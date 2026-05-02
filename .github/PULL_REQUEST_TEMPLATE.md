## 📋 ¿Qué hace este PR?

<!-- Explica QUÉ hace y POR QUÉ es necesario. Sé específico. -->

## 🔗 Requisito que implementa

RF-XXX — _(nombre del requisito del docs/requirements.md)_

## 👤 Integrante

- [ ] Andy (Módulo Usuarios y Pagos)
- [ ] Carlos (Módulo Tienda y Pedidos)
- [ ] Erick (Módulo IA, Envíos y Admin)

## 🧪 Tipo de cambio

- [ ] `feat` — Nueva funcionalidad
- [ ] `fix` — Corrección de bug
- [ ] `refactor` — Refactorización sin cambio funcional
- [ ] `test` — Pruebas
- [ ] `docs` — Documentación
- [ ] `chore` — Mantenimiento

## ✅ Checklist (autor)

- [ ] Código sigue convenciones de `docs/coding-standards.md`
- [ ] Lógica de negocio está en `/services/`, no en controllers
- [ ] Todas las queries de BD incluyen `storeId` si aplica (multi-tenant)
- [ ] Manejo de errores con `AppError` y `asyncHandler`
- [ ] Respuestas API con formato `{ success, data }` o `{ success, error }`
- [ ] Tests escritos y pasando (`npm test`)
- [ ] ESLint sin errores (`npm run lint`)
- [ ] 0 `console.log` en el código
- [ ] 0 secrets o credenciales hardcodeadas
- [ ] Variables sensibles vienen del `.env`

## 🔍 Checklist (reviewer)

- [ ] La lógica tiene sentido y es correcta
- [ ] Cobertura de tests adecuada
- [ ] No hay vulnerabilidades de seguridad obvias
- [ ] El código es legible y sigue las convenciones

## 🖥️ Cómo probar

1. 
2. 
3. 

## 📸 Capturas (si aplica para UI)
