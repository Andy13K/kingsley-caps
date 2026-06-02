const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const app = require('./app');
const logger = require('./utils/logger');
const { connectDatabase, sequelize } = require('./config/database');
require('./models');

const { PORT = 3000 } = process.env;

const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      logger.info(`Servidor escuchando en puerto ${PORT}`);
    });
  } catch (err) {
    logger.error('No se pudo iniciar el servidor', { error: err.message });
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.info(`Senal ${signal} recibida, cerrando...`);
  try {
    await sequelize.close();
  } catch (err) {
    logger.error('Error cerrando conexion BD', { error: err.message });
  }
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
