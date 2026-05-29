# CONTEXTO COMPLETO — SÉPTIMO ENTREGABLE
# Pruebas del Sistema — Kingsley Caps

---

## INSTRUCCIONES PARA CLAUDE WEB

Eres un experto en Ingeniería de Software y debes generar el **Séptimo Entregable: Pruebas del Sistema** para el proyecto universitario **Kingsley Caps**.

El documento debe ser un **documento académico completo y formal** con:
- Portada (nombre del proyecto, curso, universidad, integrantes, fecha)
- Índice numerado
- Introducción
- Desarrollo detallado de cada sección requerida
- Conclusiones
- Anexos con código real de pruebas

**Secciones obligatorias del entregable:**
1. Estrategia de pruebas
2. Casos de prueba
3. Tipos de pruebas
4. Métricas de pruebas
5. Evidencia de ejecución

Usa toda la información real del proyecto que se proporciona a continuación. NO inventes datos. Usa los casos de prueba reales, los servicios reales, los endpoints reales y la arquitectura real.

**Datos del curso:**
- Universidad: UMG Puerto Barrios
- Curso: Ingeniería de Software, 2026
- Integrantes: Andy Fabricio Aquino Escobar (0909-22-1669), Erick Andrey Ortiz Guerra (0909-22-17063)

---

## CONTEXTO DEL PROYECTO

### Descripción general
Kingsley Caps es una plataforma e-commerce multi-tenant estilo Shopify para venta de gorras con pagos en criptomonedas (Ethereum/ETH). Cuenta con panel vendedor, catálogo público, checkout, verificación blockchain on-chain y motor de inteligencia artificial anti-fraude.

### Stack tecnológico
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Node.js 20 + Express + Sequelize ORM
- **Base de datos:** PostgreSQL 16 + Redis 7
- **Auth Service:** Servicio separado Node.js (puerto 3001), JWT con rotación
- **Motor IA:** Python 3.11 + FastAPI + Pydantic v2
- **Blockchain:** ethers.js v6 → red Sepolia (Ethereum testnet)
- **Infraestructura:** Docker Compose (8 servicios) + Nginx como único punto de entrada

### Arquitectura de servicios
```
Internet → Nginx :80
              ├── /api/auth/*  → auth-service:3001 (Node.js)
              ├── /api/ai/*    → ia-service:8000    (Python/FastAPI)
              ├── /api/*       → backend-api:3000   (Node.js/Express)
              └── /*           → frontend:80         (React SPA)
```

### Roles del sistema
- `customer`: cliente final que compra gorras
- `vendor`: dueño de tienda que vende productos
- `staff`: asistente del vendedor
- `superadmin`: administrador global de la plataforma

### Módulos del sistema
1. Autenticación y usuarios (Auth Service)
2. Gestión de tiendas (multi-tenant)
3. Catálogo de productos y variantes
4. Carrito de compras
5. Órdenes y estados de pedido
6. Inventario con movimientos atómicos
7. Pagos en criptomonedas (ETH/Sepolia)
8. Motor IA anti-fraude (Python/FastAPI)
9. Notificaciones en tiempo real
10. Envíos y tracking
11. Panel SuperAdmin

---

## FRAMEWORK DE PRUEBAS

### Backend (Node.js)
- **Framework:** Jest 29.7
- **Comando:** `npm test` (desde `/server`)
- **Configuración:** `testEnvironment: "node"`, `coverageThreshold: { global: { lines: 80 } }`
- **Herramientas adicionales:** Supertest 6.3 (integración)
- **Tipo:** `--runInBand --forceExit`
- **Resultado verificado:** ✅ 50 tests passed, 6 suites, 3.593s

### AI Engine (Python)
- **Framework:** Pytest + pytest-asyncio
- **Comando:** `pytest` (desde `/ai-engine`)
- **Resultado verificado:** ✅ 16 tests passed, 0.13s (1 DeprecationWarning menor en conftest.py — no afecta resultados)

### Archivos de prueba existentes
```
server/tests/unit/auth.service.test.js
server/tests/unit/auth.middleware.test.js
server/tests/unit/blockchain.service.test.js
server/tests/unit/inventory.service.test.js
server/tests/unit/notification.service.test.js
server/tests/unit/payment.service.test.js
ai-engine/tests/test_transaction_analyzer.py
ai-engine/tests/test_inventory_analyzer.py
ai-engine/tests/conftest.py
```

---

## PRUEBAS UNITARIAS — CÓDIGO REAL

### 1. auth.service.test.js — Servicio de autenticación (8 tests)

```javascript
// Descripción: Pruebas unitarias para authService
// Módulo: Autenticación JWT, registro, login, refresh tokens

// SETUP: mocks de User, RefreshToken, logger, bcrypt

describe('authService', () => {

  test('register creates a customer and returns tokens', async () => {
    // Verifica que se crea usuario con email, role: customer, status: active
    // Verifica que se crea RefreshToken con user_id, token_hash, expires_at
    // Resultado esperado: { user: { id, email }, accessToken, refreshToken }
  });

  test('register marks vendor users as pending approval', async () => {
    // Verifica que vendors se crean con status: pending_approval
    // resultado.user.status === 'pending_approval'
  });

  test('register rejects duplicate email', async () => {
    // User.findOne devuelve usuario existente
    // Debe lanzar AppError con statusCode: 409
  });

  test('register rejects weak password', async () => {
    // Password sin mayúscula ni número
    // Debe lanzar AppError con statusCode: 400
  });

  test('login returns tokens for valid credentials', async () => {
    // bcrypt.compare válido
    // Resultado: { user, accessToken, refreshToken }
    // RefreshToken.create llamado 1 vez
  });

  test('login rejects suspended users', async () => {
    // User con status: suspended
    // Lanza AppError statusCode: 403
  });

  test('login rejects invalid credentials', async () => {
    // Password incorrecto
    // Lanza AppError statusCode: 401
  });

  test('refresh rotates a valid refresh token', async () => {
    // Token válido no expirado
    // El token anterior queda revocado: { revoked: true, revoked_at }
    // Se crea nuevo RefreshToken
    // Resultado: { accessToken, refreshToken }
  });

  test('refresh rejects expired tokens and revokes them', async () => {
    // expires_at en el pasado
    // Lanza AppError statusCode: 401
    // El token expirado se revoca
  });

  test('logout revokes the matching refresh token', async () => {
    // RefreshToken.update llamado con { revoked: true }
    // Filtra por { revoked: false }
  });
});
```

**Código completo real:**
```javascript
const makeUser = (overrides = {}) => ({
  id: 'user-1',
  name: 'Andy Aquino',
  email: 'andy@example.com',
  phone: '+502 1234 5678',
  role: 'customer',
  status: 'active',
  password_hash: 'hashed_password',
  created_at: new Date('2026-05-01T00:00:00.000Z'),
  ...overrides,
});

const loadService = () => {
  jest.resetModules();
  const User = { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() };
  const RefreshToken = { create: jest.fn(), findOne: jest.fn(), update: jest.fn() };
  jest.doMock('../../src/models/User', () => User);
  jest.doMock('../../src/models/RefreshToken', () => RefreshToken);
  jest.doMock('../../src/utils/logger', () => ({ info: jest.fn(), error: jest.fn(), debug: jest.fn() }));
  const authService = require('../../src/services/authService');
  return { authService, User, RefreshToken };
};

describe('authService', () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = 'test_access_secret';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
  });

  test('register creates a customer and returns tokens', async () => {
    const { authService, User, RefreshToken } = loadService();
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(makeUser());
    RefreshToken.create.mockResolvedValue({});
    const result = await authService.register({ name: 'Andy Aquino', email: 'andy@example.com', password: 'Password1', phone: '+502 1234 5678', role: 'customer' });
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'andy@example.com', role: 'customer', status: 'active' }));
    expect(result).toEqual(expect.objectContaining({ user: expect.objectContaining({ id: 'user-1' }), accessToken: expect.any(String), refreshToken: expect.any(String) }));
  });

  test('register marks vendor users as pending approval', async () => {
    const { authService, User, RefreshToken } = loadService();
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue(makeUser({ role: 'vendor', status: 'pending_approval' }));
    RefreshToken.create.mockResolvedValue({});
    const result = await authService.register({ name: 'Vendedor', email: 'vendor@example.com', password: 'Password1', role: 'vendor' });
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'vendor', status: 'pending_approval' }));
    expect(result.user.status).toBe('pending_approval');
  });

  test('register rejects duplicate email', async () => {
    const { authService, User } = loadService();
    User.findOne.mockResolvedValue(makeUser());
    await expect(authService.register({ name: 'Andy', email: 'andy@example.com', password: 'Password1', role: 'customer' })).rejects.toMatchObject({ statusCode: 409 });
  });

  test('register rejects weak password', async () => {
    const { authService } = loadService();
    await expect(authService.register({ name: 'Andy', email: 'andy@example.com', password: 'password', role: 'customer' })).rejects.toMatchObject({ statusCode: 400 });
  });

  test('login returns tokens for valid credentials', async () => {
    const { authService, User, RefreshToken } = loadService();
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash('Password1', 12);
    User.findOne.mockResolvedValue(makeUser({ password_hash: passwordHash }));
    RefreshToken.create.mockResolvedValue({});
    const result = await authService.login({ email: 'andy@example.com', password: 'Password1' });
    expect(result.user.email).toBe('andy@example.com');
    expect(result.accessToken).toEqual(expect.any(String));
    expect(RefreshToken.create).toHaveBeenCalledTimes(1);
  });

  test('login rejects suspended users', async () => {
    const { authService, User } = loadService();
    User.findOne.mockResolvedValue(makeUser({ status: 'suspended' }));
    await expect(authService.login({ email: 'andy@example.com', password: 'Password1' })).rejects.toMatchObject({ statusCode: 403 });
  });

  test('login rejects invalid credentials', async () => {
    const { authService, User } = loadService();
    const bcrypt = require('bcryptjs');
    User.findOne.mockResolvedValue(makeUser({ password_hash: await bcrypt.hash('Password1', 12) }));
    await expect(authService.login({ email: 'andy@example.com', password: 'Wrongpass1' })).rejects.toMatchObject({ statusCode: 401 });
  });

  test('refresh rotates a valid refresh token', async () => {
    const { authService, User, RefreshToken } = loadService();
    const storedToken = { user_id: 'user-1', expires_at: new Date(Date.now() + 60_000), update: jest.fn() };
    RefreshToken.findOne.mockResolvedValue(storedToken);
    RefreshToken.create.mockResolvedValue({});
    User.findByPk.mockResolvedValue(makeUser());
    const result = await authService.refresh('raw-refresh-token');
    expect(storedToken.update).toHaveBeenCalledWith(expect.objectContaining({ revoked: true }));
    expect(result.accessToken).toEqual(expect.any(String));
  });

  test('refresh rejects expired tokens', async () => {
    const { authService, RefreshToken } = loadService();
    const storedToken = { expires_at: new Date(Date.now() - 60_000), update: jest.fn() };
    RefreshToken.findOne.mockResolvedValue(storedToken);
    await expect(authService.refresh('expired-token')).rejects.toMatchObject({ statusCode: 401 });
    expect(storedToken.update).toHaveBeenCalledWith(expect.objectContaining({ revoked: true }));
  });

  test('logout revokes the matching refresh token', async () => {
    const { authService, RefreshToken } = loadService();
    RefreshToken.update.mockResolvedValue([1]);
    await authService.logout('raw-refresh-token');
    expect(RefreshToken.update).toHaveBeenCalledWith(expect.objectContaining({ revoked: true }), expect.any(Object));
  });
});
```

---

### 2. inventory.service.test.js — Servicio de inventario (5 tests)

```javascript
// Descripción: Pruebas unitarias para inventoryService
// Módulo: Ajuste atómico de stock, alertas de stock bajo

describe('inventoryService.adjustStock', () => {

  test('increments stock with type "in"', async () => {
    // stock inicial: 10, quantity: 5, type: 'in'
    // variant.update llamado con { stock: 15 }
    // InventoryMovement.create con { stock_before: 10, stock_after: 15, type: 'in', quantity: 5 }
  });

  test('throws AppError when stock would go negative', async () => {
    // stock: 3, quantity: 5, type: 'out'
    // Lanza AppError 'Stock insuficiente'
    // variant.update NO llamado
    // InventoryMovement.create NO llamado
  });

  test('uses sequelize transaction for atomic stock adjustment', async () => {
    // sequelize.transaction llamado exactamente 1 vez
    // ProductVariant.findOne llamado con { lock: 'UPDATE' } (row lock)
  });
});

describe('inventoryService.getAlerts', () => {

  test('returns variants at or below low stock threshold', async () => {
    // ProductVariant.findAll con where: { store_id: 'store-uuid' }
    // Devuelve variantes con stock <= low_stock_threshold
  });

  test('returns empty array when no low stock variants', async () => {
    // ProductVariant.findAll devuelve []
    // Resultado: []
  });
});
```

**Código completo real:**
```javascript
jest.mock('../../src/models', () => ({
  sequelize: { transaction: jest.fn(), literal: jest.fn((sql) => ({ sql })) },
  ProductVariant: { findOne: jest.fn(), findAll: jest.fn() },
  InventoryMovement: { create: jest.fn(), findAndCountAll: jest.fn() },
  Product: {}, Store: {}, User: {},
}));

// [ver archivo completo en server/tests/unit/inventory.service.test.js]
// Test 1: increments stock with type "in"
// Resultado: variant.update({ stock: 15 }), movement creado con stock_before:10, stock_after:15

// Test 2: throws AppError when stock would go negative
// stock:3, quantity:5, type:'out' → lanza 'Stock insuficiente'

// Test 3: atomic transaction with row lock
// sequelize.transaction llamado 1 vez, ProductVariant.findOne con lock: 'UPDATE'

// Test 4: returns low stock alerts
// findAll filtra por store_id, stock <= threshold

// Test 5: empty array when no alerts
```

---

### 3. blockchain.service.test.js — Servicio blockchain (9 tests)

```javascript
// Descripción: Pruebas unitarias para blockchainService
// Módulo: Verificación on-chain de transacciones ETH (ethers.js v6)

// Mock completo de ethers: JsonRpcProvider, parseEther, formatEther, isAddress

const EXPECTED_TO = '0xabcdef1234567890abcdef1234567890abcdef12';
const EXPECTED_AMOUNT_ETH = '0.1';
const TX_HASH = '0x' + 'a'.repeat(64);
const EXACT_VALUE = BigInt(100000000000000000); // 0.1 ETH en wei

describe('BlockchainService.verifyTransaction', () => {

  test('returns verified=true with sufficient confirmations', async () => {
    // getTransaction: { to: EXPECTED_TO, value: EXACT_VALUE }
    // getTransactionReceipt: { blockNumber: 1000n }
    // getBlockNumber: 1003
    // Resultado: { verified: true, confirmations: 4, blockNumber: 1000, txHash }
  });

  test('returns ERR-C01 TX_NOT_FOUND when transaction does not exist', async () => {
    // getTransaction devuelve null
    // Resultado: { verified: false, error: 'TX_NOT_FOUND', code: 'ERR-C01' }
  });

  test('returns ERR-C02 WRONG_RECIPIENT when destination address differs', async () => {
    // tx.to es diferente a expectedTo
    // Resultado: { verified: false, error: 'WRONG_RECIPIENT', code: 'ERR-C02' }
  });

  test('returns ERR-C06 AMOUNT_DISCREPANCY when value is below 1% tolerance', async () => {
    // value: 0.08 ETH (por debajo del 1% de tolerancia de 0.1 ETH)
    // Resultado: { verified: false, error: 'AMOUNT_DISCREPANCY', code: 'ERR-C06', received }
  });

  test('returns ERR-C03 NO_RECEIPT when receipt is not yet available', async () => {
    // getTransactionReceipt devuelve null
    // Resultado: { verified: false, error: 'NO_RECEIPT', code: 'ERR-C03' }
  });

  test('returns ERR-C04 INSUFFICIENT_CONFIRMATIONS when blocks are too few', async () => {
    // blockNumber: 1000, currentBlock: 1001 → 2 confirmaciones (necesita 3)
    // Resultado: { verified: false, error: 'INSUFFICIENT_CONFIRMATIONS', code: 'ERR-C04', confirmations: 2, required: 3 }
  });

  test('accepts amount within 1% tolerance (just at threshold)', async () => {
    // value: 0.0991 ETH (dentro del 1% de tolerancia)
    // Resultado: { verified: true }
  });
});

describe('BlockchainService.isValidAddress', () => {
  test('returns true for a valid 42-char Ethereum address');
  test('returns false for an invalid address');
  test('returns false for an address without 0x prefix');
});
```

---

### 4. payment.service.test.js — Servicio de pagos (8 tests)

```javascript
// Descripción: Pruebas unitarias para paymentService
// Módulo: Inicio de pago cripto, verificación on-chain, manejo de errores

// Mocks: Order, PaymentTransaction, Notification, User, blockchainService, priceService

const WALLET_ADDRESS = '0xabcdef1234567890abcdef1234567890abcdef12';
const TX_HASH = '0x' + 'b'.repeat(64);

describe('paymentService.initiateCryptoPayment', () => {

  test('initiates crypto payment and returns payment details', async () => {
    // order: { total: 700, currency: GTQ, status: pending_payment }
    // priceService.getCryptoRate: { eth_gtq: 3500.0 }
    // amountEth = 700 / 3500 = 0.20000000
    // Resultado: { paymentId, walletAddress, amountEth: '0.20000000', amountGtq: 700, network: 'sepolia', qrData con WALLET_ADDRESS }
    // PaymentTransaction.create llamado con { order_id, method: 'crypto_eth', amount_fiat: 700 }
  });

  test('throws AppError when order is not in pending_payment status', async () => {
    // order.status: 'paid'
    // Lanza AppError 'La orden no está pendiente de pago'
  });

  test('throws AppError when crypto is not enabled in the store', async () => {
    // Store.crypto_enabled: false
    // Lanza AppError 'Pagos crypto no habilitados'
  });

  test('throws AppError when store has no wallet address configured', async () => {
    // Store.eth_wallet_address: null
    // Lanza AppError con 'dirección de wallet'
  });

  test('throws AppError when order does not belong to user', async () => {
    // order.customer_id !== userId
    // Lanza AppError 'No tienes acceso'
  });
});

describe('paymentService.verifyCryptoPayment', () => {

  test('confirms payment when blockchain verification succeeds', async () => {
    // blockchainService.verifyTransaction: { verified: true, confirmations: 5 }
    // payment.update: { status: 'confirmed', tx_hash, confirmations: 5 }
    // order.update: { status: 'paid', payment_method: 'crypto_eth' }
    // Resultado: { orderId, status: 'paid', confirmedAt }
  });

  test('handles ERR-C06 discrepancy: updates status and creates admin notification', async () => {
    // verifyTransaction: { verified: false, error: 'AMOUNT_DISCREPANCY', code: 'ERR-C06' }
    // payment.update: { status: 'discrepancy' }
    // Notification.create llamado con type: 'payment_discrepancy' para superadmin
    // Lanza AppError 'Discrepancia en el monto enviado'
  });

  test('throws AppError with correct message for ERR-C04 insufficient confirmations', async () => {
    // verifyTransaction: { error: 'INSUFFICIENT_CONFIRMATIONS', code: 'ERR-C04' }
    // Lanza AppError 'Confirmaciones insuficientes'
  });

  test('throws ERR-C05 AppError when payment has expired', async () => {
    // expires_at en el pasado
    // Lanza AppError con 'expirado' (verificado ANTES de llamar blockchain)
  });
});
```

---

### 5. notification.service.test.js — Servicio de notificaciones (8 tests)

```javascript
// Descripción: Pruebas unitarias para notificationService
// Módulo: Alertas de stock bajo, confirmación de pago, discrepancias, lectura

describe('notificationService.createLowStockAlert', () => {

  test('creates notification for the correct vendor', async () => {
    // Store.findOne devuelve { vendor_id: 'vendor-uuid' }
    // Notification.create con { user_id: 'vendor-uuid', store_id, type: 'low_stock' }
  });

  test('does nothing when store is not found', async () => {
    // Store.findOne devuelve null
    // Notification.create NO llamado
  });
});

describe('notificationService.createPaymentConfirmedNotification', () => {

  test('creates two notifications: one for customer and one for vendor', async () => {
    // Notification.create llamado EXACTAMENTE 2 veces
    // Una con { user_id: customer_id, type: 'payment_confirmed' }
    // Una con { user_id: vendor_id, type: 'payment_received' }
  });
});

describe('notificationService.createDiscrepancyAlert', () => {

  test('notifies ALL superadmins when discrepancy occurs', async () => {
    // User.findAll con where: { role: 'superadmin' } devuelve 2 admins
    // Notification.create llamado 2 veces (uno por admin)
  });

  test('creates no notifications when there are no superadmins', async () => {
    // User.findAll devuelve []
    // Notification.create NO llamado
  });
});

describe('notificationService.getUserNotifications', () => {

  test('returns paginated notifications with unread count', async () => {
    // findAndCountAll: { count: 10, rows: [...] }
    // count: 5 (unread)
    // Resultado: { notifications, total: 10, unreadCount: 5 }
    // offset calculado: (page-1)*limit
  });

  test('filters by unread when unreadOnly is true', async () => {
    // findAndCountAll llamado con where: { user_id, read: false }
  });
});

describe('notificationService.markAsRead', () => {

  test('marks notification as read when it belongs to the user', async () => {
    // findOne con where: { id, user_id }
    // notification.update({ read: true })
  });

  test('throws AppError when notification does not belong to user', async () => {
    // findOne devuelve null (user_id no coincide)
    // Lanza AppError 'Notificación no encontrada'
  });
});
```

---

### 6. test_transaction_analyzer.py — Motor IA Python (8 tests)

```python
# Framework: pytest + pytest-asyncio
# Módulo: analyzers/transaction_analyzer.py
# Función: analyze_transaction(data: dict) -> dict
# Resultado: { risk_score, flagged, blocked, reasons, recommendations }

@pytest.mark.asyncio
async def test_clean_transaction():
    # Transacción normal sin señales de riesgo
    # metadata: is_first_purchase=False, orders_last_hour=1, account_age_days=365
    # Esperado: risk_score==0.0, flagged==False, blocked==False, reasons==[]

@pytest.mark.asyncio
async def test_large_first_purchase():
    # Primera compra mayor a GTQ 2000
    # amount=5000, is_first_purchase=True
    # Regla: +0.4 → 'LARGE_FIRST_PURCHASE' en reasons
    # score < 0.7 → flagged==False
    # recommendations incluye 'identity'

@pytest.mark.asyncio
async def test_high_frequency():
    # Más de 5 órdenes en la última hora
    # orders_last_hour=6
    # Regla: +0.3 → 'HIGH_ORDER_FREQUENCY' en reasons
    # score < 0.7 → flagged==False

@pytest.mark.asyncio
async def test_amount_discrepancy():
    # Discrepancia en monto cripto (ERR-C06)
    # amount_discrepancy=True
    # Regla: +0.8 → 'AMOUNT_DISCREPANCY'
    # risk_score >= 0.8, flagged==True
    # recommendations incluye 'block'

@pytest.mark.asyncio
async def test_combined_risks():
    # LARGE_FIRST_PURCHASE(0.4) + HIGH_FREQUENCY(0.3) + NEW_ACCOUNT(0.2) = 0.9
    # is_first_purchase=True, orders_last_hour=7, account_age_days=0, amount=3000
    # risk_score >= 0.7, flagged==True, len(reasons) >= 2

@pytest.mark.asyncio
async def test_risk_score_capped_at_one():
    # Todas las señales activas al máximo
    # risk_score NUNCA puede superar 1.0
    # blocked==True

@pytest.mark.asyncio
async def test_new_account_risk():
    # account_age_days=0
    # Regla NEW_ACCOUNT: +0.2
    # 'NEW_ACCOUNT' en reasons, risk_score >= 0.2

@pytest.mark.asyncio
async def test_unusual_amount():
    # amount=1500, average_order_amount=200 → 7.5x el promedio (>3x threshold)
    # Regla UNUSUAL_AMOUNT: +0.25
    # 'UNUSUAL_AMOUNT' en reasons
```

---

### 7. test_inventory_analyzer.py — Motor IA Inventario Python (8 tests)

```python
# Módulo: analyzers/inventory_analyzer.py
# Función: analyze_inventory(data: dict) -> dict
# Resultado: { alert_level, message, predicted_days_until_stockout, recommended_reorder_quantity, recommendation }

@pytest.mark.asyncio
async def test_out_of_stock():
    # current_stock=0 → alert_level=='out_of_stock'
    # message incluye 'out of stock', recommended_reorder_quantity > 0

@pytest.mark.asyncio
async def test_critical_stock():
    # current_stock=2, low_stock_threshold=10 (stock <= threshold/2)
    # alert_level=='critical'

@pytest.mark.asyncio
async def test_low_stock():
    # current_stock=4, low_stock_threshold=5 (stock <= threshold pero > threshold/2)
    # alert_level=='low'

@pytest.mark.asyncio
async def test_predicted_stockout_uses_7day_rate():
    # current_stock=7, sales_last_7_days=7 → 1 unit/day
    # predicted_days_until_stockout == 7

@pytest.mark.asyncio
async def test_predicted_stockout_falls_back_to_30day():
    # sales_last_7_days=0, sales_last_30_days=30 → 1 unit/day
    # current_stock=15 → predicted_days_until_stockout == 15

@pytest.mark.asyncio
async def test_no_sales_data_returns_none_prediction():
    # sales_last_7_days=0, sales_last_30_days=0
    # predicted_days_until_stockout is None

@pytest.mark.asyncio
async def test_reorder_quantity():
    # sales_last_7_days=14 → 2 units/day → 2*14=28 días
    # recommended_reorder_quantity >= 28

@pytest.mark.asyncio
async def test_reorder_quantity_minimum():
    # sales rate muy baja: max(calculado, threshold*2) = 20
    # recommended_reorder_quantity >= 20
```

---

## ENDPOINTS DEL SISTEMA (para pruebas de integración/funcionales)

### Auth Service (puerto 3001)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/register | Registro de usuario |
| POST | /api/auth/login | Login → tokens |
| POST | /api/auth/refresh | Renovar access token |
| POST | /api/auth/logout | Invalidar refresh token |
| GET | /api/auth/me | Usuario autenticado |

### Backend API (puerto 3000)
| Método | Ruta | Auth | Rol |
|--------|------|------|-----|
| GET | /health | - | - |
| POST | /api/stores | ✓ | vendor |
| GET | /api/stores/my | ✓ | vendor |
| PUT | /api/stores/:id | ✓ | vendor |
| GET | /api/products | - | - |
| GET | /api/products/:id | - | - |
| POST | /api/products | ✓ | vendor |
| GET | /api/cart | ✓ | customer |
| POST | /api/cart/items | ✓ | customer |
| POST | /api/orders | ✓ | customer |
| GET | /api/orders/my | ✓ | customer |
| PUT | /api/orders/:id/status | ✓ | vendor |
| GET | /api/inventory/variants/:id | ✓ | vendor |
| PUT | /api/inventory/variants/:id/stock | ✓ | vendor |
| GET | /api/inventory/alerts | ✓ | vendor |
| GET | /api/inventory/movements | ✓ | vendor |
| GET | /api/payments/crypto/price | - | - |
| POST | /api/payments/crypto/initiate | ✓ | customer |
| POST | /api/payments/crypto/verify | ✓ | customer |
| GET | /api/notifications | ✓ | any |
| GET | /api/notifications/unread-count | ✓ | any |
| PUT | /api/notifications/read-all | ✓ | any |
| PUT | /api/shipping/orders/:id/tracking | ✓ | vendor |
| GET | /api/admin/stores | ✓ | superadmin |
| GET | /api/admin/metrics | ✓ | superadmin |

### AI Engine (puerto 8000)
| Método | Ruta |
|--------|------|
| GET | /health |
| POST | /api/ai/analyze-transaction |
| POST | /api/ai/inventory-alert |

---

## MODELOS DE BASE DE DATOS (para casos de prueba)

```
User: id(UUID), name, email, password_hash, role(customer/vendor/staff/superadmin), status(active/suspended/pending_approval)
RefreshToken: id, user_id, token_hash, expires_at, revoked, revoked_at
Store: id, vendor_id, name, slug, status(draft/active/suspended), crypto_enabled, eth_wallet_address
Product: id, store_id, name, base_price, category, status(draft/active/archived), images(JSONB)
ProductVariant: id, product_id, store_id, size, color, sku, stock, low_stock_threshold(default 3)
Cart: id, user_id, store_id
CartItem: id, cart_id, product_variant_id, quantity, unit_price
Order: id, store_id, customer_id, status(pending_payment/paid/preparing/packed/shipped/delivered/cancelled/refunded), total
OrderItem: id, order_id, product_variant_id, quantity, unit_price (snapshot inmutable)
PaymentTransaction: id, order_id, method(crypto_eth), amount_fiat, amount_crypto, tx_hash, status(pending/confirmed/failed/discrepancy), expires_at, nonce
InventoryMovement: id, product_variant_id, type(in/out/adjustment), quantity, stock_before, stock_after, reason
Notification: id, user_id, store_id, type(low_stock/payment_confirmed/payment_received/payment_discrepancy/order_status/order_shipped), read
```

---

## REGLAS DE NEGOCIO CRÍTICAS (para casos de prueba)

1. **Stock nunca negativo** — verificado con transacción Sequelize + row-level lock (SELECT FOR UPDATE)
2. **Verificación blockchain** — mínimo 3 confirmaciones antes de confirmar pago
3. **Tolerancia de monto ETH** — ±1% aceptado (gas fees)
4. **ERR-C06 discrepancia** — bloquea pago + notifica a TODOS los superadmins
5. **Pago expira en 10 minutos** — verificado antes de consultar blockchain (ERR-C05)
6. **Nonce único por pago** — previene doble gasto
7. **Refresh token rotación** — el anterior se revoca al emitir uno nuevo
8. **Access token expira en 15 minutos**, refresh token en 7 días
9. **Rate limiting** — 5 intentos/15min/IP+email en login
10. **Motor IA fail-safe** — si falla o tarda >5s → riskScore: 0, flujo continúa normal
11. **Risk score capped at 1.0** — nunca supera 1.0 sin importar cuántas reglas disparen

---

## ERRORES CRIPTO (códigos oficiales del sistema)

| Código | Error interno | Descripción |
|--------|--------------|-------------|
| ERR-C01 | TX_NOT_FOUND | TX no encontrada en blockchain |
| ERR-C02 | WRONG_RECIPIENT | Wallet destino incorrecto |
| ERR-C03 | NO_RECEIPT / INSUFFICIENT_CONFIRMATIONS | Confirmaciones insuficientes |
| ERR-C04 | INSUFFICIENT_CONFIRMATIONS | Menos de 3 confirmaciones |
| ERR-C05 | PAYMENT_EXPIRED | Pago expirado (>10 min) |
| ERR-C06 | AMOUNT_DISCREPANCY | Monto enviado no coincide (dispara alerta superadmin) |

---

## CONFIGURACIÓN DE JEST (package.json real)

```json
{
  "scripts": {
    "test": "jest --runInBand --forceExit",
    "test:unit": "jest tests/unit --runInBand --forceExit",
    "test:integration": "jest tests/integration --runInBand --forceExit"
  },
  "jest": {
    "testEnvironment": "node",
    "coverageThreshold": {
      "global": {
        "lines": 80
      }
    }
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.4"
  }
}
```

---

## RESUMEN DE COBERTURA ACTUAL

| Módulo | Tests existentes | Tipo | Framework |
|--------|-----------------|------|-----------|
| authService | 10 tests ✅ | Unitario | Jest |
| auth.middleware | 7 tests ✅ | Unitario | Jest |
| blockchainService | 10 tests ✅ | Unitario | Jest |
| inventoryService | 5 tests ✅ | Unitario | Jest |
| notificationService | 9 tests ✅ | Unitario | Jest |
| paymentService | 9 tests ✅ | Unitario | Jest |
| transaction_analyzer | 8 tests ✅ | Unitario | Pytest |
| inventory_analyzer | 8 tests ✅ | Unitario | Pytest |
| **TOTAL** | **66 tests** (50 Jest + 16 Pytest) | | |

**Evidencia de ejecución real:**
- Jest: `Tests: 50 passed, 6 suites, Time: 3.593s` — ejecutado el 15/05/2026
- Pytest: `16 passed, 1 warning in 0.13s` — ejecutado el 15/05/2026
- Warning Pytest: DeprecationWarning en conftest.py sobre event_loop fixture (no afecta resultados)

---

## FIN DEL CONTEXTO

Con toda la información anterior, genera el Séptimo Entregable completo como documento académico formal para el proyecto Kingsley Caps — UMG Puerto Barrios 2026.

El documento debe incluir:
1. **Estrategia de pruebas** — objetivos, alcance, niveles de prueba, herramientas, responsables
2. **Casos de prueba** — tabla detallada con ID, descripción, precondición, pasos, resultado esperado, resultado obtenido, estado (Pasado/Fallido). Incluye los 62 casos reales del proyecto
3. **Tipos de pruebas** — unitarias, integración, funcionales (E2E), regresión, rendimiento, seguridad — describir cuáles aplican y cómo
4. **Métricas de pruebas** — cobertura de código, porcentaje de tests pasados, densidad de defectos, tiempo de ejecución
5. **Evidencia de ejecución** — simular/documentar la salida real de `npm test` y `pytest`, con tablas de resultados
