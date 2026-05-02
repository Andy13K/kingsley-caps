# 🟢 TAREAS DE CARLOS — Módulo de Tienda y Pedidos

**Rama:** `dev/carlos`
**Módulo oficial:** Módulo de Tienda y Pedidos (del Segundo Entregable)
**Tecnologías principales:** Node.js, Express, Sequelize, PostgreSQL

---

## RESUMEN DE RESPONSABILIDADES

Carlos es responsable de:
1. **Infraestructura base** del proyecto (Docker, BD, ESLint, CI)
2. **API de Tiendas** — CRUD de tiendas del vendedor
3. **API de Productos** — catálogo con variantes
4. **API de Carrito** — gestión del carrito de compras
5. **API de Órdenes** — ciclo de vida completo de un pedido
6. **Panel del vendedor** (Frontend) — secciones de productos y pedidos

---

## FEATURES A DESARROLLAR

### FEATURE 1: Infraestructura Base del Proyecto
**Rama:** `feature/project-infrastructure`

Archivos a crear:
```
docker-compose.yml                    — PostgreSQL + Redis + pgAdmin
server/package.json                   — Dependencias backend
server/.env.example                   — Variables de entorno
server/src/config/database.js         — Conexión Sequelize
server/src/config/cors.js             — Whitelist de orígenes
server/src/app.js                     — Express app setup
server/src/server.js                  — Entry point
client/package.json                   — Dependencias frontend
.eslintrc.js                          — ESLint config
.prettierrc                           — Prettier config
.editorconfig                         — Editor config
```

`server/src/app.js` debe configurar en este orden:
1. helmet() — headers de seguridad
2. cors() — con whitelist del .env
3. express.json() — body parser
4. Middleware de correlationId
5. General rate limiter
6. Rutas
7. 404 handler
8. Error handler global

`docker-compose.yml`:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: kingsley_caps_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
  
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  
  pgadmin:
    image: dpage/pgadmin4
    ports: ["5050:80"]
```

---

### FEATURE 2: Modelos de Base de Datos (Sequelize)
**Rama:** `feature/db-models-migrations`

Archivos a crear (en orden de dependencias):
```
server/src/models/User.js
server/src/models/RefreshToken.js
server/src/models/Store.js
server/src/models/Product.js
server/src/models/ProductVariant.js
server/src/models/Cart.js
server/src/models/CartItem.js
server/src/models/Order.js
server/src/models/OrderItem.js
server/src/models/PaymentTransaction.js
server/src/models/InventoryMovement.js
server/src/models/Notification.js
server/src/models/ActivityLog.js
server/src/models/index.js            — Asociaciones entre modelos
database/migrations/                  — Un archivo por tabla
database/seeds/                       — Datos de prueba
```

Modelo de ejemplo (`Order.js`):
```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    storeId: { type: DataTypes.UUID, allowNull: false },
    customerId: { type: DataTypes.UUID, allowNull: false },
    status: {
      type: DataTypes.ENUM(
        'pending_payment', 'paid', 'preparing', 'packed',
        'shipped', 'delivered', 'cancelled', 'refunded'
      ),
      defaultValue: 'pending_payment',
    },
    subtotal: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    taxAmount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    shippingAmount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    discountAmount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    currency: { type: DataTypes.STRING(3), defaultValue: 'GTQ' },
    shippingAddress: { type: DataTypes.JSONB, allowNull: false },
    paymentMethod: { type: DataTypes.STRING(20) },
    trackingNumber: { type: DataTypes.STRING(100) },
    trackingCompany: { type: DataTypes.STRING(100) },
    paidAt: { type: DataTypes.DATE },
    shippedAt: { type: DataTypes.DATE },
    deliveredAt: { type: DataTypes.DATE },
  }, {
    tableName: 'order',
    underscored: true,
    timestamps: true,
  });

  return Order;
};
```

Seeds a crear:
- 1 usuario superadmin
- 1 usuario vendedor (Kingsley Caps)
- 1 tienda activa
- 10 productos con 3 variantes cada uno
- 2 usuarios clientes
- 3 órdenes en distintos estados

---

### FEATURE 3: API de Tiendas
**Rama:** `feature/api-stores`

Endpoints a implementar (ver `docs/api.md`):
- `POST /api/stores` — Crear tienda
- `GET /api/stores/my` — Mi tienda
- `PUT /api/stores/:id` — Actualizar tienda
- `PUT /api/stores/:id/crypto-config` — Configurar wallet ETH
- `PUT /api/stores/:id/publish` — Publicar tienda

Regla crítica: el vendedor SOLO puede ver/editar su propia tienda.
Verificar siempre que `store.vendorId === req.user.id`.

---

### FEATURE 4: API de Productos
**Rama:** `feature/api-products`

Endpoints:
- `GET /api/products` — Listar (público, con filtros + paginación)
- `GET /api/products/:id` — Detalle con variantes
- `POST /api/products` — Crear con variantes
- `PUT /api/products/:id` — Actualizar
- `DELETE /api/products/:id` — Archivar (soft delete)

Lógica de `productService.create()`:
```javascript
const create = async ({ storeId, name, description, basePrice, category, images, variants }) => {
  const product = await sequelize.transaction(async (t) => {
    const newProduct = await Product.create(
      { storeId, name, description, basePrice, category, images },
      { transaction: t }
    );

    if (variants?.length > 0) {
      const variantData = variants.map((v) => ({
        ...v,
        productId: newProduct.id,
        storeId,
      }));
      await ProductVariant.bulkCreate(variantData, { transaction: t });
    }

    return newProduct;
  });
  return product;
};
```

---

### FEATURE 5: API de Carrito
**Rama:** `feature/api-cart`

Endpoints:
- `GET /api/cart` — Obtener carrito (con items y productos)
- `POST /api/cart/items` — Agregar item (verificar stock)
- `PUT /api/cart/items/:itemId` — Actualizar cantidad
- `DELETE /api/cart/items/:itemId` — Eliminar item
- `DELETE /api/cart` — Vaciar carrito

Lógica crítica en `cartService.addItem()`:
```javascript
const addItem = async ({ userId, storeId, productVariantId, quantity }) => {
  return sequelize.transaction(async (t) => {
    // 1. Verificar stock disponible
    const variant = await ProductVariant.findByPk(productVariantId, { transaction: t });
    if (!variant || variant.storeId !== storeId) throw new NotFoundError('Variante');
    if (variant.stock < quantity) {
      throw new BusinessError(
        `Stock insuficiente. Disponible: ${variant.stock}`,
        'INSUFFICIENT_STOCK'
      );
    }

    // 2. Obtener o crear carrito
    const [cart] = await Cart.findOrCreate({
      where: { userId, storeId },
      transaction: t,
    });

    // 3. Agregar o actualizar item
    const [item, created] = await CartItem.findOrCreate({
      where: { cartId: cart.id, productVariantId },
      defaults: { quantity, unitPrice: variant.priceOverride ?? variant.product?.basePrice },
      transaction: t,
    });

    if (!created) {
      const newQty = item.quantity + quantity;
      if (variant.stock < newQty) {
        throw new BusinessError(`Stock insuficiente. Disponible: ${variant.stock}`, 'INSUFFICIENT_STOCK');
      }
      await item.update({ quantity: newQty }, { transaction: t });
    }

    return item;
  });
};
```

---

### FEATURE 6: API de Órdenes
**Rama:** `feature/api-orders`

Endpoints:
- `POST /api/orders` — Crear orden desde carrito
- `GET /api/orders` — Listar órdenes
- `GET /api/orders/:id` — Detalle
- `PUT /api/orders/:id/status` — Cambiar estado
- `PUT /api/orders/:id/tracking` — Registrar guía
- `PUT /api/orders/:id/cancel` — Cancelar

Lógica crítica de `orderService.create()`:
```javascript
const create = async ({ userId, storeId, shippingAddress, paymentMethod }) => {
  return sequelize.transaction(async (t) => {
    // 1. Obtener carrito con items
    const cart = await Cart.findOne({
      where: { userId, storeId },
      include: [{ model: CartItem, include: [ProductVariant] }],
      transaction: t,
    });
    if (!cart?.CartItems?.length) throw new BusinessError('Carrito vacío', 'EMPTY_CART');

    // 2. Verificar stock de TODOS los items (atomic)
    for (const item of cart.CartItems) {
      if (item.ProductVariant.stock < item.quantity) {
        throw new BusinessError(
          `Stock insuficiente para ${item.ProductVariant.sku}`,
          'INSUFFICIENT_STOCK'
        );
      }
    }

    // 3. Calcular totales
    const subtotal = cart.CartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const total = subtotal; // + tax + shipping si aplica

    // 4. Crear orden
    const order = await Order.create({
      storeId, customerId: userId, shippingAddress, paymentMethod, subtotal, total,
      status: 'pending_payment',
    }, { transaction: t });

    // 5. Crear order items (snapshot de precios)
    await OrderItem.bulkCreate(
      cart.CartItems.map((item) => ({
        orderId: order.id,
        productVariantId: item.productVariantId,
        productName: item.ProductVariant.Product?.name,
        variantSize: item.ProductVariant.size,
        variantColor: item.ProductVariant.color,
        sku: item.ProductVariant.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.unitPrice * item.quantity,
      })),
      { transaction: t }
    );

    // 6. Vaciar carrito
    await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });

    return order;
  });
};
```

---

### FEATURE 7: Panel Vendedor — Frontend (Productos y Órdenes)
**Rama:** `feature/vendor-panel-products-orders`

Archivos a crear:
```
client/src/pages/vendor/Dashboard.jsx
client/src/pages/vendor/Products.jsx
client/src/pages/vendor/Orders.jsx
```

`Products.jsx` (panel del vendedor):
- Tabla de productos con: nombre, categoría, variantes, stock total, estado
- Botón crear producto → modal con formulario completo
- Editar y archivar productos

`Orders.jsx` (panel del vendedor):
- Tabla de órdenes con filtros por estado
- Ver detalle de orden
- Cambiar estado de la orden
- Ingresar número de guía

---

## CRITERIOS DE ACEPTACIÓN GLOBALES

- [ ] Todas las queries incluyen `storeId` del JWT (multi-tenant)
- [ ] Transacciones atómicas en create order y update stock
- [ ] Stock NUNCA negativo (verificado en service)
- [ ] Paginación en todas las listas (default 10 items/página)
- [ ] Tests de integración para flujo completo de checkout
- [ ] Migraciones versionadas para todos los cambios de BD
