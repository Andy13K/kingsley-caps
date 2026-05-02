# 🧢 Kingsley Caps

**Plataforma de e-commerce híbrida con pagos en criptomonedas**

> Proyecto Final — Ingeniería de Software  
> Universidad Mariano Gálvez de Guatemala — Centro Puerto Barrios, Izabal  
> Ciclo 9, Semestre I, 2026 | Ing. M. A. Alejandro Mejicanos

---

## 👥 Equipo

| Integrante | Carnet | Rama | Módulo |
|-----------|--------|------|--------|
| Andy Fabricio Aquino Escobar | 0909-22-1669 | `dev/andy` | Usuarios y Pagos |
| Carlos Giovanni Martínez Aldana | 0909-22-19157 | `dev/carlos` | Tienda y Pedidos |
| Erick Andrey Ortiz Guerra | 0909-22-17063 | `dev/erick` | IA, Envíos y Admin |

---

## 🤖 Para Agentes de IA (Claude Code / Codex)

Los agentes leen automáticamente:
- **`CLAUDE.md`** → Claude Code (lee automáticamente)
- **`AGENTS.md`** → OpenAI Codex (lee automáticamente)

Para contexto detallado por tema consulta la carpeta **`/docs/`**:

| Archivo | Contenido |
|---------|-----------|
| `docs/requirements.md` | RF-001 a RF-060 con criterios de aceptación |
| `docs/architecture.md` | Clean Architecture, multi-tenant, decisiones técnicas |
| `docs/database.md` | Esquema SQL completo de todas las tablas |
| `docs/api.md` | Todos los endpoints con ejemplos de request/response |
| `docs/coding-standards.md` | Convenciones obligatorias del Sexto Entregable |
| `docs/security.md` | Controles de seguridad y manejo de errores cripto |
| `docs/git-workflow.md` | GitFlow, Conventional Commits, proceso de PR |
| `docs/tasks/andy.md` | Tareas de Andy con código de referencia |
| `docs/tasks/carlos.md` | Tareas de Carlos con código de referencia |
| `docs/tasks/erick.md` | Tareas de Erick con código de referencia |

---

## 🛠️ Stack

| Capa | Tecnología | Puerto |
|------|-----------|--------|
| Frontend | React 18 + Vite + Tailwind CSS | 5173 |
| Auth Service | Node.js + Express | 3001 |
| Backend API | Node.js + Express + Sequelize | 3000 |
| IA Anti-fraude | Python + FastAPI | 8000 |
| Base de datos | PostgreSQL 16 | 5432 |
| Cache | Redis 7 | 6379 |
| Reverse Proxy | Nginx | 80/443 |

---

## 🚀 Inicio Rápido

```bash
# 1. Clonar
git clone https://github.com/Andy13K/kingsley-caps.git
cd kingsley-caps

# 2. Variables de entorno
cp server/.env.example server/.env
# Editar server/.env con tus valores reales

# 3. Levantar base de datos
docker-compose up -d

# 4. Backend
cd server && npm install && npm run db:migrate && npm run db:seed && npm run dev

# 5. Frontend (nueva terminal)
cd client && npm install && npm run dev
```

---

## 🌿 Workflow Git

```bash
# Cada integrante trabaja en su rama personal
git checkout dev/andy       # o dev/carlos o dev/erick

# Crear feature branch para cada funcionalidad
git checkout -b feature/auth-login-page

# Al terminar → PR hacia develop
git push origin feature/auth-login-page
# Abrir PR en GitHub: feature/... → develop
```

Ver guía completa en [`docs/git-workflow.md`](./docs/git-workflow.md)

---

## 📋 Comandos Útiles

```bash
# Tests
cd server && npm test                    # Pruebas unitarias e integración
cd server && npm run test:coverage       # Con reporte de cobertura (mín 80%)
cd client && npm test

# Linting
npm run lint                             # Verificar estilo de código
npm run lint:fix                         # Auto-corregir

# Base de datos
npm run db:migrate                       # Aplicar migraciones
npm run db:seed                          # Datos de prueba
npm run db:migrate:undo                  # Revertir última migración
```
