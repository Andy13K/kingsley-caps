# 🟠 TAREAS DE ERICK — Módulo de IA, Envíos y Administración

**Rama:** `dev/erick`
**Módulo oficial:** Módulo de IA, Envíos y Administración (del Segundo Entregable)
**Tecnologías principales:** Node.js, Python/FastAPI, ethers.js, Nginx

---

## RESUMEN DE RESPONSABILIDADES

Erick es responsable de:
1. **API de Inventario** — stock, movimientos, alertas
2. **Motor IA anti-fraude** (ia-service, Python/FastAPI)
3. **Verificación on-chain** de pagos ETH (ethers.js)
4. **API de Pagos** — verificar TX, manejar errores cripto
5. **Panel de Administración** (Frontend) — dashboard, inventario, reportes
6. **Nginx** — reverse proxy y configuración Docker completa
7. **Notificaciones** — alertas de stock bajo, estados de pedido

---

## FEATURES A DESARROLLAR

### FEATURE 1: API de Inventario
**Rama:** `feature/api-inventory`

Endpoints:
- `GET /api/inventory/variants/:variantId` — Stock actual
- `PUT /api/inventory/variants/:variantId/stock` — Ajuste manual
- `POST /api/inventory/movements` — Registrar movimiento
- `GET /api/inventory/alerts` — Variantes con stock bajo
- `GET /api/inventory/movements` — Historial con filtros

Archivos a crear:
```
server/src/controllers/inventoryController.js
server/src/services/inventoryService.js
server/src/routes/inventoryRoutes.js
```

`inventoryService.js` — Función crítica: ajuste atómico de stock
```javascript
const adjustStock = async ({ productVariantId, quantity, type, reason, userId, referenceId }) => {
  return sequelize.transaction(async (t) => {
    // Bloqueo a nivel de fila para evitar race conditions
    const variant = await ProductVariant.findByPk(productVariantId, {
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!variant) throw new NotFoundError('Variante de producto');

    const stockBefore = variant.stock;
    const stockAfter = type === 'in'
      ? stockBefore + Math.abs(quantity)
      : stockBefore - Math.abs(quantity);

    if (stockAfter < 0) {
      throw new BusinessError('Stock insuficiente para esta operación', 'NEGATIVE_STOCK');
    }

    // Actualizar stock
    await variant.update({ stock: stockAfter }, { transaction: t });

    // Registrar movimiento
    const movement = await InventoryMovement.create({
      productVariantId,
      storeId: variant.storeId,
      type,
      quantity: type === 'in' ? Math.abs(quantity) : -Math.abs(quantity),
      stockBefore,
      stockAfter,
      reason,
      referenceId,
      createdBy: userId,
    }, { transaction: t });

    // Verificar si cae bajo el umbral → generar alerta
    if (stockAfter <= variant.lowStockThreshold) {
      await notificationService.createLowStockAlert({ variant, stockAfter });
    }

    return { variant: { ...variant.toJSON(), stock: stockAfter }, movement };
  });
};
```

---

### FEATURE 2: API de Pagos (Verificación Blockchain)
**Rama:** `feature/api-payments-crypto`

Archivos a crear:
```
server/src/controllers/paymentController.js
server/src/services/paymentService.js
server/src/services/blockchainService.js
server/src/services/priceService.js
server/src/routes/paymentRoutes.js
```

`blockchainService.js` — Verificación on-chain:
```javascript
const { ethers } = require('ethers');

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
    this.confirmationsRequired = parseInt(process.env.ETH_CONFIRMATIONS_REQUIRED) || 3;
  }

  async verifyTransaction({ txHash, expectedTo, expectedAmountEth, network }) {
    try {
      // 1. Obtener la transacción
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) return { verified: false, error: 'TX_NOT_FOUND' };

      // 2. Verificar destinatario
      if (tx.to.toLowerCase() !== expectedTo.toLowerCase()) {
        return { verified: false, error: 'WRONG_RECIPIENT' };
      }

      // 3. Verificar monto (con 1% de tolerancia por gas)
      const expectedWei = ethers.parseEther(expectedAmountEth);
      const tolerance = expectedWei / BigInt(100);  // 1%
      if (tx.value < expectedWei - tolerance) {
        return { verified: false, error: 'AMOUNT_DISCREPANCY', received: ethers.formatEther(tx.value) };
      }

      // 4. Verificar confirmaciones
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) return { verified: false, error: 'NO_RECEIPT' };

      const currentBlock = await this.provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber + 1;

      if (confirmations < this.confirmationsRequired) {
        return {
          verified: false,
          error: 'INSUFFICIENT_CONFIRMATIONS',
          confirmations,
          required: this.confirmationsRequired,
        };
      }

      return {
        verified: true,
        confirmations,
        blockNumber: receipt.blockNumber,
        txHash,
      };

    } catch (err) {
      logger.error({ message: 'Blockchain verification error', txHash, error: err.message });
      return { verified: false, error: 'BLOCKCHAIN_ERROR' };
    }
  }
}
```

`priceService.js` — Conversión GTQ→ETH:
```javascript
const getCryptoRate = async () => {
  const response = await axios.get(
    'https://api.coingecko.com/api/v3/simple/price',
    { params: { ids: 'ethereum', vs_currencies: 'gtq' }, timeout: 5000 }
  );
  return {
    eth_gtq: response.data.ethereum.gtq,
    updatedAt: new Date().toISOString(),
  };
};

const convertGtqToEth = async (amountGtq) => {
  const { eth_gtq } = await getCryptoRate();
  const amountEth = amountGtq / eth_gtq;
  return amountEth.toFixed(8);
};
```

`paymentService.js` — Iniciar pago cripto:
```javascript
const initiateCryptoPayment = async ({ orderId, userId }) => {
  const order = await Order.findByPk(orderId, { include: [Store] });
  if (!order) throw new NotFoundError('Orden');
  if (order.customerId !== userId) throw new ForbiddenError();
  if (order.status !== 'pending_payment') {
    throw new BusinessError('Esta orden ya fue procesada', 'INVALID_ORDER_STATUS');
  }
  if (!order.Store.cryptoEnabled || !order.Store.ethWalletAddress) {
    throw new BusinessError('Pagos cripto no habilitados en esta tienda', 'CRYPTO_NOT_ENABLED');
  }

  const { eth_gtq } = await priceService.getCryptoRate();
  const amountEth = (order.total / eth_gtq).toFixed(8);
  const nonce = `kc_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);  // 10 minutos

  const payment = await PaymentTransaction.create({
    orderId,
    storeId: order.storeId,
    method: 'crypto_eth',
    amountFiat: order.total,
    currencyFiat: 'GTQ',
    amountCrypto: amountEth,
    cryptoCurrency: 'ETH',
    exchangeRate: eth_gtq,
    rateLockedAt: new Date(),
    walletTo: order.Store.ethWalletAddress,
    network: process.env.ETH_NETWORK || 'sepolia',
    nonce,
    expiresAt,
    status: 'pending',
  });

  return {
    paymentId: payment.id,
    walletAddress: order.Store.ethWalletAddress,
    amountEth,
    amountGtq: order.total,
    exchangeRate: eth_gtq,
    rateLockedAt: payment.rateLockedAt,
    expiresAt,
    nonce,
    network: payment.network,
    qrData: `ethereum:${order.Store.ethWalletAddress}?value=${ethers.parseEther(amountEth).toString()}`,
  };
};
```

---

### FEATURE 3: Motor IA Anti-Fraude (Python/FastAPI)
**Rama:** `feature/ai-engine`

Archivos a crear:
```
ai-engine/main.py
ai-engine/models/fraud_detector.py
ai-engine/analyzers/transaction_analyzer.py
ai-engine/requirements.txt
ai-engine/Dockerfile
```

`main.py`:
```python
from fastapi import FastAPI
from pydantic import BaseModel
from analyzers.transaction_analyzer import analyze_transaction

app = FastAPI(title="Kingsley Caps IA Service")

class TransactionRequest(BaseModel):
    order_id: str
    amount: float
    customer_id: str
    tx_hash: str | None = None
    metadata: dict = {}

@app.post("/api/ai/analyze-transaction")
async def analyze(request: TransactionRequest):
    result = await analyze_transaction(request.dict())
    return {
        "riskScore": result["risk_score"],
        "flagged": result["flagged"],
        "reasons": result["reasons"]
    }

@app.get("/health")
async def health():
    return {"status": "ok"}
```

`transaction_analyzer.py` — Reglas heurísticas básicas:
```python
async def analyze_transaction(data: dict) -> dict:
    risk_score = 0.0
    reasons = []

    # Regla 1: Monto muy alto en primera compra
    if data["metadata"].get("is_first_purchase") and data["amount"] > 2000:
        risk_score += 0.4
        reasons.append("LARGE_FIRST_PURCHASE")

    # Regla 2: Múltiples órdenes en poco tiempo
    if data["metadata"].get("orders_last_hour", 0) > 3:
        risk_score += 0.3
        reasons.append("HIGH_ORDER_FREQUENCY")

    # Regla 3: Discrepancia de monto (ERR-C06)
    if data["metadata"].get("amount_discrepancy"):
        risk_score += 0.8
        reasons.append("AMOUNT_DISCREPANCY")

    return {
        "risk_score": min(risk_score, 1.0),
        "flagged": risk_score >= 0.7,
        "reasons": reasons
    }
```

---

### FEATURE 4: Panel de Administración Frontend
**Rama:** `feature/vendor-admin-panel`

Archivos a crear:
```
client/src/pages/vendor/Dashboard.jsx     — Métricas generales
client/src/pages/vendor/Inventory.jsx     — Gestión de inventario
client/src/pages/vendor/Settings.jsx      — Config de tienda + crypto
client/src/pages/admin/SuperAdmin.jsx     — Solo para superadmin
```

`Dashboard.jsx` (RF-020) debe mostrar:
- Total de ventas del mes (en GTQ y ETH)
- Número de órdenes por estado (gráfico de barras)
- Top 5 productos más vendidos
- Variantes con stock bajo (alerta)
- Últimas 5 órdenes

`Inventory.jsx` debe mostrar:
- Tabla de variantes: SKU, talla, color, stock actual, umbral de alerta
- Botón para ajustar stock manualmente (modal con motivo)
- Historial de movimientos de inventario
- Exportar a CSV

---

### FEATURE 5: Notificaciones
**Rama:** `feature/notifications`

Archivos a crear:
```
server/src/services/notificationService.js
server/src/models/Notification.js
client/src/components/ui/NotificationBell.jsx
```

Notificaciones que se deben generar automáticamente:
- Al cambiar estado de orden → notificar al cliente
- Stock cae bajo umbral → notificar al vendedor
- Pago cripto confirmado → notificar a cliente y vendedor
- ERR-C06 (discrepancia de monto) → notificar al superadmin

---

### FEATURE 6: Docker Completo + Nginx
**Rama:** `feature/docker-nginx-setup`

Archivos a crear:
```
docker-compose.yml                    — Todos los servicios
docker/Dockerfile.server              — Backend Node.js
docker/Dockerfile.client              — Frontend React
docker/Dockerfile.ai                  — IA Engine Python
docker/nginx.conf                     — Reverse proxy config
```

`nginx.conf` — proxy hacia los servicios internos:
```nginx
upstream auth_service { server auth-service:3001; }
upstream backend_api { server backend-api:3000; }
upstream ia_service { server ia-service:8000; }
upstream frontend { server frontend:80; }

server {
    listen 80;
    
    location /api/auth/ { proxy_pass http://auth_service; }
    location /api/ai/   { proxy_pass http://ia_service; }
    location /api/      { proxy_pass http://backend_api; }
    location /          { proxy_pass http://frontend; }
}
```

---

## CRITERIOS DE ACEPTACIÓN GLOBALES

- [ ] Stock NUNCA baja a negativo (verificado con transacciones atómicas + row lock)
- [ ] Verificación on-chain: mínimo 3 confirmaciones antes de confirmar pago
- [ ] ERR-C06: si hay discrepancia de monto → bloquear orden, log ERROR, notificar admin
- [ ] Motor IA responde en < 200ms (heurísticas simples, no ML complejo en primera versión)
- [ ] Nginx funciona como único punto de entrada (puertos internos no expuestos)
- [ ] Polling de TXs pendientes cada 30 segundos (job en background)
- [ ] Tests para servicio de verificación blockchain (con mocks de ethers.js)
