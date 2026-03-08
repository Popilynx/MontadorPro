const winston = require('winston');
const path = require('path');

// Formato padrão
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`
  )
);

const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    // Console
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
    // Arquivo para erros gerais
    new winston.transports.File({ filename: path.join(__dirname, '../../logs/error.log'), level: 'error' }),
    // Arquivo para todas as transações da API
    new winston.transports.File({ filename: path.join(__dirname, '../../logs/combined.log') }),
    // Arquivo exclusivo para logs Críticos Financeiros/Convites
    new winston.transports.File({ filename: path.join(__dirname, '../../logs/transaction_critical.log'), level: 'info' })
  ],
});

module.exports = logger;
