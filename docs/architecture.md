# 🏗️ ARQUITECTURA — Kingsley Caps

> Fuente: Segundo Entregable (Diseño y Arquitectura del Sistema — 61 páginas)

---

## PATRÓN ARQUITECTÓNICO: CLEAN ARCHITECTURE

El sistema sigue **Clean Architecture** (Robert C. Martin) organizado en 4 capas horizontales:

```
┌─────────────────────────────────────────────────────────┐
│  CAPA DE PRESENTACIÓN                                    │
│  React 18 — componentes, páginas, hooks                  │
│  Comunicación: REST sobre HTTPS                          │
├─────────────────────────────────────────────────────────┤
│  CAPA DE APLICACIÓN                                      │
│  Controllers Express — orquestan casos de uso            │
│  NO contienen lógica de dominio                          │
├─────────────────────────────────────────────────────────┤
│  CAPA DE DOMINIO                                         │
│  Services — lógica de negocio pura                       │
│  Modelos con reglas de negocio internas                  │
│  Independiente de frameworks                             │
├─────────────────────────────────────────────────────────┤
│  CAPA DE INFRAESTRUCTURA                                 │
│  Node.js/Express, PostgreSQL, Redis                      │
│  Python/FastAPI (IA), ethers.js (blockchain)             │
│  Integraciones externas (CoinGecko, Infura)              │
└─────────────────────────────────────────────────────────┘
```

---

## ARQUITECTURA MULTI-TENANT

**Estrategia:** Shared Database, Shared Schema con `store_id` en todas las tablas de dominio.

```
Plataforma
├── Tienda A (store_id: uuid-1)
│   ├── Productos de A
│   ├── Órdenes de A
│   └── Inventario de A
├── Tienda B (store_id: uuid-2)  
│   └── ... (completamente aislada)
└── Kingsley Caps (tienda demo, store_id: uuid-demo)
```

**Garantía de aislamiento:**
1. El `store_id` siempre se extrae del JWT (nunca del body de la request)
2. Todos los middleware de autorización verifican que el recurso pertenece al store del JWT
3. Imposible técnicamente que un vendedor acceda a datos de otro tenant si los filtros están correctos

---

## MÓDULOS DEL SISTEMA (por integrante)

### Módulo 1: Usuarios y Pagos — ANDY
```
auth-service (Puerto 3001):
  - Registro y autenticación (RF-001, RF-002)
  - Gestión de JWT (access + refresh)
  - Rate limiting de auth

Frontend + Pagos:
  - Todas las vistas de usuario
  - Integración MetaMask (RF-004, RF-005, RF-015)
  - Conversión GTQ→ETH (RF-014)
  - Verificación de pago (colabora con Erick)
```

### Módulo 2: Tienda y Pedidos — CARLOS
```
backend-api (Puerto 3000) — secciones:
  - Gestión de tiendas (RF-003, RF-034)
  - Catálogo de productos (RF-009)
  - Carrito de compras (RF-011)
  - Órdenes y estados (RF-012, RF-017, RF-018, RF-027)

Frontend — secciones:
  - Panel del vendedor (productos y órdenes)
  - Catálogo público
```

### Módulo 3: IA, Envíos y Administración — ERICK
```
ia-service (Puerto 8000):
  - Motor anti-fraude (Python/FastAPI)
  - Análisis heurístico de transacciones

backend-api (Puerto 3000) — secciones:
  - Gestión de inventario (RF-010)
  - Verificación de pagos on-chain (RF-006, RF-016)
  - Notificaciones (RF-019)
  - Envíos y guías (RF-008)
  - Panel SuperAdmin (RF-045)

Infraestructura:
  - Nginx reverse proxy
  - Docker compose completo
```

---

## DECISIONES ARQUITECTÓNICAS (Trade-offs)

### 1. MetaMask vs Binance Pay
**Decisión:** MetaMask (Ethereum)
**Razón:** No-custodial (fondos directamente al vendedor), mayor control, compatible con Sepolia Testnet para desarrollo sin costo, mayor transparencia on-chain.

### 2. Docker Compose vs Kubernetes
**Decisión:** Docker Compose para desarrollo y entrega académica
**Razón:** Menor complejidad operacional para un equipo de 3 personas. Kubernetes sería overkill para este alcance. Migración posible en versiones futuras.

### 3. Clean Architecture vs MVC
**Decisión:** Clean Architecture
**Razón:** Mejor separación de responsabilidades, más testeable, lógica de negocio independiente del framework Express.

### 4. Motor IA Desacoplado vs Acoplado
**Decisión:** Desacoplado (microservicio Python/FastAPI)
**Razón:** Python tiene mejor ecosistema de ML (scikit-learn, pandas). Permite escalar el motor IA independientemente del backend principal.

### 5. PostgreSQL vs MongoDB
**Decisión:** PostgreSQL
**Razón:** Transacciones ACID críticas para operaciones de inventario y pagos. Relaciones bien definidas entre entidades. Soporte de JSONB para datos semi-estructurados (shipping_address, images).

---

## FLUJO DE DATOS — PAGO CRIPTO

```
Cliente                Frontend              Backend               Blockchain
   │                      │                     │                      │
   │── Selecciona ETH ───>│                     │                      │
   │                      │── POST /payments ──>│                      │
   │                      │   /crypto/initiate  │── GET ETH/GTQ ──────>│ CoinGecko
   │                      │                     │<── tasa: 320,512 GTQ │
   │                      │<── nonce + wallet + │                      │
   │                      │    monto ETH + QR   │                      │
   │<── Mostrar QR ───────│                     │                      │
   │    countdown 10 min  │                     │                      │
   │── Approve en ────────│                     │                      │
   │   MetaMask           │                     │                      │
   │                      │── sendTransaction ─>│                      │ Ethereum Network
   │                      │                     │                 TX firmada
   │                      │<── txHash ──────────│                      │
   │                      │── POST /verify ────>│                      │
   │                      │    txHash           │── getTransaction ───>│ ethers.js
   │                      │                     │<── TX datos ─────────│
   │                      │                     │── Wait 3 confirms ───│
   │                      │                     │<── confirmed ────────│
   │                      │                     │── Update order: paid │
   │                      │<── order: paid ─────│                      │
   │<── Confirmación ─────│                     │                      │
```

---

## PUERTOS Y COMUNICACIÓN

```
Internet/Cliente
    │
    ▼
[nginx :80/:443]  ← único punto de entrada externo
    │
    ├──→ /api/auth/*  → [auth-service :3001]  (Andy)
    ├──→ /api/ai/*    → [ia-service :8000]    (Erick, Python)
    ├──→ /api/*       → [backend-api :3000]   (Carlos + Erick)
    └──→ /*           → [frontend :80]        (Andy)

Redes internas Docker (no expuestas al exterior):
  backend-api ←→ postgres :5432
  backend-api ←→ redis :6379
  backend-api → ia-service :8000 (llamadas internas)
  auth-service ←→ postgres :5432
```

---

## DIAGRAMA DE CAPAS POR MÓDULO

```
                    FRONTEND (React)
┌──────────────────────────────────────────────────────────┐
│  pages/  →  components/  →  hooks/  →  services/api.js   │
│  AuthContext, CartContext                                 │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTP REST
┌──────────────────────▼───────────────────────────────────┐
│                    BACKEND (Express)                      │
│  routes/ → middleware/ → controllers/ → services/         │
│  models/ (Sequelize) → PostgreSQL                         │
└──────────────┬────────────────────┬──────────────────────┘
               │                    │
┌──────────────▼──────┐  ┌─────────▼──────────────────────┐
│  PostgreSQL          │  │  Servicios externos            │
│  Redis               │  │  - CoinGecko (precios ETH)    │
│                      │  │  - Ethereum/Sepolia (ethers.js)│
└─────────────────────┘  └────────────────────────────────┘
```
