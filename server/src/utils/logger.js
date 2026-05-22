const { createLogger, format, transports } = require('winston');

const { LOG_LEVEL = 'info', NODE_ENV = 'development' } = process.env;

const logger = createLogger({
  level: LOG_LEVEL,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    NODE_ENV === 'development'
      ? format.combine(format.colorize(), format.simple())
      : format.json()
  ),
  transports: [new transports.Console()],
});

module.exports = logger;
