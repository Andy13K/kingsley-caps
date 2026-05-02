# 🗄️ ESQUEMA DE BASE DE DATOS — Kingsley Caps

> Fuente: Extraído del Primer, Segundo y Sexto Entregable
> **Motor:** PostgreSQL 16
> **ORM:** Sequelize 6

---

## CONVENCIONES (Sexto Entregable — CD-01 a CD-04)

- Tablas en **singular y snake_case**: `product`, `order_item`
- Columnas en **snake_case**: `created_at`, `total_price`
- Claves primarias: siempre `id` (UUID o SERIAL)
- Claves foráneas: `[entidad]_id` → `user_id`, `product_id`, `store_id`
- TODA tabla del dominio comercial tiene `store_id` (multi-tenant)
- SIEMPRE usar Sequelize/queries parametrizadas. SQL directo = PROHIBIDO
- Todo cambio de esquema via archivo de migración versionado

---

## TABLAS COMPLETAS

### `user` — Usuarios del sistema
```sql
CREATE TABLE user (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,          -- bcrypt, NUNCA texto plano
  name          VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  address       TEXT,
  role          VARCHAR(20) NOT NULL,            -- 'superadmin'|'vendor'|'staff'|'customer'
  status        VARCHAR(20) DEFAULT 'active',    -- 'active'|'pending_approval'|'suspended'
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### `refresh_token` — Tokens de refresh JWT
```sql
CREATE TABLE refresh_token (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,             -- Hash del token, no el token crudo
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN DEFAULT FALSE,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_refresh_token_user ON refresh_token(user_id);
```

### `store` — Tiendas (unidad multi-tenant)
```sql
CREATE TABLE store (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id   UUID NOT NULL REFERENCES user(id),
  name        VARCHAR(255) UNIQUE NOT NULL,
  slug        VARCHAR(255) UNIQUE NOT NULL,      -- URL-friendly, auto-generado
  description TEXT,
  logo_url    VARCHAR(500),
  status      VARCHAR(20) DEFAULT 'draft',       -- 'draft'|'active'|'suspended'|'closed'
  plan        VARCHAR(20) DEFAULT 'basic',       -- 'basic'|'pro'|'enterprise'
  -- Configuración de pagos cripto
  crypto_enabled        BOOLEAN DEFAULT FALSE,
  eth_wallet_address    VARCHAR(42),             -- 0x + 40 hex chars
  eth_confirmations_required INTEGER DEFAULT 3,
  -- Configuración de envíos
  shipping_methods      JSONB,
  -- Timestamps
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### `product` — Productos del catálogo
```sql
CREATE TABLE product (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES store(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  base_price  DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
  category    VARCHAR(100),                      -- 'Snapback'|'Trucker'|'Beanie'|'Fitted'
  status      VARCHAR(20) DEFAULT 'draft',       -- 'draft'|'active'|'archived'
  featured    BOOLEAN DEFAULT FALSE,
  images      JSONB DEFAULT '[]',                -- Array de URLs de imágenes
  tags        TEXT[],
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_product_store ON product(store_id);
CREATE INDEX idx_product_status ON product(store_id, status);
```

### `product_variant` — Variantes de producto (talla + color + stock)
```sql
CREATE TABLE product_variant (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  store_id        UUID NOT NULL REFERENCES store(id),   -- Para multi-tenant en queries
  size            VARCHAR(10),                           -- 'XS'|'S'|'M'|'L'|'XL'|'XXL'
  color           VARCHAR(50),
  sku             VARCHAR(100) UNIQUE NOT NULL,
  stock           INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),  -- NUNCA negativo
  price_override  DECIMAL(10,2),                         -- NULL = usar base_price del producto
  low_stock_threshold INTEGER DEFAULT 3,                 -- Alerta si stock < este valor
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_variant_product ON product_variant(product_id);
CREATE INDEX idx_variant_store ON product_variant(store_id);
```

### `inventory_movement` — Historial de movimientos de inventario
```sql
CREATE TABLE inventory_movement (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id  UUID NOT NULL REFERENCES product_variant(id),
  store_id            UUID NOT NULL REFERENCES store(id),
  type                VARCHAR(20) NOT NULL,    -- 'in'|'out'|'adjustment'|'reserved'|'released'
  quantity            INTEGER NOT NULL,         -- Positivo para entradas, negativo para salidas
  stock_before        INTEGER NOT NULL,
  stock_after         INTEGER NOT NULL,
  reason              VARCHAR(100),             -- 'sale'|'manual_adjustment'|'return'|'cancel'
  reference_id        UUID,                     -- ID de la orden o ajuste relacionado
  created_by          UUID REFERENCES user(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inv_move_variant ON inventory_movement(product_variant_id);
```

### `cart` — Carrito de compras (persistido en BD)
```sql
CREATE TABLE cart (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user(id),
  store_id    UUID NOT NULL REFERENCES store(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, store_id)                     -- Un carrito por usuario por tienda
);
```

### `cart_item` — Items del carrito
```sql
CREATE TABLE cart_item (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id             UUID NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
  product_variant_id  UUID NOT NULL REFERENCES product_variant(id),
  quantity            INTEGER NOT NULL CHECK (quantity > 0),
  unit_price          DECIMAL(10,2) NOT NULL,   -- Precio al momento de agregar
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cart_id, product_variant_id)
);
```

### `order` — Órdenes de compra
```sql
CREATE TABLE order (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id          UUID NOT NULL REFERENCES store(id),
  customer_id       UUID NOT NULL REFERENCES user(id),
  status            VARCHAR(30) DEFAULT 'pending_payment',
  -- Estados: 'pending_payment'|'paid'|'preparing'|'packed'|'shipped'|'delivered'|'cancelled'|'refunded'
  
  -- Totales
  subtotal          DECIMAL(10,2) NOT NULL,
  tax_amount        DECIMAL(10,2) DEFAULT 0,
  shipping_amount   DECIMAL(10,2) DEFAULT 0,
  discount_amount   DECIMAL(10,2) DEFAULT 0,
  total             DECIMAL(10,2) NOT NULL,
  currency          VARCHAR(3) DEFAULT 'GTQ',
  
  -- Envío
  shipping_address  JSONB NOT NULL,             -- { name, address, city, phone }
  shipping_method   VARCHAR(100),
  tracking_number   VARCHAR(100),
  tracking_company  VARCHAR(100),
  
  -- Pago
  payment_method    VARCHAR(20),                -- 'crypto_eth'|'card'|'transfer'
  
  -- Notas
  customer_notes    TEXT,
  vendor_notes      TEXT,
  
  -- Timestamps de estados
  paid_at           TIMESTAMPTZ,
  shipped_at        TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_order_store ON order(store_id);
CREATE INDEX idx_order_customer ON order(customer_id);
CREATE INDEX idx_order_status ON order(store_id, status);
```

### `order_item` — Items de la orden
```sql
CREATE TABLE order_item (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES order(id) ON DELETE CASCADE,
  product_variant_id  UUID NOT NULL REFERENCES product_variant(id),
  product_name        VARCHAR(255) NOT NULL,    -- Snapshot del nombre (por si cambia)
  variant_size        VARCHAR(10),
  variant_color       VARCHAR(50),
  sku                 VARCHAR(100),
  quantity            INTEGER NOT NULL CHECK (quantity > 0),
  unit_price          DECIMAL(10,2) NOT NULL,
  subtotal            DECIMAL(10,2) NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_order_item_order ON order_item(order_id);
```

### `payment_transaction` — Transacciones de pago
```sql
CREATE TABLE payment_transaction (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES order(id),
  store_id          UUID NOT NULL REFERENCES store(id),
  
  -- Método de pago
  method            VARCHAR(20) NOT NULL,       -- 'crypto_eth'|'card'|'transfer'
  
  -- Montos
  amount_fiat       DECIMAL(10,2) NOT NULL,     -- Monto en moneda local (GTQ)
  currency_fiat     VARCHAR(3) DEFAULT 'GTQ',
  amount_crypto     DECIMAL(18,8),              -- Monto en criptomoneda (ETH con 8 decimales)
  crypto_currency   VARCHAR(10),               -- 'ETH'
  exchange_rate     DECIMAL(18,6),             -- Tasa GTQ/ETH usada
  rate_locked_at    TIMESTAMPTZ,               -- Cuándo se fijó la tasa
  
  -- Datos blockchain (solo para cripto)
  tx_hash           VARCHAR(66),               -- 0x + 64 hex chars
  wallet_from       VARCHAR(42),               -- Wallet del comprador
  wallet_to         VARCHAR(42),               -- Wallet de la tienda
  network           VARCHAR(20),              -- 'sepolia'|'mainnet'
  confirmations     INTEGER DEFAULT 0,
  block_number      BIGINT,
  nonce             VARCHAR(100),             -- Nonce único generado por el sistema
  
  -- Estado
  status            VARCHAR(20) DEFAULT 'pending',
  -- 'pending'|'confirmed'|'failed'|'refunded'|'discrepancy'
  
  -- Timestamps
  initiated_at      TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at      TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ,              -- Rate lock expiration (10 min)
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payment_order ON payment_transaction(order_id);
CREATE UNIQUE INDEX idx_payment_tx_hash ON payment_transaction(tx_hash) WHERE tx_hash IS NOT NULL;
```

### `notification` — Notificaciones para usuarios
```sql
CREATE TABLE notification (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user(id),
  store_id    UUID REFERENCES store(id),
  type        VARCHAR(50) NOT NULL,    -- 'order_status'|'payment_confirmed'|'low_stock'|'new_order'
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  read        BOOLEAN DEFAULT FALSE,
  metadata    JSONB,                   -- Datos adicionales (order_id, etc.)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notification_user ON notification(user_id, read);
```

### `activity_log` — Bitácora de auditoría
```sql
CREATE TABLE activity_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES user(id),
  store_id      UUID REFERENCES store(id),
  action        VARCHAR(100) NOT NULL,    -- 'LOGIN'|'PRODUCT_CREATED'|'ORDER_STATUS_CHANGED'
  entity_type   VARCHAR(50),             -- 'order'|'product'|'user'
  entity_id     UUID,
  ip_address    INET,
  user_agent    TEXT,
  metadata      JSONB,                   -- Cambios específicos (old_value, new_value)
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_activity_store ON activity_log(store_id);
CREATE INDEX idx_activity_user ON activity_log(user_id);
```

---

## RELACIONES CLAVE

```
user (1) ─────────────── (N) store            [vendor tiene tiendas]
store (1) ─────────────── (N) product
product (1) ─────────────── (N) product_variant
product_variant (1) ─────── (N) inventory_movement
product_variant (1) ─────── (N) cart_item
product_variant (1) ─────── (N) order_item

user (1) ─────────────── (N) cart             [cliente tiene carritos por tienda]
cart (1) ─────────────── (N) cart_item

user (1) ─────────────── (N) order            [cliente tiene órdenes]
store (1) ─────────────── (N) order
order (1) ─────────────── (N) order_item
order (1) ─────────────── (N) payment_transaction

user (1) ─────────────── (N) refresh_token
user (1) ─────────────── (N) notification
```

---

## REGLAS DE INTEGRIDAD CRÍTICAS

```sql
-- Stock NUNCA negativo (ya está en CHECK pero reforzar en código)
CONSTRAINT chk_stock_non_negative CHECK (stock >= 0)

-- Una sola TX hash confirmada por orden
CREATE UNIQUE INDEX idx_confirmed_payment ON payment_transaction(order_id)
  WHERE status = 'confirmed';

-- Carrito único por usuario+tienda
UNIQUE(user_id, store_id) ON cart

-- SKU único en todo el sistema
UNIQUE(sku) ON product_variant
```

---

## ÍNDICES RECOMENDADOS ADICIONALES

```sql
-- Búsqueda de productos
CREATE INDEX idx_product_search ON product USING gin(to_tsvector('spanish', name || ' ' || COALESCE(description, '')));

-- Órdenes por período
CREATE INDEX idx_order_period ON order(store_id, created_at DESC);

-- Tokens activos
CREATE INDEX idx_refresh_active ON refresh_token(user_id, revoked, expires_at);
```
