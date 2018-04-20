const express = require('express');
const router = express.Router();
const passport = require('passport'), LocalStrategy = require('passport-local').Strategy;

//Import controllers
const rootControllers = require('../controllers/rootControllers');
const authControllers = require('../controllers/authControllers');

const User = require('../models/user');

//---------------------------------------------------------//

passport.use(new LocalStrategy({
    usernameField: 'inputEmail',
    passwordField: 'inputPassword'
  },
  (email, password, done) => {
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
            throw err;
          });
      })
      .catch(err => {
        throw err;
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
      throw err;
    })
});

router.get('/', rootControllers.getHomePage);

router.get('/test', rootControllers.getTestPage);

router.get('/register', rootControllers.getRegisterForm);

router.post('/register', rootControllers.registerValidation, rootControllers.postRegisterForm);

router.get('/login', rootControllers.getLoginForm);

router.post('/login', rootControllers.passportAuthenticate, rootControllers.postLoginForm);

router.get('/logout', rootControllers.logOut);

router.get('/create-book', rootControllers.getCreateBookForm);

router.post('/create-book', rootControllers.createBookValidation, rootControllers.postCreateBookForm);

router.get('/dashboard', authControllers.isLoggedIn, rootControllers.getDashboard);

module.exports = router;