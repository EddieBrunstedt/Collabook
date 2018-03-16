const {check, validationResult} = require('express-validator/check');
const {matchedData, sanitize} = require('express-validator/filter');
const slug = require('slug');

const Book = require('../models/book');
const Passage = require('../models/passage');

exports.getBookPage = (req, res, next) => {
  Book.findBookById(req.params.bookId)
    .then((book) => {
      Passage.countPassagesInBook(book.id)
        .then((totalNumOfPassages) => {

          const totalBookPages = totalNumOfPassages < 1 ? 1 : Math.ceil(totalNumOfPassages / 2);
          const currentPage = req.params.currentPage || totalBookPages;

          Passage.findPassagesForPage(book.id, currentPage)
            .then((currentPassages) => {
              res.render('bookPage', {
                book,
                totalBookPages: Number(totalBookPages),
                currentPassages,
                currentPage: Number(currentPage),
                viewingIntroduction: false
              });
            })
            .catch((err) => {
              next(err)
            });
        })
        .catch((err) => {
          next(err);
        });
    })
    .catch((err) => {
      next(err)
    });
};

exports.getIntroduction = (req, res, next) => {
  Book.findBookById(req.params.bookId)
    .then((book) => {
      Passage.countPassagesInBook(book.id)
        .then((totalNumOfPassages) => {

          const totalBookPages = totalNumOfPassages < 1 ? 1 : Math.ceil(totalNumOfPassages / 2);
          const currentPage = req.params.currentPage || totalBookPages;

          Passage.findPassagesForPage(book.id, currentPage)
            .then((currentPassages) => {
              res.render('bookPage', {
                book,
                totalBookPages: Number(totalBookPages),
                currentPassages,
                currentPage: Number(currentPage),
                viewingIntroduction: true
              });
            })
            .catch((err) => {
              next(err)
            });
        })
        .catch((err) => {
          next(err);
        });
    })
    .catch((err) => {
      next(err)
    });
};

/*exports.getIntroduction = (req, res, next) => {
  Book.findBookById(req.params.bookId)
    .then((book) => {
      Passage.countPassagesInBook(book.id)
        .then((totalNumOfPassages) => {

          const totalBookPages = totalNumOfPassages < 1 ? 1 : Math.ceil(totalNumOfPassages / 2);
          const currentPage = req.params.currentPage || totalBookPages;

          Passage.findPassagesForPage(book.id, currentPage)
            .then((currentPassages) => {
              res.render('bookPage', {
                book,
                totalBookPages: Number(totalBookPages),
                currentPassages,
                currentPage: Number(currentPage),
                viewingIntroduction: true
              });
            })
            .catch((err) => {
              next(err)
            });
        })
        .catch((err) => {
          next(err);
        });
    })
    .catch((err) => {
      next(err)
    });
};*/

exports.writePassagePage = (req, res, next) => {
  Book.findBookById(req.params.bookId)
    .then((book) => {
      Passage.findLastPassageInBook(book.id)
        .then((passage) => {
          res.render('writePassagePage', {book, passage: passage[0]})
        })
        .catch((err) => {
          next(err)
        });
    })
    .catch((err) => {
      next(err);
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
    bookId: req.params.bookId,
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
  Book.findBookById(req.params.bookId)
    .then((book) => {
      let activeWriter;
      book.owner.id === book.activeWriter.id ? activeWriter = book.collaborator.id : activeWriter = book.owner.id;
      Book.switchActiveWriter(book.id, activeWriter)
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

//TODO: ALSO DELETE ALL PASSAGES FOR THIS BOOK YOU SILLY
exports.deleteBook = (req, res, next) => {
  Book.findBookById(req.params.bookId)
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