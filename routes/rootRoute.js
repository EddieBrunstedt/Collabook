const express = require('express');
const router = express.Router();
const passport = require('passport'), LocalStrategy = require('passport-local').Strategy;

// I wrap all controller functions using promises in this function
// to wrap promise rejections and remove the need for try/catch.
const asyncMiddleware = require('../handlers/asyncMiddleware');

//Import controllers
const rootControllers = require('../controllers/rootControllers');
const authControllers = require('../controllers/authControllers');
const bookControllers = require('../controllers/bookControllers');

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
router.get('/',
  asyncMiddleware(rootControllers.getDashboard)
);

// Get register form
router.get('/register',
  rootControllers.getRegisterForm
);

// Get followed users page
router.get('/people',
  authControllers.isLoggedIn, (req, res) => res.redirect('/people/search')
);

// Get page to see followed users/followers
router.get('/people/circle',
  authControllers.isLoggedIn,
  asyncMiddleware(rootControllers.getPeoplePageCircle)
);

// Get search people page
router.get('/people/search',
  authControllers.isLoggedIn,
  asyncMiddleware(rootControllers.getPeoplePageSearch)
);

// Post to search people page
router.post('/people/search',
  authControllers.isLoggedIn,
  asyncMiddleware(rootControllers.searchWriter)
);

// Get suggested people page
router.get('/people/suggested',
  authControllers.isLoggedIn,
  asyncMiddleware(rootControllers.getPeoplePageSuggested)
);

// Post for registering user
router.post('/register',
  rootControllers.registerValidation,
  asyncMiddleware(rootControllers.postRegisterForm)
);

// Get login page
router.get('/login',
  rootControllers.getLoginForm
);

// Post for logging in
router.post('/login',
  authControllers.passportAuthenticate
);

// Get for passport de-authentication
router.get('/logout', authControllers.logOut);

// Get Book find collaborators page
router.get('/create-book/find-collaborator',
  authControllers.isLoggedIn,
  rootControllers.getFindCollaboratorsPage
);

// Get page to find collaborator in book creation process
router.post('/create-book/find-collaborator',
  authControllers.isLoggedIn,
  asyncMiddleware(rootControllers.postFindCollaborators)
);

// Get Book creation page with selected user
router.get('/create-book/:collaboratorId',
  authControllers.isLoggedIn,
  asyncMiddleware(rootControllers.getCreateBookForm)
);

// Post for creating books
router.post('/create-book',
  authControllers.isLoggedIn,
  bookControllers.bookValidation,
  asyncMiddleware(rootControllers.createBook)
);


module.exports = router;