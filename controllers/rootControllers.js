const {check, validationResult} = require('express-validator/check');

const User = require('../models/userModel');
const Book = require('../models/bookModel');


// Get Dashboard
exports.getDashboard = async (req, res) => {
  // If user is not logged in, render welcome page
  if (!req.user) {
    return res.render('welcomePage');
  }
  const booksByUserResponse = await Book.findAllBooksWithUser(req.user._id);
  // Filter out books that are not started yet
  const blankBooks = booksByUserResponse
    .filter(book => book.passages.length <= 0);
  //Remove books without passages
  const booksByUser = booksByUserResponse
    .filter(book => book.passages.length > 0);
  const followedUserBooks = await Book.findFollowedUsersBooks(req.user.following, req.user.id);
  res.render('dashboard', {booksByUser, blankBooks, followedUserBooks});
};

// Get Welcome Page
exports.getWelcomePage = (req, res) => res.render('welcomePage');

//Get Followed users page
exports.getFollowedUsers = async (req, res) => {
  const followedUsers = await User.getFollowedUsers(req.user.following);
  res.render('followedUsers', {followedUsers});
};

// Get login page
exports.getLoginForm = (req, res) => res.render('login');

// Get register form
exports.getRegisterForm = (req, res) => res.render('register');

// Post for registering user
exports.postRegisterForm = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.array().map(error => {
      req.flash('error_msg', error.msg);
    });
    return res.redirect('/register');
  }
  const user = await User.getUserByEmail(req.body.inputEmail);
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
};

exports.postFindCollaborators = async (req, res) => {

  if (req.body.inputSearchString.length < 3) {
    req.flash('error_msg', 'The search criteria needs to be at least 3 characters long');
    return res.redirect('/create-book/find-collaborator');
  }

  const foundUsers = await User.fuzzySearchUserByName(req.body.inputSearchString, req.user.id);

  let parsedFoundUsers = [];

  foundUsers.map((user) => {
    if (req.user.following.indexOf(user._id) >= 0) {
      return parsedFoundUsers.push({name: user.name, id: user.id, requesterIsFollowingUser: true})
    } else {
      return parsedFoundUsers.push({name: user.name, id: user.id})
    }
  });

  res.render('findCollaborator', {foundUsers: parsedFoundUsers});

};

// Get find collaborator page in book creation
exports.getFindCollaboratorsPage = (req, res) => res.render('findCollaborator');

// Get Book creation page
exports.getCreateBookForm = async (req, res) => {
  const collaborator = await User.getUserById(req.params.collaboratorId);
  res.render('createBook', {collaborator});
};

// Create book
exports.createBook = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    errors.array().map(error => {
      req.flash('error_msg', error.msg);
    });
    return res.redirect('/create-book');
  }

  const user = await User.getUserById(req.body.collaboratorId);

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

  await newBook.save();

  logger.log({
    level: 'info',
    message: 'BOOK CREATED | ID: ' + newBook.id + ' / by ' + req.user.id
  });


  req.flash('success_msg', 'Your book was created successfully');
  return res.redirect('/');

};

// Validator for user registration
exports.registerValidation = [
  check('inputEmail').exists().isEmail().trim().normalizeEmail({gmail_remove_dots: false}),
  check('inputName').exists().isLength({min: 4}).withMessage('Name needs to be at least 4 characters long'),
  check('inputPassword').exists().isLength({min: 4}).withMessage('Password needs to be at least 4 characters long'),
  check('inputPasswordConf', 'Your passwords don\'t match').exists()
    .custom((value, {req}) => value === req.body.inputPassword)
];