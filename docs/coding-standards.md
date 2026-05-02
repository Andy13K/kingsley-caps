# 📏 CONVENCIONES DE CÓDIGO — Kingsley Caps

> Fuente: Sexto Entregable (Codificación y Control de Versiones)
> **OBLIGATORIO** para todos los integrantes del equipo.

---

## CONVENCIONES GENERALES (CG-01 a CG-10)

| ID | Regla | Ejemplo correcto | Ejemplo PROHIBIDO |
|----|-------|-----------------|-------------------|
| CG-01 | Código en **inglés** | `const calculateTotal` | `const calcularTotal` |
| CG-02 | Indentación **2 espacios** | `  const x = 1;` | `    const x = 1;` (4 espacios o tab) |
| CG-03 | Líneas máximo **100 caracteres** | *(dividir en múltiples líneas)* | línea de 120 chars |
| CG-04 | Variables/funciones: **camelCase** | `calculateTotalPrice` | `calculate_total_price` |
| CG-04 | Clases/Componentes: **PascalCase** | `ProductCard`, `PaymentService` | `product_card`, `productCard` |
| CG-04 | Constantes globales: **UPPER_SNAKE_CASE** | `MAX_RETRY_ATTEMPTS` | `maxRetryAttempts` |
| CG-05 | Archivos de componentes: **PascalCase** | `ProductCard.jsx` | `productCard.jsx` |
| CG-05 | Archivos de servicios/utils: **camelCase** | `paymentService.js` | `PaymentService.js` |
| CG-05 | Archivos de configuración: **kebab-case** | `docker-compose.yml` | `dockerCompose.yml` |
| CG-06 | Comentarios explican el **POR QUÉ**, no el qué | `// Rate lock prevents price manipulation` | `// Assign value to variable` |
| CG-07 | Funciones máximo **30 líneas** | *(dividir en funciones más pequeñas)* | función de 80 líneas |
| CG-07 | Funciones máximo **3 parámetros** | `fn({ userId, orderId, amount })` | `fn(userId, orderId, amount, currency, date)` |
| CG-08 | Strings dinámicos: **template literals** | `` `Hello ${name}` `` | `"Hello " + name` |
| CG-09 | Declarar con **const** por defecto | `const total = 100;` | `var total = 100;` o `let total = 100;` |
| CG-09 | `let` SOLO si se reasigna | `let count = 0; count++;` | *(no usar var)* |
| CG-09 | `var` = **PROHIBIDO** | — | `var x = 1;` |
| CG-10 | Imports en **3 grupos** con línea en blanco | *(ver ejemplo abajo)* | imports mezclados |

### Ejemplo de imports correctos (CG-10)
```javascript
// 1. Dependencias externas (npm) — ordenadas alfabéticamente
import axios from 'axios';
import express from 'express';
import jwt from 'jsonwebtoken';

// 2. Módulos internos del proyecto
import { AppError } from '../utils/AppError.js';
import { orderService } from '../services/orderService.js';

// 3. Archivos locales del módulo actual
import { validateOrder } from './orderValidator.js';
```

---

## CONVENCIONES BACKEND — Node.js / Express (CB-01 a CB-05)

### CB-01 — Estructura de Controllers
```javascript
// ✅ CORRECTO: Controller SOLO valida → llama service → formatea respuesta
const createOrder = asyncHandler(async (req, res) => {
  // 1. El middleware ya validó la entrada
  const { storeId, shippingAddress, paymentMethod } = req.body;
  const customerId = req.user.id;  // Del JWT via middleware authenticate

  // 2. Delegar TODA la lógica al service
  const order = await orderService.create({
    storeId,
    customerId,
    shippingAddress,
    paymentMethod,
  });

  // 3. Formatear y responder
  res.status(201).json({ success: true, data: { order } });
});

// ❌ PROHIBIDO: Lógica de negocio en el controller
const createOrder = asyncHandler(async (req, res) => {
  // ❌ PROHIBIDO poner esto aquí:
  const cartItems = await CartItem.findAll({ where: { cartId: req.body.cartId } });
  const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const stock = await ProductVariant.findByPk(cartItems[0].productVariantId);
  if (stock.stock < cartItems[0].quantity) throw new Error('No stock');
  // ... etc
});
```

### CB-02 — Validación con Joi (en middleware, ANTES del controller)
```javascript
// validators/orderValidator.js
const Joi = require('joi');

const createOrderSchema = Joi.object({
  storeId: Joi.string().uuid().required(),
  shippingAddress: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    address: Joi.string().min(5).max(500).required(),
    city: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-()]{8,20}$/).required(),
  }).required(),
  paymentMethod: Joi.string().valid('crypto_eth', 'card', 'transfer').required(),
  customerNotes: Joi.string().max(500).optional(),
});

// Middleware
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((d) => d.message).join(', ');
    return next(new ValidationError(messages));
  }
  next();
};
```

### CB-03 — Formato de respuesta SIEMPRE consistente
```javascript
// ✅ Éxito
res.status(200).json({ success: true, data: { order } });
res.status(201).json({ success: true, data: { product } });

// ✅ Lista con paginación
res.status(200).json({
  success: true,
  data: { orders },
  meta: { page: 1, limit: 10, total: 45, totalPages: 5 },
});

// ✅ Error (manejado por errorHandler global)
// Usar AppError, no res.json directamente en controllers
throw new AppError('Producto no encontrado', 404, 'PRODUCT_NOT_FOUND');
```

### CB-04 — Async/Await (NUNCA callbacks)
```javascript
// ✅ CORRECTO
const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.findById(req.params.id);
  if (!product) throw new AppError('No encontrado', 404, 'PRODUCT_NOT_FOUND');
  res.json({ success: true, data: { product } });
});

// ❌ PROHIBIDO
const getProduct = (req, res, next) => {
  productService.findById(req.params.id, (err, product) => {  // callback = PROHIBIDO
    if (err) return next(err);
    res.json({ product });
  });
};
```

### CB-05 — Variables de entorno
```javascript
// ✅ CORRECTO
const jwtSecret = process.env.JWT_ACCESS_SECRET;
const dbUrl = process.env.DATABASE_URL;

// ❌ PROHIBIDO
const jwtSecret = 'mi_secreto_super_seguro';  // NUNCA hardcodear
```

---

## CONVENCIONES FRONTEND — React (CF-01 a CF-05)

### CF-01 — Solo componentes funcionales con Hooks
```javascript
// ✅ CORRECTO
const ProductCard = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    await onAddToCart(product.id, quantity);
    setIsLoading(false);
  };

  return (
    <div className="product-card">
      {/* JSX */}
    </div>
  );
};

export default ProductCard;

// ❌ PROHIBIDO: class components
class ProductCard extends React.Component { ... }
```

### CF-02 — Gestión de estado
```javascript
// ✅ Estado local → useState
const [isOpen, setIsOpen] = useState(false);

// ✅ Estado complejo local → useReducer
const [state, dispatch] = useReducer(cartReducer, initialState);

// ✅ Estado global → Context API
// AuthContext para autenticación
// CartContext para carrito
// NO prop drilling de más de 2 niveles

// ✅ Para estado de servidor → React Query (si se agrega) o useState + useEffect
```

### CF-03 — Estilos con Tailwind CSS
```javascript
// ✅ CORRECTO
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
  Comprar
</button>

// ❌ PROHIBIDO: inline styles (excepto valores dinámicos calculados en runtime)
<button style={{ backgroundColor: 'blue', color: 'white' }}>Comprar</button>
```

### CF-04 — Peticiones HTTP via instancia Axios centralizada
```javascript
// ✅ En src/services/api.js — LA ÚNICA instancia Axios
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
});

// Interceptor: agregar token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: manejar 401 → refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Intentar renovar token
      const newToken = await refreshAccessToken();
      if (newToken) {
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api.request(error.config);
      }
      // Si falla el refresh → logout
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ✅ En hooks y componentes — SIEMPRE usar api, NUNCA fetch() o axios directo
import api from '../services/api';
const { data } = await api.get(`/products/${id}`);
```

### CF-05 — Accesibilidad
```javascript
// ✅ CORRECTO
<button aria-label="Agregar al carrito" onClick={handleAdd}>
  <ShoppingCartIcon />
</button>

<img src={product.imageUrl} alt={`Imagen de ${product.name}`} />

<label htmlFor="email">Correo electrónico</label>
<input id="email" type="email" name="email" />

// ❌ PROHIBIDO
<div onClick={handleAdd}>Agregar</div>  // usar button, no div
<img src={product.imageUrl} />          // siempre alt
```

---

## CONVENCIONES BASE DE DATOS (CD-01 a CD-04)

| ID | Regla |
|----|-------|
| CD-01 | Tablas en **singular y snake_case**: `product`, `order_item` |
| CD-02 | Columnas en **snake_case**: `created_at`, `total_price`, `user_id` |
| CD-03 | SIEMPRE Sequelize/ORM. **NUNCA** SQL con concatenación de strings |
| CD-04 | Todo cambio de esquema via **archivo de migración** versionado |

---

## MANEJO DE ERRORES

### Jerarquía de clases de error (AppError.js)
```javascript
class AppError extends Error {
  constructor(message, statusCode, errorCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

class BusinessError extends AppError {
  constructor(message, errorCode) {
    super(message, 422, errorCode);
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND');
  }
}

class AuthError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 403, 'FORBIDDEN');
  }
}
```

### asyncHandler wrapper
```javascript
// utils/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Uso: todas las rutas async usan asyncHandler
router.post('/products', authenticate, authorize('vendor'), validate(schema), asyncHandler(controller));
```

### Global error handler middleware
```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_ERROR';
  const message = err.isOperational ? err.message : 'Error interno del servidor';

  // Log con Winston
  logger.error({
    message: err.message,
    errorCode,
    statusCode,
    correlationId: req.correlationId,
    userId: req.user?.id,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    error: { code: errorCode, message },
  });
};
```

---

## LOGGING CON WINSTON

```javascript
// utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()  // JSON estructurado
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/app.log' }),
  ],
});

// Campos OBLIGATORIOS en cada log:
// timestamp (auto), level, message, correlationId, module, userId (si autenticado)

// Ejemplo de uso correcto:
logger.info({
  message: 'Payment transaction initiated',
  correlationId: req.correlationId,
  module: 'payment-service',
  userId: req.user.id,
  orderId: order.id,
  amount: order.total,
});

// NUNCA usar console.log en producción
```

---

## PRINCIPIOS SOLID APLICADOS

### SRP — Cada archivo tiene UNA responsabilidad
```
authController.js     → Solo recibe/responde HTTP
authService.js        → Solo lógica de autenticación
jwtHelper.js          → Solo operaciones JWT
bcryptHelper.js       → Solo operaciones de hash
```

### OCP — Abierto para extensión, cerrado para modificación
```javascript
// Usar estrategias para métodos de pago
class PaymentProcessor {
  constructor(strategy) { this.strategy = strategy; }
  async process(order) { return this.strategy.process(order); }
}
class CryptoPaymentStrategy { async process(order) { ... } }
class CardPaymentStrategy { async process(order) { ... } }
// Agregar nuevo método = nueva clase, NO modificar la existente
```

### DIP — Dependencias hacia abstracciones
```javascript
// ✅ El service no importa directamente la implementación
class OrderService {
  constructor({ orderRepository, paymentGateway, inventoryService }) {
    this.orderRepo = orderRepository;
    this.paymentGateway = paymentGateway;
    this.inventoryService = inventoryService;
  }
}
```
