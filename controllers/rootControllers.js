const {check, validationResult} = require('express-validator/check');
const {matchedData, sanitize} = require('express-validator/filter');

const slug = require('slug');

const logger = require('../logger');

const User = require('../models/userModel');
const Book = require('../models/bookModel');
const Passage = require('../models/passageModel');

// Test controller
// Todo: Remove before production
exports.test = (req, res, next) => {
  res.render('test', {slug: slug('this is a test of things...')})
};

// Get users own dashboard
exports.getDashboard = (req, res, next) => {
  if (req.user) {
    Book.findAllBooksWithUser(req.user._id)
      .then((booksByUser) => {
        let booksNotStarted = booksByUser
          .filter(book => !book.passages[0]);
        let booksByUserParsed = booksByUser
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
        Book.findFollowedUsersBooks(req.user.following, req.user.id)
          .then((followedUserBooks) => {
            res.render('dashboard',
              {
                booksByUser: booksByUserParsed,
                booksNotStarted, followedUserBooks
              })
          })
          .catch((err) => {
            next(err);
          });
      })
      .catch((err) => {
        next(err);
      });
  } else {
    res.redirect('/login');
  }
};

//Get Followed users page
exports.getFollowedUsers = (req, res) => {
  User.getFollowedUsers(req.user.following)
    .then((followedUsers) => {
      res.render('followedUsers', {followedUsers});
    })
    .catch((err) => {
      next(err);
    });
};

// Get login page
exports.getLoginForm = (req, res) => {
  res.render('login');
};

// Post for logging in
exports.postLoginForm = (req, res) => {
  res.redirect('/')
};

// Get register form
exports.getRegisterForm = (req, res) => {
  res.render('register');
};

// Post for registering user
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

//TOdo: MAKE IT SO IT CANT FIND EVERYONE WHEN SEARCHING BLANK
exports.postFindCollaborators = (req, res, next) => {

  //Todo: uncomment before production
  /*if (req.body.inputSearchString.length < 3) {
    req.flash('error_msg', 'The search criteria needs to be at least 3 characters long');
    return res.redirect('/create-book/find-collaborator');
  }*/


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
      res.render('findCollaborator', {foundUsers: parsedFoundUsers});
    })
    .catch((err) => {
      next(err);
    });
};

// Get find collaborator page in book creation
exports.getFindCollaborators = (req, res) => {
  res.render('findCollaborator');
};

// Get Book creation page
exports.getCreateBookForm = (req, res, next) => {
  User.getUserById(req.params.collaboratorId)
    .then((collaborator) => {
      console.log(collaborator);
      res.render('createBook', {collaborator});
    })
    .catch((err) => next(err));
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
        .then((book) => {
          logger.info(`BOOK CREATED - book/owner/collaborator: ${book.id} / ${book.owner} / ${book.collaborator}`);
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

// Validator for user registration
exports.registerValidation = [
  //Todo: Work out proper rules before production
  check('inputEmail').exists().isEmail().trim().normalizeEmail({gmail_remove_dots: false}),
  check('inputName').exists().isLength({min: 3}).withMessage('Name needs to be at least 3 characters long'),
  check('inputPassword').exists().isLength({min: 3}).withMessage('Password needs to be at least 3 characters long'),
  check('inputPasswordConf', 'Your passwords don\'t match').exists()
    .custom((value, {req}) => value === req.body.inputPassword)
];