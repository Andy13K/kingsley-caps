const jwtConfig = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_in_prod',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_prod',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
};

module.exports = jwtConfig;
