import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: '/var/log/drivesync/error.log', level: 'error', maxsize: 10485760, maxFiles: 5 }),
    new winston.transports.File({ filename: '/var/log/drivesync/combined.log', maxsize: 10485760, maxFiles: 10 }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  }));
}
