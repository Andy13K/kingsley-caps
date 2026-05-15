# Plan maestro - Kingsley Caps estilo Shopify con pagos cripto

Este documento concentra el contexto operativo del proyecto y las fases necesarias para convertir Kingsley Caps en una tienda online de gorras estilo Shopify, con panel vendedor, catalogo publico, checkout, administracion, inventario y pagos con criptomonedas.

## 1. Vision del producto

Kingsley Caps debe funcionar como una plataforma e-commerce multi-vendedor enfocada en gorras. El cliente compra productos con variantes como talla, color y stock. El vendedor administra su tienda, productos, inventario, pedidos, envios y wallet cripto. El superadmin aprueba tiendas, supervisa metricas y controla riesgos. El pago principal diferencial es cripto, usando MetaMask, QR, verificacion on-chain y confirmacion automatica de ordenes.

Objetivo final:

- Tienda publica usable por clientes.
- Panel vendedor estilo Shopify para administrar negocio.
- Checkout real con carrito, envio y orden.
- Pago cripto real verificable en blockchain.
- Inventario consistente, sin stock negativo.
- Panel superadmin con aprobacion, metricas y alertas.
- App lista para demo solida y para evolucionar a produccion.

## 2. Contexto actual del repositorio

### Modulos principales

- `client/`: frontend React + Vite + Tailwind.
- `server/`: backend Node.js + Express + Sequelize.
- `ai-engine/`: servicio Python/FastAPI para analisis IA.
- `docs/`: documentacion funcional, tecnica, seguridad, API, BD y tareas por integrante.
- `docker/` y `docker-compose.yml`: infraestructura local/contenedores.

### Responsabilidades historicas

- Andy: autenticacion, frontend cliente, carrito, checkout, MetaMask, tema claro/oscuro.
- Carlos: tiendas, productos, carrito, ordenes y panel vendedor.
- Erick: inventario, pagos, blockchain, notificaciones, IA, admin y Docker/Nginx.

### Documentos que NO se deben borrar

- `README.md`
- `DEVELOPMENT.md`
- `CONTRIBUTING.md`
- `RESUMEN-ERICK.md`
- `docs/api.md`
- `docs/architecture.md`
- `docs/database.md`
- `docs/requirements.md`
- `docs/security.md`
- `docs/coding-standards.md`
- `docs/git-workflow.md`
- `docs/tasks/andy.md`
- `docs/tasks/andy-status.md`
- `docs/tasks/carlos.md`
- `docs/tasks/erick.md`
- Este documento: `docs/PLAN-MAESTRO-SHOPIFY-CRIPTO.md`

## 3. Estado integrado actual

Ya existen piezas importantes:

- Autenticacion con registro, login, refresh, logout y `me`.
- Roles: `customer`, `vendor`, `staff`, `superadmin`.
- Catalogo publico.
- Detalle de producto.
- Carrito y checkout base.
- Flujo frontend de MetaMask.
- Panel vendedor con dashboard, productos, inventario, ordenes y configuracion.
- Panel superadmin.
- Endpoints de tiendas, productos, carrito, ordenes, inventario, pagos, notificaciones y shipping.
- Servicios de blockchain, precios cripto, pagos e inventario.
- Tests unitarios del backend.

Integraciones corregidas recientemente:

- Ruta visible `/vendor/products`.
- Enlace de productos en sidebar vendedor.
- Rutas backend `/api/admin/*`.
- Endpoint `/api/inventory/variants`.
- Actualizacion de `/api/stores/my`.
- Correccion de llamadas frontend duplicadas `/api/api/...`.
- Correccion de inconsistencias `camelCase`/`snake_case` en servicios criticos.
- Middleware de autenticacion validando usuario activo.
- Ajustes visuales de tema claro/oscuro.

## 4. Brechas principales para llegar a Shopify con cripto

Aunque hay muchos modulos subidos, varias partes siguen necesitando cierre de producto:

- El onboarding del vendedor no esta completo como flujo guiado.
- La creacion de tienda no esta conectada de forma fluida al registro de vendedor.
- Algunas vistas aun conservan fallbacks mock para demo.
- Falta flujo end-to-end probado: registrar vendedor, crear tienda, crear producto, comprar, pagar cripto, verificar tx y entregar pedido.
- Falta subida real de imagenes.
- Falta pagina publica de tienda por slug.
- Falta seleccion robusta de variantes en producto.
- Falta checkout con envio, impuestos/descuentos y validacion final de stock.
- Falta reserva/liberacion de stock durante pagos pendientes.
- Falta verificacion cripto completamente probada con red Sepolia o mock controlado.
- Falta polling/job para transacciones pendientes.
- Falta cerrar notificaciones automaticas en cada evento importante.
- Falta dashboard admin con datos reales completos, no solo metricas basicas.
- Falta hardening de produccion: secrets, HTTPS, CORS, rate limits afinados, logs, auditoria.

## 5. Fases de trabajo

### Fase 0 - Limpieza y estabilidad

Meta: dejar el proyecto ordenado, sin basura generada y con documentacion central.

Tareas:

- Conservar documentacion critica listada arriba.
- Eliminar solo artefactos generados: `dist/`, `.vite/`, `coverage/`, logs y carpetas vacias mal creadas.
- No borrar `node_modules/` mientras se necesite ejecutar localmente.
- Confirmar que `npm run build` del cliente pasa.
- Confirmar que `npm test` del servidor pasa.
- Verificar que frontend y backend arrancan.

Criterio de aceptacion:

- Repo arranca localmente.
- No quedan carpetas basura obvias.
- Documento maestro creado.

### Fase 1 - Base Shopify: tienda y vendedor

Meta: que un vendedor pueda operar su tienda desde cero.

Tareas:

- Al registrar vendedor, llevarlo a onboarding.
- Crear tienda desde formulario si no existe.
- Permitir editar nombre, descripcion, logo, wallet cripto y metodos de envio.
- Mostrar estado de tienda: pendiente, activa, suspendida.
- Bloquear ventas si tienda no esta activa.
- Agregar pagina publica `/stores/:slug`.
- Agregar configuracion de marca: logo, banner, colores basicos si aplica.

Criterio de aceptacion:

- Un vendedor nuevo puede crear su tienda sin tocar la base de datos.
- El superadmin puede aprobarla.
- La tienda aprobada aparece publicamente.

### Fase 2 - Catalogo profesional de gorras

Meta: catalogo estilo Shopify con variantes y busqueda real.

Tareas:

- CRUD completo de productos en panel vendedor.
- Edicion de productos existentes.
- Archivado/restauracion.
- Subida real de imagenes o integracion con storage.
- Variantes por talla, color, SKU, stock, precio opcional.
- Filtros publicos: categoria, talla, color, precio, disponibilidad.
- Buscador por nombre/descripcion/tags.
- Productos destacados.
- Validar que solo productos activos de tiendas activas se muestran al cliente.

Criterio de aceptacion:

- Vendedor crea producto con imagenes y variantes.
- Cliente filtra, ve detalle y selecciona variante disponible.

### Fase 3 - Carrito y checkout real

Meta: compra completa sin mocks.

Tareas:

- Eliminar fallback mock en flujo productivo.
- Carrito persistido por usuario y tienda.
- Agregar, editar cantidad y eliminar items.
- Validar stock al agregar y antes de crear orden.
- Checkout con direccion completa.
- Seleccion de metodo de envio.
- Calculo de subtotal, envio, descuentos/impuestos si aplican.
- Crear orden real desde carrito.
- Vaciar carrito despues de crear orden.

Criterio de aceptacion:

- Cliente puede crear una orden real desde productos reales.
- La orden queda en `pending_payment`.

### Fase 4 - Pagos cripto reales

Meta: pago ETH con MetaMask y verificacion on-chain.

Tareas:

- Validar wallet ETH del vendedor.
- Iniciar pago cripto desde `orderId`.
- Calcular monto ETH con tasa GTQ/ETH.
- Bloquear tasa por ventana de tiempo.
- Generar nonce y QR.
- Enviar transaccion desde MetaMask.
- Guardar `txHash`.
- Verificar destinatario, monto, red y confirmaciones.
- Actualizar pago a `confirmed`.
- Actualizar orden a `paid`.
- Manejar errores:
  - wallet no conectada
  - red incorrecta
  - fondos insuficientes
  - tx no encontrada
  - confirmaciones insuficientes
  - monto incorrecto
  - wallet destino incorrecta
  - timeout
- Crear job/polling cada 30 segundos para pagos pendientes.
- Notificar cliente, vendedor y superadmin segun resultado.

Criterio de aceptacion:

- Una orden puede pagarse con MetaMask en Sepolia.
- El backend confirma la transaccion.
- La orden cambia automaticamente a `paid`.

### Fase 5 - Ordenes, envios e inventario

Meta: gestion operativa de pedidos estilo Shopify.

Tareas:

- Estados completos de orden:
  - `pending_payment`
  - `paid`
  - `preparing`
  - `packed`
  - `shipped`
  - `delivered`
  - `cancelled`
  - `refunded`
- Detalle de orden para cliente y vendedor.
- Notas del vendedor.
- Registro de guia y empresa de envio.
- Historial de cambios.
- Cancelacion con restauracion de stock.
- Inventario por variante.
- Movimientos de inventario.
- Alertas de stock bajo.
- Reserva de stock durante pago pendiente.
- Liberacion de stock si pago expira o falla.

Criterio de aceptacion:

- Vendedor puede procesar una orden de pagada a entregada.
- El stock refleja correctamente ventas, cancelaciones y ajustes.

### Fase 6 - SuperAdmin y control de plataforma

Meta: administracion real de marketplace.

Tareas:

- Aprobar, suspender y reactivar tiendas.
- Ver vendedores y clientes.
- Ver ventas globales.
- Ver tiendas activas, pendientes y suspendidas.
- Ver pagos con discrepancia.
- Ver alertas criticas.
- Moderar productos si aplica.
- Dashboard con metricas reales.
- Auditoria de acciones sensibles.

Criterio de aceptacion:

- Superadmin puede controlar la plataforma sin modificar BD manualmente.

### Fase 7 - Notificaciones y experiencia de usuario

Meta: que todos los eventos importantes sean visibles.

Tareas:

- Notificar nueva orden al vendedor.
- Notificar pago confirmado.
- Notificar cambio de estado al cliente.
- Notificar stock bajo.
- Notificar discrepancias cripto al superadmin.
- Agregar centro de notificaciones estable.
- Opcional: emails transaccionales.

Criterio de aceptacion:

- Cada accion critica genera notificacion.

### Fase 8 - Produccion y seguridad

Meta: preparar demo seria o despliegue.

Tareas:

- Revisar `.env.example` completo.
- Secrets seguros para JWT y blockchain.
- CORS por ambiente.
- Rate limits en login, checkout y pagos.
- Helmet/CSP.
- Logs estructurados.
- Migraciones limpias.
- Seeds para demo.
- Docker/Nginx funcionando como entrada unica.
- HTTPS.
- Backups de BD.
- Documentar despliegue.

Criterio de aceptacion:

- Proyecto se levanta con instrucciones claras.
- No hay secretos comprometidos.
- Flujo completo funciona en ambiente limpio.

## 6. Pruebas obligatorias por fase

### Pruebas tecnicas

- `client`: `npm run build`
- `server`: `npm test`
- Smoke test backend: `GET /health`
- Smoke test frontend: abrir `/`, `/catalog`, `/vendor/products`, `/admin/dashboard`

### Pruebas funcionales end-to-end

1. Registrar cliente.
2. Registrar vendedor.
3. Crear tienda.
4. Aprobar tienda como superadmin.
5. Crear producto con variantes.
6. Ver producto en catalogo.
7. Agregar variante al carrito.
8. Crear orden.
9. Iniciar pago cripto.
10. Pagar con MetaMask.
11. Verificar transaccion.
12. Confirmar orden como pagada.
13. Procesar envio.
14. Confirmar stock actualizado.

## 7. Regla de depuracion del proyecto

Se puede borrar:

- `dist/`
- `.vite/`
- `coverage/`
- `*.log`
- carpetas vacias o mal creadas sin archivos
- caches temporales

No se debe borrar sin revision:

- `docs/`
- `server/src/`
- `client/src/`
- `ai-engine/`
- `server/database/`
- `docker/`
- `.github/`
- archivos `.env.example`
- `package.json`
- `package-lock.json`
- documentacion raiz

No borrar durante desarrollo activo:

- `node_modules/`, salvo que se vaya a reinstalar dependencias.
- `.env`, salvo que se haya respaldado o regenerado.

## 8. Prioridad recomendada

Orden recomendado para terminar el producto:

1. Onboarding vendedor + tienda activa.
2. CRUD completo de productos y variantes.
3. Checkout real sin mocks.
4. Pago cripto real desde orden.
5. Verificacion blockchain y cambio automatico a `paid`.
6. Gestion completa de ordenes/envios.
7. Admin completo.
8. Notificaciones automaticas.
9. Seguridad, Docker y despliegue.

## 9. Definicion de listo

La app estara lista como Shopify con cripto cuando se pueda demostrar este flujo sin tocar codigo ni base de datos:

Un vendedor se registra, crea tienda, el admin la aprueba, el vendedor crea gorras con variantes e imagenes, un cliente compra desde el catalogo, paga con MetaMask, el backend verifica la transaccion, la orden pasa a pagada, el vendedor la prepara/envia, el cliente ve el estado y el inventario queda correcto.
