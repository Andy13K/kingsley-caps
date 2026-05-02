# 🌿 FLUJO DE TRABAJO GIT — Kingsley Caps

> Fuente: Sexto Entregable (sección 5) y Quinto Entregable (sección 6.2)
> Modelo: **GitFlow Simplificado**

---

## ESTRUCTURA DE RAMAS

```
main          ← Producción. PROTEGIDA. Requiere 2 PR aprobados.
develop       ← Integración. PROTEGIDA. Requiere 1 PR aprobado. CI automático.
│
├── dev/andy      ← Rama personal Andy (trabajo diario)
├── dev/carlos    ← Rama personal Carlos (trabajo diario)
├── dev/erick     ← Rama personal Erick (trabajo diario)
│
├── feature/auth-jwt-refresh          ← Features desde develop
├── feature/frontend-cart-page
├── feature/api-inventory-alerts
└── ...

hotfix/[descripción]     ← Urgentes: desde main, merge a main Y develop
release/v[X.Y.Z]         ← Preparación de entrega: desde develop
```

---

## REGLAS DE PROTECCIÓN DE RAMAS

### `main`
- ❌ Push directo PROHIBIDO
- ✅ Solo merge desde `release/*` o `hotfix/*` vía PR
- ✅ Requiere 2 aprobaciones de otros integrantes
- ✅ CI debe pasar (todos los tests)

### `develop`
- ❌ Push directo PROHIBIDO
- ✅ Solo merge desde `feature/*` o `dev/*` vía PR
- ✅ Requiere 1 aprobación
- ✅ CI debe pasar

---

## NOMBRES DE FEATURE BRANCHES

Formato: `feature/[módulo]-[descripción-en-inglés]`

```bash
# Autenticación (Andy)
feature/auth-register-endpoint
feature/auth-jwt-refresh-rotation
feature/auth-rate-limiting
feature/frontend-login-page
feature/frontend-register-page

# Catálogo y tienda (Carlos)
feature/db-models-migrations
feature/api-stores-crud
feature/api-products-crud
feature/api-cart-operations
feature/api-orders-lifecycle
feature/vendor-panel-products
feature/vendor-panel-orders

# Inventario y pagos (Erick)
feature/api-inventory-management
feature/api-inventory-alerts
feature/api-payments-crypto-verify
feature/ai-engine-fraud-detection
feature/admin-panel-dashboard
feature/docker-nginx-setup
feature/notifications-service

# Infraestructura (Carlos/Todos)
feature/project-infrastructure
feature/ci-github-actions
```

---

## FLUJO DE TRABAJO DIARIO

```bash
# ── Al iniciar el día ─────────────────────────────────
# Actualizar tu rama personal con los últimos cambios
git checkout dev/andy           # o dev/carlos o dev/erick
git fetch origin
git merge origin/develop        # traer cambios integrados
git push origin dev/andy        # actualizar tu rama remota

# ── Para trabajar en una feature ──────────────────────
# OPCIÓN A: Desde tu rama personal
git checkout dev/andy
git checkout -b feature/frontend-login-page

# OPCIÓN B: Directamente desde develop (recomendado para features largas)
git checkout develop
git pull origin develop
git checkout -b feature/frontend-login-page

# ── Trabajar y hacer commits frecuentes ──────────────
# ... codificar ...
git add .
git commit -m "feat(auth): add login form with validation"
# ... más trabajo ...
git commit -m "feat(auth): integrate with auth API endpoint"
git commit -m "test(auth): add LoginForm unit tests"

# ── Publicar y abrir PR ──────────────────────────────
git push origin feature/frontend-login-page

# En GitHub:
# Base: develop ← Compare: feature/frontend-login-page
# Llenar el PR template
# Asignar 1 reviewer (compañero del equipo)

# ── Después del merge ─────────────────────────────────
git checkout dev/andy
git pull origin develop
git branch -d feature/frontend-login-page          # eliminar local
git push origin --delete feature/frontend-login-page  # eliminar remota
```

---

## CONVENTIONAL COMMITS — OBLIGATORIO

**Formato:** `tipo(módulo): descripción en imperativo`

| Tipo | Cuándo usar | Ejemplo |
|------|-------------|---------|
| `feat` | Nueva funcionalidad | `feat(auth): add JWT refresh token rotation` |
| `fix` | Corrección de bug | `fix(inventario): resolve race condition in stock update` |
| `refactor` | Refactorización sin cambio funcional | `refactor(pagos): extract blockchain verification to service` |
| `test` | Agregar o modificar pruebas | `test(auth): add register endpoint integration tests` |
| `docs` | Cambios en documentación | `docs(api): update payment endpoints documentation` |
| `chore` | Mantenimiento (deps, config, CI) | `chore(docker): update Node.js base image to v20.12` |
| `style` | Formato, espacios (sin cambio de lógica) | `style(cart): fix indentation in CartItem component` |

**Módulos válidos:** `auth`, `users`, `stores`, `products`, `inventario`, `cart`, `orders`, `pagos`, `ai`, `admin`, `docker`, `ci`, `frontend`, `api`

---

## PROCESS DE CODE REVIEW

Cuando abres un PR debes verificar:

### Checklist del autor
- [ ] Código sigue convenciones del `docs/coding-standards.md`
- [ ] Tests agregados para los cambios realizados
- [ ] `npm test` pasa localmente sin errores
- [ ] `npm run lint` sin errores
- [ ] 0 `console.log` en código
- [ ] 0 secrets o credenciales hardcodeadas
- [ ] PR template lleno completamente

### Checklist del reviewer
- [ ] Lógica de negocio está en services, no en controllers
- [ ] Todas las queries incluyen `storeId` si aplica (multi-tenant)
- [ ] Manejo de errores con `AppError`/`asyncHandler`
- [ ] Respuestas API con formato `{ success, data }` o `{ success, error }`
- [ ] Variables sensibles desde `.env`

---

## VERSIONADO SEMÁNTICO

Formato: `MAJOR.MINOR.PATCH`

- **MAJOR:** cambio incompatible (rompe API existente)
- **MINOR:** nueva funcionalidad compatible
- **PATCH:** corrección de bugs

Para este proyecto académico:
- `v0.1.0` — Setup inicial + Auth
- `v0.2.0` — Productos y Catálogo
- `v0.3.0` — Carrito y Órdenes
- `v0.4.0` — Pagos Cripto
- `v1.0.0` — Entrega final (70% RF completado)

---

## COMANDOS GIT ÚTILES

```bash
# Ver estado de todas las ramas
git branch -a

# Ver historial de commits formateado
git log --oneline --graph --all

# Descartar cambios locales
git checkout -- .

# Squash commits antes de PR (opcional)
git rebase -i HEAD~3  # últimos 3 commits

# Resolver conflictos
git mergetool

# Ver cambios de una rama vs develop
git diff develop..feature/mi-feature

# Limpiar ramas remotas eliminadas
git remote prune origin
```
