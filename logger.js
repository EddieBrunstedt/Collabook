const {createLogger, format, transports} = require('winston');
const {combine, timestamp, label, printf} = format;


/*
Logging Levels

error: 0,
warn: 1,
info: 2,
verbose: 3,
debug: 4,
silly: 5
*/


const myFormat = printf(info => {
  return `${info.level}: ${info.message}`;
});

const logger = createLogger({
  transports: [
    new transports.File({filename: 'logs/error.log', level: 'error'}),
    new transports.File({filename: 'logs/combined.log'})
  ],
  format: format.combine(
    format.timestamp(),
    format.json(),
    format.colorize({all: true}),
  )
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.simple(),
      myFormat
    )
  }));
}

module.exports = logger;

