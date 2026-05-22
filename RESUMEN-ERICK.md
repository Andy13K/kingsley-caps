# Resumen completo — Features implementadas por Erick (Kingsley Caps)

## 1. Resumen general de módulos

| Módulo | Descripción |
|---|---|
| **API Inventario** | Gestión atómica de stock con transacciones Sequelize, alertas de stock bajo, historial de movimientos |
| **API Pagos Crypto** | Cotización ETH en tiempo real (CoinGecko, caché 60s), verificación on-chain via ethers v6, tolerancia 1%, códigos de error ERR-C01..C06 |
| **Motor IA Anti-fraude** | Microservicio Python/FastAPI con 6 reglas heurísticas para análisis de transacciones y predicción de desabastecimiento |
| **Notificaciones** | Sistema completo de notificaciones en BD, polling 30s en frontend, tipos: low_stock, payment_confirmed, payment_received, payment_discrepancy, order_status, order_shipped |
| **Servicio de envíos** | Registro de tracking por orden, validación de propiedad vendor, disparo de notificación automático |
| **Panel Admin Frontend** | Dashboard, Inventario, Órdenes y Configuración para vendor; Panel SuperAdmin; layouts y hooks propios |
| **Docker + Nginx** | docker-compose completo con 8 servicios, Nginx como único punto de entrada público, multi-stage build para frontend |

---

## 2. Archivos creados por feature

### Feature 1 — API Inventario (`feature/api-inventory`)
```
server/src/models/index.js                     ← hub central de modelos y asociaciones
server/src/models/Store.js
server/src/models/Product.js
server/src/models/ProductVariant.js
server/src/models/InventoryMovement.js
server/src/models/Notification.js             ← creado aquí, usado más adelante
server/src/models/RefreshToken.js             ← modificado (quitadas asociaciones inline)
server/src/services/inventoryService.js
server/src/controllers/inventoryController.js
server/src/routes/inventoryRoutes.js
server/src/validators/inventoryValidator.js
server/src/app.js                              ← modificado: monta inventoryRoutes
server/tests/unit/inventory.service.test.js
```

### Feature 2 — API Pagos Crypto (`feature/api-payments-crypto`)
```
server/src/models/Order.js
server/src/models/OrderItem.js
server/src/models/PaymentTransaction.js
server/src/services/blockchainService.js       ← ethers v6, verificación on-chain
server/src/services/priceService.js            ← CoinGecko caché 60s
server/src/services/paymentService.js
server/src/controllers/paymentController.js
server/src/routes/paymentRoutes.js
server/src/validators/paymentValidator.js
server/tests/unit/blockchain.service.test.js
server/tests/unit/payment.service.test.js
```

### Feature 3 — Motor IA Anti-fraude (`feature/ai-engine`)
```
ai-engine/main.py
ai-engine/config.py
ai-engine/requirements.txt
ai-engine/Dockerfile
ai-engine/.gitignore
ai-engine/models/__init__.py
ai-engine/models/schemas.py                    ← Pydantic v2
ai-engine/analyzers/__init__.py
ai-engine/analyzers/transaction_analyzer.py   ← 6 reglas heurísticas
ai-engine/analyzers/inventory_analyzer.py
ai-engine/routers/__init__.py
ai-engine/routers/analysis.py
ai-engine/tests/conftest.py
ai-engine/tests/test_transaction_analyzer.py
ai-engine/tests/test_inventory_analyzer.py
server/src/services/aiService.js               ← integración Node.js (fail-safe)
```

### Feature 5 — Notificaciones + Envíos (`feature/notifications`)
```
server/src/services/notificationService.js
server/src/services/shippingService.js
server/src/controllers/notificationController.js
server/src/controllers/shippingController.js
server/src/routes/notificationRoutes.js
server/src/routes/shippingRoutes.js
server/src/validators/shippingValidator.js
server/src/services/inventoryService.js       ← modificado: dispara notif. low stock
server/src/services/paymentService.js         ← modificado: dispara notif. pago/discrepancia
server/src/app.js                             ← modificado: monta notificationRoutes, shippingRoutes
client/src/components/ui/NotificationBell.jsx
client/src/hooks/useNotifications.js
client/src/components/layout/Navbar.jsx       ← modificado: agrega <NotificationBell />
server/tests/unit/notification.service.test.js
```

### Feature 4 — Panel Admin Frontend (`feature/vendor-admin-panel`)
```
client/src/pages/vendor/Dashboard.jsx
client/src/pages/vendor/Inventory.jsx
client/src/pages/vendor/Orders.jsx
client/src/pages/vendor/Settings.jsx
client/src/pages/admin/SuperAdmin.jsx
client/src/components/layout/VendorLayout.jsx
client/src/components/layout/VendorSidebar.jsx
client/src/hooks/useInventory.js
client/src/hooks/useVendorOrders.js
client/src/hooks/useAdmin.js
client/src/App.jsx                            ← modificado: VendorRoute, AdminRoute, nuevas rutas
```

### Feature 6 — Docker + Nginx (`feature/docker-nginx-setup`)
```
docker/Dockerfile.server
docker/Dockerfile.auth
docker/Dockerfile.client                      ← multi-stage: build Vite + nginx:alpine
docker/Dockerfile.ai
docker/nginx.conf                             ← reverse proxy con limit_req, 4 upstreams
docker/client-nginx.conf                      ← SPA routing + cache assets
docker/docker-entrypoint.sh
docker-compose.yml                            ← reemplazado: 8 servicios, kingsley-network
.env.example
README.md                                     ← actualizado con instrucciones completas
```

---

## 3. Endpoints disponibles

### `/api/inventory/*` — Puerto 3000 (backend-api)

| Método | Ruta | Auth | Rol | Descripción |
|---|---|---|---|---|
| `GET` | `/api/inventory/variants/:variantId` | ✓ | vendor, staff | Obtiene stock actual de una variante |
| `PUT` | `/api/inventory/variants/:variantId/stock` | ✓ | vendor, staff | Ajusta stock atómicamente (in/out/adjustment). Body: `{ quantity, type, reason }` |
| `GET` | `/api/inventory/alerts` | ✓ | vendor | Lista variantes con `stock <= low_stock_threshold` |
| `GET` | `/api/inventory/movements` | ✓ | vendor | Historial de movimientos. Query: `variantId, type, dateFrom, dateTo, page, limit` |

### `/api/payments/*` — Puerto 3000 (backend-api)

| Método | Ruta | Auth | Rol | Descripción |
|---|---|---|---|---|
| `GET` | `/api/payments/crypto/price` | ✗ | — | Cotización ETH/GTQ en tiempo real (caché 60s desde CoinGecko) |
| `POST` | `/api/payments/crypto/initiate` | ✓ | cualquier | Inicia pago crypto. Body: `{ orderId, amountGtq }`. Devuelve monto en ETH y nonce |
| `POST` | `/api/payments/crypto/verify` | ✓ | cualquier | Verifica transacción on-chain. Body: `{ paymentId, txHash }`. Valida confirmaciones, monto (±1%), wallet destino |
| `GET` | `/api/payments/:orderId` | ✓ | cualquier | Obtiene transacción de pago por ID de orden |

**Códigos de error de verificación:**

| Código | Significado |
|---|---|
| `ERR-C01` | TX no encontrada en blockchain |
| `ERR-C02` | Wallet destino incorrecto |
| `ERR-C03` | Confirmaciones insuficientes |
| `ERR-C04` | TX fallida en blockchain |
| `ERR-C05` | Pago expirado |
| `ERR-C06` | Discrepancia de monto (dispara alerta automática a todos los superadmins) |

### `/api/notifications/*` — Puerto 3000 (backend-api)

| Método | Ruta | Auth | Rol | Descripción |
|---|---|---|---|---|
| `GET` | `/api/notifications` | ✓ | cualquier | Notificaciones del usuario. Query: `page, limit, unreadOnly` |
| `GET` | `/api/notifications/unread-count` | ✓ | cualquier | Cantidad de notificaciones sin leer (usado por el bell cada 30s) |
| `PUT` | `/api/notifications/read-all` | ✓ | cualquier | Marca todas las notificaciones como leídas |
| `PUT` | `/api/notifications/:id/read` | ✓ | cualquier | Marca una notificación específica como leída (valida propiedad) |

### `/api/shipping/*` — Puerto 3000 (backend-api)

| Método | Ruta | Auth | Rol | Descripción |
|---|---|---|---|---|
| `PUT` | `/api/shipping/orders/:orderId/tracking` | ✓ | vendor, staff | Registra guía y empresa de envío. Cambia estado a `shipped`. Body: `{ tracking_number, carrier, estimated_delivery }` |
| `GET` | `/api/shipping/orders/:orderId/tracking` | ✓ | cualquier | Obtiene info de tracking (acceso para customer y vendor de esa orden) |

### `/api/ai/*` — Puerto 8000 (ia-service, FastAPI)

| Método | Ruta | Auth | Rol | Descripción |
|---|---|---|---|---|
| `GET` | `/health` | ✗ | — | Health check del motor IA |
| `POST` | `/api/ai/analyze-transaction` | ✗ | — | Análisis anti-fraude. Devuelve `riskScore [0-1]`, `flagged`, `blocked`, `reasons`, `recommendations` |
| `POST` | `/api/ai/inventory-alert` | ✗ | — | Predicción de desabastecimiento. Devuelve `alert_level`, `predicted_stockout_days`, `recommendation` |

> El motor IA **no es llamado directamente desde el frontend** — lo llama `server/src/services/aiService.js` de forma automática al verificar pagos. Si el motor falla o no responde en 5s, retorna `riskScore: 0` y el flujo continúa normal (fail-safe).

---

## 4. Modelos de base de datos creados

### `Store` (tabla: `store`)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `vendor_id` | UUID FK → User | |
| `name` | STRING | unique |
| `slug` | STRING | unique |
| `description` | TEXT | |
| `logo_url` | STRING | |
| `status` | ENUM | `draft`, `active`, `suspended`, `closed` |
| `plan` | ENUM | `basic`, `pro`, `enterprise` |
| `crypto_enabled` | BOOLEAN | default false |
| `eth_wallet_address` | STRING(42) | |
| `eth_confirmations_required` | INTEGER | default 3 |
| `shipping_methods` | JSONB | array de métodos configurados |

### `Product` (tabla: `product`)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `store_id` | UUID FK → Store | |
| `name` | STRING | |
| `description` | TEXT | |
| `base_price` | DECIMAL(10,2) | |
| `category` | STRING(100) | |
| `status` | ENUM | `draft`, `active`, `archived` |
| `featured` | BOOLEAN | |
| `images` | JSONB | array de URLs |
| `tags` | ARRAY(STRING) | |

### `ProductVariant` (tabla: `product_variant`)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `product_id` | UUID FK → Product | |
| `store_id` | UUID FK → Store | |
| `size` | STRING(10) | |
| `color` | STRING(50) | |
| `sku` | STRING(100) | unique |
| `stock` | INTEGER | default 0 |
| `price_override` | DECIMAL(10,2) | nullable |
| `low_stock_threshold` | INTEGER | default 3 — trigger de alerta |
| `active` | BOOLEAN | |

### `InventoryMovement` (tabla: `inventory_movement`)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `product_variant_id` | UUID FK → ProductVariant | |
| `store_id` | UUID FK → Store | |
| `type` | ENUM | `in`, `out`, `adjustment`, `reserved`, `released` |
| `quantity` | INTEGER | |
| `stock_before` | INTEGER | |
| `stock_after` | INTEGER | |
| `reason` | STRING(100) | |
| `reference_id` | UUID | nullable — puede ligar a Order |
| `created_by` | UUID FK → User | |

### `Order` (tabla: `order`)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `store_id` | UUID FK → Store | |
| `customer_id` | UUID FK → User | |
| `status` | ENUM | `pending_payment`, `paid`, `preparing`, `packed`, `shipped`, `delivered`, `cancelled`, `refunded` |
| `subtotal` | DECIMAL(10,2) | |
| `tax_amount` | DECIMAL(10,2) | |
| `shipping_amount` | DECIMAL(10,2) | |
| `discount_amount` | DECIMAL(10,2) | |
| `total` | DECIMAL(10,2) | |
| `currency` | STRING(3) | default `GTQ` |
| `shipping_address` | JSONB | |
| `shipping_method` | STRING(100) | |
| `tracking_number` | STRING(100) | |
| `tracking_company` | STRING(100) | |
| `payment_method` | STRING(20) | `crypto_eth`, `card`, etc. |
| `customer_notes` / `vendor_notes` | TEXT | |
| `paid_at` / `shipped_at` / `delivered_at` / `cancelled_at` | DATE | timestamps de cambio de estado |

### `OrderItem` (tabla: `order_item`)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `order_id` | UUID FK → Order | |
| `product_variant_id` | UUID FK → ProductVariant | |
| `product_name` | STRING(255) | snapshot al momento de compra |
| `variant_size` / `variant_color` / `sku` | STRING | snapshot inmutable |
| `quantity` | INTEGER | |
| `unit_price` | DECIMAL(10,2) | |
| `subtotal` | DECIMAL(10,2) | |

### `PaymentTransaction` (tabla: `payment_transaction`)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `order_id` | UUID FK → Order | |
| `store_id` | UUID FK → Store | |
| `method` | ENUM | `crypto_eth`, `card`, `transfer` |
| `amount_fiat` | DECIMAL(10,2) | en GTQ |
| `amount_crypto` | DECIMAL(18,8) | en ETH |
| `exchange_rate` | DECIMAL(18,6) | GTQ/ETH al momento del pago |
| `rate_locked_at` | DATE | cuando se bloqueó el tipo de cambio |
| `tx_hash` | STRING(66) | hash de la transacción Ethereum |
| `wallet_from` / `wallet_to` | STRING(42) | |
| `network` | STRING(20) | `sepolia`, `mainnet` |
| `confirmations` | INTEGER | |
| `nonce` | STRING(100) | previene doble gasto |
| `status` | ENUM | `pending`, `confirmed`, `failed`, `refunded`, `discrepancy` |
| `expires_at` | DATE | TTL del pago pendiente |

### `Notification` (tabla: `notification`)
| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK → User | destinatario |
| `store_id` | UUID FK → Store | nullable |
| `type` | STRING(50) | `low_stock`, `payment_confirmed`, `payment_received`, `payment_discrepancy`, `order_status`, `order_shipped` |
| `title` | STRING(255) | |
| `message` | TEXT | |
| `read` | BOOLEAN | default false |
| `metadata` | JSONB | datos extra según tipo (orderId, sku, amounts, etc.) |

### Asociaciones centralizadas en `models/index.js`

```
User → hasMany → RefreshToken (onDelete CASCADE)
User → hasMany → Store (vendor_id)
User → hasMany → Order (customer_id)
User → hasMany → Notification

Store → hasMany → Product
Store → hasMany → Order
Store → hasMany → PaymentTransaction (via Order)

Product → hasMany → ProductVariant
ProductVariant → hasMany → InventoryMovement
ProductVariant → hasMany → OrderItem

Order → hasMany → OrderItem
Order → hasMany → PaymentTransaction
```

---

## 5. Lo que Carlos necesita saber

### Modelos ya listos que puede usar directamente
Carlos puede hacer `const { Store, Product, ProductVariant, Order, OrderItem, PaymentTransaction } = require('../models')` y usarlos directamente. Todos tienen asociaciones definidas.

### Endpoints del frontend que ya esperan sus APIs

| Página | Endpoint esperado por el frontend |
|---|---|
| `/catalog` | `GET /api/products?page=&limit=&category=` |
| `/products/:id` | `GET /api/products/:id` |
| `/cart` | APIs de Cart y CartItem (modelos pendientes) |
| `/checkout` | `POST /api/orders` para crear la orden |
| `/orders` (cliente) | `GET /api/orders/my` |
| `/vendor/orders` | `GET /api/orders` (filtrado por store del vendor), `PUT /api/orders/:id/status` |
| `/admin/dashboard` | `GET /api/admin/stores`, `GET /api/admin/metrics`, `PUT /api/admin/stores/:id/approve`, `PUT /api/admin/stores/:id/suspend` |
| `/vendor/settings` | `GET /api/stores/my`, `PUT /api/stores/my` |

### Hooks del frontend con datos mock (Carlos debe conectar las APIs reales)
Todos estos hooks tienen fallback a datos mock si la API falla. Carlos debe implementar los endpoints para que la data sea real:

- `client/src/hooks/useVendorOrders.js` — espera `GET /api/orders` y `PUT /api/orders/:id/status`
- `client/src/hooks/useAdmin.js` — espera los endpoints `/api/admin/*`
- `client/src/pages/vendor/Dashboard.jsx` — llama a `GET /api/orders?dateFrom=...` para métricas reales

---

## 6. Lo que Andy necesita saber

### Auth service ya integrado en docker-compose
El `auth-service` ya está en `docker-compose.yml` con su propio contenedor en puerto 3001. Solo necesita asegurarse de que el código del servidor responde en `process.env.AUTH_PORT || 3001`.

### Middleware `authenticate` y `authorize` ya en uso
Todos mis endpoints protegidos usan:
```js
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
```
Estos deben estar en `server/src/middleware/`. El `authorize` recibe roles como strings: `authorize('vendor', 'staff')`, `authorize('superadmin')`.

### El modelo `User` ya tiene asociaciones definidas
En `models/index.js` el modelo `User` de Andy ya tiene estas asociaciones registradas. Si modifica el modelo, debe mantener al menos estos campos:
- `id` — UUID
- `name` — STRING
- `email` — STRING
- `role` — con valores posibles: `customer`, `vendor`, `staff`, `superadmin`

### Formato de respuesta esperado
Todos mis servicios y el frontend esperan este formato estándar:
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

---

## 7. Componentes frontend creados

### Páginas del panel vendor

| Componente | Ruta | Rol requerido | Descripción |
|---|---|---|---|
| `pages/vendor/Dashboard.jsx` | `/vendor/dashboard` | vendor, staff, superadmin | Métricas del mes, gráficas de barras con Tailwind (sin librerías externas), stock bajo, últimas órdenes |
| `pages/vendor/Inventory.jsx` | `/vendor/inventory` | vendor, staff, superadmin | Tabla de variantes, modal ajuste de stock (Headless UI Dialog), historial movimientos, exportar CSV |
| `pages/vendor/Orders.jsx` | `/vendor/orders` | vendor, staff, superadmin | Tabla de órdenes con filtros de estado/fecha, cambio de estado por botones, modal de tracking |
| `pages/vendor/Settings.jsx` | `/vendor/settings` | vendor, staff, superadmin | Formulario tienda, toggle crypto con validación wallet ETH (regex 0x + 40 hex), métodos de envío editables |
| `pages/admin/SuperAdmin.jsx` | `/admin/dashboard` | superadmin | Métricas globales, aprobar/suspender tiendas pendientes, alertas de discrepancia ERR-C06 |

### Layout y componentes de UI

| Componente | Descripción |
|---|---|
| `components/layout/VendorLayout.jsx` | Sidebar izquierdo + `<Outlet />`. Mobile: overlay con hamburger. Sin Navbar ni Footer públicos |
| `components/layout/VendorSidebar.jsx` | Sidebar charcoal-900, `<NavLink>` con gold activo, 4 secciones + botón logout |
| `components/ui/NotificationBell.jsx` | Campana en Navbar con badge gold, dropdown de notificaciones, polling 30s al `GET /api/notifications/unread-count`, lazy load al abrir |

### Hooks

| Hook | Descripción |
|---|---|
| `hooks/useNotifications.js` | `fetchNotifications`, `fetchUnreadCount` (polling 30s con cleanup), `markAsRead`, `markAllAsRead` |
| `hooks/useInventory.js` | `fetchVariants`, `fetchAlerts`, `fetchMovements(page)`, `adjustStock(id, {quantity, type, reason})`, `exportCSV()` |
| `hooks/useVendorOrders.js` | `fetchOrders(filters)`, `updateOrderStatus(orderId, status)`, `addTracking(orderId, data)` |
| `hooks/useAdmin.js` | `fetchStores()`, `fetchDashboardMetrics()`, `approveStore(id)`, `suspendStore(id)` |

### Route guards en `App.jsx`

```jsx
// Redirige a /login si no autenticado, a / si no tiene rol correcto
<VendorRoute>   → permite: vendor, staff, superadmin → /vendor/*
<AdminRoute>    → permite: superadmin únicamente     → /admin/dashboard
<ProtectedRoute>→ permite: cualquier usuario logueado → /cart, /checkout, /orders
```

---

## 8. Variables de entorno (`.env.example`)

```bash
# Base de datos
DB_PASSWORD=postgres
DB_NAME=kingsley_caps_dev
DB_USER=postgres
DB_HOST=localhost
DB_PORT=5432

# JWT (Andy los configura en el auth service)
JWT_ACCESS_SECRET=change_me_in_production
JWT_REFRESH_SECRET=change_me_in_production_too

# Blockchain Ethereum
ETH_RPC_URL=https://rpc.sepolia.org
ETH_NETWORK=sepolia
ETH_CONFIRMATIONS_REQUIRED=3

# AI Engine
AI_ENGINE_URL=http://localhost:8000

# Frontend — build-time para Vite
VITE_API_URL=http://localhost:3000
VITE_AUTH_URL=http://localhost:3001
```

---

## 9. Cómo correr el proyecto

### Desarrollo local (recomendado para trabajar individualmente)

```bash
# 1. Copiar variables de entorno
cp .env.example .env

# 2. Levantar solo la infraestructura con Docker
docker-compose up postgres redis -d

# 3. Backend API — terminal 1 (puerto 3000)
cd server && npm install && npm run dev

# 4. Auth service — terminal 2 (puerto 3001, mismo código)
AUTH_PORT=3001 node server/src/app.js

# 5. Frontend — terminal 3
cd client && npm install && npm run dev
# Disponible en http://localhost:5173

# 6. AI Engine — terminal 4 (opcional)
cd ai-engine
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Docker completo — un solo comando

```bash
docker-compose up --build
# Acceder en: http://localhost
```

### Arquitectura Docker

```
Internet
    │
    ▼
Nginx :80 (único puerto público)
    ├── /api/auth/*  ──► auth-service:3001
    ├── /api/ai/*   ──► ia-service:8000
    ├── /api/*      ──► backend-api:3000
    └── /*          ──► frontend:80 (React SPA)

Red interna: kingsley-network
Puertos NO expuestos al host: 3000, 3001, 6379, 8000
Puertos expuestos al host: 80 (nginx), 5432 (postgres), 5050 (pgadmin)
```

### Servicios en docker-compose

| Servicio | Imagen/Build | Puerto interno |
|---|---|---|
| `postgres` | postgres:16-alpine | 5432 |
| `redis` | redis:7-alpine | 6379 |
| `pgadmin` | dpage/pgadmin4 | 80 → host:5050 |
| `auth-service` | docker/Dockerfile.auth | 3001 |
| `backend-api` | docker/Dockerfile.server | 3000 |
| `ia-service` | docker/Dockerfile.ai | 8000 |
| `frontend` | docker/Dockerfile.client (multi-stage) | 80 |
| `nginx` | nginx:alpine | 80 → host:80 |
