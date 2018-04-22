const passport = require('passport'), LocalStrategy = require('passport-local').Strategy;

// Check if user is logged in
exports.isLoggedIn = (req, res, next) => {
  // Is user logged in?
  if (req.isAuthenticated()) {
    return next();
  }
  // If not, send to login screen with error message.
  req.flash('error_msg', 'You must log in to view this page');
  return res.redirect('/login');
};

// Passport authentication
exports.passportAuthenticate = passport.authenticate('local', {
  successRedirect: '/',
  failureFlash: true,
  failureRedirect: '/login',
});

// Passport de-authentication
exports.logOut = (req, res) => {
  req.logout();
  req.flash('success_msg', 'You have been successfully logged out');
  res.redirect('/login');
};

// Check if logged in user is owner or collaborator on book
exports.isUserPartOfBook = (req, res) => {
  if (req.params.bookId) {
    
  }
};