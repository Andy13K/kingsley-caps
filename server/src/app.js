require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { generalLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const logger = require('./utils/logger');
const { sequelize } = require('./models');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(generalLimiter);

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/payments', paymentRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: { message: 'Ruta no encontrada' } });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (!err.isOperational) {
    logger.error({ message: err.message, stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.isOperational ? err.message : 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

const PORT = process.env.AUTH_PORT || 3001;

if (require.main === module) {
  const start = async () => {
    try {
      await sequelize.authenticate();
      logger.info('Conexión a PostgreSQL establecida');
      await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
      logger.info('Modelos sincronizados');
      app.listen(PORT, () => logger.info(`Auth Service corriendo en puerto ${PORT}`));
    } catch (err) {
      logger.error('Error al iniciar el servidor:', err);
      process.exit(1);
    }
  };
  start();
}

module.exports = app;
