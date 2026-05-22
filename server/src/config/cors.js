const { FRONTEND_URL = 'http://localhost:5173' } = process.env;

const whitelist = FRONTEND_URL.split(',').map((url) => url.trim());

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id'],
  exposedHeaders: ['X-Correlation-Id'],
  maxAge: 86400,
};

module.exports = corsOptions;
