# CONTEXTO COMPLETO — OCTAVO ENTREGABLE
# Implementación y Documentación — Kingsley Caps

---

## INSTRUCCIONES PARA CLAUDE WEB

Eres un experto en Ingeniería de Software y debes generar el **Octavo Entregable: Implementación y Documentación** para el proyecto universitario **Kingsley Caps**.

El documento debe ser un **documento académico completo y formal** con:
- Portada (nombre del proyecto, curso, universidad, integrantes, fecha)
- Índice numerado
- Introducción
- Desarrollo detallado de cada sección requerida
- Conclusiones
- Anexos con configuraciones reales

**Secciones obligatorias del entregable:**
1. Estrategia de despliegue
2. Entornos
3. Criterios de validación
4. Manual de usuario
5. Manual técnico

Usa TODA la información real del proyecto que se proporciona a continuación. NO inventes datos. Usa los comandos reales, la arquitectura real, los endpoints reales, el docker-compose real y las configuraciones reales.

**Datos del curso:**
- Universidad: UMG Puerto Barrios
- Curso: Ingeniería de Software, 2026
- Integrantes: Andy Fabricio Aquino Escobar (0909-22-1669), Erick Andrey Ortiz Guerra (0909-22-17063)

---

## CONTEXTO DEL PROYECTO

### Descripción general
Kingsley Caps es una plataforma e-commerce multi-tenant estilo Shopify para venta de gorras con pagos en criptomonedas (Ethereum/ETH). Cuenta con panel vendedor, catálogo público, checkout, verificación blockchain on-chain y motor de inteligencia artificial anti-fraude.

### Stack tecnológico completo
| Capa | Tecnología | Versión / Notas |
|------|-----------|---------|
| Frontend | React + Vite + Tailwind CSS | React 18.2, Vite 5.0 — puerto 5174 |
| Backend API | Node.js + Express + Sequelize | Node 20, Express 4.18 — puerto 3002 |
| Base de datos | **Supabase (PostgreSQL gestionado)** | PostgreSQL 15, cloud compartido por todo el equipo |
| Motor IA | Python + FastAPI + Pydantic v2 | Python 3.11 — puerto 8000 |
| Blockchain | ethers.js v6 → Ethereum Sepolia testnet | ethers 6.9 |
| Contenedores | Docker Compose | v3.9 (opcional, para entorno completo) |

### Roles del sistema
| Rol | Descripción |
|-----|-------------|
| `customer` | Cliente que navega y compra gorras |
| `vendor` | Dueño de tienda: gestiona productos, inventario y pedidos |
| `staff` | Asistente del vendedor con acceso limitado |
| `superadmin` | Administrador global: aprueba tiendas, ve métricas, gestiona alertas |

---

## ARQUITECTURA DEL SISTEMA

### Diagrama — Entorno real de desarrollo del equipo
```
Navegador
    |
    |-- http://127.0.0.1:5174 --> Frontend React (Vite, puerto 5174)
    |       |
    |       +-- VITE_API_URL=http://127.0.0.1:3002
    |
    |-- http://127.0.0.1:3002 --> Backend API Node.js (puerto 3002)
    |       |
    |       +-- /api/auth/*   (integrado en el mismo proceso)
    |       +-- /api/ai/*  --> AI Engine FastAPI (puerto 8000)
    |       +-- Supabase PostgreSQL (DB_HOST=127.0.0.1, DB_PORT=55432)
    |
    +-- http://localhost:8000  --> AI Engine Python/FastAPI

Base de datos: Supabase Cloud (compartida por todo el equipo)
```

### Diagrama — Entorno Docker Compose (completo/CI)
```
Internet (HTTP)
      |
      v
  Nginx :80  ---- /api/auth/*  --> auth-service:3001  (Node.js)
      |        ---- /api/ai/*   --> ia-service:8000    (Python/FastAPI)
      |        ---- /api/*      --> backend-api:3000   (Node.js/Express)
      |        ---- /*          --> frontend:80         (React SPA)
      |
  Red interna: kingsley-network (bridge)
  Puertos NO expuestos: 3000, 3001, 6379, 8000
  Puertos expuestos: 80 (nginx), 5432 (postgres), 5050 (pgadmin)
```

### Servicios Docker (docker-compose — entorno completo opcional)
| Servicio | Container | Imagen | Puerto interno | Expuesto |
|----------|-----------|--------|---------------|---------|
| postgres | kingsley_postgres | postgres:16-alpine | 5432 | :5432 |
| redis | kingsley_redis | redis:7-alpine | 6379 | No |
| pgadmin | kingsley_pgadmin | dpage/pgadmin4 | 80 | :5050 |
| auth-service | kingsley_auth | Dockerfile.auth | 3001 | No |
| backend-api | kingsley_backend | Dockerfile.server | 3000 | No |
| ia-service | kingsley_ai | Dockerfile.ai | 8000 | No |
| frontend | kingsley_frontend | Dockerfile.client | 80 | No |
| nginx | kingsley_nginx | nginx:alpine | 80 | :80 |

> **NOTA IMPORTANTE:** En el entorno de desarrollo real del equipo, la base de datos **NO corre en Docker**. Se usa **Supabase** (PostgreSQL gestionado en la nube) como base de datos compartida entre todos los integrantes del equipo. El backend se conecta via `DATABASE_URL` (Supabase connection string con SSL) o via `DB_HOST=127.0.0.1, DB_PORT=55432` (conexión local al proyecto Supabase).

---

## CONFIGURACIONES REALES

### docker-compose.yml (completo)
```yaml
version: '3.9'

networks:
  kingsley-network:
    driver: bridge

volumes:
  postgres_data:

services:
  postgres:
    image: postgres:16-alpine
    container_name: kingsley_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME:-kingsley_caps_dev}
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - kingsley-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: kingsley_redis
    restart: unless-stopped
    networks:
      - kingsley-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: kingsley_pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@kingsley.com
      PGADMIN_DEFAULT_PASSWORD: admin123
    ports:
      - "5050:80"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - kingsley-network

  auth-service:
    build:
      context: .
      dockerfile: docker/Dockerfile.auth
    container_name: kingsley_auth
    restart: unless-stopped
    environment:
      NODE_ENV: development
      AUTH_PORT: 3001
      DB_HOST: postgres
      DB_NAME: ${DB_NAME:-kingsley_caps_dev}
      DB_USER: ${DB_USER:-postgres}
      DB_PASSWORD: ${DB_PASSWORD:-postgres}
      DB_PORT: 5432
      REDIS_URL: redis://redis:6379
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET:-dev_secret}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:-dev_refresh_secret}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - kingsley-network
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3001/health || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 20s

  backend-api:
    build:
      context: .
      dockerfile: docker/Dockerfile.server
    container_name: kingsley_backend
    restart: unless-stopped
    environment:
      NODE_ENV: development
      PORT: 3000
      DB_HOST: postgres
      DB_NAME: ${DB_NAME:-kingsley_caps_dev}
      DB_USER: ${DB_USER:-postgres}
      DB_PASSWORD: ${DB_PASSWORD:-postgres}
      DB_PORT: 5432
      REDIS_URL: redis://redis:6379
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET:-dev_secret}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:-dev_refresh_secret}
      AI_ENGINE_URL: http://ia-service:8000
      ETH_RPC_URL: ${ETH_RPC_URL:-https://rpc.sepolia.org}
      ETH_NETWORK: ${ETH_NETWORK:-sepolia}
      ETH_CONFIRMATIONS_REQUIRED: ${ETH_CONFIRMATIONS_REQUIRED:-3}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      ia-service:
        condition: service_healthy
    networks:
      - kingsley-network
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3000/health || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 20s

  ia-service:
    build:
      context: .
      dockerfile: docker/Dockerfile.ai
    container_name: kingsley_ai
    restart: unless-stopped
    networks:
      - kingsley-network
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 15s

  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile.client
      args:
        VITE_API_URL: /api
        VITE_AUTH_URL: /api/auth
    container_name: kingsley_frontend
    restart: unless-stopped
    networks:
      - kingsley-network

  nginx:
    image: nginx:alpine
    container_name: kingsley_nginx
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./docker/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      auth-service:
        condition: service_healthy
      backend-api:
        condition: service_healthy
      ia-service:
        condition: service_healthy
      frontend:
        condition: service_started
    networks:
      - kingsley-network
```

---

### nginx.conf (configuración real de Nginx)
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;

upstream auth_service    { server auth-service:3001; }
upstream backend_api     { server backend-api:3000; }
upstream ia_service      { server ia-service:8000; }
upstream frontend        { server frontend:80; }

server {
    listen 80;
    server_name localhost;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Timeouts
    proxy_connect_timeout 10s;
    proxy_read_timeout 30s;
    proxy_send_timeout 30s;
    client_max_body_size 10M;

    location /api/auth/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://auth_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ai/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://ia_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /nginx-health {
        return 200 'ok';
        add_header Content-Type text/plain;
    }
}
```

---

### Dockerfile.server (Backend Node.js)
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ .
EXPOSE 3000
CMD ["node", "src/app.js"]
```

### Dockerfile.client (Frontend React — multi-stage)
```dockerfile
# Stage 1: Build con Vite
FROM node:20-alpine AS builder
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
ARG VITE_API_URL=/api
ARG VITE_AUTH_URL=/api/auth
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AUTH_URL=$VITE_AUTH_URL
COPY client/ .
RUN npm run build

# Stage 2: Servir con Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/client-nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### client-nginx.conf (SPA routing + cache)
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

### Variables de entorno (.env real del equipo)
```bash
NODE_ENV=development
PORT=3002
FRONTEND_URL=http://localhost:5174,http://127.0.0.1:5174

# Base de datos — conexión a Supabase (puerto local 55432 = Supabase CLI / port-forward)
DB_HOST=127.0.0.1
DB_PORT=55432
DB_NAME=kingsley_caps_dev
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_ACCESS_SECRET=kingsley_access_secret_andy_carlos_erick_2025
JWT_REFRESH_SECRET=kingsley_refresh_secret_andy_carlos_erick_2025
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Blockchain Ethereum
ETH_NETWORK=sepolia
ETH_RPC_URL=https://rpc.sepolia.org
ETH_CONFIRMATIONS_REQUIRED=3

COINGECKO_API_URL=https://api.coingecko.com/api/v3
LOG_LEVEL=debug
```

### Variables de entorno (.env.example — plantilla para nuevos integrantes)
```bash
NODE_ENV=development
PORT=3000
AUTH_PORT=3001
FRONTEND_URL=http://localhost:5173

# Opción A — Supabase (recomendado, BD compartida del equipo)
# DATABASE_URL=postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres

# Opción B — PostgreSQL local o Docker
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kingsley_caps_dev
DB_USER=postgres
DB_PASSWORD=

# JWT
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Blockchain Ethereum
ETH_NETWORK=sepolia
ETH_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
ETH_CONFIRMATIONS_REQUIRED=3

COINGECKO_API_URL=https://api.coingecko.com/api/v3
LOG_LEVEL=debug
```

### Variables frontend (client/.env real)
```bash
VITE_API_URL=http://127.0.0.1:3002
VITE_AUTH_URL=http://127.0.0.1:3002
VITE_ETH_NETWORK=sepolia
```

---

## COMANDOS REALES DE DESPLIEGUE

### Entorno de desarrollo real del equipo (sin Docker para BD)
```bash
# 1. Clonar repositorio
git clone <repositorio>
cd kingsley-caps

# 2. Configurar variables de entorno
cp server/.env.example server/.env
# Agregar DATABASE_URL de Supabase (obtener desde Dashboard > Connect > Session pooler)
# o configurar DB_HOST/DB_PORT del proyecto Supabase del equipo

# 3. Backend — terminal 1 (puerto 3002)
cd server
npm install
npm run dev
# Conecta automáticamente a Supabase vía DATABASE_URL o DB_HOST:55432

# 4. Frontend — terminal 2 (puerto 5174)
cd client
npm install
npm run dev

# 5. AI Engine — terminal 3 (puerto 8000)
cd ai-engine
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Entorno Docker completo (opcional, para demo o CI)
```bash
# 1. Configurar variables
cp .env.example .env
# Editar .env con valores reales

# 2. Levantar todos los servicios
docker-compose up --build

# Acceder en: http://localhost
```

### Cómo funciona la conexión a Supabase
El archivo `server/src/config/database.js` detecta automáticamente el tipo de conexión:
```javascript
// Si existe DATABASE_URL → usa Supabase con SSL
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
    })
  // Si no → usa DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD
  : new Sequelize({ host, port, database, username, password, ... });
```
Esto permite que el mismo código funcione tanto con Supabase (producción/compartido) como con PostgreSQL local (Docker o instalación local).

### Comandos útiles
```bash
# Ver logs de un servicio
docker-compose logs -f backend-api

# Reiniciar un servicio
docker-compose restart backend-api

# Detener todo
docker-compose down

# Detener y eliminar volúmenes (CUIDADO: borra la BD)
docker-compose down -v

# Migraciones de BD
cd server && npm run db:migrate

# Seeds de datos de prueba
cd server && npm run db:seed

# Reset completo de BD
cd server && npm run db:reset

# Tests backend
cd server && npm test

# Tests AI Engine
cd ai-engine && pytest

# Build del frontend
cd client && npm run build
```

---

## ENDPOINTS COMPLETOS DEL SISTEMA

### Auth + Backend API — puerto 3002 (acceso: /api/*)
> En el entorno real del equipo, auth y backend corren en el mismo proceso en el puerto 3002.

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Registro (customer o vendor) |
| POST | /api/auth/login | No | Login → access + refresh tokens |
| POST | /api/auth/refresh | No | Renovar access token |
| POST | /api/auth/logout | No | Revocar refresh token |
| GET | /api/auth/me | ✓ | Usuario autenticado actual |
| GET | /health | No | Health check del servicio |

### Backend API — puerto 3002 (acceso: /api/*)

**Tiendas**
| Método | Ruta | Auth | Rol |
|--------|------|------|-----|
| POST | /api/stores | ✓ | vendor |
| GET | /api/stores/my | ✓ | vendor |
| PUT | /api/stores/:id | ✓ | vendor |
| PUT | /api/stores/:id/crypto-config | ✓ | vendor |
| PUT | /api/stores/:id/publish | ✓ | vendor |

**Productos**
| Método | Ruta | Auth | Rol |
|--------|------|------|-----|
| GET | /api/products | No | — (público) |
| GET | /api/products/:id | No | — (público) |
| POST | /api/products | ✓ | vendor |
| PUT | /api/products/:id | ✓ | vendor |
| DELETE | /api/products/:id | ✓ | vendor |

**Carrito**
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /api/cart | ✓ | Ver carrito con items |
| POST | /api/cart/items | ✓ | Agregar item (valida stock) |
| PUT | /api/cart/items/:id | ✓ | Actualizar cantidad |
| DELETE | /api/cart/items/:id | ✓ | Eliminar item |
| DELETE | /api/cart | ✓ | Vaciar carrito |

**Órdenes**
| Método | Ruta | Auth | Rol |
|--------|------|------|-----|
| POST | /api/orders | ✓ | customer |
| GET | /api/orders/my | ✓ | customer |
| GET | /api/orders/:id | ✓ | any |
| PUT | /api/orders/:id/status | ✓ | vendor/staff |
| PUT | /api/orders/:id/cancel | ✓ | customer |

**Inventario**
| Método | Ruta | Auth | Rol |
|--------|------|------|-----|
| GET | /api/inventory/variants/:id | ✓ | vendor/staff |
| PUT | /api/inventory/variants/:id/stock | ✓ | vendor/staff |
| GET | /api/inventory/alerts | ✓ | vendor |
| GET | /api/inventory/movements | ✓ | vendor |

**Pagos Crypto**
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /api/payments/crypto/price | No | Cotización ETH/GTQ en tiempo real |
| POST | /api/payments/crypto/initiate | ✓ | Iniciar pago → wallet + monto ETH + nonce |
| POST | /api/payments/crypto/verify | ✓ | Verificar TX on-chain |
| GET | /api/payments/:orderId | ✓ | Estado del pago de una orden |

**Notificaciones**
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /api/notifications | ✓ | Lista paginada |
| GET | /api/notifications/unread-count | ✓ | Contador sin leer |
| PUT | /api/notifications/read-all | ✓ | Marcar todas leídas |
| PUT | /api/notifications/:id/read | ✓ | Marcar una leída |

**Envíos**
| Método | Ruta | Auth | Rol |
|--------|------|------|-----|
| PUT | /api/shipping/orders/:id/tracking | ✓ | vendor/staff |
| GET | /api/shipping/orders/:id/tracking | ✓ | any |

**Admin**
| Método | Ruta | Auth | Rol |
|--------|------|------|-----|
| GET | /api/admin/stores | ✓ | superadmin |
| GET | /api/admin/metrics | ✓ | superadmin |
| PUT | /api/admin/stores/:id/approve | ✓ | superadmin |
| PUT | /api/admin/stores/:id/suspend | ✓ | superadmin |

### AI Engine — puerto 8000 (acceso: /api/ai/*)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /health | Health check |
| POST | /api/ai/analyze-transaction | Análisis anti-fraude → riskScore, flagged, blocked, reasons |
| POST | /api/ai/inventory-alert | Predicción de desabastecimiento → alert_level, predicted_days |

---

## FORMATO DE RESPUESTA ESTÁNDAR

Todos los endpoints siguen este formato:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

En error:
```json
{
  "success": false,
  "error": {
    "message": "Descripción del error",
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

---

## ESTRUCTURA DEL PROYECTO

```
kingsley-caps/
├── client/                    ← React 18 + Vite + Tailwind
│   ├── src/
│   │   ├── App.jsx            ← Router principal con guards de rutas
│   │   ├── components/
│   │   │   ├── layout/        ← Navbar, Footer, VendorLayout, VendorSidebar
│   │   │   ├── ui/            ← Button, Input, Modal, Spinner, Badge, NotificationBell
│   │   │   ├── cart/          ← CartItem, CartSummary
│   │   │   ├── checkout/      ← CryptoPayment, MetaMaskGuide, PaymentSelector, ShippingForm
│   │   │   └── products/      ← ProductCard, ProductGrid, VariantSelector
│   │   ├── context/           ← AuthContext, CartContext, ThemeContext
│   │   ├── hooks/             ← useAuth, useCart, useMetaMask, useCryptoPrice,
│   │   │   │                     useProducts, useOrders, useInventory,
│   │   │   │                     useVendorOrders, useNotifications, useAdmin
│   │   ├── pages/
│   │   │   ├── Home.jsx, Catalog.jsx, ProductDetail.jsx, Storefront.jsx
│   │   │   ├── Login.jsx, Register.jsx
│   │   │   ├── Cart.jsx, Checkout.jsx, CryptoCheckout.jsx
│   │   │   ├── OrderConfirmation.jsx, MyOrders.jsx
│   │   │   ├── vendor/        ← Dashboard, Inventory, Orders, Products, Settings
│   │   │   └── admin/         ← SuperAdmin
│   │   ├── services/
│   │   │   └── api.js         ← Axios + interceptores JWT + retry 401
│   │   └── utils/
│   │       ├── formatters.js  ← formatCurrency, formatDate, formatEthAddress
│   │       └── validators.js  ← validadores de formularios
│   ├── package.json
│   └── vite.config.js
│
├── server/                    ← Node.js 20 + Express + Sequelize
│   ├── src/
│   │   ├── app.js             ← Express app: helmet, cors, routes, handlers
│   │   ├── server.js          ← Entry point
│   │   ├── config/            ← database.js, cors.js, jwt.js, marketplace.js
│   │   ├── controllers/       ← auth, store, product, cart, order, inventory,
│   │   │                         payment, notification, shipping, admin
│   │   ├── services/          ← authService, storeService, productService,
│   │   │                         cartService, orderService, inventoryService,
│   │   │                         paymentService, blockchainService, priceService,
│   │   │                         notificationService, shippingService, aiService
│   │   ├── models/            ← User, RefreshToken, Store, Product, ProductVariant,
│   │   │                         Cart, CartItem, Order, OrderItem, PaymentTransaction,
│   │   │                         InventoryMovement, Notification, ActivityLog, index.js
│   │   ├── routes/            ← authRoutes, storeRoutes, productRoutes, cartRoutes,
│   │   │                         orderRoutes, inventoryRoutes, paymentRoutes,
│   │   │                         notificationRoutes, shippingRoutes, adminRoutes
│   │   ├── middleware/        ← authenticate, authorize, rateLimiter,
│   │   │                         correlationId, errorHandler, validate
│   │   └── validators/        ← Joi validators por módulo
│   ├── tests/unit/            ← 6 archivos de tests Jest
│   └── package.json
│
├── ai-engine/                 ← Python 3.11 + FastAPI
│   ├── main.py                ← FastAPI app + endpoints
│   ├── config.py
│   ├── requirements.txt       ← fastapi, uvicorn, pydantic v2, pytest
│   ├── models/schemas.py      ← Pydantic schemas
│   ├── analyzers/
│   │   ├── transaction_analyzer.py  ← 6 reglas heurísticas anti-fraude
│   │   └── inventory_analyzer.py    ← predicción de desabastecimiento
│   ├── routers/analysis.py
│   └── tests/                 ← 16 tests pytest
│
├── docker/
│   ├── Dockerfile.server      ← node:20-alpine
│   ├── Dockerfile.auth        ← node:20-alpine (mismo código, puerto 3001)
│   ├── Dockerfile.client      ← multi-stage: builder + nginx:alpine
│   ├── nginx.conf             ← reverse proxy (4 upstreams, rate limiting)
│   ├── client-nginx.conf      ← SPA routing + cache de assets
│   └── docker-entrypoint.sh
│
├── docker-compose.yml         ← 8 servicios, red interna, healthchecks
├── .env.example
├── README.md
└── docs/
    ├── api.md
    ├── architecture.md
    ├── database.md
    ├── requirements.md
    ├── security.md
    ├── coding-standards.md
    └── git-workflow.md
```

---

## MODELOS DE BASE DE DATOS

### Diagrama de relaciones
```
User ──────┬──► RefreshToken (CASCADE DELETE)
           ├──► Store (vendor_id)
           ├──► Order (customer_id)
           └──► Notification (user_id)

Store ─────┬──► Product
           ├──► Order
           └──► PaymentTransaction

Product ───►  ProductVariant ──┬──► InventoryMovement
                               └──► OrderItem

Order ─────┬──► OrderItem
           └──► PaymentTransaction

Cart ──────► CartItem ──► ProductVariant
```

### Tablas y campos principales
| Tabla | Campos clave |
|-------|-------------|
| user | id(UUID), name, email, password_hash, role, status |
| store | id, vendor_id, name, slug, status, crypto_enabled, eth_wallet_address |
| product | id, store_id, name, base_price, category, status, images(JSONB) |
| product_variant | id, product_id, store_id, size, color, sku, stock, low_stock_threshold |
| cart | id, user_id, store_id |
| cart_item | id, cart_id, product_variant_id, quantity, unit_price |
| order | id, store_id, customer_id, status, total, currency, shipping_address(JSONB) |
| order_item | id, order_id, product_variant_id, quantity, unit_price (snapshot) |
| payment_transaction | id, order_id, method, amount_fiat, amount_crypto, tx_hash, status, expires_at, nonce |
| inventory_movement | id, product_variant_id, type(in/out/adjustment), quantity, stock_before, stock_after |
| notification | id, user_id, type, title, message, read, metadata(JSONB) |

---

## FLUJO COMPLETO DE COMPRA CON CRIPTO

```
1. Cliente navega catálogo público → /catalog
2. Selecciona producto y variante → /products/:id
3. Agrega al carrito → POST /api/cart/items (valida stock)
4. Va a checkout → /checkout
5. Ingresa dirección de envío
6. Selecciona método de pago: crypto_eth
7. Sistema llama GET /api/payments/crypto/price → cotización GTQ/ETH
8. Cliente confirma orden → POST /api/orders (crea orden en pending_payment)
9. Sistema llama POST /api/payments/crypto/initiate
   → Devuelve: walletAddress, amountEth, nonce, QR, countdown 10 min
10. Cliente conecta MetaMask → cambia a red Sepolia
11. Cliente confirma transacción en MetaMask → obtiene txHash
12. Sistema llama POST /api/payments/crypto/verify { paymentId, txHash }
    → blockchainService verifica: destinatario, monto (±1%), 3 confirmaciones
    → Si OK: payment.status = confirmed, order.status = paid
    → Si discrepancia: ERR-C06, notifica superadmins, bloquea
13. Orden pasa a estado "paid"
14. Notificación automática a cliente y vendedor
15. Motor IA analiza transacción en background (fail-safe)
16. Vendedor procesa orden: preparing → packed → shipped
17. Al marcar shipped: PUT /api/shipping/orders/:id/tracking
    → Registra número de guía y empresa
    → Notificación automática al cliente
18. Vendedor marca entregada: delivered
```

---

## SEGURIDAD IMPLEMENTADA

| Mecanismo | Implementación |
|-----------|---------------|
| Autenticación | JWT: access token 15min + refresh token 7 días con rotación |
| Contraseñas | bcrypt con salt rounds = 12 |
| Autorización | Middleware `authorize(roles)` por endpoint |
| Rate limiting | express-rate-limit: 5 intentos/15min en auth, 30r/s general en Nginx |
| Headers HTTP | helmet() en Express + X-Frame-Options, X-Content-Type, X-XSS en Nginx |
| CORS | Whitelist configurable por ambiente |
| Trazabilidad | correlationId en cada request |
| Transacciones atómicas | Sequelize transactions con row-level lock en inventario |
| Anti-doble-gasto | Nonce único por PaymentTransaction |
| IA anti-fraude | Motor Python con 6 reglas heurísticas, fail-safe de 5s |

---

## RUTAS DEL FRONTEND (React Router)

### Públicas (sin autenticación)
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| / | Home | Página principal |
| /catalog | Catalog | Catálogo de gorras |
| /products/:id | ProductDetail | Detalle de producto + variantes |
| /stores/:slug | Storefront | Tienda pública por slug |
| /login | Login | Formulario de login |
| /register | Register | Formulario de registro |

### Protegidas (cualquier usuario logueado)
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| /cart | Cart | Carrito de compras |
| /checkout | Checkout | Proceso de compra |
| /checkout/crypto | CryptoCheckout | Pago con MetaMask |
| /orders/confirmation | OrderConfirmation | Confirmación de orden |
| /orders/my | MyOrders | Mis órdenes |

### Panel Vendedor (vendor, staff, superadmin)
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| /vendor/dashboard | vendor/Dashboard | Métricas, gráficas, stock bajo |
| /vendor/inventory | vendor/Inventory | Gestión de inventario |
| /vendor/orders | vendor/Orders | Órdenes y tracking |
| /vendor/products | vendor/Products | CRUD de productos |
| /vendor/settings | vendor/Settings | Configuración de tienda y wallet ETH |

### Panel Admin (solo superadmin)
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| /admin/dashboard | admin/SuperAdmin | Control global de la plataforma |

---

## DEPENDENCIAS PRINCIPALES

### Backend (server/package.json)
```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "ethers": "^6.9.0",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "joi": "^17.11.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^2.1.1",
    "pg": "^8.11.3",
    "sequelize": "^6.35.2",
    "uuid": "^9.0.1",
    "winston": "^3.11.0"
  }
}
```

### Frontend (client/package.json)
```json
{
  "dependencies": {
    "@headlessui/react": "^1.7.17",
    "axios": "^1.6.0",
    "ethers": "^6.9.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hot-toast": "^2.4.1",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.7"
  }
}
```

### AI Engine (requirements.txt)
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
httpx==0.26.0
python-dotenv==1.0.0
pytest==7.4.4
pytest-asyncio==0.23.3
```

---

## HEALTH CHECKS (entorno real)

| Servicio | Endpoint | Respuesta esperada |
|----------|----------|-------------------|
| backend-api (puerto 3002) | GET http://127.0.0.1:3002/health | `{"success":true,"data":{"status":"ok","timestamp":"..."}}` |
| ia-service (puerto 8000) | GET http://localhost:8000/health | `{"status":"ok"}` |
| Supabase (BD) | Dashboard > Project Settings > Database | Status: Healthy |

> **Nota:** En el entorno con Docker Compose, nginx expone `/nginx-health` y postgres tiene `pg_isready`. En el entorno de desarrollo real del equipo, Supabase gestiona la BD y su health se monitorea desde el dashboard de Supabase.

---

## WORKFLOW DE RAMAS GIT

```
main
  └── develop
        ├── dev/andy     (Auth + Frontend + MetaMask)
        ├── dev/carlos   (Tiendas + Productos + Carrito + Órdenes)
        └── dev/erick    (Inventario + Pagos + IA + Notificaciones + Docker)

Feature branches:
  feature/auth-service-setup
  feature/frontend-setup
  feature/frontend-auth-pages
  feature/frontend-catalog
  feature/frontend-cart-checkout
  feature/frontend-metamask
  feature/api-inventory
  feature/api-payments-crypto
  feature/ai-engine
  feature/notifications
  feature/vendor-admin-panel
  feature/docker-nginx-setup
```

---

## CI/CD

Archivo: `.github/workflows/ci.yml`

El pipeline de CI incluye:
- Lint del código (`npm run lint`)
- Tests unitarios backend (`npm test`)
- Build del frontend (`npm run build`)
- Se ejecuta en push a `develop` y pull requests a `main`

---

## FIN DEL CONTEXTO

Con toda la información anterior, genera el Octavo Entregable completo como documento académico formal para el proyecto Kingsley Caps — UMG Puerto Barrios 2026.

El documento debe incluir:

1. **Estrategia de despliegue**
   - Descripción de la estrategia (Docker Compose como única fuente de verdad)
   - Pasos de despliegue con comandos reales
   - Diagrama de arquitectura de despliegue
   - Gestión de secretos y variables de entorno
   - Estrategia de rollback
   - Pipeline CI/CD

2. **Entornos**
   - Entorno de desarrollo (local sin Docker / con Docker)
   - Entorno de pruebas (servicios en contenedores)
   - Entorno de producción (consideraciones de hardening)
   - Comparación de variables de entorno por ambiente
   - Puertos y servicios por ambiente

3. **Criterios de validación**
   - Checklist de validación técnica (smoke tests, health checks)
   - Flujo E2E de validación funcional (14 pasos reales documentados)
   - Criterios de aceptación por módulo
   - Pruebas de seguridad básicas
   - Criterios de performance

4. **Manual de usuario**
   - Guía para el cliente: registro, búsqueda, carrito, checkout, pago con MetaMask
   - Guía para el vendedor: configuración de tienda, productos, inventario, órdenes
   - Guía para el superadmin: aprobación de tiendas, métricas, alertas
   - Capturas de pantalla descriptivas (describir en texto qué mostraría cada pantalla)
   - Preguntas frecuentes

5. **Manual técnico**
   - Prerrequisitos del sistema (Docker, Node.js, Python, Git)
   - Instalación paso a paso con comandos reales
   - Configuración de variables de entorno
   - Estructura del proyecto explicada
   - Descripción de cada servicio y su función
   - API Reference resumida con ejemplos de request/response
   - Guía de troubleshooting (errores comunes y soluciones)
   - Comandos de mantenimiento (logs, restart, migraciones, seeds)
