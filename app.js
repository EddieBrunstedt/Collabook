const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const lessMiddleware = require('less-middleware');
const logger = require('./logger');
const helpers = require('./helpers');

const errorHandlers = require('./handlers/errorHandlers');

const index = require('./routes/index');
const users = require('./routes/users');

const app = express();

// Get real remote IP's from clients instead of NGINX proxy ip.
app.set('trust proxy', true);

//---------------------- LOGGING --------------------------//

//Todo: Change 'dev' to 'combine' before production
//Stream all error > 400 to stderr
app.use(morgan('dev', {
  skip: function (req, res) {
    return res.statusCode < 400
  },
  stream: process.stderr
}));

//Todo: Change 'dev' to 'combine' before production
//Stream all error < 400 to stdout
app.use(morgan('dev', {
  skip: function (req, res) {
    return res.statusCode >= 400
  },
  stream: process.stdout
}));

//---------------------------------------------------------//

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(lessMiddleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.h = helpers;
  next();
});

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(errorHandlers.catch404);

// error handler
app.use(errorHandlers.erroHandler);

module.exports = app;