const {check, validationResult} = require('express-validator/check');
const {matchedData, sanitize} = require('express-validator/filter');

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

exports.postBookPage = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    errors.array().map(error => {
      req.flash('error_msg', error.msg);
    });
    return res.redirect('back');
  }


  const newPassage = new Passage({
    author: req.user._id,
    body: req.body.bodyInput,
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

exports.passageValidation = [
  check('bodyInput')
    .exists()
    .isLength({
      min: 300,
      max: 10000
    })
    .withMessage('The passage needs to be between 300 and 10000 characters long')
];