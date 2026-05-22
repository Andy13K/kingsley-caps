# 🤖 FEATURES DE IA — Kingsley Caps

> **Rama:** `develop` (integra feature/ai-demand-prediction + feature/ai-price-suggestion)
> **Autor:** Erick Andrey Ortiz Guerra
> **Fecha:** Mayo 2026

---

## RESUMEN EJECUTIVO

Se implementaron dos features de inteligencia artificial para el panel de vendedor de Kingsley Caps:

| Feature | Donde se ve | Que resuelve |
|---------|-------------|-------------|
| **Prediccion de demanda** | Dashboard del vendor | El vendor no tenia visibilidad de cuantas unidades vender en los proximos dias |
| **Predictor de precio** | Formulario crear/editar producto | El vendor no tenia referencia de precios del mercado interno al crear un producto |

Ambas features usan **algoritmos de estadistica descriptiva en Python puro** (sin dependencias externas como scikit-learn o numpy). El ai-engine ya existia en el proyecto — solo se extendio con nuevos endpoints y analyzers.

---

## ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT (React + Vite, puerto 5173)                          │
│  Dashboard.jsx → GET /api/inventory/demand-predictions       │
│  Products.jsx  → POST /api/products/suggest-price            │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP (axios)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  SERVER (Express, puerto 3002)                               │
│  inventoryController.getDemandPredictions()                  │
│    → inventoryService.getDemandData()   [Sequelize → Supabase]│
│    → aiService.predictDemand()          [HTTP → ai-engine]   │
│                                                              │
│  pricingController.suggestProductPrice()                     │
│    → pricingService.getComparableProducts() [Sequelize]      │
│    → aiService.suggestPrice()           [HTTP → ai-engine]   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP (axios, timeout 5-8s)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  AI ENGINE (FastAPI + Python, puerto 8000)                   │
│  POST /api/ai/predict-demand → demand_analyzer.predict()     │
│  POST /api/ai/suggest-price  → price_analyzer.suggest()      │
└─────────────────────────────────────────────────────────────┘
```

**Garantia de fallback:** Si el ai-engine no esta disponible, el server devuelve una respuesta vacia segura (`{ predictions: [] }` o `{ suggestedPrice: 0, confidence: 0 }`) en lugar de un error 500. El vendor ve un mensaje de error claro, no una pantalla rota.

---

## FEATURE 1: PREDICCION DE DEMANDA

### Que hace

Dado el historial de ventas de los ultimos 30 dias de una tienda, predice cuantas unidades de cada producto activo se vendran en los proximos 7 dias. El vendor puede ver la prediccion en su Dashboard con un boton "Actualizar prediccion".

### Donde se ve

`client/src/pages/vendor/Dashboard.jsx` — seccion "Prediccion de demanda — proximos 7 dias"

La tabla muestra:
- Producto y categoria
- Unidades predichas para los proximos 7 dias
- Tendencia: flecha arriba (verde), lateral (gris), abajo (rojo)
- Nivel de confianza: badge verde/amarillo/rojo

### Como funciona el algoritmo

Archivo: `ai-engine/analyzers/demand_analyzer.py`

El algoritmo es una **media movil ponderada con factor de tendencia**. No requiere ninguna libreria externa — solo `statistics`, `math` y `datetime` de Python stdlib.

```
Para cada producto p en la tienda:
  1. Recibir daily_sales[30] — array de 30 enteros
     (indice 0 = hace 30 dias, indice 29 = ayer)

  2. avg_last_7  = mean(daily_sales[-7:])
  3. avg_prev_7  = mean(daily_sales[-14:-7])

  4. trend_factor = (avg_last_7 - avg_prev_7) / max(avg_prev_7, 0.001)

  5. predicted_units = round(avg_last_7 * 7 * (1 + trend_factor * 0.5))

  6. trend:
     - "up"   si trend_factor > 0.10
     - "down" si trend_factor < -0.10
     - "flat" en otro caso

  7. dias_con_ventas = count(d for d in daily_sales if d > 0)
     confidence:
     - "high"   si dias_con_ventas >= 30
     - "medium" si dias_con_ventas >= 7
     - "low"    si dias_con_ventas < 7
```

### Archivos involucrados

```
ai-engine/
  analyzers/demand_analyzer.py       -- algoritmo Python
  models/schemas.py                  -- ProductSalesData, DemandPredictionRequest,
                                        ProductDemandForecast, DemandPredictionResponse
  routers/analysis.py                -- endpoint POST /api/ai/predict-demand
  tests/test_demand_analyzer.py      -- 8 tests pytest

server/
  src/services/inventoryService.js   -- getDemandData() — query Sequelize
  src/services/aiService.js          -- predictDemand() — llamada HTTP al ai-engine
  src/controllers/inventoryController.js  -- getDemandPredictions()
  src/routes/inventoryRoutes.js      -- GET /api/inventory/demand-predictions
  database/seeds/20260101000002-historical-orders.js  -- seed de 90 ordenes
  tests/unit/inventory.demand.test.js -- 3 tests Jest

client/
  src/pages/vendor/Dashboard.jsx     -- UI de la tabla de predicciones
  src/hooks/useInventory.js          -- fetchDemandPredictions()
```

### Endpoint Express

```
GET /api/inventory/demand-predictions
Authorization: Bearer <token>
Roles permitidos: vendor, staff, superadmin
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "storeId": "uuid-de-la-tienda",
    "forecastDays": 7,
    "generatedAt": "2026-05-21T12:00:00.000Z",
    "predictions": [
      {
        "productId": "uuid",
        "productName": "Kingsley Verde Vintage",
        "category": "Snapback",
        "predictedUnits": 14,
        "trend": "up",
        "confidence": "high",
        "avgDailySales": 1.8
      }
    ]
  }
}
```

**Respuesta cuando el ai-engine no esta disponible:**
```json
{
  "success": true,
  "data": {
    "storeId": "uuid",
    "forecastDays": 7,
    "predictions": [],
    "generatedAt": "2026-05-21T12:00:00.000Z"
  }
}
```

### Endpoint AI Engine (interno)

```
POST /api/ai/predict-demand
Content-Type: application/json
```

**Body:**
```json
{
  "store_id": "uuid-de-la-tienda",
  "forecast_days": 7,
  "products": [
    {
      "product_id": "uuid",
      "product_name": "Kingsley Verde Vintage",
      "category": "Snapback",
      "daily_sales": [0, 2, 1, 0, 3, 1, 2, 0, 1, 2, 1, 0, 2, 1, 3, 0, 1, 2, 0, 3, 1, 2, 1, 0, 2, 3, 1, 2, 0, 1]
    }
  ]
}
```

**Respuesta:**
```json
{
  "store_id": "uuid",
  "forecast_days": 7,
  "generated_at": "2026-05-21T12:00:00Z",
  "predictions": [
    {
      "product_id": "uuid",
      "product_name": "Kingsley Verde Vintage",
      "category": "Snapback",
      "predicted_units": 14,
      "trend": "up",
      "confidence": "high",
      "avg_daily_sales": 1.8
    }
  ]
}
```

### Como interpretar los resultados

| Campo | Valores | Significado |
|-------|---------|-------------|
| `trend` | `"up"` | Ventas creciendo >10% vs semana anterior |
| `trend` | `"flat"` | Ventas estables (variacion <= 10%) |
| `trend` | `"down"` | Ventas cayendo >10% vs semana anterior |
| `confidence` | `"high"` | >= 30 dias con ventas — prediccion confiable |
| `confidence` | `"medium"` | 7-29 dias con ventas — prediccion orientativa |
| `confidence` | `"low"` | < 7 dias con ventas — datos insuficientes |
| `predicted_units` | entero >= 0 | Unidades estimadas para los proximos 7 dias |

---

## FEATURE 2: PREDICTOR DE PRECIO

### Que hace

Al crear o editar un producto, el vendor puede hacer clic en "Sugerir precio IA" para recibir un precio recomendado basado en los precios actuales de productos de la misma categoria en su tienda. Incluye nivel de confianza, razonamiento en texto, y lista de productos similares de referencia.

### Donde se ve

`client/src/pages/vendor/Products.jsx` — boton "Sugerir precio IA" a la derecha del campo `base_price` en el formulario de crear/editar producto.

El panel de resultado muestra:
- Precio sugerido (numero grande)
- Barra de confianza coloreada (verde >= 60%, amarillo 30%, rojo 0%)
- Texto de razonamiento en espanol
- Lista de hasta 5 productos similares con sus precios
- Boton "Usar este precio" que rellena el campo automaticamente

### Como funciona el algoritmo

Archivo: `ai-engine/analyzers/price_analyzer.py`

El algoritmo usa **estadistica descriptiva** del modulo `statistics` de Python stdlib. Sin dependencias externas.

```
1. Recibir lista de comparable_products [{name, price}]

2. Si len(comparables) == 0:
   → retornar confidence=0, suggested_price=0.0

3. Extraer precios: prices = [p.price for p in comparables]

4. Calcular estadisticas:
   mediana = statistics.median(prices)
   media   = statistics.mean(prices)
   n       = len(prices)
   p75     = sorted(prices)[min(int(n * 0.75), n - 1)]

5. Aplicar ajustes segun tipo de producto:
   - featured=True        → usar p75 (percentil 75) en lugar de mediana
   - tag "limited"
     o tag "edicion"      → mediana * 1.10  (+10% por exclusividad)
   - caso base            → mediana

6. Confianza segun cantidad de comparables:
   - 0 comparables  → 0%
   - 1-2 comparables → 30%
   - 3-5 comparables → 60%
   - 6+ comparables  → 80%

7. similar_products: los 5 mas cercanos al suggested_price
   ordenados por |price - suggested_price| ascendente

8. reasoning: texto en espanol con estadisticas del mercado
```

### Archivos involucrados

```
ai-engine/
  analyzers/price_analyzer.py        -- algoritmo Python
  models/schemas.py                  -- ProductDataForPricing, ComparableProduct,
                                        PriceSuggestionRequest, PriceSuggestionResponse
  routers/analysis.py                -- endpoint POST /api/ai/suggest-price
  tests/test_price_analyzer.py       -- 7 tests pytest

server/
  src/services/pricingService.js     -- getComparableProducts() — query Sequelize
  src/services/aiService.js          -- suggestPrice() — llamada HTTP al ai-engine
  src/controllers/pricingController.js -- suggestProductPrice()
  src/routes/productRoutes.js        -- POST /api/products/suggest-price
  tests/unit/pricing.service.test.js -- 3 tests Jest

client/
  src/pages/vendor/Products.jsx      -- UI del boton + panel de sugerencia
```

**Nota sobre pricingController vs productController:** `productController.js` es responsabilidad de Carlos. Para evitar conflictos de merge, se creo `pricingController.js` como controlador independiente.

**Nota sobre pricingService vs priceService:** `priceService.js` ya existia y maneja conversion ETH/GTQ. El nuevo archivo `pricingService.js` es completamente independiente y maneja precios del catalogo en GTQ.

### Endpoint Express

```
POST /api/products/suggest-price
Authorization: Bearer <token>
Roles permitidos: vendor, superadmin
Content-Type: application/json
```

**Body:**
```json
{
  "category": "Snapback",
  "tags": ["limited"],
  "featured": false,
  "exclude_product_id": "uuid-del-producto-en-edicion"
}
```

`exclude_product_id` es opcional. Se usa al editar un producto existente para que no se compare consigo mismo.

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "suggestedPrice": 248.75,
    "confidence": 60,
    "reasoning": "Basado en 4 productos similares de la categoria Snapback. Precio promedio: Q245.00. Rango: Q210.00 - Q275.00.",
    "similarProducts": [
      { "name": "Kingsley Star Chain", "price": 250.00 },
      { "name": "Kingsley Azul Cuadros", "price": 240.00 }
    ]
  }
}
```

**Respuesta cuando no hay comparables:**
```json
{
  "success": true,
  "data": {
    "suggestedPrice": 0,
    "confidence": 0,
    "reasoning": "Sin datos suficientes en esta categoria.",
    "similarProducts": []
  }
}
```

### Endpoint AI Engine (interno)

```
POST /api/ai/suggest-price
Content-Type: application/json
```

**Body:**
```json
{
  "product_data": {
    "name": "Nueva Gorra",
    "category": "Snapback",
    "tags": ["limited"],
    "featured": false
  },
  "comparable_products": [
    { "name": "Kingsley Star Chain", "price": 250.00 },
    { "name": "Kingsley Azul Cuadros", "price": 240.00 },
    { "name": "Kingsley Verde Vintage", "price": 225.00 }
  ]
}
```

**Respuesta:**
```json
{
  "suggested_price": 275.00,
  "confidence": 60,
  "reasoning": "Basado en 3 productos similares de la categoria Snapback. Precio promedio: Q238.33. Rango: Q225.00 – Q250.00.",
  "similar_products": [
    { "name": "Kingsley Star Chain", "price": 250.00 },
    { "name": "Kingsley Azul Cuadros", "price": 240.00 }
  ]
}
```

### Como interpretar los resultados

| Campo | Valores | Significado |
|-------|---------|-------------|
| `confidence` | 80 | 6+ productos comparables — sugerencia solida |
| `confidence` | 60 | 3-5 productos — sugerencia confiable |
| `confidence` | 30 | 1-2 productos — orientativo, usar con criterio |
| `confidence` | 0 | Sin comparables — no hay datos suficientes |
| `suggestedPrice` | float en GTQ | Precio base recomendado antes de variantes |
| `similarProducts` | lista (max 5) | Los productos mas cercanos al precio sugerido |
| `reasoning` | texto | Estadisticas del mercado que respaldan la sugerencia |

Si `confidence == 0`, el frontend muestra "Sin datos suficientes en esta categoria." en lugar del panel de precio.

---

## SEED HISTORICO

### Que es

El archivo `server/database/seeds/20260101000002-historical-orders.js` genera datos de ventas historicas para demostrar la feature de prediccion de demanda.

Sin este seed, la BD de desarrollo solo tiene 3 ordenes — insuficientes para que el algoritmo calcule tendencias con confianza media o alta.

### Que genera

- **90 ordenes** con status `delivered` distribuidas en los ultimos 90 dias
- **~150 OrderItems** con variantes distintas
- Distribucion de demanda por categoria:
  | Categoria | Proporcion |
  |-----------|-----------|
  | Snapback | 40% |
  | Trucker | 30% |
  | Beanie | 20% |
  | Fitted | 10% |
- Usa los IDs de store y variantes del seed inicial (no crea datos nuevos de tiendas)

### Como ejecutarlo

```bash
cd server
npm run db:seed
```

Si la BD ya tiene datos del seed inicial y da error de duplicado, hacer primero:

```bash
npm run db:reset
```

> **Impacto en CI:** Nulo. El CI usa la BD `kingsley_caps_test` (separada). Los tests unitarios mockean los modelos con Jest y no tocan ninguna BD real.

---

## COMO LEVANTAR EL PROYECTO LOCALMENTE

### Requisitos previos

- Node.js >= 20
- Python >= 3.11
- PostgreSQL (o acceso a la instancia de Supabase del equipo)
- Acceso al archivo `server/.env` (no se versiona)

### Variables de entorno necesarias

El archivo `server/.env` debe contener:

```
NODE_ENV
PORT
FRONTEND_URL
DATABASE_URL
DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD
JWT_ACCESS_SECRET / JWT_REFRESH_SECRET
JWT_ACCESS_EXPIRES / JWT_REFRESH_EXPIRES
ETH_NETWORK / ETH_RPC_URL / ETH_CONFIRMATIONS_REQUIRED
COINGECKO_API_URL
LOG_LEVEL
AI_ENGINE_URL          ← apunta al ai-engine (por defecto: http://localhost:8000)
VITE_API_URL / VITE_AUTH_URL / VITE_ETH_NETWORK
```

> Las features de IA solo necesitan `AI_ENGINE_URL`. No se agrego ninguna variable de entorno nueva.

### Los 3 comandos para levantar los servicios

**Terminal 1 — AI Engine:**
```bash
cd ai-engine
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Server (Express):**
```bash
cd server
npm run dev
```

**Terminal 3 — Client (React):**
```bash
cd client
npm run dev
```

El cliente queda disponible en `http://localhost:5173`.
Ingresar como vendor (`vendor@kingsley.com`) para ver las features de IA.

---

## TESTS

### Tests Python (ai-engine)

```bash
python -m pytest ai-engine/tests/ -v
```

| Archivo | Tests | Que cubren |
|---------|-------|-----------|
| `test_demand_analyzer.py` | 8 | Algoritmo de prediccion de demanda |
| `test_price_analyzer.py` | 7 | Algoritmo de sugerencia de precio |

**Tests del demand analyzer:**

| Test | Descripcion |
|------|-------------|
| `test_predict_sufficient_data` | 30 dias de ventas → confidence="high" |
| `test_predict_partial_data` | 10 dias con ventas → confidence="medium" |
| `test_predict_no_history` | daily_sales=[0]*30 → predicted_units=0, confidence="low" |
| `test_trend_up` | Ventas creciendo cada semana → trend="up" |
| `test_trend_down` | Ventas cayendo → trend="down" |
| `test_trend_flat` | Ventas estables → trend="flat" |
| `test_empty_products` | products=[] → predictions=[] |
| `test_output_sorted_desc` | Resultado ordenado por predicted_units descendente |

**Tests del price analyzer:**

| Test | Descripcion |
|------|-------------|
| `test_suggest_with_6_comparables` | 6 productos → confidence=80 |
| `test_suggest_with_2_comparables` | 2 productos → confidence=30 |
| `test_suggest_no_comparables` | [] → confidence=0, suggested_price=0.0 |
| `test_featured_uses_p75` | featured=True → precio = percentil 75 |
| `test_limited_tag_adds_10_pct` | tag "limited" → precio base + 10% |
| `test_similar_products_max_5` | 20 comparables → similar_products tiene <= 5 |
| `test_reasoning_in_spanish` | reasoning contiene "Basado en" |

### Tests Express (server)

```bash
cd server
npm run test:unit
```

| Archivo | Tests | Que cubren |
|---------|-------|-----------|
| `inventory.demand.test.js` | 3 | getDemandData() — filtros de store y estado de orden |
| `pricing.service.test.js` | 3 | getComparableProducts() — multi-tenant y price_override |

**Cobertura total actual: 15 tests Python + 57 tests Express**

---

## GARANTIAS DEL DISENO

| Garantia | Detalle |
|----------|---------|
| **Cero dependencias nuevas** | `demand_analyzer.py` y `price_analyzer.py` usan solo `statistics`, `math`, `datetime` de Python stdlib. El server y el client no agregaron ningun paquete npm nuevo. |
| **Cero cambios en Docker** | Ambas features son codigo puro en servicios existentes. Sin nuevos contenedores, Dockerfiles ni puertos. |
| **Cero variables de entorno nuevas** | Ambas features usan `AI_ENGINE_URL` que ya estaba definida en `.env.example`. |
| **Fallback seguro** | Si el ai-engine cae o tarda mas de 5-8s, el server devuelve una respuesta vacia valida. Nunca 500. |
| **Multi-tenant** | `getComparableProducts()` y `getDemandData()` siempre filtran por `store_id` extraido del JWT. Un vendor nunca ve datos de otra tienda. |
| **Sin modificar codigo de Carlos** | Se creo `pricingController.js` independiente en lugar de tocar `productController.js`. |

---

## PARA EL EQUIPO — COMO EXTENDER ESTAS FEATURES

### Agregar un nuevo analyzer Python

1. Crear `ai-engine/analyzers/mi_analyzer.py` con una funcion `async def analyze(data: dict) -> dict`
2. Agregar los schemas Pydantic en `ai-engine/models/schemas.py`
3. Importar y registrar el endpoint en `ai-engine/routers/analysis.py`
4. Agregar la funcion cliente en `server/src/services/aiService.js`
5. Agregar tests en `ai-engine/tests/test_mi_analyzer.py`

**Patron de un analyzer:**
```python
# ai-engine/analyzers/mi_analyzer.py
async def analyze(data: dict) -> dict:
    # data viene de request.model_dump() — ya validado por Pydantic
    # toda la logica aqui, sin dependencias externas
    return {
        "resultado": ...,
        "confidence": ...,
    }
```

**Patron de un endpoint en el router:**
```python
# ai-engine/routers/analysis.py
from models.schemas import MiRequest, MiResponse
from analyzers.mi_analyzer import analyze as mi_analyze

@router.post("/mi-endpoint", response_model=MiResponse)
async def mi_endpoint(request: MiRequest):
    try:
        result = await mi_analyze(request.model_dump())
        return MiResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Donde viven los schemas Pydantic

Todos los schemas estan en `ai-engine/models/schemas.py`. El archivo tiene 4 secciones:
1. Schemas de transacciones (analyzeTransaction) — Andy
2. Schemas de inventario (analyzeInventory) — Erick
3. Schemas de precio (suggestPrice) — Erick (Fase 2)
4. Schemas de demanda (predictDemand) — Erick (Fase 1)

### Agregar un nuevo endpoint al router Express

El patron de los endpoints de IA en Express es:

```javascript
// En el controller (asyncHandler maneja el try/catch)
const miFeature = asyncHandler(async (req, res) => {
  const store = await getStoreForVendor(req.user.id);
  const inputData = await miService.getData(store.id);
  const result = await aiService.miAnalysis(inputData);
  res.json({ success: true, data: result });
});
```

```javascript
// En la ruta (SIEMPRE antes de rutas /:id para evitar conflictos)
router.get('/mi-ruta', authenticate, authorize(['vendor']), miController);
```

```javascript
// En aiService.js (SIEMPRE con fallback en el catch)
const miAnalysis = async (data) => {
  try {
    const { data: response } = await axios.post(
      `${AI_ENGINE_URL}/api/ai/mi-endpoint`,
      data,
      { timeout: 5000 }
    );
    return response;
  } catch (err) {
    logger.error('AI service unavailable for mi-analysis', { message: err.message });
    return { resultado: null };  // fallback seguro — nunca lanzar el error
  }
};
```

### Convenciones de codigo a respetar

| Regla | Detalle |
|-------|---------|
| Comentarios en ingles | Consistencia con el resto del codebase |
| Commits en espanol sin tildes | `feat(ai): descripcion sin tildes` |
| ESLint `curly` | Todo `if` debe usar `{}` aunque sea de una linea |
| ESLint `max-len 100` | Ninguna linea JS supera 100 caracteres |
| `asyncHandler` | Todos los controllers de Express usan este wrapper |
| Sin `console.log` | Usar siempre `logger.error()` / `logger.info()` de `../utils/logger` |
| `store_id` desde JWT | Nunca desde el body — siempre desde `req.user.store_id` o `getStoreForVendor(req.user.id)` |
