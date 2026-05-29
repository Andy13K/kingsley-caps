# PROMPT PARA CLAUDE – NOVENO ENTREGABLE
# Mantenimiento y Gestión de Cambios
# Proyecto: Kingsley Caps – Marketplace de Gorras Premium (Guatemala, 2026)

---

## CONTEXTO DEL PROYECTO (para que Claude entienda el sistema)

Eres el asistente del equipo de desarrollo de **Kingsley Caps**, un marketplace de e-commerce
construido con la siguiente arquitectura:

- **Frontend:** React + Vite, Tailwind CSS, React Router v6, react-hot-toast
- **Backend:** Node.js + Express.js, Sequelize ORM, JWT para autenticacion
- **Base de datos:** PostgreSQL alojado en Supabase (cloud, sin servidor propio)
- **Almacenamiento de imagenes:** Carpeta local `client/public/uploads/` servida via Vite proxy
- **Pagos soportados:** Transferencia bancaria, tarjeta de credito/debito, y criptomonedas (Ethereum en red Sepolia testnet)
- **IA integrada:**
  - Prueba virtual de gorras: Google Gemini Vision (gemini-2.5-flash-image)
  - Prediccion de demanda de inventario: Python FastAPI + modelo estadistico (ai-engine, puerto 8000)
  - Sugerencia de precio: Python FastAPI + analisis de precios comparables por categoria
- **Notificaciones:** Sistema en tiempo real con polling, notificaciones interactivas por rol
- **Roles del sistema:** `superadmin` (dueno de la marca), `vendor` (tiendas independientes), `customer`
- **Repositorio:** GitHub (Andy13K/kingsley-caps), ramas: main / dev / feature/*
- **Equipo:** 3 desarrolladores universitarios – Andy (lider frontend), Carlos (backend/BD), Erick (IA/Python)
- **Contexto academico:** Proyecto de Ingenieria de Software, Universidad Mariano Galvez de Guatemala, 2026

### Tiendas del sistema (seeds de produccion):
| Tienda | Propietario | Plan | Descripcion |
|--------|------------|------|-------------|
| Kingsley Caps Oficial | superadmin (admin@kingsley.com) | Enterprise | Coleccion oficial de la marca |
| Urban Star Caps | Mario Urban | Pro | Gorras urbanas con detalles de estrellas |
| Cross Crown Studio | Lucia Cross | Pro | Gorras negras con bordados metalicos |
| Sakura Streetwear | Sofia Sakura | Basic | Streetwear con elementos japoneses |

### Modulos principales del sistema:
1. Catalogo publico de productos con filtros y busqueda
2. Carrito de compras y proceso de checkout
3. Pagos (tarjeta, transferencia, Ethereum)
4. Panel de vendedor (gestion de productos, inventario, pedidos, configuracion de tienda)
5. Panel de superadmin (gestion de usuarios, tiendas, aprobaciones, metricas)
6. Prueba virtual de gorras con IA (sube selfie, el sistema superpone la gorra)
7. Prediccion de demanda de inventario con IA
8. Sugerencia de precios con IA
9. Sistema de notificaciones interactivas
10. Seguimiento de pedidos con guia de envio

---

## INSTRUCCION PRINCIPAL

Con base en el contexto del proyecto Kingsley Caps descrito arriba Y en todos los entregables
anteriores que tienes como conocimiento en este proyecto de Claude, genera el **NOVENO ENTREGABLE
COMPLETO**: **Mantenimiento y Gestion de Cambios**.

El documento debe ser:
- En **espanol formal** (sin contracciones, nivel universitario)
- Formateado con **encabezados Markdown** (# ## ###)
- Con **tablas Markdown** para registros, formularios, calendarios y comparaciones
- Con **listas numeradas** para procesos paso a paso
- Con ejemplos **concretos y reales** del sistema Kingsley Caps (NO ejemplos genericos)
- Longitud objetivo: **minimo 15 paginas** al convertirlo a Word (contenido denso, no relleno)
- Al final de cada seccion principal incluye un parrafo de **"Conclusion de la seccion"**

El documento tiene **5 secciones principales** descritas a continuacion:

---

## SECCION 1 – ESTRATEGIA DE MANTENIMIENTO

Genera una estrategia de mantenimiento completa para Kingsley Caps que cubra:

### 1.1 Tipos de mantenimiento aplicados al proyecto
Explica cada tipo con definicion, cuando aplica en Kingsley Caps y ejemplos reales del sistema:
- **Correctivo:** Bugs y errores encontrados en produccion (ejemplos: error 403 en authorize(), columna `items.createdAt` inexistente, Gemini modelo incorrecto)
- **Preventivo:** Actualizaciones de dependencias npm/pip, revision de seguridad JWT, rotacion de API keys, auditoria de permisos por rol
- **Adaptativo:** Cambios por nuevos requisitos (agregar soporte crypto, integrar IA de Erick, cambiar proveedor de imagenes de HuggingFace a Gemini)
- **Perfectivo:** Mejoras de rendimiento, UX (mover notificaciones a bottom-right), nueva funcionalidad (boton "Volver al catalogo" en todas las vistas)

### 1.2 Ciclo de vida del mantenimiento del sistema
Diagrama textual/ASCII del ciclo: Deteccion → Reporte → Evaluacion → Planificacion → Implementacion → Prueba → Despliegue → Cierre

### 1.3 Responsabilidades del equipo por tipo de mantenimiento
Tabla con columnas: Tipo de mantenimiento | Responsable principal | Responsable de revision | Tiempo maximo de respuesta

Asigna responsabilidades reales:
- Andy: frontend, UI/UX, integracion de APIs en cliente
- Carlos: backend Express, base de datos Sequelize/Supabase, autenticacion
- Erick: modulos de IA (Python FastAPI ai-engine), integracion Gemini/HuggingFace

### 1.4 Herramientas de soporte al mantenimiento
- Git + GitHub (ramas feature/dev/main, pull requests, code review)
- Winston logger (logs del servidor Express en tiempo real)
- Supabase dashboard (monitoreo de BD, backups automaticos del tier gratuito)
- npm audit / pip-audit (auditoria de vulnerabilidades en dependencias)
- .env para gestion de secretos (JWT_SECRET, GEMINI_API_KEY, SUPABASE_URL, etc.)
- Postman/Thunder Client para pruebas de endpoints

### 1.5 Calendario de mantenimiento propuesto
Tabla semestral (Enero–Junio 2026) con: Mes | Actividad | Tipo | Responsable | Duracion estimada

Incluye actividades como:
- Actualizacion de dependencias npm
- Revision de logs de errores
- Auditoria de permisos y roles
- Prueba de endpoints criticos (checkout, pagos, IA)
- Backup manual de imagenes de productos
- Revision de cuotas de API (Gemini, Supabase)
- Renovacion de certificados si aplica

### 1.6 Metricas de mantenimiento
Define y calcula (con valores de ejemplo del proyecto) las siguientes metricas:
- MTTR (Mean Time To Repair) – con ejemplos de incidentes reales
- MTBF (Mean Time Between Failures)
- Tasa de defectos por sprint
- Cobertura de tipos de mantenimiento (% correctivo vs preventivo)
- Deuda tecnica estimada

---

## SECCION 2 – GESTION DE CAMBIOS

Genera un proceso formal de gestion de cambios para Kingsley Caps:

### 2.1 Proceso de solicitud de cambio (RFC – Request for Change)

**Quienes pueden solicitar cambios:**
- Cliente/propietario de la marca (superadmin) via formulario o comunicacion directa
- Vendedores registrados (mejoras al panel de vendor)
- Equipo de desarrollo (mejoras tecnicas, refactoring, seguridad)
- Usuarios finales (via reporte de bugs en el sistema)

**Formulario RFC** – tabla con los siguientes campos:
| Campo | Descripcion | Ejemplo real |
Incluye: ID del cambio, fecha, solicitante, descripcion del cambio, modulo afectado, justificacion, prioridad, impacto estimado, tiempo estimado, estado

**Flujo de aprobacion** (diagrama textual):
Solicitud → Revision inicial (equipo) → Clasificacion → Evaluacion de impacto → Aprobacion/Rechazo → Planificacion → Implementacion → QA → Despliegue → Cierre

### 2.2 Clasificacion de cambios con ejemplos reales
- **Cambio de emergencia (hotfix):** Error critico en produccion. Ejemplo: bug authorize() que bloqueaba la sugerencia de precios para TODOS los roles. Proceso: rama hotfix/ → prueba rapida → merge directo a main.
- **Cambio estandar (planificado):** Feature nueva en sprint. Ejemplo: integracion del ai-engine de Erick para prediccion de demanda. Proceso: rama feature/ → dev → PR → main.
- **Cambio mayor (arquitectonico):** Cambio de proveedor de IA de HuggingFace FLUX a Google Gemini Vision. Requiere aprobacion del equipo completo, documentacion de impacto, plan de rollback.

### 2.3 Control de versiones y branching strategy
- Modelo GitFlow adaptado al equipo de 3 personas
- Diagrama de ramas: main / dev / feature/nombre-feature / hotfix/nombre-fix
- Convencion de commits: `tipo(modulo): descripcion sin tildes`
  - Tipos: feat, fix, chore, docs, style, refactor, test
  - Ejemplos reales: `feat(auth): agregar superadmin a rutas vendor`, `fix(pricing): corregir bug de array en authorize`, `feat(ia): integrar prueba virtual con Gemini 2.5 Flash Image`
- Pull Requests: template, quien revisa, criterios de aprobacion

### 2.4 Evaluacion de impacto de cambios
Tabla de modulos del sistema con indicacion de dependencias:
| Modulo afectado | Dependencias | Riesgo | Requiere prueba de regresion |

### 2.5 Registro de cambios historico del proyecto (changelog real)
Tabla con los cambios principales realizados durante el desarrollo:
| ID | Fecha | Tipo | Descripcion | Modulos afectados | Solicitante | Estado |

Documenta estos cambios reales (y otros que infiereas del contexto):
- CH-001: Integracion de prueba virtual con Gemini 2.5 Flash Image
- CH-002: Sistema de prediccion de demanda con Python FastAPI (Erick)
- CH-003: Sugerencia de precios con IA (Erick)
- CH-004: Acceso del superadmin a todas las rutas del panel vendor
- CH-005: Reasignacion de tienda oficial Kingsley Caps al superadmin
- CH-006: Movimiento de notificaciones toast a posicion bottom-right
- CH-007: Boton "Volver al catalogo" en todas las vistas vendor/admin
- CH-008: Ocultamiento del banner de aprobacion para tienda oficial
- CH-009: Corrección del bug de authorize() con array en lugar de rest params
- CH-010: Guia de envio con imagen en seguimiento de pedidos

---

## SECCION 3 – PLAN DE RESPALDO Y RECUPERACION

Genera un plan detallado de backup y disaster recovery para Kingsley Caps:

### 3.1 Inventario de activos criticos a respaldar
Tabla completa:
| Activo | Ubicacion | Criticidad | Frecuencia de cambio | Responsable del respaldo |

Activos a incluir:
- Base de datos PostgreSQL (Supabase cloud – tablas: user, store, product, product_variant, order, order_item, cart, cart_item, payment_transaction, inventory_movement, notification, activity_log)
- Imagenes de productos (`client/public/uploads/` – gorraparaventa*, voinaparaventa*, gorracliente*)
- Imagenes de prueba virtual (archivos generados por Gemini en `uploads/tryon/`)
- Codigo fuente (repositorio GitHub Andy13K/kingsley-caps)
- Variables de entorno (`.env` del servidor: JWT_SECRET, SUPABASE_URL, SUPABASE_KEY, GOOGLE_GEMINI_API_KEY, etc.)
- Configuracion del servidor Express (puerto 3002, CORS, middlewares)
- Configuracion del ai-engine Python (puerto 8000, dependencias pip)

### 3.2 Estrategia de respaldo por activo
Tabla con: Activo | Tipo de respaldo | Frecuencia | Ubicacion de almacenamiento | Retencion | Herramienta

- **Base de datos Supabase:** Supabase hace backups automaticos diarios en plan gratuito (7 dias de retencion). Respaldo manual adicional con `pg_dump` via Supabase CLI semanal.
- **Imagenes de productos:** Copia manual semanal a carpeta comprimida en Google Drive del equipo
- **Codigo fuente:** Git push diario a GitHub (control de versiones = respaldo continuo)
- **Variables de entorno:** Archivo `.env.example` en repo (sin secretos reales) + copia cifrada en gestor de contrasenas del equipo (Bitwarden recomendado)

### 3.3 Procedimientos de recuperacion paso a paso
Documenta el procedimiento detallado para cada escenario:

**Escenario A: Perdida total del servidor de desarrollo**
Pasos numerados para restaurar el entorno completo en una maquina nueva.

**Escenario B: Corrupcion o perdida de datos en la base de datos**
Pasos para restaurar desde backup de Supabase o desde pg_dump manual.

**Escenario C: Perdida de imagenes de productos**
Pasos para restaurar imagenes desde backup en Google Drive.

**Escenario D: Compromiso de credenciales (API keys, JWT secret)**
Pasos para revocar, rotar y actualizar todas las credenciales del sistema.

**Escenario E: Falla del ai-engine Python (puerto 8000 no responde)**
Pasos para reiniciar el servicio FastAPI.

### 3.4 RTO y RPO por escenario
Tabla: Escenario | RTO (tiempo maximo de recuperacion) | RPO (perdida maxima de datos aceptable) | Impacto en el negocio

### 3.5 Plan de continuidad del negocio durante mantenimiento
Que puede seguir funcionando si el servidor esta caido (catalogo estatico, paginas de mantenimiento)
Protocolo de comunicacion con usuarios durante incidentes

### 3.6 Responsables y contactos de emergencia
Tabla: Rol | Nombre | Responsabilidad | Tiempo de respuesta comprometido

---

## SECCION 4 – REGISTRO DE INCIDENTES

Genera un sistema formal de registro y gestion de incidentes para Kingsley Caps:

### 4.1 Definiciones
Define claramente en el contexto de Kingsley Caps:
- **Incidente:** Interrupcion o degradacion no planificada de un servicio del sistema
- **Problema:** Causa raiz de uno o mas incidentes recurrentes
- **Cambio:** Adicion, modificacion o eliminacion planificada de un componente (ver Seccion 2)

### 4.2 Clasificacion de severidad
Tabla detallada:
| Nivel | Nombre | Definicion | Ejemplo en Kingsley Caps | SLA de resolucion | Notificacion requerida |

- **P1 – Critico:** Sistema completamente caido, no se pueden realizar compras o pagos. Ej: base de datos Supabase inaccesible, servidor Express no inicia. SLA: 2 horas.
- **P2 – Alto:** Funcionalidad principal degradada. Ej: checkout falla para todos los usuarios, autenticacion JWT no funciona, error 500 en listado de productos. SLA: 8 horas.
- **P3 – Medio:** Funcionalidad secundaria con error. Ej: prueba virtual no genera imagen (Gemini falla), sugerencia de precios retorna error, panel de inventario no carga para superadmin. SLA: 48 horas.
- **P4 – Bajo:** Error menor o mejora estetica. Ej: notificaciones aparecen en posicion incorrecta, imagen de logo no carga, texto de descripcion con caracteres mal codificados. SLA: 1 semana.

### 4.3 Ciclo de vida de un incidente
Diagrama textual con descripcion de cada fase:
**Deteccion** → **Registro** → **Clasificacion** → **Asignacion** → **Diagnostico** → **Resolucion** → **Verificacion** → **Cierre** → **Postmortem** (P1/P2 solamente)

### 4.4 Plantilla de registro de incidente
Tabla completa con TODOS los campos:
| Campo | Descripcion |
- ID del incidente (INC-YYYY-NNN)
- Fecha y hora de deteccion
- Fecha y hora de reporte
- Reportado por (usuario/desarrollador)
- Severidad (P1/P2/P3/P4)
- Estado (Abierto / En progreso / Resuelto / Cerrado)
- Modulo afectado
- Descripcion del problema (sintomas observados)
- Pasos para reproducir
- Error exacto (mensaje de consola/log)
- Causa raiz identificada
- Solucion aplicada
- Desarrollador asignado
- Fecha y hora de resolucion
- Tiempo total de resolucion
- Acciones preventivas para evitar recurrencia
- Requiere postmortem? (Si/No)

### 4.5 Registro historico de incidentes reales del proyecto
Documenta TODOS los siguientes incidentes reales con la plantilla completa (al menos los campos principales):

| ID | Fecha | Severidad | Modulo | Descripcion | Causa raiz | Solucion | Tiempo resolucion |

Incidentes a documentar (usa fechas aproximadas de Mayo 2026):
1. **INC-2026-001:** Error 403 "Rol superadmin no autorizado" al acceder al panel vendor como superadmin
   - Causa: `authorize('vendor')` no incluia al rol superadmin en ninguna ruta del panel
   - Solucion: Actualizar todas las rutas vendor para incluir `authorize('vendor', 'superadmin')`

2. **INC-2026-002:** Prueba virtual de gorras no genera imagen (error 402 HuggingFace)
   - Causa: Endpoint fal.ai de HuggingFace requiere plan de pago
   - Solucion: Migrar a Google Gemini 2.5 Flash Image

3. **INC-2026-003:** Error 404 al llamar modelo Gemini para prueba virtual
   - Causa: Nombre incorrecto del modelo (`gemini-2.5-flash-image-preview` en lugar de `gemini-2.5-flash-image`)
   - Solucion: Corregir nombre del modelo en aiService.js

4. **INC-2026-004:** Puerto 3002 en uso al reiniciar el servidor Express
   - Causa: Proceso Node.js anterior no terminado correctamente con `taskkill`
   - Solucion: Identificar PID con `netstat -ano | findstr :3002` y matar proceso especifico

5. **INC-2026-005:** Imagenes de productos no cargan despues de reiniciar servidores
   - Causa: Las imagenes estan en `client/public/uploads/` que esta en `.gitignore`. Al matar todos los procesos Node.js con `taskkill /F /IM node.exe` se termino tambien el proceso de Vite (servidor de desarrollo del frontend)
   - Solucion: Reiniciar ambos servidores (backend en puerto 3002, Vite en puerto 5176)

6. **INC-2026-006:** Error de columna `items.createdAt` al consultar el carrito
   - Causa: Modelo Sequelize con `timestamps: true` en tabla `cart_item` pero la columna no existe en la BD
   - Solucion: Agregar `timestamps: false` al modelo o correr migracion para agregar columnas

7. **INC-2026-007:** "Sugerir precio IA" retorna error 403 para TODOS los roles incluyendo vendor
   - Causa: `authorize(['vendor', 'superadmin'])` pasa un array como primer argumento a una funcion de rest params. `allowedRoles` se convierte en `[['vendor','superadmin']]` y `.includes('vendor')` siempre es false
   - Solucion: Cambiar a `authorize('vendor', 'superadmin')` (sin array)

8. **INC-2026-008:** "No tienes una tienda asociada" al acceder a inventario/precios como superadmin
   - Causa: Los controladores de inventario y precios solo buscaban la tienda por `vendor_id = userId`, sin contemplar el caso especial del superadmin
   - Solucion: Agregar logica en `getStoreForVendor()` que para rol superadmin busca la tienda oficial por slug `kingsley-caps-oficial`

9. **INC-2026-009:** Banner de "Aprobacion y comision" se muestra en la tienda oficial
   - Causa: `Settings.jsx` no copiaba el campo `slug` al estado local, por lo que `store.slug` siempre era `undefined` y la condicion `!== 'kingsley-caps-oficial'` siempre era `true`
   - Solucion: Agregar `slug: s.slug || ''` al `setStore()` inicial

10. **INC-2026-010:** Prueba virtual genera imagen generica en lugar de la del usuario
    - Causa: Pollinations.ai es un modelo texto-a-imagen, no imagen-a-imagen. No puede preservar la identidad del usuario
    - Solucion: Documentado como limitacion tecnica. Requiere modelo pago (Gemini con billing activado)

### 4.6 KPIs de gestion de incidentes
Tabla de metricas con valores calculados en base a los incidentes registrados:
| KPI | Definicion | Valor calculado | Meta |
- Total de incidentes registrados
- Incidentes por severidad (P1/P2/P3/P4)
- MTTR por severidad
- Porcentaje de incidentes resueltos en SLA
- Incidentes recurrentes (misma causa raiz)
- Modulo con mas incidentes

### 4.7 Plantilla de postmortem
Para incidentes P1 y P2, documentar:
- Resumen ejecutivo del incidente
- Linea de tiempo detallada
- Causa raiz (usando metodologia de los 5 Porques)
- Impacto real (usuarios afectados, tiempo de interrupcion, perdida economica estimada)
- Que funciono bien durante la respuesta
- Que no funciono bien durante la respuesta
- Acciones correctivas con responsable y fecha limite

---

## SECCION 5 – CONTRATO ADAPTADO AL PROYECTO

Genera un contrato de desarrollo y mantenimiento de software profesional, completo y en formato
legal formal guatemalteco/latinoamericano, con articulos numerados:

**DATOS DEL CONTRATO:**
- **Contratante:** Kingsley Caps (marca de gorras premium, Guatemala)
- **Representante del contratante:** Administrador del sistema (superadmin, admin@kingsley.com)
- **Contratista:** Equipo de desarrollo universitario
  - Andy (Desarrollador Lider Frontend)
  - Carlos (Desarrollador Backend y Base de Datos)
  - Erick (Desarrollador de Inteligencia Artificial)
- **Fecha de referencia:** Mayo 2026
- **Contexto:** Proyecto academico de Ingenieria de Software con potencial comercial

**El contrato debe incluir los siguientes articulos:**

**ARTICULO 1 – OBJETO DEL CONTRATO**
Descripcion del sistema desarrollado: marketplace web Kingsley Caps con sus modulos principales.

**ARTICULO 2 – ALCANCE DEL SERVICIO**
Que ESTA incluido (todos los modulos desarrollados) y que NO esta incluido (app movil nativa,
integracion con ERP, soporte 24/7, hosting en servidor dedicado, API keys de terceros pagas).

**ARTICULO 3 – ENTREGABLES Y DOCUMENTACION**
Lista de entregables (los 9 entregables academicos + codigo fuente + manual de usuario + manual tecnico).

**ARTICULO 4 – PROPIEDAD INTELECTUAL**
Derechos sobre el codigo fuente, disenos, marca Kingsley Caps. El contratante retiene derechos
sobre la marca; el equipo retiene derechos morales sobre el codigo academico.

**ARTICULO 5 – CONFIDENCIALIDAD**
Proteccion de: credenciales de acceso (JWT secrets, API keys), datos de usuarios registrados
(emails, direcciones, historial de compras), informacion financiera (transacciones, wallets ETH),
logica de negocio propietaria.

**ARTICULO 6 – OBLIGACIONES DEL CONTRATISTA**
- Entregar el sistema funcionando segun las especificaciones acordadas
- Documentar el codigo y la arquitectura
- Corregir bugs sin costo adicional durante el periodo de garantia
- Mantener confidencialidad de datos
- Seguir estandares de seguridad (hash de contrasenas con bcrypt, validacion de inputs, JWT)
- Responder a comunicaciones en tiempo razonable

**ARTICULO 7 – OBLIGACIONES DEL CONTRATANTE**
- Proveer informacion y retroalimentacion oportuna
- Gestionar y pagar las API keys de terceros requeridas (Google Cloud/Gemini, Supabase plan comercial)
- Proveer acceso a los entornos necesarios para pruebas
- Revisar y aprobar entregables en los plazos acordados

**ARTICULO 8 – SERVICIO DE MANTENIMIENTO POST-ENTREGA**
- Periodo de garantia: 3 meses desde la entrega final (agosto–octubre 2026)
- Durante garantia: correccion de bugs sin costo adicional
- Soporte incluido en garantia: correcciones del Tipo Correctivo (ver Seccion 1)
- No incluido en garantia: nuevas funcionalidades, cambios de requerimientos, integraciones adicionales
- Tiempos de respuesta comprometidos por severidad (referencia a SLAs de Seccion 4)

**ARTICULO 9 – GESTION DE CAMBIOS POST-GARANTIA**
- Todo cambio despues del periodo de garantia debe seguir el proceso RFC documentado en Seccion 2
- Tarifas por hora de desarrollo (dejar campo en blanco para negociacion)
- Proceso de aprobacion de cambios adicionales

**ARTICULO 10 – LIMITACION DE RESPONSABILIDAD**
- El equipo no es responsable por fallas en servicios de terceros (Supabase, Google Gemini, Ethereum network)
- No es responsable por perdida de datos si el contratante no sigue el Plan de Respaldo (Seccion 3)
- Responsabilidad maxima limitada al valor del contrato

**ARTICULO 11 – SERVICIOS DE TERCEROS Y COSTOS OPERATIVOS**
Especificar que el contratante es responsable de pagar directamente:
- Supabase (plan gratuito tiene limites; plan Pro: $25/mes)
- Google Cloud / Gemini API (~$0.039 por imagen generada)
- Dominio y hosting web (si se despliega en produccion)
- Certificado SSL

**ARTICULO 12 – VIGENCIA DEL CONTRATO**
Fecha de inicio, fecha de entrega final, duracion del periodo de garantia, condiciones de renovacion.

**ARTICULO 13 – CAUSALES DE TERMINACION**
- Por mutuo acuerdo
- Por incumplimiento grave de cualquiera de las partes
- Por fuerza mayor que impida la ejecucion por mas de 30 dias
- Procedimiento de terminacion y entrega de activos

**ARTICULO 14 – RESOLUCION DE CONFLICTOS**
Proceso de resolucion: primero negociacion directa (15 dias), luego mediacion, luego arbitraje.
Jurisdiccion: Guatemala, conforme al Codigo de Comercio de la Republica de Guatemala.

**ARTICULO 15 – DISPOSICIONES GENERALES**
Modificaciones al contrato deben ser por escrito y firmadas por ambas partes.

**FIRMAS:**
Espacio para firma del representante del contratante, cada miembro del equipo, fecha y lugar (Guatemala).

---

## INSTRUCCIONES FINALES DE FORMATO

1. Genera el documento completo de una vez (no preguntes si continuar)
2. Usa encabezados jerarquicos: # para el titulo principal, ## para las 5 secciones, ### para subsecciones
3. Todas las tablas deben estar en formato Markdown valido
4. Los ejemplos deben ser especificos a Kingsley Caps (nombres reales de modulos, IDs de usuarios del sistema, slugs de tiendas, etc.)
5. El contrato en Seccion 5 debe estar en formato legal con ARTICULOS en mayuscula y numeracion romana o arabiga
6. Incluye una pagina de portada con: nombre del entregable, nombre del proyecto, universidad, integrantes del equipo, fecha
7. Incluye una tabla de contenidos al inicio
8. El documento final debe tener contenido suficiente para ocupar minimo 15 paginas en Word (fuente Arial 11, interlineado 1.5)
