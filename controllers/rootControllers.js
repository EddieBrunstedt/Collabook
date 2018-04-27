const {validationResult} = require('express-validator/check');

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

        //TODO: THIS IS VERY WRONG
        Passage.findPassageById(booksByUserParsed.passages[0].id)
          .then((last) => {
            res.render('dashboard',
              {
                booksByUser: booksByUserParsed,
                booksNotStarted
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

// Get Book creation page
exports.getCreateBookForm = (req, res) => {
  res.render('createBook');
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