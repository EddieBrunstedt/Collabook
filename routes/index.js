const express = require('express');
const router = express.Router();
const passport = require('passport'), LocalStrategy = require('passport-local').Strategy;

//Import controllers
const rootControllers = require('../controllers/rootControllers');
const authControllers = require('../controllers/authControllers');

const User = require('../models/user');

passport.use(new LocalStrategy({
    usernameField: 'inputEmail',
    passwordField: 'inputPassword'
  }, (email, password, done) => {
    User.getUserByEmail(email)
      .then((user) => {
        if (!user) {
          return done(null, false, {message: 'Unknown User'});
        }
        User.comparePassword(password, user.password)
          .then((isMatch) => {
            if (!isMatch) {
              return done(null, false, {message: 'Invalid password'});
            }
            return done(null, user);
          })
          .catch((err) => {
            next(err);
          });
      })
      .catch(err => {
        next(err);
      })
  }
));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  User.getUserById(id)
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      next(err);
    })
});

// Get users own dashboard
// Todo: Add correct checking for correct user
router.get('/', authControllers.isLoggedIn, rootControllers.getDashboard);

// Test Get - page for debugging
// Todo: Remove before production
router.get('/test', rootControllers.getTestPage);

// Get register form
router.get('/register', rootControllers.getRegisterForm);

// Post for registering user
router.post('/register', rootControllers.registerValidation, rootControllers.postRegisterForm);

// Get login page
router.get('/login', rootControllers.getLoginForm);

// Post for logging in
router.post('/login', rootControllers.passportAuthenticate, rootControllers.postLoginForm);

// Get for passport de-authentication
router.get('/logout', rootControllers.logOut);

// Get Book creation page
router.get('/create-book', authControllers.isLoggedIn, rootControllers.getCreateBookForm);

// Post for creating books
router.post('/create-book', authControllers.isLoggedIn, rootControllers.createBookValidation, rootControllers.postCreateBookForm);

module.exports = router;