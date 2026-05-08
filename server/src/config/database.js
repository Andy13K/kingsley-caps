const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'kingsley_caps_dev',
  DB_USER = 'postgres',
  DB_PASSWORD = '',
  NODE_ENV = 'development',
} = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'postgres',
  logging: NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    underscored: true,
    timestamps: true,
  },
});

const connectDatabase = async () => {
  await sequelize.authenticate();
  logger.info('Conexion a PostgreSQL establecida');
};

module.exports = { sequelize, connectDatabase };
