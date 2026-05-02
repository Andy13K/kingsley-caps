# 📋 REQUISITOS COMPLETOS — Kingsley Caps

> Fuente: Primer Entregable (62 páginas)
> **Prioridades:** MUST = implementar obligatoriamente | SHOULD = importante | COULD = deseable

---

## REQUISITOS FUNCIONALES (RF-001 a RF-060)

---

### RF-001 — Registro de Usuarios ⭐ MUST
**Módulo:** Auth | **Responsable:** Andy

**Descripción:** Registro de nuevos usuarios diferenciando entre tipo Cliente y tipo Vendedor.

**Entradas:**
- Nombre completo
- Correo electrónico (único en el sistema)
- Número de teléfono
- Dirección
- Contraseña (mínimo 8 caracteres, al menos 1 mayúscula, 1 número)
- Tipo de usuario: `customer` | `vendor`

**Proceso:**
1. Validar formato de correo electrónico
2. Verificar unicidad del correo en BD
3. Validar requisitos de contraseña
4. Hash de contraseña con bcrypt (salt rounds = 12)
5. Asignar rol automáticamente según tipo seleccionado
6. Estado inicial: `active` para clientes, `pending_approval` para vendedores

**Salida:** HTTP 201 + token JWT + datos del usuario creado

**Criterios de aceptación:**
- Sistema NO permite correos duplicados → HTTP 409
- Contraseña almacenada SIEMPRE cifrada con bcrypt
- Rol asignado corresponde al tipo seleccionado
- Vendedores quedan en estado `pending_approval` hasta aprobación del SuperAdmin

---

### RF-002 — Inicio y Cierre de Sesión ⭐ MUST
**Módulo:** Auth | **Responsable:** Andy

**Descripción:** Autenticación con JWT de doble token. Protección contra fuerza bruta.

**Entradas:** Correo electrónico + contraseña

**Proceso:**
1. Validar existencia del usuario
2. Comparar contraseña con bcrypt
3. Si falla: registrar intento, bloquear tras 5 intentos en 15 min
4. Si exitoso: generar access token (15 min) + refresh token (7 días)
5. Almacenar refresh token en BD (tabla `refresh_token`)

**Salida:** HTTP 200 + `{ accessToken, refreshToken, user }`

**Criterios de aceptación:**
- Acceso correcto con credenciales válidas
- Bloqueo temporal (15 min) tras 5 intentos fallidos por IP/usuario
- Logout revoca el refresh token en BD

---

### RF-003 — Creación de Tienda por Vendedor ⭐ MUST
**Módulo:** Tienda | **Responsable:** Carlos

**Descripción:** Cada vendedor aprobado puede crear su tienda dentro de la plataforma multi-tenant.

**Entradas:** Nombre de tienda (único), descripción, logotipo (imagen)

**Proceso:**
1. Verificar que el usuario tiene rol `vendor` y estado `active`
2. Validar unicidad del nombre de tienda → generar `slug` URL-friendly
3. Crear registro de tienda asociado al `vendor_id`
4. Estado inicial: `draft`

**Criterios de aceptación:**
- Cada tienda es independiente (datos aislados por `store_id`)
- Vendedor SOLO ve y gestiona su propia tienda
- Modelo SaaS: múltiples vendedores en la misma infraestructura

---

### RF-004 — Activación de Pagos con Criptomonedas ⭐ MUST
**Módulo:** Pagos | **Responsable:** Andy

**Descripción:** El vendedor configura su wallet de Ethereum para recibir pagos cripto.

**Entradas:** Dirección de wallet Ethereum (formato `0x...`), red seleccionada

**Proceso:**
1. Validar formato de dirección Ethereum (regex `^0x[a-fA-F0-9]{40}$`)
2. Registrar dirección en configuración de la tienda
3. Activar opción de pago cripto en checkout

**Criterios de aceptación:**
- Opción de pago cripto SOLO aparece si está activada
- Dirección válida obligatoria (formato Ethereum)
- Función clave del proyecto

---

### RF-005 — Generación de Solicitud de Pago Cripto ⭐ MUST
**Módulo:** Pagos | **Responsable:** Andy

**Descripción:** Al seleccionar pago cripto, se genera la solicitud con equivalencia en ETH.

**Entradas:** Orden confirmada + moneda seleccionada (ETH)

**Proceso:**
1. Consultar tasa GTQ→ETH via CoinGecko API
2. Calcular equivalente en ETH del total de la orden
3. Generar nonce único para esta transacción (anti-replay)
4. Iniciar temporizador de 10 minutos (rate lock)
5. Mostrar: monto en ETH, dirección de pago, QR code, tiempo restante

**Criterios de aceptación:**
- Monto correcto según tasa consultada
- Expiración visible con countdown
- Nonce único por solicitud (RF impide replay attacks)

---

### RF-006 — Verificación de Pago Cripto ⭐ MUST
**Módulo:** Pagos | **Responsable:** Andy + Erick

**Descripción:** Verificación on-chain de la transacción antes de confirmar la orden.

**Entradas:** Hash de transacción (TX hash) enviado por el frontend

**Proceso:**
1. Consultar la transacción en la blockchain via ethers.js
2. Verificar que el destinatario es la wallet de la tienda
3. Verificar que el monto recibido >= monto solicitado
4. Esperar mínimo 3 confirmaciones de bloque
5. Solo entonces: actualizar orden a `paid`, liberar stock permanentemente

**Criterios de aceptación:**
- NO aprobar sin confirmaciones on-chain suficientes
- Registrar TX hash en `payment_transaction`
- Si discrepancia de monto → ERR-C06: bloquear orden, notificar admin

---

### RF-007 — Preparación Manual del Pedido ⭐ MUST
**Módulo:** Pedidos | **Responsable:** Carlos

**Descripción:** El vendedor/staff prepara el pedido después de confirmarse el pago.

**Proceso:** Visualizar detalles → cambiar estado a `preparing` → marcar como `packed`

**Criterios de aceptación:** Solo pedidos con estado `paid` pueden prepararse

---

### RF-008 — Registro Manual de Guía de Envío ⭐ MUST
**Módulo:** Envíos | **Responsable:** Erick

**Descripción:** El vendedor ingresa manualmente el número de guía de la empresa de transporte.

**Entradas:** Número de guía, empresa de transporte

**Criterios de aceptación:** El número de guía se muestra al cliente para seguimiento

---

### RF-009 — Gestión de Catálogo de Productos ⭐ MUST
**Módulo:** Productos | **Responsable:** Carlos

**Descripción:** CRUD completo de productos con sus variantes (talla, color, precio, stock).

**Entradas para crear producto:**
- Nombre, descripción, precio base
- Categoría (Snapback, Trucker, Beanie, etc.)
- Imágenes (máx 5MB c/u, validar magic bytes)
- Variantes: `[{ size: 'M', color: 'Negro', sku: 'KC-001-M-NEG', stock: 20, price_override: null }]`

**Criterios de aceptación:**
- Solo el vendedor propietario puede CRUD sus productos
- Variantes con SKU único en el sistema
- Imágenes validadas (tipo real, no solo extensión)

---

### RF-010 — Gestión de Inventario ⭐ MUST
**Módulo:** Inventario | **Responsable:** Erick

**Descripción:** Control automático de stock. Nunca negativo. Alerta cuando cae bajo umbral.

**Proceso:**
1. Descuento automático al confirmar pago (transacción atómica)
2. Validación de disponibilidad ANTES de agregar al carrito
3. Registro de CADA movimiento en `inventory_movement`
4. Alerta cuando stock de variante < umbral configurado (default: 3 unidades)

**Criterios de aceptación:**
- Stock NUNCA negativo (restricción en BD)
- No se puede comprar si no hay stock
- Todos los movimientos quedan registrados con `type`, `quantity`, `reason`

---

### RF-011 — Carrito de Compras ⭐ MUST
**Módulo:** Carrito | **Responsable:** Carlos

**Descripción:** Carrito persistido en BD. Calcular subtotal/total en tiempo real.

**Proceso:**
1. Verificar stock disponible al agregar item
2. Reservar stock temporalmente (no descontar hasta pago confirmado)
3. Calcular totales automáticamente
4. Persistir en BD (sobrevive si el usuario cierra el navegador)

**Criterios de aceptación:**
- Carrito actualizado refleja precios y stock en tiempo real
- No se puede agregar más unidades del stock disponible

---

### RF-012 — Confirmación de Pedido ⭐ MUST
**Módulo:** Pedidos | **Responsable:** Carlos

**Descripción:** Creación de la orden desde el carrito con toda la información del checkout.

**Entradas:** Carrito válido + dirección de envío + método de pago seleccionado

**Proceso:**
1. Validar que TODOS los items tienen stock suficiente
2. Calcular total final (subtotal + impuesto + envío)
3. Crear registro de `order` con estado `pending_payment`
4. Crear registros de `order_item`
5. Vaciar el carrito

**Criterios de aceptación:** Orden generada con ID único, estado `pending_payment`

---

### RF-013 — Procesamiento de Pago Convencional ⭐ MUST
**Módulo:** Pagos | **Responsable:** Andy

**Descripción:** Integración con pasarela de pago convencional (tarjeta de crédito/débito).

---

### RF-014 — Conversión de Moneda para Pago Cripto ⭐ MUST
**Módulo:** Pagos | **Responsable:** Andy

**Descripción:** Mostrar equivalencia GTQ → ETH en tiempo real consultando CoinGecko.

**Endpoint CoinGecko:** `GET /simple/price?ids=ethereum&vs_currencies=gtq`

**Criterios de aceptación:** Tasa actualizada, mostrar fecha/hora de la consulta

---

### RF-015 — Generación de Código QR de Pago Cripto ⭐ MUST
**Módulo:** Pagos | **Responsable:** Andy

**Descripción:** Generar QR con la dirección ETH + monto para facilitar el pago desde wallet móvil.

---

### RF-016 — Monitoreo del Estado de Pago Cripto ⭐ MUST
**Módulo:** Pagos | **Responsable:** Andy + Erick

**Descripción:** Polling automático cada 30 segundos para TXs pendientes hasta 6 confirmaciones.

**Errores a manejar (del Sexto Entregable):**
- `ERR-C01`: MetaMask no conectado → mostrar guía paso a paso
- `ERR-C02`: Nonce inválido/reutilizado → generar nuevo nonce automáticamente + alerta seguridad
- `ERR-C03`: Fondos insuficientes → mostrar monto requerido vs disponible
- `ERR-C04`: Timeout >10 min → mantener orden `pending`, monitorear cada 30s hasta 6 confirmaciones
- `ERR-C05`: TX revertida → notificar usuario, liberar stock reservado, ofrecer reintento
- `ERR-C06`: Discrepancia de monto → bloquear orden, notificar admin (CRÍTICO)

---

### RF-017 — Gestión de Estados del Pedido ⭐ MUST
**Módulo:** Pedidos | **Responsable:** Carlos + Erick

**Flujo de estados:**
```
pending_payment → paid → preparing → packed → shipped → delivered
                                                        ↘ cancelled
```

**Reglas de transición:**
- Solo el vendedor/staff puede avanzar estados
- Cliente puede cancelar si está en `pending_payment` o `paid`
- Cada cambio de estado genera notificación al cliente

---

### RF-018 — Consulta de Pedido por el Cliente ⭐ MUST
**Módulo:** Pedidos | **Responsable:** Carlos

**Descripción:** El cliente puede ver el estado actual de sus pedidos y el número de guía de envío.

---

### RF-019 — Notificaciones al Cliente ⭐ MUST
**Módulo:** Notificaciones | **Responsable:** Erick

**Descripción:** Notificaciones en la plataforma cuando cambia el estado de su pedido.

---

### RF-020 — Panel de Control del Vendedor ⭐ MUST
**Módulo:** Admin | **Responsable:** Erick

**Descripción:** Dashboard con métricas: ventas del período, pedidos pendientes, productos con stock bajo, ingresos en GTQ y ETH.

---

### RF-021 — Reportes de Ventas (SHOULD)
**Módulo:** Admin | **Responsable:** Erick

Dashboard con ventas por período, top productos, comparativa mensual.

---

### RF-022 — Gestión de Clientes por Tienda (SHOULD)
**Módulo:** Admin | **Responsable:** Erick

Lista de clientes que han comprado en la tienda.

---

### RF-023 — Gestión de Cupones y Promociones (SHOULD)
**Módulo:** Productos | **Responsable:** Carlos

Crear cupones de descuento por porcentaje o monto fijo.

---

### RF-027 — Historial de Pedidos ⭐ MUST
**Módulo:** Pedidos | **Responsable:** Carlos

Lista paginada de órdenes del usuario con filtros por estado y fecha.

---

### RF-033 — Gestión de Categorías y Etiquetas (SHOULD)
**Módulo:** Productos | **Responsable:** Carlos

CRUD de categorías de productos para el catálogo.

---

### RF-034 — Publicación de Tienda (SHOULD)
**Módulo:** Tienda | **Responsable:** Carlos

Cambiar tienda de modo `draft` a `active` para que sea visible al público.

---

### RF-035 — Configuración de Confirmaciones Cripto por Red (SHOULD)
**Módulo:** Pagos | **Responsable:** Andy

Configurar cuántas confirmaciones de bloque se requieren por red (default: 3 para Sepolia, 6 para Mainnet).

---

### RF-036 — Ventana de Pago Cripto y Fijación de Tasa (SHOULD)
**Módulo:** Pagos | **Responsable:** Andy

Fijar la tasa de conversión por 10 minutos desde que se inicia el pago cripto (rate lock).

---

### RF-045 — Administración de Plataforma (SHOULD)
**Módulo:** SuperAdmin | **Responsable:** Erick

Panel de SuperAdmin para gestionar todas las tiendas, aprobar vendedores, suspender tiendas.

---

## REQUISITOS NO FUNCIONALES (RNF-001 a RNF-015)

### RNF-001 — Seguridad de Contraseñas ⭐ CRÍTICO
- bcrypt con salt rounds ≥ 12
- NUNCA almacenar en texto plano
- Contraseñas de API keys almacenadas cifradas (AES-256)

### RNF-002 — Comunicación Segura ⭐ CRÍTICO
- HTTPS/TLS 1.2+ obligatorio en producción
- Redirigir HTTP → HTTPS automáticamente
- HSTS habilitado (max-age=31536000)

### RNF-003 — Protección OWASP Top 10 ⭐ CRÍTICO
- Validar TODA entrada con Joi/express-validator
- Queries parametrizadas (NO SQL dinámico)
- CSP headers configurados
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY

### RNF-004 — Aislamiento Multi-Tenant ⭐ CRÍTICO
- `tenant_id` en TODAS las tablas del dominio
- Extraído del JWT en cada request
- Imposible que un vendedor acceda a datos de otro tenant

### RNF-005 — Protección Fuerza Bruta ⭐ ALTA
- Rate limiting en auth: 5 intentos / 15 min / IP+usuario
- Rate limiting general: 100 req/min por usuario
- Checkout: 10 req/min
- Bloqueo temporal de 15 minutos tras exceder límite

### RNF-006 — Integridad de Pagos ⭐ CRÍTICO
- Transacciones atómicas en BD para operaciones de inventario+orden
- Verificación on-chain antes de confirmar cualquier pago cripto
- Nonce único por solicitud de pago (anti-replay attacks)

### RNF-007 — Exactitud en Conversión Cripto ⭐ ALTA
- Tasa de cambio consultada en tiempo real a CoinGecko
- Rate lock de 10 minutos después de generar solicitud de pago
- Mostrar siempre fecha/hora de la consulta de tasa

### RNF-008 — Rendimiento ⭐ ALTA
- Tiempo de respuesta de API: p95 < 500ms bajo 50 usuarios concurrentes
- Tiempo de carga inicial del frontend: < 3 segundos
- Proceso de checkout completo: < 10 segundos

### RNF-009 — Disponibilidad ⭐ ALTA
- Uptime objetivo: 99.5% mensual
- Health checks en todos los contenedores Docker
- Reinicio automático de contenedores si fallan

### RNF-011 — Observabilidad ⭐ ALTA
- Logs estructurados en JSON con Winston
- Campos obligatorios: timestamp, level, message, correlationId, module, userId
- correlationId único por request HTTP (permite rastrear una petición de punta a punta)

### RNF-012 — Usabilidad del Flujo de Pago Cripto ⭐ ALTA
- Guía visual paso a paso para conectar MetaMask
- Indicador de tiempo restante visible (countdown)
- Mensajes de error claros y accionables

### RNF-014 — Compatibilidad ⭐ MEDIA
- Responsive: mobile-first
- Navegadores: Chrome, Firefox, Edge (últimas 2 versiones)
- MetaMask: extensión de Chrome/Firefox

### RNF-015 — Mantenibilidad ⭐ ALTA
- Cobertura de tests: mínimo 80% de sentencias
- Seguir convenciones del Sexto Entregable (ver `docs/coding-standards.md`)
- Todos los cambios en BD via migraciones versionadas

---

## PRIORIDADES PARA EL 70% MUST DEL PROYECTO FINAL

```
✅ RF-001  Registro de usuarios
✅ RF-002  Login/logout
✅ RF-003  Crear tienda
✅ RF-004  Activar pagos cripto
✅ RF-005  Solicitud de pago cripto
✅ RF-006  Verificar pago cripto on-chain
✅ RF-007  Preparación de pedido
✅ RF-009  CRUD de productos
✅ RF-010  Gestión de inventario
✅ RF-011  Carrito de compras
✅ RF-012  Confirmación de pedido
✅ RF-014  Conversión GTQ→ETH
✅ RF-016  Monitoreo estado pago cripto
✅ RF-017  Estados del pedido
✅ RF-018  Consulta de pedido (cliente)
✅ RF-020  Panel de control del vendedor
✅ RF-027  Historial de pedidos
```
