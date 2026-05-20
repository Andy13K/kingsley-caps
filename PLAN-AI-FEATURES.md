# Plan de implementación: Features de IA — Kingsley Caps
> Rama activa: dev/erick | Fecha: 2026-05-20
> Features: IA de Predicción de demanda + IA de Predictor de precio sugerido

---

## Garantías de este plan

| Garantía | Verificado |
|----------|-----------|
| ✅ Cero dependencias nuevas | `demand_analyzer.py` usa `statistics`, `math`, `datetime` (stdlib Python 3.11). `price_analyzer.py` usa `statistics`, `math` (stdlib). Frontend y server usan solo lo que ya está instalado. |
| ✅ Cero cambios en Docker | Ambas features son código puro en servicios existentes. Sin nuevos contenedores, Dockerfiles ni puertos. |
| ✅ Cero variables de entorno nuevas | Ambas features usan `AI_ENGINE_URL` que ya está definida en `.env.example`. |

---

## Fase 0 — Pre-flight checks

### 0.1 Esquema de BD actual

Tablas existentes y columnas relevantes para las 2 features:

#### Para predicción de demanda (consultas a órdenes históricas)
```sql
-- Ventas reales = order_item donde la orden fue pagada y pertenece a la tienda
SELECT
  oi.product_variant_id,
  pv.product_id,
  p.name            AS product_name,
  p.category,
  oi.quantity,
  o.created_at
FROM order_item oi
JOIN "order" o          ON o.id = oi.order_id
JOIN product_variant pv ON pv.id = oi.product_variant_id
JOIN product p          ON p.id = pv.product_id
WHERE o.store_id = :store_id
  AND o.status IN ('paid','preparing','packed','shipped','delivered')
  AND o.created_at >= NOW() - INTERVAL '30 days'
```

Columnas clave usadas:
- `product.id`, `product.name`, `product.category`, `product.store_id`
- `product_variant.product_id`, `product_variant.store_id`
- `order.store_id`, `order.status`, `order.created_at`
- `order_item.product_variant_id`, `order_item.quantity`, `order_item.order_id`

#### Para predictor de precio (consultas al catálogo)
```sql
-- Precios comparables = productos activos de la misma categoría en la tienda
SELECT
  p.id, p.name, p.category, p.base_price,
  COALESCE(AVG(pv.price_override), p.base_price) AS effective_price
FROM product p
JOIN product_variant pv ON pv.product_id = p.id AND pv.active = true
WHERE p.store_id = :store_id
  AND p.category   = :category
  AND p.status     = 'active'
  AND p.id        != :exclude_product_id
GROUP BY p.id
```

Columnas clave usadas:
- `product.id`, `product.name`, `product.category`, `product.base_price`, `product.status`, `product.featured`, `product.tags`
- `product_variant.price_override`, `product_variant.active`

**Todos los modelos Sequelize (`Product`, `ProductVariant`, `Order`, `OrderItem`) ya están definidos y migrados.** Sin acción requerida.

---

### 0.2 Estado de los datos seed

| Entidad | Cantidad actual | Suficiente |
|---------|----------------|-----------|
| Productos activos | 10 | ✅ para precio |
| Variantes | 30 | ✅ |
| Órdenes | 3 | ❌ para demanda |
| OrderItems | 1 | ❌ para demanda |

**Resultado:** Para el predictor de precio, los 10 productos del seed actual permiten demostrar la feature con confianza baja-media (3-5 comparables por categoría). Para la predicción de demanda, se necesita historial real. Se creará un seed histórico.

---

### 0.3 D5 — Verificación de tests e impacto del seed histórico

**Hallazgos del CI** (`.github/workflows/ci.yml` + `server/package.json`):

1. El CI usa la base de datos `kingsley_caps_test` (separada de `kingsley_caps_dev`).
2. El CI **NO ejecuta** `db:migrate` ni `db:seed` antes de `npm run test`.
3. La BD de test arranca vacía (sin esquema ni datos).
4. El `jest` config en `package.json` no tiene `globalSetup` ni archivos de setup que ejecuten migraciones.
5. Los 6 archivos de test existentes mockean los modelos Sequelize con Jest (`jest.mock()`), por lo que **no tocan la BD real**.

**Veredicto D5:** El nuevo seed histórico (`20260101000002-historical-orders.js`) es **100% seguro**:
- No afecta al CI (usa otra BD, sin seeds).
- No afecta a tests unitarios (todo mockeado).
- Solo afecta al dev local, que es el comportamiento esperado.
- `npm run db:reset` incluirá el nuevo seed — esto es intencional para que el dev local tenga datos realistas.

---

### 0.4 Estado del backend de Erick

Todos los servicios y rutas implementados. Los relevantes para este plan:
- `server/src/services/inventoryService.js` ✅ — se extenderá con `getDemandData()`
- `server/src/services/aiService.js` ✅ — se extenderá con `predictDemand()` y `suggestPrice()`
- `server/src/controllers/inventoryController.js` ✅ — se extenderá con `getDemandPredictions()`
- `server/src/controllers/productController.js` ✅ (de Carlos, ya migrado) — se extenderá con `suggestProductPrice()`
- `server/src/routes/inventoryRoutes.js` ✅ — se extenderá
- `server/src/routes/productRoutes.js` ✅ (de Carlos) — se extenderá
- `server/src/app.js` ✅ — NO necesita cambios (inventoryRoutes y productRoutes ya están montados)

---

### 0.5 Nginx y rate limits — sin cambios necesarios

Rate limit actual para `/api/ai/`: `burst=10` con zona global de `30r/s`.
Ambas features son endpoints on-demand (vendor los llama manualmente). `burst=10` es suficiente.
**Sin modificaciones en `docker/nginx.conf`.**

---

## Fase 1 — Predicción de demanda mejorada

### 1.1 Objetivo
Dado un `store_id`, predecir cuántas unidades de cada producto activo se venderán en los próximos 7 días. El vendor ve la predicción en su Dashboard. La predicción incluye tendencia (up/flat/down) y nivel de confianza basado en cuántos días de datos históricos hay.

### 1.2 Enfoque técnico — Media móvil ponderada

Sin dependencias externas. Todo con Python stdlib (`statistics`, `math`).

```
Para cada producto p en la tienda:
  1. Recibir daily_sales[30] (array de enteros, índice 0 = hace 30 días)
  2. avg_last_7  = mean(daily_sales[-7:])
  3. avg_prev_7  = mean(daily_sales[-14:-7])
  4. trend_factor = (avg_last_7 - avg_prev_7) / max(avg_prev_7, 0.001)
  5. predicted_units = round(avg_last_7 * 7 * (1 + trend_factor * 0.5))
  6. trend = "up" si trend_factor>0.1, "down" si <-0.1, "flat" en otro caso
  7. días_con_ventas = count(d for d in daily_sales if d > 0)
  8. confidence = "high" si días≥30, "medium" si días≥7, "low" si días<7
```

Justificación académica: La media móvil es interpretable, no requiere librerías ML, y con 90 días de datos históricos (que creamos en el seed) da resultados razonables para el contexto de un e-commerce universitario.

### 1.3 Endpoint nuevo en ai-engine
```
POST /api/ai/predict-demand
```
Body → `DemandPredictionRequest`
Response → `DemandPredictionResponse`

### 1.4 Schemas Pydantic (agregar a `ai-engine/models/schemas.py`)

```python
class ProductSalesData(BaseModel):
    product_id: str
    product_name: str
    category: str
    daily_sales: list[int]  # 30 enteros, índice 0 = hace 30 días, índice 29 = ayer

class DemandPredictionRequest(BaseModel):
    store_id: str
    products: list[ProductSalesData]
    forecast_days: int = 7

class ProductDemandForecast(BaseModel):
    product_id: str
    product_name: str
    category: str
    predicted_units: int
    trend: str            # "up" | "flat" | "down"
    confidence: str       # "high" | "medium" | "low"
    avg_daily_sales: float

class DemandPredictionResponse(BaseModel):
    store_id: str
    forecast_days: int
    predictions: list[ProductDemandForecast]  # ordenadas desc por predicted_units
    generated_at: str                          # ISO timestamp
```

### 1.5 Endpoint Express
```
GET /api/inventory/demand-predictions
```
Query param: implícito desde JWT (`req.user.store_id` para vendors).
Acceso: `authenticate` + `authorize(['vendor', 'staff', 'superadmin'])`.
**No se toca `server/src/app.js`** — `inventoryRoutes` ya está montado en `/api/inventory`.

### 1.6 Flujo de datos
```
Dashboard.jsx (GET /api/inventory/demand-predictions)
  → inventoryController.getDemandPredictions()
  → inventoryService.getDemandData(storeId)         ← query Sequelize a Order+OrderItem+Product
  → aiService.predictDemand(storeId, productsData)   ← POST al ai-engine
  → demand_analyzer.predict(data)                    ← algoritmo Python
  → respuesta al frontend con array de predicciones
```

### 1.7 UI en Dashboard.jsx

Agregar sección "Predicción de demanda — próximos 7 días" con:
- Tabla: Producto | Categoría | Unidades predichas | Tendencia | Confianza
- Tendencia: flecha ↑ (verde), → (gris), ↓ (rojo) usando Tailwind
- Confianza: badge coloreado (verde/amarillo/rojo)
- Botón "Actualizar predicción" en el header de la sección
- Estado de carga: spinner Tailwind mientras espera

### 1.8 Seed histórico

**Archivo a crear:** `server/database/seeds/20260101000002-historical-orders.js`

Genera 90 órdenes distribuidas en 90 días con estas características:
- Todas con `status = 'delivered'` y `paid_at` poblado
- `created_at` = `NOW() - (90 - i) * 24 * 60 * 60 * 1000` ms para la orden i
- Distribución de demanda: Snapback (40%), Trucker (30%), Beanie (20%), Fitted (10%)
- 1-2 OrderItems por orden con variantes distintas
- ~150 OrderItems en total
- Usa los IDs de store y variantes del seed inicial (hardcodeados como en el seed 1)

### 1.9 Tests requeridos

**Archivo:** `ai-engine/tests/test_demand_analyzer.py`

| Test | Descripción |
|------|-------------|
| `test_predict_sufficient_data` | 30 días de ventas → confidence="high" |
| `test_predict_partial_data` | Solo 10 días con ventas → confidence="medium" |
| `test_predict_no_history` | daily_sales=[0]*30 → predicted_units=0, confidence="low" |
| `test_trend_up` | Ventas crecen cada semana → trend="up" |
| `test_trend_down` | Ventas decrecen → trend="down" |
| `test_trend_flat` | Ventas estables → trend="flat" |
| `test_empty_products` | products=[] → predictions=[] |
| `test_output_sorted_desc` | Resultado ordenado por predicted_units descendente |

**Archivo:** `server/tests/unit/inventory.demand.test.js`

| Test | Descripción |
|------|-------------|
| `getDemandData filtra por store_id` | Solo retorna productos de la tienda correcta |
| `getDemandData filtra estados de orden` | Excluye pending_payment y cancelled |
| `getDemandData retorna array daily_sales de 30 posiciones` | Estructura correcta |

### 1.10 Checklist de implementación — Fase 1

Sigue estos pasos en orden. Completa cada uno antes del siguiente.

```
PASO 1 — Seed histórico
  a. Crear server/database/seeds/20260101000002-historical-orders.js
  b. Ejecutar: cd server && npm run db:seed
     (si falla, hacer db:reset primero)
  c. Verificar en pgAdmin o consola que existen ~90 órdenes y ~150 order_items

PASO 2 — Analyzer Python
  a. Crear ai-engine/analyzers/demand_analyzer.py
     Implementar: predict(data: dict) -> dict con el algoritmo de media móvil

PASO 3 — Schemas Pydantic
  a. Abrir ai-engine/models/schemas.py
  b. Agregar al final: ProductSalesData, DemandPredictionRequest,
     ProductDemandForecast, DemandPredictionResponse

PASO 4 — Router Python
  a. Abrir ai-engine/routers/analysis.py
  b. Agregar import de DemandPredictionRequest, DemandPredictionResponse,
     demand_analyzer.predict
  c. Agregar endpoint POST /predict-demand al final del archivo

PASO 5 — Tests Python
  a. Crear ai-engine/tests/test_demand_analyzer.py con los 8 tests listados
  b. Ejecutar: python -m pytest ai-engine/tests/test_demand_analyzer.py -v
  c. Verificar que todos pasan. Si falla alguno, corregir el analyzer antes de continuar.

PASO 6 — inventoryService (Express)
  a. Abrir server/src/services/inventoryService.js
  b. Agregar función exportada getDemandData(storeId) al final del módulo:
     - Query Order JOIN OrderItem JOIN ProductVariant JOIN Product
     - Filtrar últimos 30 días y estados pagados
     - Agrupar por producto y construir array daily_sales[30]

PASO 7 — aiService (Express)
  a. Abrir server/src/services/aiService.js
  b. Agregar función exportada predictDemand(storeId, productsData):
     - POST a AI_ENGINE_URL + '/api/ai/predict-demand'
     - Timeout: 8000ms
     - En catch: log del error + retornar { predictions: [] } como fallback seguro

PASO 8 — inventoryController (Express)
  a. Abrir server/src/controllers/inventoryController.js
  b. Agregar función getDemandPredictions(req, res):
     - Obtener storeId desde req.user.store_id
     - Llamar inventoryService.getDemandData(storeId)
     - Llamar aiService.predictDemand(storeId, data)
     - Responder con { success: true, data: result }

PASO 9 — inventoryRoutes (Express)
  a. Abrir server/src/routes/inventoryRoutes.js
  b. Agregar import getDemandPredictions del controller
  c. Agregar ruta: GET /demand-predictions con authenticate + authorize + asyncHandler

PASO 10 — Tests Express
  a. Crear server/tests/unit/inventory.demand.test.js con los 3 tests listados
  b. Ejecutar: cd server && npm run test:unit
  c. Verificar que todos los tests (existentes + nuevos) pasan

PASO 11 — Hook React
  a. Abrir client/src/hooks/useInventory.js
  b. Agregar estado demandPredictions y función fetchDemandPredictions()
     que llama GET /api/inventory/demand-predictions

PASO 12 — Dashboard.jsx
  a. Abrir client/src/pages/vendor/Dashboard.jsx
  b. Importar useInventory (ya existente)
  c. Agregar sección de tabla con predicciones, botón actualizar y spinner
  d. Todo en Tailwind CSS, sin estilos inline

PASO 13 — Verificación manual
  a. Levantar ai-engine: uvicorn main:app --reload --port 8000
  b. Levantar server: npm run dev (desde /server)
  c. Levantar client: npm run dev (desde /client)
  d. Abrir http://localhost:5173 como vendor@kingsley.com
  e. Ir a Dashboard → hacer clic en "Actualizar predicción"
  f. Verificar que aparece la tabla con predicciones y tendencias
```

### 1.11 Criterio de aceptación
- [ ] Seed crea ≥90 órdenes históricas sin errores
- [ ] `POST /api/ai/predict-demand` responde en <1s con datos de seed
- [ ] Dashboard vendor muestra tabla de predicciones con tendencias y badges de confianza
- [ ] 8 tests Python + 3 tests Express pasan
- [ ] `npm run test -- --coverage` en server/ mantiene ≥80% cobertura global
- [ ] Si ai-engine no está disponible, el endpoint Express retorna `{ predictions: [] }` (no 500)

---

## Fase 2 — Predictor de precio sugerido

### 2.1 Objetivo
Al crear o editar un producto, el vendor hace clic en "Sugerir precio IA" y recibe un precio sugerido basado en el catálogo de la tienda, con nivel de confianza y productos similares de referencia.

### 2.2 Enfoque técnico — Estadística descriptiva

Sin dependencias externas. Usa `statistics` de Python stdlib.

```
1. Recibir lista de comparable_products [{name, price}]
2. Si len(comparables) == 0: retornar confidence=0, suggested_price=0.0
3. Extraer precios: prices = [p.price for p in comparables]
4. Calcular: mediana = statistics.median(prices)
              media  = statistics.mean(prices)
              p75    = sorted(prices)[int(len(prices)*0.75)]
5. Aplicar ajustes:
   - featured=True → usar p75 en lugar de mediana
   - "limited" o "edicion" en tags → mediana * 1.10
   - caso base → mediana
6. Confianza según cantidad de comparables:
   - 0: 0%
   - 1-2: 30%
   - 3-5: 60%
   - 6+: 80%
7. similar_products: los 5 más cercanos al suggested_price (por |price - suggested|)
8. reasoning: "Basado en {N} productos similares de la categoría {cat}.
               Precio promedio: Q{media:.2f}. Rango: Q{min:.2f} – Q{max:.2f}."
```

### 2.3 Endpoint nuevo en ai-engine
```
POST /api/ai/suggest-price
```

### 2.4 Schemas Pydantic (agregar a `ai-engine/models/schemas.py`)

```python
class ProductDataForPricing(BaseModel):
    name: str
    category: str
    tags: list[str] = []
    featured: bool = False

class ComparableProduct(BaseModel):
    name: str
    price: float

class PriceSuggestionRequest(BaseModel):
    product_data: ProductDataForPricing
    comparable_products: list[ComparableProduct]  # máx 50

class PriceSuggestionResponse(BaseModel):
    suggested_price: float
    confidence: int          # 0-100
    reasoning: str           # en español
    similar_products: list[ComparableProduct]  # hasta 5
```

### 2.5 Endpoint Express
```
POST /api/products/suggest-price
```
Body: `{ category, tags, featured, exclude_product_id? }`
Acceso: `authenticate` + `authorize(['vendor', 'superadmin'])`.
**No se toca `server/src/app.js`** — `productRoutes` ya está montado en `/api/products`.

### 2.6 Flujo de datos
```
Products.jsx (POST /api/products/suggest-price)
  → productController.suggestProductPrice()
  → pricingService.getComparableProducts(storeId, category, excludeId)
      ← query Sequelize a Product JOIN ProductVariant
  → aiService.suggestPrice(productData, comparableProducts)
      ← POST al ai-engine
  → price_analyzer.suggest(data)
  → respuesta al frontend: { suggested_price, confidence, reasoning, similar_products }
```

### 2.7 Nuevo servicio Express

**Archivo a crear:** `server/src/services/pricingService.js`

Nota: `priceService.js` ya existe y maneja precios crypto ETH/GTQ. Este nuevo archivo es independiente.

```javascript
// pricingService.js — consulta precios del catálogo para sugerencia de precio IA
async function getComparableProducts(storeId, category, excludeProductId = null) {
  const where = {
    store_id: storeId,
    category,
    status: 'active',
  };
  if (excludeProductId) where.id = { [Op.ne]: excludeProductId };

  const products = await Product.findAll({
    where,
    include: [{
      model: ProductVariant,
      as: 'variants',
      where: { active: true },
      required: false,
    }],
    limit: 50,
  });

  return products.map(p => {
    const variantPrices = p.variants
      .filter(v => v.price_override !== null)
      .map(v => parseFloat(v.price_override));
    const effectivePrice = variantPrices.length > 0
      ? variantPrices.reduce((a, b) => a + b, 0) / variantPrices.length
      : parseFloat(p.base_price);
    return { name: p.name, price: effectivePrice };
  });
}
```

### 2.8 UI en Products.jsx

En el formulario de crear/editar producto (junto al campo `base_price`):
- Botón "✨ Sugerir precio IA" habilitado solo cuando `category` tiene valor
- Al hacer clic: spinner → llamada al endpoint → panel debajo del campo con:
  - Precio sugerido en grande
  - Barra de confianza (verde ≥60%, amarillo 30%, rojo 0%)
  - Texto `reasoning` en español
  - Lista de hasta 5 productos similares con sus precios
  - Botón "Usar este precio" → rellena el campo `base_price`
- Si confidence=0: mensaje "Sin datos suficientes en esta categoría."

### 2.9 ⚠️ Aclaración sobre dependencia de Carlos

`productController.js` es de Carlos. Se agrega UNA nueva función al **final** del archivo (`suggestProductPrice`), sin tocar las existentes. Si hay riesgo de conflicto de merge, alternativa: crear `server/src/controllers/pricingController.js` propio y apuntar la ruta a él.

### 2.10 Tests requeridos

**Archivo:** `ai-engine/tests/test_price_analyzer.py`

| Test | Descripción |
|------|-------------|
| `test_suggest_with_6_comparables` | 6 productos → confidence=80 |
| `test_suggest_with_2_comparables` | 2 productos → confidence=30 |
| `test_suggest_no_comparables` | [] → confidence=0, suggested_price=0.0 |
| `test_featured_uses_p75` | featured=True → precio = percentil 75 |
| `test_limited_tag_adds_10_pct` | tag "limited" → precio + 10% sobre mediana |
| `test_similar_products_max_5` | 20 comparables → similar_products tiene ≤5 |
| `test_reasoning_in_spanish` | reasoning contiene "Basado en" |

**Archivo:** `server/tests/unit/pricing.service.test.js`

| Test | Descripción |
|------|-------------|
| `getComparableProducts filtra por store_id y category` | Multi-tenant correcto |
| `getComparableProducts excluye el producto editado` | No sugiere el mismo producto |
| `getComparableProducts usa price_override cuando existe` | Precio efectivo correcto |

### 2.11 Checklist de implementación — Fase 2

```
PASO 1 — Analyzer Python
  a. Crear ai-engine/analyzers/price_analyzer.py
     Implementar: suggest(data: dict) -> dict con estadística descriptiva

PASO 2 — Schemas Pydantic
  a. Abrir ai-engine/models/schemas.py
  b. Agregar al final: ProductDataForPricing, ComparableProduct,
     PriceSuggestionRequest, PriceSuggestionResponse

PASO 3 — Router Python
  a. Abrir ai-engine/routers/analysis.py
  b. Agregar import de PriceSuggestionRequest, PriceSuggestionResponse,
     price_analyzer.suggest
  c. Agregar endpoint POST /suggest-price al final del archivo

PASO 4 — Tests Python
  a. Crear ai-engine/tests/test_price_analyzer.py con los 7 tests listados
  b. Ejecutar: python -m pytest ai-engine/tests/test_price_analyzer.py -v
  c. Verificar que todos pasan.

PASO 5 — pricingService (Express) — archivo nuevo
  a. Crear server/src/services/pricingService.js
  b. Implementar getComparableProducts(storeId, category, excludeProductId)
     con la query Sequelize descrita en 2.7

PASO 6 — aiService (Express)
  a. Abrir server/src/services/aiService.js
  b. Agregar función exportada suggestPrice(productData, comparableProducts):
     - POST a AI_ENGINE_URL + '/api/ai/suggest-price'
     - Timeout: 5000ms
     - En catch: retornar { suggested_price: 0, confidence: 0,
       reasoning: 'Error al consultar la IA.', similar_products: [] }

PASO 7 — productController (Express)
  a. Abrir server/src/controllers/productController.js
  b. Agregar al FINAL del archivo la función suggestProductPrice(req, res):
     - Extraer { category, tags, featured, exclude_product_id } de req.body
     - Obtener storeId de req.user.store_id
     - Llamar pricingService.getComparableProducts(...)
     - Llamar aiService.suggestPrice(...)
     - Responder con { success: true, data: result }
  c. Si hay riesgo de conflicto con código de Carlos:
     Alternativa: crear server/src/controllers/pricingController.js propio

PASO 8 — productRoutes (Express)
  a. Abrir server/src/routes/productRoutes.js
  b. Agregar import de suggestProductPrice
  c. Agregar ruta: POST /suggest-price con authenticate + authorize + asyncHandler
     IMPORTANTE: esta ruta debe ir ANTES de cualquier ruta /:id

PASO 9 — Tests Express
  a. Crear server/tests/unit/pricing.service.test.js con los 3 tests listados
  b. Ejecutar: cd server && npm run test:unit
  c. Verificar que todos los tests (existentes + nuevos) pasan

PASO 10 — Frontend (Products.jsx)
  a. Abrir client/src/pages/vendor/Products.jsx
  b. Agregar estado local: priceSuggestion (null), isLoadingSuggestion (false)
  c. Agregar función handleSuggestPrice():
     POST a /api/products/suggest-price con { category, tags, featured, exclude_product_id }
  d. Agregar UI: botón + panel de resultado (ver 2.8)
  e. Todo en Tailwind CSS, sin estilos inline

PASO 11 — Verificación manual
  a. Levantar ai-engine: uvicorn main:app --reload --port 8000
  b. Levantar server: npm run dev (desde /server)
  c. Levantar client: npm run dev (desde /client)
  d. Abrir http://localhost:5173 como vendor@kingsley.com
  e. Ir a Productos → crear nuevo producto → seleccionar categoría "Snapback"
  f. Hacer clic en "✨ Sugerir precio IA"
  g. Verificar: aparece precio sugerido, confianza, reasoning y productos similares
  h. Hacer clic en "Usar este precio" → verificar que el campo se rellena
```

### 2.12 Criterio de aceptación
- [ ] `POST /api/ai/suggest-price` responde en <500ms
- [ ] Botón "Sugerir precio IA" habilitado solo con categoría seleccionada
- [ ] Panel muestra precio, confianza, reasoning y productos similares
- [ ] Si no hay comparables: confidence=0 y mensaje claro (no pantalla rota)
- [ ] Botón "Usar este precio" rellena el campo base_price correctamente
- [ ] 7 tests Python + 3 tests Express pasan
- [ ] `npm run test -- --coverage` en server/ mantiene ≥80% cobertura

---

## Fase 4 — Docs mínimas

### 4.1 Variables de entorno — sin cambios
`AI_ENGINE_URL` ya existe en `.env.example`. No hay nada que agregar.

### 4.2 Documentar en `docs/api.md`
Agregar al final:
- `GET /api/inventory/demand-predictions` con descripción de respuesta
- `POST /api/products/suggest-price` con descripción de request y respuesta
- `POST /api/ai/predict-demand` y `POST /api/ai/suggest-price` (endpoints internos)

### 4.3 CI — sin cambios necesarios
Los tests Python se corren localmente. El CI solo cubre Node.js y React.

### 4.4 Commits y ramas

```bash
# Feature 1
git checkout -b feature/ai-demand-prediction
# ... implementar pasos 1-13 de Fase 1 ...
git add server/database/seeds/20260101000002-historical-orders.js \
        ai-engine/analyzers/demand_analyzer.py \
        ai-engine/tests/test_demand_analyzer.py \
        ai-engine/models/schemas.py \
        ai-engine/routers/analysis.py \
        server/src/services/inventoryService.js \
        server/src/services/aiService.js \
        server/src/controllers/inventoryController.js \
        server/src/routes/inventoryRoutes.js \
        server/tests/unit/inventory.demand.test.js \
        client/src/hooks/useInventory.js \
        client/src/pages/vendor/Dashboard.jsx
git commit -m "feat(ai): add demand prediction analyzer and vendor dashboard section"
git push origin feature/ai-demand-prediction

# Feature 2
git checkout develop && git checkout -b feature/ai-price-suggestion
# ... implementar pasos 1-11 de Fase 2 ...
git add ai-engine/analyzers/price_analyzer.py \
        ai-engine/tests/test_price_analyzer.py \
        ai-engine/models/schemas.py \
        ai-engine/routers/analysis.py \
        server/src/services/pricingService.js \
        server/src/services/aiService.js \
        server/src/controllers/productController.js \
        server/src/routes/productRoutes.js \
        server/tests/unit/pricing.service.test.js \
        client/src/pages/vendor/Products.jsx
git commit -m "feat(ai): add price suggestion analyzer and vendor product form integration"
git push origin feature/ai-price-suggestion
```

---

## Resumen de implementación

### Archivos a CREAR (8 total)
| # | Ruta | Feature |
|---|------|---------|
| 1 | `server/database/seeds/20260101000002-historical-orders.js` | Fase 1 |
| 2 | `ai-engine/analyzers/demand_analyzer.py` | Fase 1 |
| 3 | `ai-engine/tests/test_demand_analyzer.py` | Fase 1 |
| 4 | `server/tests/unit/inventory.demand.test.js` | Fase 1 |
| 5 | `ai-engine/analyzers/price_analyzer.py` | Fase 2 |
| 6 | `ai-engine/tests/test_price_analyzer.py` | Fase 2 |
| 7 | `server/src/services/pricingService.js` | Fase 2 |
| 8 | `server/tests/unit/pricing.service.test.js` | Fase 2 |

### Archivos a MODIFICAR (11 total)
| # | Ruta | Qué agregar |
|---|------|-------------|
| 1 | `ai-engine/models/schemas.py` | 4 schemas Fase 1 + 4 schemas Fase 2 |
| 2 | `ai-engine/routers/analysis.py` | 2 endpoints nuevos |
| 3 | `server/src/services/inventoryService.js` | función `getDemandData()` |
| 4 | `server/src/services/aiService.js` | funciones `predictDemand()` y `suggestPrice()` |
| 5 | `server/src/controllers/inventoryController.js` | función `getDemandPredictions()` |
| 6 | `server/src/routes/inventoryRoutes.js` | ruta GET /demand-predictions |
| 7 | `server/src/controllers/productController.js` | función `suggestProductPrice()` |
| 8 | `server/src/routes/productRoutes.js` | ruta POST /suggest-price |
| 9 | `client/src/hooks/useInventory.js` | función `fetchDemandPredictions()` |
| 10 | `client/src/pages/vendor/Dashboard.jsx` | sección tabla de predicciones |
| 11 | `client/src/pages/vendor/Products.jsx` | botón + panel sugerencia de precio |

### Tiempo estimado
| Fase | Tarea | Tiempo |
|------|-------|--------|
| 1 | Seed + analyzer Python + tests Python | 2h |
| 1 | Integración Express (service + controller + route) | 1.5h |
| 1 | Tests Express + frontend Dashboard | 2h |
| 2 | Analyzer Python + tests Python | 1.5h |
| 2 | Integración Express (pricingService + controller + route) | 1.5h |
| 2 | Tests Express + frontend Products.jsx | 2h |
| 4 | Docs + commits + PRs | 0.5h |
| **Total** | | **~11 horas** |
