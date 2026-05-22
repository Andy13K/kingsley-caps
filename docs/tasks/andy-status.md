# Estado del modulo de Andy

## Alcance entregado

Andy deja implementado el modulo de Usuarios y Pagos a nivel de frontend y auth base:

- Auth service base en `server/src` con registro, login, refresh, logout y `me`.
- Frontend React completo con rutas principales de cliente.
- Login, registro, catalogo, detalle de producto, carrito, checkout, pago cripto, confirmacion y mis ordenes.
- Contextos globales de autenticacion, carrito y tema.
- Interceptor Axios con access token, refresh token y retry de requests 401.
- Integracion MetaMask en frontend con conexion de wallet, cambio a Sepolia y envio de transaccion.
- Conversion GTQ a ETH desde el hook de precio cripto.
- UI de QR, countdown, guia de MetaMask y manejo de errores cripto.
- Tema claro/oscuro con contraste corregido.

## Mocks temporales

El frontend tiene fallbacks mock para poder demostrar la interfaz aunque los servicios de Carlos y Erick aun no esten conectados:

- `client/src/hooks/useProducts.js`: usa productos mock si falla `/products`.
- `client/src/hooks/useOrders.js`: usa ordenes mock si falla `/orders/my`.
- `client/src/context/AuthContext.jsx`: usa `mockAuth` solo si el auth-service no responde.
- `client/src/components/checkout/CryptoPayment.jsx`: crea un pago mock si falla `/payments/crypto/initiate` o `/payments/crypto/verify`.

Estos mocks no reemplazan las APIs finales. Solo mantienen funcional la demo mientras se integran los modulos restantes.

## Endpoints que espera el frontend

### Auth service, responsabilidad Andy

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Formato esperado para login/register:

```json
{
  "success": true,
  "data": {
    "user": {},
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Backend API, responsabilidad Carlos

- `GET /products`
- `GET /products/:id`
- `POST /orders`
- `GET /orders/my`

El frontend espera productos con:

```json
{
  "id": "uuid",
  "name": "Gorra",
  "description": "...",
  "base_price": 150,
  "category": "Visera Plana",
  "featured": true,
  "images": ["https://..."],
  "variants": [
    {
      "id": "uuid",
      "size": "M",
      "color": "Negro",
      "stock": 10,
      "price_override": null,
      "low_stock_threshold": 3,
      "active": true
    }
  ]
}
```

### Pagos, responsabilidad Andy + Erick

- `GET /payments/crypto/price`
- `POST /payments/crypto/initiate`
- `POST /payments/crypto/verify`
- `GET /payments/:orderId`

Nota de integracion: el flujo final documentado debe iniciar el pago con `orderId`. Mientras Carlos no entregue ordenes reales, el componente mantiene fallback con `items`, `shipping` y `total` para demo.

## Pendiente fuera del alcance directo de Andy

- Carlos: API real de tiendas, productos, carrito y ordenes.
- Carlos: panel vendedor de productos y pedidos.
- Erick: inventario, movimientos, alertas, verificacion on-chain, notificaciones, guias de envio, IA y admin.
- Erick + Andy: cerrar la verificacion real de pagos ETH contra Sepolia y actualizar ordenes a `paid`.

## Pendiente recomendado para reforzar Andy

- Agregar tests de auth service.
- Agregar tests de validadores de formularios.
- Agregar tests de render basico para login/register.
- Alinear `CryptoPayment` a `orderId` cuando Carlos entregue `POST /orders`.
