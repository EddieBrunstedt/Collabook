const express = require('express');
const router = express.Router();
const passport = require('passport'), LocalStrategy = require('passport-local').Strategy;

//Import controllers
const rootControllers = require('../controllers/rootControllers');
const authControllers = require('../controllers/authControllers');
const bookControllers = require('../controllers/bookControllers');
const userControllers = require('../controllers/userControllers');

const User = require('../models/userModel');

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
router.get('/', rootControllers.getDashboard);

// Get welcome page
// Todo: Not needed?
// router.get('/welcome', rootControllers.getWelcomePage);

// Get register form
router.get('/register', rootControllers.getRegisterForm);

// Get followed users page
router.get('/followed-users', authControllers.isLoggedIn, rootControllers.getFollowedUsers);

// Post for registering user
router.post('/register', rootControllers.registerValidation, rootControllers.postRegisterForm);

// Get login page
router.get('/login', rootControllers.getLoginForm);

// Post for logging in
router.post('/login', authControllers.passportAuthenticate);

// Get for passport de-authentication
router.get('/logout', authControllers.logOut);

// Get Book creation page
router.get('/create-book/find-collaborator', authControllers.isLoggedIn, rootControllers.getFindCollaborators);

router.post('/create-book/find-collaborator', authControllers.isLoggedIn, rootControllers.postFindCollaborators);

// Get Book creation page
router.get('/create-book/:collaboratorId', authControllers.isLoggedIn, rootControllers.getCreateBookForm);

// Post for creating books
router.post('/create-book', authControllers.isLoggedIn, bookControllers.bookValidation, rootControllers.createBook);


module.exports = router;