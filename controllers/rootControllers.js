const {check, validationResult} = require('express-validator/check');
const {matchedData, sanitize} = require('express-validator/filter');
const passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
const slug = require('slug');

const logger = require('../logger');

const User = require('../models/user');
const Book = require('../models/book');

exports.getDashboard = (req, res, next) => {
  if (req.user) {
    Book.findAllUserBooks(req.user._id)
      .then((allUserBooks) => {
        let notStartedBooks = allUserBooks
          .filter(book => !book.passages[0]);
        let parsed_allUserBooks = allUserBooks
        //Remove books without passages
          .filter(book => book.passages[0])
          //Sort array after lastPassageStamp in book
          .sort((a, b) => {
            if (a.lastPassageStamp < b.lastPassageStamp) {
              return 1;
            }
            if (b.lastPassageStamp < a.lastPassageStamp) {
              return -1;
            }
            return 0;
          });
        res.render('dashboard',
          {
            allUserBooks: parsed_allUserBooks,
            notStartedBooks
          })
      })
      .catch((err) => {
        next(err);
      });
  } else {
    res.render('guestStartPage');
  }
};

//Todo: Remove this
exports.getTestPage = (req, res, next) => {
  res.render('test', {slug: slug('this is a test of things...')})
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
      req.flash('error_msg', error.msg);
    });
    return res.redirect('/register');
  }
  User.getUserByEmail(req.body.inputEmail)
    .then(user => {
      if (user) {
        req.flash('error_msg', 'There is already an account associated with this Email address');
        return res.redirect('/register')
      }
      const newUser = new User({
        email: req.body.inputEmail,
        password: req.body.inputPassword,
        name: req.body.inputName
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
  req.flash('success_msg', 'You have been successfully logged out');
  res.redirect('/');
};

exports.getCreateBookForm = (req, res) => {
  res.render('createBook');
};

exports.postCreateBookForm = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    errors.array().map(error => {
      req.flash('error_msg', error.msg);
    });
    return res.redirect('/create-book');
  }

  User.getUserByEmail(req.body.inputCollaborator)
    .then((user) => {
      if (!user) {
        req.flash('error_msg', 'There is no user associated with the Email address ' + req.body.inputcollaborator);
        res.redirect('/create-book');
      }

      const newBook = new Book({
        title: req.body.inputTitle,
        introduction: req.body.inputIntroduction,
        collaborator: user.id,
        owner: req.user.id,
        activeWriter: req.user.id,
      });

      newBook.save()
        .then((returnedValue) => {
          //Todo: Add Book ID in log
          logger.info(`BOOK CREATED: owner: ${req.user.id}/${req.user.name} collaborator: ${user.id}/${user.name}`);
          req.flash('success_msg', 'Your book was created successfully');
          res.redirect('/');
        })
        .catch((err) => {
          next(err);
        })
    })
    .catch((err) => {
        next(err);
      }
    );
};

exports.passportAuthenticate = passport.authenticate('local', {
  successRedirect: '/',
  failureFlash: true,
  failureRedirect: '/login',
});

exports.registerValidation = [
  //Todo: Work out proper rules before production
  check('inputEmail').exists().isEmail().trim().normalizeEmail({gmail_remove_dots: false}),
  check('inputName').exists().isLength({min: 3}).withMessage('Name needs to be at least 3 characters long'),
  check('inputPassword').exists().isLength({min: 3}).withMessage('Password needs to be at least 3 characters long'),
  check('inputPasswordConf', 'Your passwords don\'t match').exists()
    .custom((value, {req}) => value === req.body.inputPassword)
];

exports.createBookValidation = [
  check('inputTitle').exists().trim().isLength({
    min: 1,
    max: 100
  }).withMessage('Your book title must be between 1 and 100 characters long')
];
