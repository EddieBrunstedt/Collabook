const {check, validationResult} = require('express-validator/check');
const {matchedData, sanitize} = require('express-validator/filter');
const slug = require('slug');

const Book = require('../models/bookModel');
const Passage = require('../models/passageModel');

// Get book page and handle possible specific page numbers
// Todo: Create checking for correct user in regards to if book is public or not
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

// Get book introduction page
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

// Get form page for adding passage
exports.getCreatePassageForm = (req, res, next) => {
  Book.findBookById(req.params.bookId)
    .then((book) => {
      Passage.findLastPassageInBook(book.id)
        .then((passage) => {
          res.render('createPassageForm', {book, passage: passage[0]})
        })
        .catch((err) => {
          next(err)
        });
    })
    .catch((err) => {
      next(err);
    });
};

// Create passage
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

  return newPassage.save()
    .then((newPassage) => {
      Book.findBookById(req.params.bookId)
        .then((book) => {
          book.passages.push(newPassage._id);
          book.save();
          req.flash('success_msg', 'Your passage was successfully saved');
          res.redirect('/book/' + book.id);
        })
        .catch((err) => {
          next(err);
        });

    })
    .catch((err) => {
      next(err);
    });
};

// Switch active writer for book
// Todo: Add checking for correct user
exports.switchActiveWriter = (req, res, next) => {
  Book.findBookById(req.params.bookId)
    .then((book) => {
      let activeWriter;
      book.owner.id === book.activeWriter.id ? activeWriter = book.collaborator.id : activeWriter = book.owner.id;
      Book.updateActiveWriter(book.id, activeWriter)
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

// Delete book and all its passages
// Todo #1: Add checking for correct user
// Todo #2: Make this also delete all passages for this book.
exports.deleteBookAndPassages = (req, res, next) => {
  Book.findBookById(req.params.bookId)
    .then((book) => {
      if (slug(book.title, {lower: true}) === req.body.inputConfirmation) {
        Book.deleteBook(book.id)
          .then(() => {
            Passage.deletePassagesFromBook(book.id)
              .then(() => {
                req.flash('success_msg', 'Book successfully deleted.');
                res.redirect('/');
              })
              .catch((err) => {
                next(err);
              });
          })
          .catch((err) => {
            next(err);
          });
      } else {
        req.flash('error_msg', 'The text you entered didn\'t match.');
        res.redirect('back');
      }
    })
    .catch((err) => {
      next(err);
    });
};

// Validator for book creation
exports.bookValidation = [
  check('inputTitle').exists().trim().isLength({
    min: 1,
    max: 100
  }).withMessage('Your book title must be between 1 and 100 characters long')
];

// Validator for passage creation
// Todo: Change min/max before production
exports.passageValidation = [
  check('inputPassageBody')
    .exists()
    .isLength({
      min: 1,
      max: 10000
    })
    .withMessage('The passage needs to be between 1 and 10000 characters long')
];