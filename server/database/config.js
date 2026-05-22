require('dotenv').config();

const isRemoteHost = (host = '') =>
  host.includes('supabase.co') || host.includes('amazonaws.com') || host.includes('pooler.supabase.com');

const isRemoteUrl = (url = '') => url.includes('supabase.co') || url.includes('amazonaws.com');

const baseConfig = {
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kingsley_caps_dev',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  dialect: 'postgres',
  ...(isRemoteHost(process.env.DB_HOST) && {
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  }),
};

const config = process.env.DATABASE_URL
  ? {
      url: process.env.DATABASE_URL,
      dialect: 'postgres',
      ...(isRemoteUrl(process.env.DATABASE_URL) && {
        dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
      }),
    }
  : baseConfig;

module.exports = {
  development: config,
  test: process.env.DATABASE_URL ? config : { ...baseConfig, database: `${baseConfig.database}_test` },
  production: config,
};
