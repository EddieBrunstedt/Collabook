const {check, validationResult} = require('express-validator/check');
const {matchedData, sanitize} = require('express-validator/filter');
const passport = require('passport'), LocalStrategy = require('passport-local').Strategy;

const User = require('../models/user');

exports.getHomePage = (req, res) => {
  res.render('index');
};

exports.getLoginForm = (req, res) => {
  res.render('login');
};

exports.postLoginForm = (req, res) => {
  res.redirect('/')
};

exports.getRegisterForm = (req, res) => {
  res.render('register');
};

exports.postRegisterForm = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    errors.array().map(error => {
      console.log(error);
      req.flash('error_msg', error.msg);
    });
    return res.redirect('/register');
  }
  User.getUserByEmail(req.body.emailInput)
    .then(user => {
      if (user) {
        req.flash('error_msg', 'There is already an account associated with this Email address');
        return res.redirect('/register')
      }
      const newUser = new User({
        email: req.body.emailInput,
        password: req.body.passwordInput,
        name: req.body.nameInput
      });
      User.createUser(newUser);
      req.flash('success_msg', 'You are registered and can now login');
      res.redirect('/login');
    })
    .catch(err => {
      throw err;
    });

};

exports.logOut = (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/');
};

exports.passportAuthenticate = passport.authenticate('local', {
  successRedirect: '/',
  successFlash: 'You are now logged in',
  failureFlash: true,
  failureRedirect: '/login',
});

exports.registerValidation = [
  //TODO: Work out proper rules before production
  check('emailInput').exists().isEmail().trim().normalizeEmail(),
  check('nameInput').exists().isLength({min: 3}).withMessage('Name needs to be at least 3 characters long'),
  check('passwordInput').exists().isLength({min: 3}).withMessage('Password needs to be at least 3 characters long'),
  check('passwordConfInput', 'Your passwords don\'t match')
    .exists()
    .custom((value, {req}) => value === req.body.passwordInput)
];