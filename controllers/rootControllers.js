const {check, validationResult} = require('express-validator/check');
const {matchedData, sanitize} = require('express-validator/filter');

const User = require('../models/userModel');
const Book = require('../models/bookModel');

// Get Dashboard
exports.getDashboard = (req, res, next) => {
  // If user is not logged in, render welcome page
  if (!req.user) {
    return res.render('welcomePage');
  }

  let blankBooks;
  let booksByUser;

  Book.findAllBooksWithUser(req.user._id)
    .then((booksByUserResponse) => {
      // Filter out books that are not started yet
      blankBooks = booksByUserResponse
        .filter(book => book.passages.length <= 0);
      //Remove books without passages
      booksByUser = booksByUserResponse
        .filter(book => book.passages.length > 0);

      return Book.findFollowedUsersBooks(req.user.following, req.user.id)
    })
    .then(followedUserBooks => res.render('dashboard', {booksByUser, blankBooks, followedUserBooks}))
    .catch(err => next(err))
};

// Get Welcome Page
exports.getWelcomePage = (req, res) => res.render('welcomePage');

//Get Followed users page
exports.getFollowedUsers = (req, res, next) => {
  User.getFollowedUsers(req.user.following)
    .then(followedUsers => res.render('followedUsers', {followedUsers}))
    .catch(err => next(err))
};

// Get login page
exports.getLoginForm = (req, res) => res.render('login');

// Post for logging in
exports.postLoginForm = (req, res) => res.redirect('/');

// Get register form
exports.getRegisterForm = (req, res) => res.render('register');

// Post for registering user
exports.postRegisterForm = (req, res, next) => {
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
    .catch(err => next(err));
};

exports.postFindCollaborators = (req, res, next) => {

  if (req.body.inputSearchString.length < 3) {
    req.flash('error_msg', 'The search criteria needs to be at least 3 characters long');
    return res.redirect('/create-book/find-collaborator');
  }

  User.fuzzySearchUserByName(req.body.inputSearchString, req.user.id)
    .then((foundUsers) => {

      let parsedFoundUsers = [];

      foundUsers.map((user) => {
        if (req.user.following.indexOf(user._id) >= 0) {
          return parsedFoundUsers.push({name: user.name, id: user.id, requesterIsFollowingUser: true})
        } else {
          return parsedFoundUsers.push({name: user.name, id: user.id})
        }
      });
      return res.render('findCollaborator', {foundUsers: parsedFoundUsers});
    })
    .catch(err => next(err));
};

// Get find collaborator page in book creation
exports.getFindCollaborators = (req, res) => res.render('findCollaborator');

// Get Book creation page
exports.getCreateBookForm = (req, res, next) => {
  User.getUserById(req.params.collaboratorId)
    .then((collaborator) => res.render('createBook', {collaborator}))
    .catch(err => next(err));
};

// Create book
exports.createBook = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.array().map(error => {
      req.flash('error_msg', error.msg);
    });
    return res.redirect('/create-book');
  }

  User.getUserById(req.body.collaboratorId)
    .then((user) => {
      if (!user) {
        req.flash('error_msg', 'Please try again');
        return res.redirect('/create-book');
      }
      const newBook = new Book({
        title: req.body.inputTitle,
        introduction: req.body.inputIntroduction,
        collaborator: user.id,
        owner: req.user.id,
        activeWriter: req.user.id,
      });
      return newBook.save()
    })
    .then((book) => {
      req.flash('success_msg', 'Your book was created successfully');
      return res.redirect('/');
    })
    .catch(err => next(err));
};

// Validator for user registration
exports.registerValidation = [
  check('inputEmail').exists().isEmail().trim().normalizeEmail({gmail_remove_dots: false}),
  check('inputName').exists().isLength({min: 4}).withMessage('Name needs to be at least 4 characters long'),
  check('inputPassword').exists().isLength({min: 4}).withMessage('Password needs to be at least 4 characters long'),
  check('inputPasswordConf', 'Your passwords don\'t match').exists()
    .custom((value, {req}) => value === req.body.inputPassword)
];