# Guia de Despliegue — Kingsley Caps en Render

**Quien sigue esta guia:** un integrante del equipo que va a subir el proyecto a produccion.  
**Plataforma:** [Render.com](https://render.com) — plan gratuito.  
**Resultado:** una sola URL publica con frontend + backend funcionando.

---

## Como funciona en produccion

```
Usuario en el navegador
        |
https://kingsley-caps.onrender.com
        |
  [Render - Node.js]
  ├── /api/*          → Express (rutas del backend)
  ├── /uploads/*      → archivos estaticos (imagenes subidas)
  ├── /health         → health check
  └── /*              → React build (index.html + assets)
        |
  [Supabase - PostgreSQL]  (ya esta en la nube)
```

Frontend y backend corren como **un solo servicio** en Render.  
La base de datos ya esta en Supabase — solo necesitas la cadena de conexion.

---

## Requisitos previos

- Cuenta en [render.com](https://render.com) (registro gratuito con GitHub)
- Acceso al repositorio: `https://github.com/Andy13K/kingsley-caps`
- Credenciales de Supabase del proyecto (pedirle a Andy)
- API key de Google Gemini (gratis en https://aistudio.google.com/apikey)

---

## PASO 1 — Obtener la DATABASE_URL de Supabase

1. Entra a [supabase.com](https://supabase.com) con las credenciales del proyecto
2. Abre el proyecto **Kingsley Caps**
3. Ve a **Project Settings** (icono de engranaje, columna izquierda)
4. Click en **Database**
5. Baja hasta **Connection string**
6. Selecciona la pestana **Transaction pooler** (NO Session pooler, NO Direct)
7. Copia la URL — se ve asi:

```
postgresql://postgres.[ref]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

8. Guardala, la vas a necesitar en el Paso 4.

---

## PASO 2 — Generar los JWT Secrets

Necesitas dos cadenas aleatorias largas. Ejecuta esto **dos veces** en tu terminal
(una para ACCESS_SECRET, otra para REFRESH_SECRET):

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Guarda los dos resultados. Se ven asi:
```
a3f8c2d1e9b4...  (128 caracteres hexadecimales)
```

---

## PASO 3 — Crear el servicio en Render

1. Entra a [dashboard.render.com](https://dashboard.render.com)
2. Click en **New +** → **Web Service**
3. En "Source Code" click **Connect a repository**
4. Autoriza acceso a GitHub si te lo pide
5. Busca y selecciona **Andy13K/kingsley-caps**
6. Render va a detectar el archivo `render.yaml` automaticamente

Si Render NO detecta el `render.yaml` y pide configuracion manual, usa estos valores:

| Campo | Valor |
|-------|-------|
| **Name** | `kingsley-caps` |
| **Region** | Oregon (US West) |
| **Branch** | `master` |
| **Runtime** | Node |
| **Build Command** | `cd client && npm install && npm run build && cd ../server && npm install --omit=dev` |
| **Start Command** | `node server/src/server.js` |
| **Plan** | Free |

7. **NO hagas click en "Create Web Service" todavia** — primero configura las variables de entorno (Paso 4).

---

## PASO 4 — Configurar variables de entorno

En la misma pantalla de creacion del servicio, baja hasta la seccion **Environment Variables**.  
Agrega cada una con el boton **Add Environment Variable**:

### Variables que debes escribir manualmente (con secretos)

| Key | Value |
|-----|-------|
| `DATABASE_URL` | La URL de Supabase del Paso 1 |
| `JWT_ACCESS_SECRET` | Primera cadena del Paso 2 |
| `JWT_REFRESH_SECRET` | Segunda cadena del Paso 2 |
| `GOOGLE_GEMINI_API_KEY` | Tu API key de Google AI Studio |
| `FRONTEND_URL` | `https://kingsley-caps.onrender.com` (ajusta si el nombre es distinto) |

> **Nota sobre FRONTEND_URL:** Render te muestra la URL definitiva del servicio arriba de la
> pantalla antes de crearlo. Usala ahi. Si no la ves todavia, pon `https://kingsley-caps.onrender.com`
> y la corriges despues desde Settings > Environment.

### Variables de configuracion (sin secretos — puedes copiar y pegar)

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `JWT_ACCESS_EXPIRES` | `15m` |
| `JWT_REFRESH_EXPIRES` | `7d` |
| `ETH_NETWORK` | `sepolia` |
| `ETH_RPC_URL` | `https://rpc.sepolia.org` |
| `ETH_CONFIRMATIONS_REQUIRED` | `3` |
| `COINGECKO_API_URL` | `https://api.coingecko.com/api/v3` |
| `LOG_LEVEL` | `info` |

### Variable opcional

| Key | Value |
|-----|-------|
| `HUGGINGFACE_API_TOKEN` | Token de HuggingFace (si tienes) |

---

## PASO 5 — Crear el servicio y esperar el build

1. Click en **Create Web Service**
2. Render va a correr el build — esto tarda **5 a 10 minutos** la primera vez
3. Puedes ver el log en tiempo real en la pestana **Logs**
4. El log debe terminar con algo asi:

```
==> Build successful
==> Deploying...
info: Conexion a PostgreSQL establecida
info: Servidor escuchando en puerto 10000
==> Your service is live
```

5. Tu URL publica aparece arriba del log, algo como:  
   `https://kingsley-caps.onrender.com`

---

## PASO 6 — Verificar que funciona

Abre estas URLs en el navegador:

| URL | Que debe mostrar |
|-----|-----------------|
| `https://tu-url.onrender.com/health` | `{"success":true,"data":{"status":"ok",...}}` |
| `https://tu-url.onrender.com/` | El catalogo de Kingsley Caps |
| `https://tu-url.onrender.com/login` | La pantalla de login |

Si el health check responde pero el frontend no carga, espera 1 minuto y recarga.

---

## PASO 7 — Iniciar sesion con las cuentas de prueba

Todas las cuentas tienen la misma contrasena: **`Password@123`**

| Email | Rol | Para que |
|-------|-----|----------|
| `admin@kingsley.com` | Super Admin | Panel de administracion completo |
| `vendedor.urban@kingsley.com` | Vendor | Panel de vendedor (Urban Star Caps) |
| `vendedor.cross@kingsley.com` | Vendor | Panel de vendedor (Cross Crown Studio) |
| `cliente1@kingsley.com` | Customer | Comprar productos, carrito, checkout |

---

## Soluciones a problemas comunes

### El build falla con error de npm

**Sintoma:** `npm ERR! code ENOENT` o similar en los logs de build.  
**Solucion:** Verifica que el Build Command este exactamente asi (copia y pega):
```
cd client && npm install && npm run build && cd ../server && npm install --omit=dev
```

---

### Error "Cannot connect to database" al iniciar

**Sintoma:** El log muestra `Error: getaddrinfo ENOTFOUND` o `password authentication failed`.  
**Causa:** La `DATABASE_URL` esta mal.  
**Solucion:**
1. Ve a Render > tu servicio > **Environment**
2. Verifica que `DATABASE_URL` sea del tipo **Transaction pooler** de Supabase (puerto 6543)
3. Asegurate de haber reemplazado `[PASSWORD]` por la contrasena real

---

### La pagina carga pero las imagenes de gorras no aparecen

**Causa:** Las imagenes estaticas del catalogo estan en `client/public/assets/` y deben estar en el build.  
**Solucion:** Volver a hacer deploy. En Render > tu servicio > click **Manual Deploy** > **Deploy latest commit**.

---

### El servicio "duerme" y tarda 30-60 segundos en responder

**Causa:** El plan gratuito de Render suspende el servicio si no hay trafico por 15 minutos.  
**Solucion para la presentacion:** Abre la URL 5 minutos antes de presentar para que despierte.  
**Solucion permanente:** Actualizar a plan Starter ($7/mes) o usar un servicio de ping como [UptimeRobot](https://uptimerobot.com) (gratis).

---

### Error CORS al hacer login

**Sintoma:** La consola del navegador muestra `CORS policy: No 'Access-Control-Allow-Origin'`.  
**Causa:** `FRONTEND_URL` en Render no coincide exactamente con la URL del sitio.  
**Solucion:**
1. Copia la URL exacta de tu servicio desde el dashboard de Render
2. Ve a Environment > edita `FRONTEND_URL` con esa URL exacta (sin slash al final)
3. Render va a reiniciar el servicio automaticamente

---

### Las funciones de IA (prediccion de demanda, sugerencia de precios) no responden

**Causa:** El ai-engine de Python no esta desplegado (es un servicio separado que corre localmente).  
**Impacto:** Solo afecta las pantallas de "Prediccion de demanda" e "Inventario IA" en el panel vendor.  
**El resto del sistema funciona con normalidad.**  
Si quieres desplegar el ai-engine tambien, crea un segundo servicio en Render con:
- Runtime: Python
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Luego agrega la variable `AI_ENGINE_URL=https://tu-ai-engine.onrender.com` al servicio principal.

---

## Estructura relevante del repositorio

```
kingsley-caps/
├── client/                    # Frontend React + Vite
│   ├── public/assets/         # Imagenes de productos (incluidas en el build)
│   ├── .env.production        # URLs vacias = mismo origen en produccion
│   └── src/services/api.js    # Configuracion de Axios
├── server/                    # Backend Node.js + Express
│   ├── src/app.js             # Sirve el build de React en produccion
│   ├── src/server.js          # Entry point
│   └── .env.example           # Plantilla de variables de entorno
├── render.yaml                # Configuracion de despliegue para Render
└── DEPLOY.md                  # Esta guia
```

---

## Contacto

Cualquier problema durante el despliegue, escribe a Andy (lider del proyecto).
