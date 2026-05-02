# 🔌 API REST — Documentación Completa

> **Base URL:** `http://localhost:3001` (auth-service) y `http://localhost:3000` (backend-api)
> Todas las respuestas siguen el formato estándar (CB-03 del Sexto Entregable)

---

## FORMATO ESTÁNDAR DE RESPUESTA

```json
// Éxito
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "total": 45 }  // Solo en listas paginadas
}

// Error
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Correo o contraseña incorrectos"
  }
}
```

## CÓDIGOS HTTP
| Código | Cuándo usar |
|--------|-------------|
| 200 | OK — operación exitosa |
| 201 | Created — recurso creado |
| 400 | Bad Request — validación fallida |
| 401 | Unauthorized — no autenticado |
| 403 | Forbidden — no autorizado para esa acción |
| 404 | Not Found — recurso no existe |
| 409 | Conflict — duplicado (email, SKU, etc.) |
| 429 | Too Many Requests — rate limit |
| 500 | Internal Server Error |

## AUTENTICACIÓN
Todos los endpoints protegidos requieren el header:
```
Authorization: Bearer <accessToken>
```

---

## AUTH ENDPOINTS (Puerto 3001)
**Responsable:** Andy

### `POST /api/auth/register`
Registrar nuevo usuario (cliente o vendedor).
```json
// Body
{
  "name": "Juan García",
  "email": "juan@example.com",
  "password": "MiPass@123",
  "phone": "+502 1234 5678",
  "address": "Zona 1, Ciudad de Guatemala",
  "role": "customer"  // "customer" | "vendor"
}
// Response 201
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "Juan García", "email": "...", "role": "customer" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### `POST /api/auth/login`
```json
// Body
{ "email": "juan@example.com", "password": "MiPass@123" }
// Response 200
{
  "success": true,
  "data": { "accessToken": "eyJ...", "refreshToken": "eyJ...", "user": { ... } }
}
// Error 401
{ "success": false, "error": { "code": "INVALID_CREDENTIALS", "message": "..." } }
// Error 429 (rate limit)
{ "success": false, "error": { "code": "TOO_MANY_ATTEMPTS", "message": "Bloqueado por 15 minutos" } }
```

### `POST /api/auth/refresh`
```json
// Body
{ "refreshToken": "eyJ..." }
// Response 200
{ "success": true, "data": { "accessToken": "eyJ...", "refreshToken": "eyJ..." } }
```

### `POST /api/auth/logout` 🔒
```json
// Body
{ "refreshToken": "eyJ..." }
// Response 200
{ "success": true, "data": { "message": "Sesión cerrada exitosamente" } }
```

### `GET /api/auth/me` 🔒
```json
// Response 200
{ "success": true, "data": { "id": "uuid", "name": "...", "email": "...", "role": "..." } }
```

---

## STORE ENDPOINTS (Puerto 3000)
**Responsable:** Carlos

### `POST /api/stores` 🔒 [vendor]
Crear tienda para el vendedor autenticado.
```json
// Body
{ "name": "Kingsley Caps", "description": "Gorras y accesorios premium", "logoUrl": "https://..." }
// Response 201
{ "success": true, "data": { "id": "uuid", "name": "Kingsley Caps", "slug": "kingsley-caps", "status": "draft" } }
```

### `GET /api/stores/my` 🔒 [vendor]
Obtener la tienda del vendedor autenticado.

### `PUT /api/stores/:id` 🔒 [vendor]
Actualizar datos de la tienda (solo el propietario).

### `PUT /api/stores/:id/crypto-config` 🔒 [vendor]
Configurar wallet ETH y activar pagos cripto.
```json
// Body
{ "ethWalletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bd3E", "ethConfirmationsRequired": 3 }
```

### `PUT /api/stores/:id/publish` 🔒 [vendor]
Cambiar estado de `draft` a `active`.

---

## PRODUCT ENDPOINTS (Puerto 3000)
**Responsable:** Carlos

### `GET /api/products`
Listar productos (público). Soporta filtros.
```
Query params: storeId, category, minPrice, maxPrice, available, search, page, limit
```

### `GET /api/products/:id`
Obtener detalle de un producto con todas sus variantes.

### `POST /api/products` 🔒 [vendor]
```json
// Body
{
  "name": "Gorra Snapback Classic",
  "description": "Gorra snapback ajustable de alta calidad",
  "basePrice": 250.00,
  "category": "Snapback",
  "images": ["https://..."],
  "variants": [
    { "size": "S", "color": "Negro", "sku": "KC-SNP-S-NEG", "stock": 15 },
    { "size": "M", "color": "Negro", "sku": "KC-SNP-M-NEG", "stock": 20 },
    { "size": "L", "color": "Negro", "sku": "KC-SNP-L-NEG", "stock": 10 }
  ]
}
```

### `PUT /api/products/:id` 🔒 [vendor]
Actualizar producto (solo propietario).

### `DELETE /api/products/:id` 🔒 [vendor]
Archivar producto (soft delete, `status = 'archived'`).

---

## INVENTORY ENDPOINTS (Puerto 3000)
**Responsable:** Erick

### `GET /api/inventory/variants/:variantId` 🔒 [vendor|staff]
Obtener stock actual de una variante.

### `PUT /api/inventory/variants/:variantId/stock` 🔒 [vendor|staff]
Ajustar stock manualmente.
```json
// Body
{ "quantity": 10, "type": "in", "reason": "Reposición de stock" }
```

### `GET /api/inventory/alerts` 🔒 [vendor]
Listar variantes con stock bajo el umbral.

### `GET /api/inventory/movements` 🔒 [vendor]
Historial de movimientos de inventario con filtros.

---

## CART ENDPOINTS (Puerto 3000)
**Responsable:** Carlos

### `GET /api/cart` 🔒 [customer]
Obtener carrito actual del usuario para una tienda.
```
Query: storeId (required)
```

### `POST /api/cart/items` 🔒 [customer]
Agregar item al carrito (verifica stock).
```json
// Body
{ "storeId": "uuid", "productVariantId": "uuid", "quantity": 2 }
// Error 400 si stock insuficiente
{ "success": false, "error": { "code": "INSUFFICIENT_STOCK", "message": "Solo 1 unidad disponible" } }
```

### `PUT /api/cart/items/:itemId` 🔒 [customer]
Actualizar cantidad de un item.

### `DELETE /api/cart/items/:itemId` 🔒 [customer]
Eliminar item del carrito.

### `DELETE /api/cart` 🔒 [customer]
Vaciar el carrito completo.

---

## ORDER ENDPOINTS (Puerto 3000)
**Responsable:** Carlos + Erick

### `POST /api/orders` 🔒 [customer]
Crear orden desde el carrito (checkout).
```json
// Body
{
  "storeId": "uuid",
  "shippingAddress": {
    "name": "Juan García",
    "address": "Calle Principal 123, Zona 1",
    "city": "Puerto Barrios",
    "phone": "+502 1234 5678"
  },
  "paymentMethod": "crypto_eth",  // "crypto_eth" | "card" | "transfer"
  "customerNotes": "Por favor empacar con cuidado"
}
// Response 201
{
  "success": true,
  "data": {
    "order": { "id": "uuid", "status": "pending_payment", "total": 750.00, ... },
    "paymentIntent": { ... }  // Solo si paymentMethod = "crypto_eth"
  }
}
```

### `GET /api/orders` 🔒
Listar órdenes. Vendedor ve órdenes de su tienda. Cliente ve sus propias órdenes.
```
Query: status, storeId, page, limit, dateFrom, dateTo
```

### `GET /api/orders/:id` 🔒
Detalle de una orden con items y transacciones de pago.

### `PUT /api/orders/:id/status` 🔒 [vendor|staff]
Cambiar estado de la orden.
```json
// Body
{ "status": "preparing", "vendorNotes": "Empacando el pedido" }
```

### `PUT /api/orders/:id/tracking` 🔒 [vendor|staff]
Registrar número de guía de envío.
```json
// Body
{ "trackingNumber": "GE123456789GT", "trackingCompany": "Guatex" }
```

### `PUT /api/orders/:id/cancel` 🔒 [customer|vendor]
Cancelar orden (solo si estado es `pending_payment` o `paid`).

---

## PAYMENT ENDPOINTS (Puerto 3000)
**Responsable:** Andy + Erick

### `POST /api/payments/crypto/initiate` 🔒 [customer]
Iniciar proceso de pago cripto. Genera nonce y fija tasa de cambio.
```json
// Body
{ "orderId": "uuid" }
// Response 200
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "walletAddress": "0x742d35Cc...",  // Wallet de la tienda
    "amountEth": "0.00234",
    "amountGtq": 750.00,
    "exchangeRate": 320512.50,         // GTQ por 1 ETH
    "rateLockedAt": "2026-05-02T10:00:00Z",
    "expiresAt": "2026-05-02T10:10:00Z",  // 10 minutos
    "nonce": "kc_nonce_abc123",
    "network": "sepolia",
    "qrData": "ethereum:0x742d35Cc...?value=2340000000000000"
  }
}
```

### `POST /api/payments/crypto/verify` 🔒 [customer]
Verificar transacción on-chain y confirmar pago.
```json
// Body
{ "paymentId": "uuid", "txHash": "0xabc123..." }
// Response 200 (después de verificar blockchain)
{ "success": true, "data": { "orderId": "uuid", "status": "paid", "confirmedAt": "..." } }
// Error ERR-C06 (discrepancia de monto)
{ "success": false, "error": { "code": "AMOUNT_DISCREPANCY", "message": "Monto recibido no coincide" } }
```

### `GET /api/payments/:orderId` 🔒
Estado actual del pago de una orden.

### `GET /api/payments/crypto/price` 
Consultar tasa ETH/GTQ actual (sin auth).
```json
// Response 200
{ "success": true, "data": { "eth_gtq": 320512.50, "updatedAt": "2026-05-02T10:00:00Z" } }
```

---

## ADMIN ENDPOINTS (Puerto 3000)
**Responsable:** Erick

### `GET /api/admin/stores` 🔒 [superadmin]
Listar todas las tiendas de la plataforma.

### `PUT /api/admin/stores/:id/approve` 🔒 [superadmin]
Aprobar tienda y activar vendedor.

### `PUT /api/admin/stores/:id/suspend` 🔒 [superadmin]
Suspender tienda.

### `GET /api/admin/dashboard` 🔒 [superadmin]
Métricas globales de la plataforma.

---

## IA ENGINE ENDPOINTS (Puerto 8000)
**Responsable:** Erick

### `POST /api/ai/analyze-transaction`
Analizar una transacción en busca de señales de fraude.
```json
// Body (llamado internamente desde backend-api)
{
  "orderId": "uuid",
  "amount": 2500.00,
  "customerId": "uuid",
  "txHash": "0xabc...",
  "metadata": { ... }
}
// Response
{ "riskScore": 0.15, "flagged": false, "reasons": [] }
```

### `POST /api/ai/inventory-alert`
Analizar patrones de inventario para predicción de demanda.
