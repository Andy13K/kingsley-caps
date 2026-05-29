/* ============================================================
   KINGSLEY CAPS — Presentation Engine v2
   ============================================================ */

// ── State ─────────────────────────────────────────────────────
let current = 0;
const TOTAL = 12;

// ── Term dictionary ───────────────────────────────────────────
const TERMS = {
  'react': {
    name: 'React 18', type: 'Librería Frontend',
    what: 'Librería de JavaScript para construir interfaces de usuario mediante componentes reutilizables.',
    use: 'Es el framework principal del frontend de Kingsley Caps.',
    does: 'Renderiza todas las páginas: catálogo, carrito, checkout cripto, panel del vendedor y dashboard.'
  },
  'vite': {
    name: 'Vite 5', type: 'Build Tool',
    what: 'Herramienta de construcción moderna para proyectos frontend. Usa ES modules nativos.',
    use: 'Reemplaza webpack para compilar y servir el frontend.',
    does: 'Compila el código React en un bundle optimizado para producción y provee Hot Module Replacement en desarrollo.'
  },
  'tailwind': {
    name: 'Tailwind CSS 3', type: 'Framework CSS',
    what: 'Framework CSS utility-first que permite estilizar con clases predefinidas directamente en el HTML.',
    use: 'Sistema de diseño principal del frontend.',
    does: 'Define los colores de marca (gold, charcoal), tipografía Outfit, y todos los componentes visuales de la app.'
  },
  'nodejs': {
    name: 'Node.js 20 LTS', type: 'Runtime Backend',
    what: 'Entorno de ejecución de JavaScript del lado del servidor, basado en el motor V8 de Chrome.',
    use: 'Runtime del servidor backend (puerto 3000) y del servicio de autenticación (puerto 3001).',
    does: 'Ejecuta toda la lógica de negocio: productos, órdenes, pagos, inventario y autenticación.'
  },
  'express': {
    name: 'Express.js', type: 'Framework Backend',
    what: 'Framework web minimalista para Node.js que facilita la creación de APIs REST.',
    use: 'Framework del backend API de Kingsley Caps.',
    does: 'Define las rutas, middleware de seguridad, validación Joi, rate limiting y manejo de errores global.'
  },
  'sequelize': {
    name: 'Sequelize 6', type: 'ORM',
    what: 'Object-Relational Mapper para Node.js. Traduce objetos JavaScript a queries SQL.',
    use: 'Capa de acceso a datos de toda la aplicación.',
    does: 'Define los 14 modelos (User, Store, Product, Order, PaymentTransaction...), ejecuta migraciones versionadas y previene SQL injection con queries parametrizadas automáticamente.'
  },
  'postgresql': {
    name: 'PostgreSQL 16', type: 'Base de datos relacional',
    what: 'Sistema de gestión de bases de datos relacional de código abierto, conocido por su robustez y cumplimiento de estándares SQL.',
    use: 'Base de datos principal de todo el sistema.',
    does: 'Almacena los 14 modelos con ACID transactions, garantiza stock ≥ 0 con CHECK constraints y mantiene el aislamiento multi-tenant mediante store_id.'
  },
  'redis': {
    name: 'Redis 7', type: 'Base de datos en memoria',
    what: 'Almacén de datos en memoria de tipo clave-valor, extremadamente rápido.',
    use: 'Cache y almacenamiento de sesiones del sistema.',
    does: 'Gestiona el rate limiting distribuido entre instancias y acelera consultas frecuentes como tasas de cambio ETH/GTQ.'
  },
  'nginx': {
    name: 'Nginx Alpine', type: 'Servidor web / Proxy',
    what: 'Servidor web de alto rendimiento usado frecuentemente como proxy inverso y balanceador de carga.',
    use: 'Punto de entrada único del sistema en el puerto 80.',
    does: 'Enruta /api/auth/* al servicio de auth (3001), /api/ai/* al motor IA (8000), /api/* al backend (3000) y /* al frontend (80). También aplica rate limiting global.'
  },
  'docker': {
    name: 'Docker Compose', type: 'Contenedorización',
    what: 'Plataforma para desarrollar, empaquetar y ejecutar aplicaciones en contenedores aislados.',
    use: 'Infraestructura completa del sistema Kingsley Caps.',
    does: 'Orquesta los 7 servicios (nginx, frontend, auth, backend, ai-engine, postgres, redis) en una red bridge interna, con health checks y restart automático.'
  },
  'jwt': {
    name: 'JSON Web Token', type: 'Estándar de autenticación',
    what: 'Estándar abierto (RFC 7519) para transmitir información de forma segura entre partes como un objeto JSON firmado criptográficamente.',
    use: 'Sistema de autenticación stateless de Kingsley Caps.',
    does: 'El Access Token (15 min) autentica cada request. El Refresh Token (7 días) permite renovar sesiones. El store_id dentro del token garantiza el aislamiento multi-tenant.'
  },
  'bcrypt': {
    name: 'bcrypt', type: 'Función de hash para contraseñas',
    what: 'Función de hash diseñada específicamente para contraseñas. Es intencionalmente lenta y usa salt aleatorio para resistir ataques.',
    use: 'Cifrado de todas las contraseñas de usuarios.',
    does: 'Hashea contraseñas con salt rounds = 12 antes de guardarlas en BD. Hace que romper una contraseña por fuerza bruta tome millones de años en hardware moderno.'
  },
  'ethers': {
    name: 'ethers.js 6.9', type: 'Librería Web3',
    what: 'Librería completa para interactuar con la blockchain de Ethereum: wallets, contratos, transacciones.',
    use: 'Integración blockchain del sistema de pagos.',
    does: 'Verifica on-chain que la transacción ETH enviada por el cliente llegó a la wallet correcta del vendedor, con el monto correcto y las confirmaciones de bloque requeridas.'
  },
  'metamask': {
    name: 'MetaMask', type: 'Wallet Ethereum',
    what: 'Extensión de navegador (Chrome/Firefox) que funciona como wallet de criptomonedas Ethereum.',
    use: 'Método de pago principal del checkout cripto.',
    does: 'El cliente conecta su MetaMask, confirma la transacción ETH en la UI, y el monto va directamente a la wallet del vendedor sin pasar por la plataforma.'
  },
  'ethereum': {
    name: 'Ethereum / Sepolia', type: 'Blockchain',
    what: 'Red blockchain descentralizada que soporta contratos inteligentes. Sepolia es su red de pruebas oficial.',
    use: 'Red blockchain usada para el sistema de pagos cripto.',
    does: 'Registra de forma inmutable cada transacción de pago. El backend verifica los pagos consultando directamente la blockchain pública, sin posibilidad de falsificación.'
  },
  'fastapi': {
    name: 'FastAPI', type: 'Framework Python',
    what: 'Framework web moderno para Python, basado en anotaciones de tipo. Genera documentación automática.',
    use: 'Framework del motor de Inteligencia Artificial.',
    does: 'Expone los endpoints /api/ai/predict-demand y /api/ai/suggest-price que el backend Node.js consume para mostrar predicciones de demanda y sugerencias de precio al vendedor.'
  },
  'multitenant': {
    name: 'Multi-tenancy', type: 'Patrón arquitectónico',
    what: 'Arquitectura de software donde una única instancia de la aplicación sirve a múltiples clientes (tenants), manteniendo sus datos completamente aislados.',
    use: 'Modelo de negocio SaaS de Kingsley Caps.',
    does: 'Cada tienda (store_id) en la BD es un tenant aislado. El store_id viene del JWT firmado — es imposible que un vendedor acceda a datos de otra tienda aunque manipule las peticiones HTTP.'
  },
  'stride': {
    name: 'STRIDE', type: 'Modelo de amenazas',
    what: 'Framework de análisis de seguridad que categoriza amenazas en 6 tipos: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege.',
    use: 'Marco de seguridad aplicado al diseño de Kingsley Caps.',
    does: 'Cada amenaza tiene controles preventivos (JWT, bcrypt, Joi, RBAC), detectivos (Winston logs, audit_log) y correctivos (revocación de tokens, suspensión de cuentas).'
  },
  'joi': {
    name: 'Joi 17', type: 'Librería de validación',
    what: 'Librería de validación de esquemas para JavaScript. Permite definir reglas declarativas para datos de entrada.',
    use: 'Validación de todos los endpoints del backend.',
    does: 'Cada ruta de la API tiene un schema Joi que valida el body/params antes de llegar al controlador. Previene SQL injection y datos malformados desde el borde del sistema.'
  },
  'helmet': {
    name: 'Helmet.js', type: 'Middleware de seguridad',
    what: 'Middleware Express que configura automáticamente headers HTTP de seguridad.',
    use: 'Capa de seguridad HTTP del backend.',
    does: 'Activa HSTS (fuerza HTTPS), Content Security Policy (previene XSS), X-Frame-Options: DENY (previene clickjacking) y X-Content-Type-Options: nosniff.'
  },
  'winston': {
    name: 'Winston', type: 'Librería de logging',
    what: 'Librería de logging para Node.js que soporta múltiples transportes y formatos estructurados.',
    use: 'Sistema de observabilidad del backend.',
    does: 'Genera logs JSON estructurados con correlationId único por request, permitiendo rastrear una petición de punta a punta. Registra todos los eventos críticos: logins, cambios de estado de órdenes, errores.'
  },
  'acid': {
    name: 'ACID', type: 'Propiedades de BD',
    what: 'Atomicity, Consistency, Isolation, Durability. Garantías que aseguran que las transacciones de BD sean procesadas de forma confiable.',
    use: 'Propiedad crítica requerida para pagos e inventario.',
    does: 'Garantiza que el descuento de stock y la creación de la orden sean atómicos: si falla cualquier parte, todo hace rollback. Imposible quedar con stock descontado sin orden confirmada.'
  },
  'uuid': {
    name: 'UUID v4', type: 'Identificador único',
    what: 'Identificador Universalmente Único de 128 bits generado aleatoriamente. Formato: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx.',
    use: 'Clave primaria de todas las tablas de Kingsley Caps.',
    does: 'Reemplaza los auto-increment (1, 2, 3...) que son predecibles. Con UUIDs no se pueden enumerar recursos ni adivinar IDs de otras tiendas.'
  },
  'clean-architecture': {
    name: 'Clean Architecture', type: 'Patrón arquitectónico',
    what: 'Patrón de diseño que separa la lógica de negocio de los detalles de infraestructura en capas concéntricas.',
    use: 'Patrón base de la arquitectura del backend.',
    does: 'Toda la lógica de negocio vive en Services. Los Controllers solo orquestan. Los Models solo persisten. Esto hace el código testeable y mantenible independientemente de frameworks o BD.'
  },
  'rpc': {
    name: 'RPC Endpoint', type: 'API Blockchain',
    what: 'Remote Procedure Call. En Ethereum, un nodo RPC permite consultar el estado de la blockchain sin correr un nodo propio.',
    use: 'Conexión de Kingsley Caps a la blockchain de Ethereum.',
    does: 'ethers.js usa la URL RPC de Sepolia para verificar transacciones: obtener el receipt de la TX, contar confirmaciones de bloque y validar el monto recibido.'
  },
  'rate-limit': {
    name: 'Rate Limiting', type: 'Control de tráfico',
    what: 'Técnica que limita cuántas peticiones puede hacer un cliente en un período de tiempo, previniendo abuso.',
    use: 'Protección contra fuerza bruta y DDoS en Kingsley Caps.',
    does: 'Auth: máx 5 intentos/15min por IP+email. Checkout: 10 req/60s. General: 100 req/60s. Configurado tanto en Nginx como en Express con express-rate-limit.'
  },
  'rbac': {
    name: 'RBAC', type: 'Control de acceso',
    what: 'Role-Based Access Control. Sistema de autorización donde los permisos se asignan a roles, no a usuarios individuales.',
    use: 'Sistema de autorización de Kingsley Caps.',
    does: 'Define 4 roles: superadmin, vendor, staff, customer. El middleware authorize.js verifica que el rol del JWT tenga permiso para cada endpoint antes de ejecutar el controlador.'
  },
  'cors': {
    name: 'CORS', type: 'Política de seguridad web',
    what: 'Cross-Origin Resource Sharing. Mecanismo que controla qué dominios pueden hacer peticiones a una API.',
    use: 'Protección de la API de Kingsley Caps.',
    does: 'Solo los dominios en la whitelist (frontend de Kingsley) pueden hacer peticiones a la API. Previene que sitios maliciosos llamen a la API usando las cookies/tokens del usuario.'
  }
};

// ── Tooltip engine ────────────────────────────────────────────
let tooltipVisible = false;

function buildTooltip() {
  const el = document.getElementById('tooltip');

  document.addEventListener('click', e => {
    const term = e.target.closest('.term');
    if (term) {
      e.stopPropagation();
      showTooltip(term, term.dataset.term);
      return;
    }
    if (!el.contains(e.target)) hideTooltip();
  });

  document.getElementById('tt-close').addEventListener('click', hideTooltip);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') hideTooltip();
  });
}

function showTooltip(anchor, key) {
  const data = TERMS[key];
  if (!data) return;

  const el = document.getElementById('tooltip');
  document.getElementById('tt-name').textContent = data.name;
  document.getElementById('tt-type').textContent = data.type;
  document.getElementById('tt-what').textContent = data.what;
  document.getElementById('tt-use').textContent  = data.use;
  document.getElementById('tt-does').textContent = data.does;

  el.classList.remove('show');

  // Position
  const rect = anchor.getBoundingClientRect();
  const tw   = 280, th = 200;
  let left   = rect.left;
  let top    = rect.bottom + 8;

  if (left + tw > window.innerWidth - 16) left = window.innerWidth - tw - 16;
  if (top  + th > window.innerHeight - 16) top = rect.top - th - 8;
  if (left < 8) left = 8;

  el.style.left = left + 'px';
  el.style.top  = top  + 'px';

  void el.offsetWidth;
  el.classList.add('show');
  tooltipVisible = true;
}

function hideTooltip() {
  document.getElementById('tooltip').classList.remove('show');
  tooltipVisible = false;
}

// ── Navigation ────────────────────────────────────────────────
function goTo(index, dir = 'next') {
  const all   = document.querySelectorAll('.slide');
  const dts   = document.querySelectorAll('.dot');
  if (index < 0 || index >= TOTAL) return;
  hideTooltip();

  const prev = current;
  current = index;

  all[prev].classList.remove('active');
  all[prev].classList.add(dir === 'next' ? 'exit-left' : 'exit-right');

  all[current].classList.remove('exit-left','exit-right');
  all[current].classList.add(dir === 'next' ? 'enter-right' : 'enter-left');
  void all[current].offsetWidth;

  requestAnimationFrame(() => {
    all[current].classList.remove('enter-right','enter-left');
    all[current].classList.add('active');
    setTimeout(() => all[prev].classList.remove('exit-left','exit-right'), 700);
  });

  dts.forEach((d,i) => d.classList.toggle('active', i === current));
  document.getElementById('slide-counter').textContent =
    `${String(current+1).padStart(2,'0')} / ${String(TOTAL).padStart(2,'0')}`;
  document.getElementById('progress-bar').style.width =
    `${((current+1)/TOTAL)*100}%`;

  onSlideEnter(current);
}

const next = () => goTo(current+1,'next');
const prev = () => goTo(current-1,'prev');

// ── Slide-specific effects ─────────────────────────────────────
function onSlideEnter(i) {
  if (i === 0) scramble();
  if (i === 4) { runCounters(); animateBars(); }
}

function scramble() {
  const el = document.getElementById('scramble-kc');
  if (!el) return;
  const target = 'KINGSLEY';
  const chars  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let iter = 0;
  const iv = setInterval(() => {
    el.textContent = target.split('').map((c,i) =>
      i < iter ? target[i] : chars[Math.floor(Math.random()*chars.length)]
    ).join('');
    if (iter >= target.length) clearInterval(iv);
    iter += 0.5;
  }, 45);
}

function runCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const suf    = el.dataset.suffix || '';
    const dur    = 1300;
    const t0     = performance.now();
    const tick = now => {
      const t = Math.min((now-t0)/dur, 1);
      const e = t === 1 ? 1 : 1 - Math.pow(2,-10*t);
      el.textContent = (Number.isInteger(target) ? Math.round(e*target) : (e*target).toFixed(1)) + suf;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function animateBars() {
  document.querySelectorAll('.metric-fill').forEach(b => {
    if (b.dataset.width) b.style.width = b.dataset.width + '%';
  });
}

// ── Particle canvas ───────────────────────────────────────────
function initCanvas() {
  const canvas = document.getElementById('canvas-bg');
  const ctx    = canvas.getContext('2d');
  let W, H, pts;

  const resize = () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight; };

  class P {
    constructor() { this.reset(true); }
    reset(init) {
      this.x  = Math.random() * (W || 1200);
      this.y  = init ? Math.random() * (H || 800) : (H||800) + 10;
      this.vx = (Math.random()-.5)*.12;
      this.vy = -(Math.random()*.25+.08);
      this.r  = Math.random()*1.1+.2;
      this.a  = 0; this.ma = Math.random()*.25+.04;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      this.a = Math.min(this.a+.004, this.ma);
      if (this.y < -10) this.reset();
    }
    draw() {
      ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(216,173,91,${this.a})`; ctx.fill();
    }
  }

  resize();
  pts = Array.from({length:70}, () => new P());
  addEventListener('resize', resize);

  (function loop() {
    ctx.clearRect(0,0,W,H);
    pts.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  })();
}

// ── Spotlight on cards ────────────────────────────────────────
function initSpotlight() {
  document.addEventListener('mousemove', e => {
    document.querySelectorAll('.card').forEach(c => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', ((e.clientX-r.left)/r.width*100)+'%');
      c.style.setProperty('--my', ((e.clientY-r.top )/r.height*100)+'%');
    });
  });
}

// ── Keyboard ──────────────────────────────────────────────────
function initKeyboard() {
  document.addEventListener('keydown', e => {
    if (tooltipVisible && e.key === 'Escape') { hideTooltip(); return; }
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
    if (e.key === 'Home')       goTo(0,'prev');
    if (e.key === 'End')        goTo(TOTAL-1,'next');
    if (e.key === 'f' || e.key === 'F') toggleFS();
  });
}

// ── Touch ─────────────────────────────────────────────────────
function initTouch() {
  let sx = 0;
  document.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, {passive:true});
  document.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
  });
}

function toggleFS() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
}

// ── Build dots ────────────────────────────────────────────────
function buildDots() {
  const c = document.getElementById('slide-dots');
  for (let i=0; i<TOTAL; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i===0?' active':'');
    d.addEventListener('click', () => goTo(i, i>current?'next':'prev'));
    c.appendChild(d);
  }
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildDots();
  buildTooltip();
  initCanvas();
  initSpotlight();
  initKeyboard();
  initTouch();

  document.querySelectorAll('.slide')[0].classList.add('active');
  document.getElementById('slide-counter').textContent = `01 / ${String(TOTAL).padStart(2,'0')}`;
  document.getElementById('progress-bar').style.width = `${100/TOTAL}%`;
  document.getElementById('btn-prev').addEventListener('click', prev);
  document.getElementById('btn-next').addEventListener('click', next);
  document.getElementById('btn-fs').addEventListener('click', toggleFS);

  scramble();
});
