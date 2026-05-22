const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const isRemoteHost = (host = '') =>
  host.includes('supabase.co') || host.includes('amazonaws.com') || host.includes('pooler.supabase.com');

const isRemoteUrl = (url = '') => url.includes('supabase.co') || url.includes('amazonaws.com');

const commonOptions = {
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
};

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      ...commonOptions,
      dialectOptions: isRemoteUrl(process.env.DATABASE_URL)
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
    })
  : new Sequelize({
      ...commonOptions,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'kingsley_caps_dev',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      dialectOptions: isRemoteHost(process.env.DB_HOST)
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
    });

const connectDatabase = async () => {
  await sequelize.authenticate();
  logger.info('Conexion a PostgreSQL establecida');
};

// Soporta ambos patrones: const seq = require(...) y const { sequelize } = require(...)
module.exports = sequelize;
module.exports.sequelize = sequelize;
module.exports.connectDatabase = connectDatabase;
