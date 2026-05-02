# 🔵 TAREAS DE ANDY — Módulo de Usuarios y Pagos

**Rama:** `dev/andy`
**Módulo oficial:** Módulo de Usuarios y Pagos (del Segundo Entregable)
**Tecnologías principales:** React, Node.js (auth-service), ethers.js, MetaMask

---

## RESUMEN DE RESPONSABILIDADES

Andy es responsable de:
1. **Auth Service** (Puerto 3001) — registro, login, JWT
2. **Frontend completo** — todas las páginas de la interfaz de usuario
3. **Integración MetaMask** — connect wallet, firmar TX, manejar errores cripto
4. **Conversión de precios** GTQ → ETH via CoinGecko

---

## FEATURES A DESARROLLAR

### FEATURE 1: Auth Service Backend
**Rama:** `feature/auth-service-setup`

Archivos a crear:
```
server/src/controllers/authController.js
server/src/services/authService.js
server/src/middleware/authenticate.js
server/src/middleware/authorize.js
server/src/middleware/rateLimiter.js
server/src/models/User.js
server/src/models/RefreshToken.js
server/src/routes/authRoutes.js
server/src/utils/AppError.js
server/src/utils/asyncHandler.js
server/src/utils/logger.js
server/src/config/jwt.js
server/src/config/database.js
```

Endpoints a implementar:
- `POST /api/auth/register` — RF-001
- `POST /api/auth/login` — RF-002
- `POST /api/auth/refresh` — RF-002
- `POST /api/auth/logout` — RF-002
- `GET /api/auth/me` — RF-002

Reglas críticas:
- bcrypt salt rounds = 12
- Access token expira en 15 minutos
- Refresh token expira en 7 días y se rota
- Rate limiting: 5 intentos / 15 min / IP+email
- Formato de respuesta: `{ success: true, data: { user, accessToken, refreshToken } }`

Tests requeridos:
```
server/tests/unit/auth.service.test.js      — 12 tests
server/tests/unit/auth.middleware.test.js   — 6 tests
server/tests/integration/auth.routes.test.js — 8 tests
```

---

### FEATURE 2: Frontend Setup
**Rama:** `feature/frontend-setup`

Archivos a crear:
```
client/src/services/api.js           — Instancia Axios con interceptores JWT
client/src/context/AuthContext.jsx   — Estado global de autenticación
client/src/context/CartContext.jsx   — Estado global del carrito
client/src/hooks/useAuth.js          — Hook para usar AuthContext
client/src/hooks/useCart.js          — Hook para usar CartContext
client/src/utils/formatters.js       — formatCurrency, formatDate, formatEthAddress
client/src/utils/validators.js       — Helpers de validación de formularios
client/src/components/ui/Button.jsx
client/src/components/ui/Input.jsx
client/src/components/ui/Modal.jsx
client/src/components/ui/Spinner.jsx
client/src/components/ui/Badge.jsx
client/src/components/layout/Navbar.jsx
client/src/components/layout/Footer.jsx
```

El `api.js` debe tener:
1. `baseURL` desde variable de entorno `VITE_API_URL`
2. Interceptor de request: agrega `Authorization: Bearer <token>`
3. Interceptor de response: maneja 401 → refresca token → reintenta
4. Si refresh falla → logout y redirect a `/login`

---

### FEATURE 3: Páginas de Autenticación
**Rama:** `feature/frontend-auth-pages`

Archivos a crear:
```
client/src/pages/Login.jsx
client/src/pages/Register.jsx
```

`Login.jsx`:
- Formulario: email + password
- Validación client-side antes de enviar
- Mostrar errores del servidor
- Al éxito: guardar tokens en localStorage, actualizar AuthContext, redirect a `/`
- Protección rate limit: deshabilitar botón temporalmente si hay error 429

`Register.jsx`:
- Formulario: name, email, password, confirmPassword, phone, role (customer/vendor)
- Validación de contraseña: mín 8 chars, 1 mayúscula, 1 número
- Al éxito: auto-login o redirect a login con mensaje

---

### FEATURE 4: Catálogo y Vista de Producto
**Rama:** `feature/frontend-catalog`

Archivos a crear:
```
client/src/pages/Home.jsx
client/src/pages/Catalog.jsx
client/src/pages/ProductDetail.jsx
client/src/components/products/ProductCard.jsx
client/src/components/products/ProductGrid.jsx
client/src/components/products/VariantSelector.jsx
client/src/hooks/useProducts.js
```

`ProductCard.jsx`:
- Imagen, nombre, precio, categoría, badge de stock bajo
- Botón "Ver detalle" → navigate a `/products/:id`
- aria-label en todos los elementos interactivos

`ProductDetail.jsx`:
- Selector de talla y color (VariantSelector)
- Mostrar stock disponible de la variante seleccionada
- Precio según la variante (puede tener price_override)
- Botón "Agregar al carrito" → verifica stock → llama API
- Error boundary para manejar errores

`useProducts.js`:
```javascript
const useProducts = (filters = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get('/products', { params: filters })
      .then(res => setProducts(res.data.data.products))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [JSON.stringify(filters)]);

  return { products, loading, error };
};
```

---

### FEATURE 5: Carrito y Checkout
**Rama:** `feature/frontend-cart-checkout`

Archivos a crear:
```
client/src/pages/Cart.jsx
client/src/pages/Checkout.jsx
client/src/pages/OrderConfirmation.jsx
client/src/components/cart/CartItem.jsx
client/src/components/cart/CartSummary.jsx
client/src/components/checkout/ShippingForm.jsx
client/src/components/checkout/PaymentSelector.jsx
```

`Cart.jsx`:
- Listar items con imagen, nombre, variante, precio, cantidad
- Modificar cantidad (con validación de stock)
- Eliminar items
- Subtotal por item y total del carrito
- Botón "Proceder al pago" → `/checkout`

`Checkout.jsx`:
- Resumen de la orden
- Formulario de dirección de envío
- Selector de método de pago: `crypto_eth` | `card` | `transfer`
- Si `crypto_eth` seleccionado → renderizar `CryptoPayment`

---

### FEATURE 6: Integración MetaMask
**Rama:** `feature/frontend-metamask`

Archivos a crear:
```
client/src/hooks/useMetaMask.js
client/src/hooks/useCryptoPrice.js
client/src/components/checkout/CryptoPayment.jsx
client/src/components/checkout/MetaMaskGuide.jsx
```

`useMetaMask.js`:
```javascript
const useMetaMask = () => {
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const connect = async () => {
    if (!window.ethereum) {
      setError('ERR_C01');  // MetaMask no instalado
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      setIsConnected(true);
    } catch (err) {
      setError(err.code === 4001 ? 'USER_REJECTED' : 'CONNECTION_ERROR');
    }
  };

  const sendTransaction = async ({ to, amountEth }) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const tx = await signer.sendTransaction({
      to,
      value: ethers.parseEther(amountEth),
    });
    return tx.hash;
  };

  return { account, isConnected, connect, sendTransaction, error };
};
```

`CryptoPayment.jsx` debe:
1. Llamar `GET /api/payments/crypto/price` para mostrar equivalencia GTQ→ETH
2. Llamar `POST /api/payments/crypto/initiate` para obtener nonce + wallet + monto
3. Mostrar QR code con datos de pago
4. Mostrar countdown de 10 minutos (rate lock)
5. Si usuario conecta MetaMask: botón "Pagar {monto} ETH"
6. Al confirmar TX: llamar `POST /api/payments/crypto/verify` con el txHash
7. Manejar todos los errores ERR-C01 a ERR-C06

---

### FEATURE 7: Mis Órdenes
**Rama:** `feature/frontend-orders`

Archivos a crear:
```
client/src/pages/MyOrders.jsx
client/src/hooks/useOrders.js
```

Mostrar: lista paginada de órdenes con estado, fecha, total, método de pago
Al hacer clic: ver detalle completo con items, número de guía (si enviado)

---

## CRITERIOS DE ACEPTACIÓN GLOBALES

- [ ] Todos los formularios tienen validación client-side
- [ ] Todos los errores de API se muestran al usuario (toast notifications)
- [ ] Loading states en todas las operaciones async
- [ ] Responsive: funciona en mobile y desktop
- [ ] MetaMask: todos los errores ERR-C01 a ERR-C06 manejados
- [ ] Tests unitarios para hooks y componentes críticos
- [ ] 0 console.log en código de producción

---

## VARIABLES DE ENTORNO FRONTEND

```env
# client/.env
VITE_API_URL=http://localhost:3000
VITE_AUTH_URL=http://localhost:3001
VITE_ETH_NETWORK=sepolia
```
