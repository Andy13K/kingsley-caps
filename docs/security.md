# 🔐 SEGURIDAD — Kingsley Caps

> Fuente: Cuarto Entregable (Seguridad del Software — 54 páginas)
> Metodología: STRIDE para modelado de amenazas

---

## CONTROLES PREVENTIVOS

| ID | Control | Implementación |
|----|---------|----------------|
| CP-01 | **JWT doble token** | Access: 15 min / Refresh: 7 días con rotación. Almacenar refresh hash en BD |
| CP-02 | **Hashing de contraseñas** | bcrypt con salt rounds = 12. NUNCA MD5/SHA1/texto plano |
| CP-03 | **Validación de entrada** | Joi en TODOS los endpoints. Whitelist de campos permitidos |
| CP-04 | **Prevención SQL Injection** | Sequelize ORM con queries parametrizadas. NUNCA concatenación |
| CP-05 | **Isolamiento multi-tenant** | `store_id` del JWT en CADA query a tablas de dominio |
| CP-06 | **Headers de seguridad HTTP** | HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy |
| CP-07 | **Rate limiting** | 100 req/min general, 10 req/min checkout, bloqueo 15 min tras 5 intentos auth |
| CP-08 | **Validación de archivos** | Verificar magic bytes (no solo extensión), máx 5MB, S3 aislado |
| CP-09 | **Cifrado AES-256** | Datos sensibles en reposo (wallets, secrets). TLS 1.2+ en tránsito |

### Implementación de headers (Helmet.js)
```javascript
app.use(helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin' },
}));
```

### Rate limiting
```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 5,                     // 5 intentos
  message: { success: false, error: { code: 'TOO_MANY_ATTEMPTS', message: 'Bloqueado 15 min' } },
  keyGenerator: (req) => `${req.ip}:${req.body.email}`,
});

const generalLimiter = rateLimit({ windowMs: 60000, max: 100 });
const checkoutLimiter = rateLimit({ windowMs: 60000, max: 10 });

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/orders', checkoutLimiter);
app.use('/api', generalLimiter);
```

---

## CONTROLES DETECTIVOS

| ID | Control | Implementación |
|----|---------|----------------|
| CD-01 | **Logs de auditoría** | Winston JSON con correlationId, userId, action, entity |
| CD-02 | **SIEM básico** | Alertas automáticas: >10 errores nivel 3 en 5 min, ERR-C06, tasa 5xx >1% |
| CD-03 | **Monitoreo de TX cripto** | Polling cada 30s para TXs pendientes (ERR-C04) |
| CD-04 | **Detección de anomalías** | Motor IA (ia-service) analiza cada transacción por signos de fraude |

---

## CONTROLES CORRECTIVOS

| ID | Control | Implementación |
|----|---------|----------------|
| CC-01 | **Revocación de tokens** | Marcar `refresh_token.revoked = true` en logout o detección de abuso |
| CC-02 | **Bloqueo de cuenta** | Suspender usuario tras actividad sospechosa detectada por IA |
| CC-03 | **Rollback de inventario** | Si TX cripto falla → liberar stock reservado automáticamente |

---

## MANEJO DE ERRORES CRIPTO (ERR-C01 a ERR-C06)

```javascript
// Todos estos escenarios deben estar implementados en paymentService.js

const CRYPTO_ERRORS = {
  ERR_C01: {  // MetaMask no conectado
    action: 'show_metamask_guide',
    logLevel: 'INFO',
    userMessage: 'Por favor conecta tu billetera MetaMask para continuar',
  },
  ERR_C02: {  // Nonce inválido o reutilizado
    action: 'regenerate_nonce',
    logLevel: 'WARN',
    alert: 'security',
    userMessage: 'Sesión de pago expirada. Iniciando nueva sesión...',
  },
  ERR_C03: {  // Fondos insuficientes
    action: 'show_alternative_payment',
    logLevel: 'INFO',
    userMessage: 'Fondos insuficientes. Monto requerido: {amount} ETH. Disponible: {balance} ETH',
  },
  ERR_C04: {  // Timeout > 10 minutos
    action: 'poll_tx_every_30s',
    logLevel: 'WARN',
    maxRetries: 6,  // 6 confirmaciones
    userMessage: 'Transacción en proceso. Verificando confirmaciones...',
  },
  ERR_C05: {  // TX revertida
    action: 'release_reserved_stock',
    logLevel: 'ERROR',
    notify: 'user',
    userMessage: 'El pago no fue procesado. El stock ha sido liberado. Puedes intentar nuevamente.',
  },
  ERR_C06: {  // Discrepancia de monto — CRÍTICO
    action: 'block_order_notify_admin',
    logLevel: 'ERROR',
    alert: 'critical',
    userMessage: 'Problema con el pago. Nuestro equipo revisará tu transacción.',
    adminMessage: 'CRÍTICO: Discrepancia de monto en orden {orderId}. TX: {txHash}',
  },
};
```

---

## AUTENTICACIÓN JWT — IMPLEMENTACIÓN

```javascript
// config/jwt.js
const JWT_CONFIG = {
  access: {
    secret: process.env.JWT_ACCESS_SECRET,
    expiresIn: '15m',
    algorithm: 'HS256',
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
    algorithm: 'HS256',
  },
};

// Payload del access token
const ACCESS_TOKEN_PAYLOAD = {
  id: user.id,
  email: user.email,
  role: user.role,
  storeId: user.store?.id,  // Para vendedores
};

// middleware/authenticate.js
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) throw new AuthError('Token requerido');

  const token = authHeader.split(' ')[1];
  const payload = jwt.verify(token, JWT_CONFIG.access.secret);

  req.user = payload;
  req.correlationId = req.headers['x-correlation-id'] || generateUUID();
  next();
});

// middleware/authorize.js
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new ForbiddenError(`Se requiere uno de estos roles: ${roles.join(', ')}`);
  }
  next();
};

// Uso en rutas
router.post('/products', authenticate, authorize('vendor', 'superadmin'), asyncHandler(controller));
```

---

## VALIDACIÓN DE WALLET ETHEREUM

```javascript
// utils/validators/ethereumValidator.js
const { ethers } = require('ethers');

const isValidEthAddress = (address) => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

// Joi schema para wallet
const walletSchema = Joi.string()
  .pattern(/^0x[a-fA-F0-9]{40}$/)
  .custom((value, helpers) => {
    if (!isValidEthAddress(value)) return helpers.error('any.invalid');
    return value;
  })
  .required();
```

---

## VARIABLES DE ENTORNO OBLIGATORIAS

```env
# CRÍTICAS — Sin estas el sistema NO arranca
JWT_ACCESS_SECRET=   # Min 64 chars aleatorios
JWT_REFRESH_SECRET=  # Min 64 chars aleatorios
DB_PASSWORD=         # Password de PostgreSQL
ETH_RPC_URL=         # URL de Infura/Alchemy para Sepolia

# Generar secrets seguros:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
