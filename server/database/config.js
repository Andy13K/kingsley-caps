require('dotenv').config();

const baseConfig = {
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kingsley_caps_dev',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  dialect: 'postgres',
};

module.exports = {
  development: baseConfig,
  test: { ...baseConfig, database: `${baseConfig.database}_test` },
  production: baseConfig,
};
