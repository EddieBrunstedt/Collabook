require('dotenv').config();

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const lessMiddleware = require('less-middleware');
const flash = require('connect-flash');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const helpers = require('./helpers');
const errorHandlers = require('./handlers/errorHandlers');

const index = require('./routes/rootRoute');
const user = require('./routes/userRoute');
const book = require('./routes/bookRoute');

const logger = require('./logger');


const app = express();

// Get real remote IP's instead of NGINX proxy ip.
app.set('trust proxy', true);

// Stream all error > 400 to stderr
app.use(morgan('short', {
  skip: function (req, res) {
    return res.statusCode < 400
  },
  stream: process.stderr
}));

// Stream all error < 400 to stdout
app.use(morgan('short', {
  skip: function (req, res) {
    return res.statusCode >= 400
  },
  stream: process.stdout
}));

logger.log({
  level: 'info',
  message: 'Hello distributed log files!'
});

logger.log({
  level: 'warn',
  message: 'Hello distributed log files!'
});

logger.log({
  level: 'error',
  message: 'Hello distributed log files!'
});

// Connect to database
mongoose.Promise = global.Promise;
mongoose.connect(process.env.DB_HOST)
  .then(() => {
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
  })
  .catch(err => {
    throw(err);
  });

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(lessMiddleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({mongooseConnection: mongoose.connection})
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// For showing success and error messages in flash.pug
app.use(flash());

app.use((req, res, next) => {
  // Helper functions for templates
  res.locals.h = helpers;
  // Store the User in locals for easy retrievability in templates
  res.locals.user = req.user || null;
  // Flash messages
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  // To help setting corresponding class on navbar links, we set a variable to hold current Url
  res.locals.currentUrl = req.originalUrl;
  next();
});

// Routing
app.use('/', index);
app.use('/user', user);
app.use('/book', book);

// catch 404 and forward to error handler
app.use(errorHandlers.catch404);
// error handler
app.use(errorHandlers.erroHandler);

module.exports = app;