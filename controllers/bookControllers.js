const {check, validationResult} = require('express-validator/check');
const {matchedData, sanitize} = require('express-validator/filter');
const slug = require('slug');

const Book = require('../models/book');
const Passage = require('../models/passage');

exports.getBookPage = (req, res, next) => {
  Book.findBookById(req.params.id)
    .then((book) => {
      Passage.findAllPassagesInBook(book._id)
        .then((passages) => {
          res.render('bookPage', {book, passages});
        })
        .catch((err) => {
          next(err)
        });
    })
    .catch((err) => {
      next(err)
    });
};

exports.createPassage = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.array().map(error => {
      req.flash('error_msg', error.msg);
    });
    return res.redirect('back');
  }

  const newPassage = new Passage({
    authorId: req.user._id,
    body: req.body.inputPassageBody,
    book: req.params.id,
  });

  Passage.createPassage(newPassage)
    .then(() => {
      res.redirect('back');
    })
    .catch((err) => {
      next(err);
    });
};

exports.switchActiveWriter = (req, res, next) => {
  Book.findBookById(req.params.id)
    .then((book) => {
      let activeWriter;
      book.owner.id === book.activeWriter.id ? activeWriter = book.collaborator.id : activeWriter = book.owner.id;
      Book.switchActiveWriter(req.params.id, activeWriter)
        .then(() => {
          res.redirect('back');
        })
        .catch((err) => {
          next(err);
        });
    })
    .catch((err) => {
      next(err)
    });
};

exports.deleteBook = (req, res, next) => {
  Book.findBookById(req.params.id)
    .then((book) => {
      if (slug(book.title, {lower: true}) === req.body.inputConfirmation) {
        Book.deleteBookById(book.id)
          .then(() => {
            req.flash('success_msg', 'Book successfully deleted.');
            res.redirect('/');
          })
          .catch((err) => {
            next(err)
          });
      } else {
        req.flash('error_msg', 'The text you entered didn\'t match.');
        res.redirect('back');
      }
    })
    .catch((err) => {
      next(err)
    });
};

//Todo: Change min/max before production
exports.passageValidation = [
  check('inputPassageBody')
    .exists()
    .isLength({
      min: 1,
      max: 10000
    })
    .withMessage('The passage needs to be between 1 and 10000 characters long')
];