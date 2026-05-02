# 🧢 KINGSLEY CAPS — CONTEXTO MAESTRO PARA AGENTES DE IA

> **Este archivo es leído automáticamente por Claude Code.**
> **OpenAI Codex lee AGENTS.md (copia idéntica).**
> Contiene el contexto COMPLETO extraído de los 7 entregables académicos del proyecto.
> Consulta los archivos en `/docs/` para información adicional por tema.

---

## 📌 ÍNDICE RÁPIDO

| Tema | Archivo |
|------|---------|
| Requisitos funcionales completos (RF-001 a RF-060) | `docs/requirements.md` |
| Arquitectura y decisiones técnicas | `docs/architecture.md` |
| Esquema de base de datos completo | `docs/database.md` |
| Todos los endpoints de la API | `docs/api.md` |
| Convenciones de código | `docs/coding-standards.md` |
| Seguridad y controles | `docs/security.md` |
| Workflow Git y ramas | `docs/git-workflow.md` |
| Tareas de Andy (Frontend + MetaMask) | `docs/tasks/andy.md` |
| Tareas de Carlos (Tienda + Pedidos) | `docs/tasks/carlos.md` |
| Tareas de Erick (IA + Admin + Envíos) | `docs/tasks/erick.md` |

---

## 🏪 QUÉ ES ESTE PROYECTO

**Kingsley Caps** es una plataforma web **multi-tenant** de e-commerce para Guatemala que permite a emprendedores y pequeñas empresas vender productos en línea. La marca de ejemplo que demuestra el sistema es **Kingsley Caps**, una tienda de gorras y camisas.

### Características diferenciadoras vs Shopify:
1. **Pagos en criptomonedas (ETH)** vía MetaMask — no custodial, directo a wallet del vendedor
2. **Motor de IA anti-fraude** — detección heurística de transacciones sospechosas
3. **Multi-tenant con aislamiento total** por `tenant_id` en todas las tablas
4. **Despliegue en Docker** con contenedores independientes por módulo
5. **Contexto guatemalteco** — envíos manuales, divisas GTQ/ETH, logística local

### Contexto académico:
- **Universidad:** Mariano Gálvez de Guatemala — Centro Puerto Barrios, Izabal
- **Curso:** Ingeniería de Software — Ciclo 9, Semestre I, 2026
- **Catedrático:** Ing. M. A. Alejandro Mejicanos
- **Criterio de aprobación:** 70% de los requisitos funcionales MUST implementados

---

## 👥 EQUIPO Y MÓDULOS ASIGNADOS

| Desarrollador | Carnet | Rama Git | Módulo Principal |
|---|---|---|---|
| **Andy Fabricio Aquino Escobar** | 0909-22-1669 | `dev/andy` | Módulo de Usuarios y Pagos |
| **Carlos Giovanni Martínez Aldana** | 0909-22-19157 | `dev/carlos` | Módulo de Tienda y Pedidos |
| **Erick Andrey Ortiz Guerra** | 0909-22-17063 | `dev/erick` | Módulo de IA, Envíos y Administración |

> Esta asignación viene del **Segundo Entregable (Diseño y Arquitectura)** — es oficial.

---

## 🏗️ STACK TECNOLÓGICO COMPLETO

### Servicios Docker (del Segundo Entregable, sección 1.3)

| Servicio | Tecnología | Puerto | Responsable |
|---|---|---|---|
| `auth-service` | Node.js + Express | 3001 | Andy |
| `backend-api` | Node.js + Express | 3000 | Carlos + Erick |
| `ia-service` | Python + FastAPI | 8000 | Erick |
| `frontend` | React 18 + Vite | 5173 (dev) | Andy |
| `postgres` | PostgreSQL 16 | 5432 (interno) | Carlos |
| `redis` | Redis 7 | 6379 (interno) | Carlos |
| `nginx` | Nginx (reverse proxy) | 80/443 | Erick |

### Dependencias Backend (Node.js)
```json
{
  "express": "^4.18",
  "jsonwebtoken": "^9.0",
  "bcryptjs": "^2.4",
  "sequelize": "^6.35",
  "pg": "^8.11",
  "joi": "^17.11",
  "winston": "^3.11",
  "cors": "^2.8",
  "helmet": "^7.1",
  "express-rate-limit": "^7.1",
  "dotenv": "^16.3",
  "ethers": "^6.9",
  "axios": "^1.6",
  "uuid": "^9.0"
}
```

### Dependencias Frontend (React)
```json
{
  "react": "^18.2",
  "react-dom": "^18.2",
  "react-router-dom": "^6.20",
  "axios": "^1.6",
  "ethers": "^6.9",
  "tailwindcss": "^3.3",
  "@headlessui/react": "^1.7",
  "react-hot-toast": "^2.4",
  "zustand": "^4.4"
}
```

### Dependencias IA (Python)
```
fastapi==0.104
uvicorn==0.24
scikit-learn==1.3
pandas==2.1
numpy==1.26
httpx==0.25
```

---

## 📁 ESTRUCTURA DE CARPETAS (OFICIAL del Sexto Entregable)

```
kingsley-caps/
├── client/                        # Frontend React — ANDY
│   ├── src/
│   │   ├── components/            # Componentes reutilizables (PascalCase)
│   │   │   ├── auth/              # LoginForm, RegisterForm
│   │   │   ├── cart/              # CartDrawer, CartItem, CartSummary
│   │   │   ├── checkout/          # CheckoutForm, PaymentSelector, CryptoPayment
│   │   │   ├── layout/            # Navbar, Footer, Sidebar
│   │   │   ├── products/          # ProductCard, ProductGrid, ProductDetail
│   │   │   └── ui/                # Button, Input, Modal, Spinner, Toast, Badge
│   │   ├── pages/                 # Una página por ruta
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Catalog.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── OrderConfirmation.jsx
│   │   │   ├── MyOrders.jsx
│   │   │   └── vendor/            # Panel del vendedor (Carlos/Erick)
│   │   │       ├── Dashboard.jsx
│   │   │       ├── Products.jsx
│   │   │       ├── Orders.jsx
│   │   │       ├── Inventory.jsx
│   │   │       └── Settings.jsx
│   │   ├── hooks/                 # Custom hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useCart.js
│   │   │   ├── useProducts.js
│   │   │   ├── useOrders.js
│   │   │   ├── useInventory.js
│   │   │   ├── useMetaMask.js     # MetaMask integration hook
│   │   │   └── useCryptoPrice.js  # CoinGecko price hook
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Global auth state
│   │   │   └── CartContext.jsx    # Global cart state
│   │   ├── services/
│   │   │   └── api.js             # Axios instance centralizada (ÚNICA fuente de HTTP)
│   │   └── utils/
│   │       ├── formatters.js      # formatCurrency, formatDate, formatAddress
│   │       └── validators.js      # Form validation helpers
│   ├── public/
│   └── package.json
│
├── server/                        # Backend Node.js — CARLOS + ANDY
│   ├── src/
│   │   ├── controllers/           # Solo: validar → llamar service → responder
│   │   │   ├── authController.js       # ANDY
│   │   │   ├── userController.js       # ANDY
│   │   │   ├── storeController.js      # CARLOS
│   │   │   ├── productController.js    # CARLOS
│   │   │   ├── inventoryController.js  # ERICK
│   │   │   ├── cartController.js       # CARLOS
│   │   │   ├── orderController.js      # CARLOS/ERICK
│   │   │   └── paymentController.js    # ANDY
│   │   ├── services/              # TODA la lógica de negocio aquí
│   │   │   ├── authService.js
│   │   │   ├── userService.js
│   │   │   ├── storeService.js
│   │   │   ├── productService.js
│   │   │   ├── inventoryService.js
│   │   │   ├── cartService.js
│   │   │   ├── orderService.js
│   │   │   ├── paymentService.js      # Crypto + fiat
│   │   │   ├── blockchainService.js   # ethers.js, verificar TX
│   │   │   └── priceService.js        # CoinGecko GTQ→ETH
│   │   ├── models/                # Sequelize models
│   │   │   ├── User.js
│   │   │   ├── Store.js
│   │   │   ├── RefreshToken.js
│   │   │   ├── Product.js
│   │   │   ├── ProductVariant.js
│   │   │   ├── InventoryMovement.js
│   │   │   ├── Cart.js
│   │   │   ├── CartItem.js
│   │   │   ├── Order.js
│   │   │   ├── OrderItem.js
│   │   │   ├── PaymentTransaction.js
│   │   │   ├── Notification.js
│   │   │   └── ActivityLog.js
│   │   ├── middleware/
│   │   │   ├── authenticate.js    # Verificar JWT
│   │   │   ├── authorize.js       # Verificar rol
│   │   │   ├── validate.js        # Joi validation wrapper
│   │   │   ├── rateLimiter.js     # express-rate-limit configs
│   │   │   └── errorHandler.js    # Global error handler
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── storeRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   ├── inventoryRoutes.js
│   │   │   ├── cartRoutes.js
│   │   │   ├── orderRoutes.js
│   │   │   ├── paymentRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── config/
│   │   │   ├── database.js        # Sequelize connection
│   │   │   ├── jwt.js             # JWT config
│   │   │   └── cors.js            # CORS whitelist
│   │   └── utils/
│   │       ├── AppError.js        # Custom error classes
│   │       ├── asyncHandler.js    # Async wrapper
│   │       ├── logger.js          # Winston logger
│   │       └── validators/        # Joi schemas por recurso
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── .env.example
│   └── package.json
│
├── ai-engine/                     # Motor IA anti-fraude — ERICK
│   ├── models/
│   ├── analyzers/
│   ├── tests/
│   └── main.py                    # FastAPI app
│
├── docker/
│   ├── Dockerfile.server
│   ├── Dockerfile.client
│   └── Dockerfile.ai
│
├── docs/                          # Documentación detallada
│   ├── requirements.md            # RF-001 a RF-060 completos
│   ├── architecture.md            # Arquitectura, capas, decisiones
│   ├── database.md                # Esquema BD completo
│   ├── api.md                     # Todos los endpoints
│   ├── security.md                # Controles de seguridad
│   ├── coding-standards.md        # Convenciones de código
│   ├── git-workflow.md            # Flujo Git
│   └── tasks/
│       ├── andy.md                # Tareas de Andy
│       ├── carlos.md              # Tareas de Carlos
│       └── erick.md               # Tareas de Erick
│
├── CLAUDE.md                      # Este archivo
├── AGENTS.md                      # Copia para OpenAI Codex
├── README.md
├── docker-compose.yml
├── .gitignore
├── .editorconfig
├── .eslintrc.js
└── .prettierrc
```

---

## 🔑 REGLAS ABSOLUTAS (LEER ANTES DE ESCRIBIR UNA SOLA LÍNEA)

### ✅ SIEMPRE
- `const` por defecto, `let` solo si reasignas. `var` = PROHIBIDO
- `async/await` para todo lo asíncrono. Callbacks anidados = PROHIBIDO
- Lógica de negocio SOLO en `/services/`. Controllers solo reciben y responden
- Variables de entorno con `dotenv`. Hardcodear secrets = PROHIBIDO
- Indentación 2 espacios. Tabs = PROHIBIDO
- Líneas máximo 100 caracteres
- JSDoc en toda función pública
- Inglés para código. Español permitido en comentarios explicativos largos
- `tenant_id` en TODA consulta a tablas del dominio comercial
- Respuesta API siempre: `{ success: true, data: {} }` o `{ success: false, error: {} }`

### ❌ NUNCA
- SQL dinámico con concatenación de strings (SQL Injection)
- `console.log` en producción (usar Winston)
- Push directo a `main` o `develop`
- Commit sin mensaje Conventional Commits
- Secrets o API keys en el código
- Inline styles en React
- Fetch() directo en componentes React (usar la instancia Axios de `api.js`)
- Lógica de negocio en controllers
- Stock negativo en inventario
- Confirmar pago cripto sin verificar on-chain con múltiples confirmaciones

---

## 🌿 RAMAS GIT — RESUMEN RÁPIDO

```
main        ← Producción. 2 PR aprobados. NO push directo.
develop     ← Integración. 1 PR aprobado. CI automático.
dev/andy    ← Rama personal Andy
dev/carlos  ← Rama personal Carlos  
dev/erick   ← Rama personal Erick
feature/[módulo]-[descripción]   ← Features desde develop
hotfix/[descripción]             ← Urgentes desde main
```

### Formato de commits (OBLIGATORIO)
```
feat(auth): add JWT refresh token rotation
fix(inventario): resolve race condition in stock update
refactor(pagos): extract blockchain verification to service
test(auth): add register endpoint integration tests
docs(api): update payment endpoints documentation
chore(docker): update Node.js base image to v20.12
```

---

## ⚡ COMANDOS DE ARRANQUE

```bash
# Levantar infraestructura
docker-compose up -d

# Backend
cd server && npm install && npm run dev

# Frontend  
cd client && npm install && npm run dev

# Tests
cd server && npm test
cd client && npm test

# Migraciones
cd server && npm run db:migrate
cd server && npm run db:seed
```

---

> Para información DETALLADA sobre cada tema, consulta los archivos en `/docs/`
