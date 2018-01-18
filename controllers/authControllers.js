exports.isLoggedIn = (req, res, next) => {
  //Is user logged in?
  if (req.isAuthenticated()) {
    return next();
  }
  //If not, send to login screen with error message.
  req.flash('error_msg', 'You must log in to view this page');
  return res.redirect('/login');
};