require('dotenv').config();

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const lessMiddleware = require('less-middleware');
const logger = require('./logger');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
//Todo: Is mongodb needed? if not; remove.
//const mongodb = require('mongodb');

const helpers = require('./helpers');

const errorHandlers = require('./handlers/errorHandlers');

const index = require('./routes/index');
const user = require('./routes/user');
const book = require('./routes/book');

const app = express();

// Get real remote IP's from clients instead of NGINX proxy ip.
app.set('trust proxy', true);

mongoose.connect(process.env.DB_HOST, {useMongoClient: true});
mongoose.Promise = global.Promise;

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

app.use(session({
  secret: 'The Beaver and the Tiger sat on a roof.',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
  //Helper functions for templates
  res.locals.h = helpers;
  //Store the User in locals for retrievability in templates
  res.locals.user = req.user || null;
  //Flash messages
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

//Todo: for testing. Delete before production
app.use((req, res, next) => {
  next();
});

app.use('/', index);
app.use('/user', user);
app.use('/book', book);


// catch 404 and forward to error handler
app.use(errorHandlers.catch404);

// error handler
app.use(errorHandlers.erroHandler);

module.exports = app;