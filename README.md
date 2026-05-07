# Kingsley Caps

Plataforma multi-tenant de e-commerce para gorras con pagos en criptomonedas.

---

## Equipo

| Integrante | Carnet |
|-----------|--------|
| Andy Fabricio Aquino Escobar | 0909-22-1669 |
| Carlos Giovanni Martínez Aldana | 0909-22-19157 |
| Erick Andrey Ortiz Guerra | 0909-22-17063 |

Curso: Ingeniería de Software — UMG Puerto Barrios, 2026

---

## Stack

- **Backend**: Node.js 20 / Express / Sequelize / PostgreSQL 16
- **Auth**: Servicio separado en puerto 3001 (mismo código, diferente config)
- **Frontend**: React 18 / Vite / Tailwind CSS
- **AI Engine**: Python 3.11 / FastAPI (detección de fraude)
- **Infra**: Docker Compose / Nginx (reverse proxy)

## Puertos

| Servicio | Puerto | Descripción |
|---|---|---|
| Nginx | **80** | Único punto de entrada público |
| Backend API | 3000 | Acceso interno (via Nginx `/api/`) |
| Auth Service | 3001 | Acceso interno (via Nginx `/api/auth/`) |
| AI Engine | 8000 | Acceso interno (via Nginx `/api/ai/`) |
| PostgreSQL | 5432 | Base de datos |
| Redis | 6379 | Cache / sesiones |
| pgAdmin | 5050 | Administración de BD (solo dev) |

## Inicio rápido

### 1. Variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores reales
```

### 2. Desarrollo local (sin Docker para el código)

```bash
# Solo infraestructura
docker-compose up postgres redis -d

# Backend (terminal 1)
cd server && npm install && npm run dev

# Frontend (terminal 2)
cd client && npm install && npm run dev

# AI Engine (terminal 3)
cd ai-engine && pip install -r requirements.txt && uvicorn main:app --reload
```

### 3. Docker completo (todos los servicios)

```bash
docker-compose up --build
```

Acceder en: http://localhost

### 4. Solo infraestructura + servicios específicos

```bash
# Levantar todo menos el frontend
docker-compose up postgres redis auth-service backend-api ia-service nginx -d
```

## Variables de entorno requeridas

| Variable | Descripción | Default (dev) |
|---|---|---|
| `DB_PASSWORD` | Contraseña de PostgreSQL | `postgres` |
| `DB_NAME` | Nombre de la base de datos | `kingsley_caps_dev` |
| `JWT_ACCESS_SECRET` | Secreto para access tokens | `dev_secret` |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens | `dev_refresh_secret` |
| `ETH_RPC_URL` | URL del nodo Ethereum | `https://rpc.sepolia.org` |
| `VITE_API_URL` | URL del API para el frontend | `http://localhost:3000` |
| `VITE_AUTH_URL` | URL del auth service | `http://localhost:3001` |

> En producción, cambiar **todos** los secretos por valores seguros generados aleatoriamente.

## Arquitectura de red (Docker)

```
Cliente HTTP
     │
     ▼
  Nginx :80  ──── /api/auth/*  ──► auth-service:3001
     │        ──── /api/ai/*   ──► ia-service:8000
     │        ──── /api/*      ──► backend-api:3000
     │        ──── /*          ──► frontend:80
     │
  (red interna: kingsley-network)
```

## Estructura del proyecto

```
kingsley-caps/
├── client/          # React 18 / Vite / Tailwind
├── server/          # Node.js / Express / Sequelize
├── ai-engine/       # Python / FastAPI
├── docker/
│   ├── Dockerfile.server
│   ├── Dockerfile.auth
│   ├── Dockerfile.client
│   ├── Dockerfile.ai
│   ├── nginx.conf          # Reverse proxy config
│   ├── client-nginx.conf   # SPA routing config
│   └── docker-entrypoint.sh
├── docker-compose.yml
└── .env.example
```

## Estructura de ramas

```
main → develop → dev/andy | dev/carlos | dev/erick
```