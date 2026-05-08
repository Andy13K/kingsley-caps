const {
  JWT_ACCESS_SECRET = 'change_me_access',
  JWT_REFRESH_SECRET = 'change_me_refresh',
  JWT_ACCESS_EXPIRES = '15m',
  JWT_REFRESH_EXPIRES = '7d',
} = process.env;

module.exports = {
  accessSecret: JWT_ACCESS_SECRET,
  refreshSecret: JWT_REFRESH_SECRET,
  accessExpires: JWT_ACCESS_EXPIRES,
  refreshExpires: JWT_REFRESH_EXPIRES,
};
