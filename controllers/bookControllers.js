const {check, validationResult} = require('express-validator/check');
const {matchedData, sanitize} = require('express-validator/filter');
const slug = require('slug');

const Book = require('../models/bookModel');
const Passage = require('../models/passageModel');

// Get book page and handle possible specific page numbers
exports.getBookPage = (req, res, next) => {
  Book.findBookById(req.params.bookId)
    .then((book) => {

      // Check if a user is logged in if book is private
      if (!book.public && !req.user) {
        req.flash('error_msg', 'That is a private book. You can see it only if it becomes public.');
        return res.redirect('/')
      }

      // Check if correct user is logged in if book is private
      if (!book.public && (req.user && req.user.id !== book.owner.id) && (req.user && req.user.id !== book.collaborator.id)) {
        req.flash('error_msg', 'That is a private book. You can see it only if it becomes public.');
        return res.redirect('/')
      }

      Passage.countPassagesInBook(book.id)
        .then((totalNumOfPassages) => {

          if (totalNumOfPassages <= 0) {
            return res.redirect('/book/' + book.id + '/introduction');
          }

          const totalBookPages = totalNumOfPassages < 1 ? 1 : Math.ceil(totalNumOfPassages / 2);
          const currentPage = req.params.currentPage || totalBookPages;

          Passage.findPassagesForPage(book.id, currentPage)
            .then((currentPassages) => {
              res.render('bookPage', {
                totalNumOfPassages,
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
                totalNumOfPassages,
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
      if (req.user.id !== book.activeWriter.id) {
        req.flash('error_msg', 'You are not authorized to do that');
        return res.redirect('/');
      }
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

// Set a book private if it is public and vice versa
exports.makeBookPrivate = (req, res, next) => {
  Book.setPrivate(req.params.bookId)
    .then(() => {
      res.redirect('back');
    })
    .catch((err) => {
      next(err);
    })
};

// Set a book private if it is public and vice versa
exports.makeBookPublic = (req, res, next) => {
  Book.setPublic(req.params.bookId)
    .then(() => {
      res.redirect('back');
    })
    .catch((err) => {
      next(err);
    })
};

exports.switchActiveWriter = (req, res, next) => {
  Book.findBookById(req.params.bookId)
    .then((book) => {
      if (req.user.id !== book.owner.id) {
        req.flash('error_msg', 'You are not authorized to do that');
        return res.redirect('/');
      }
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
exports.deleteBookAndPassages = (req, res, next) => {
  Book.findBookById(req.params.bookId)
    .then((book) => {
      if (req.user.id !== book.owner.id) {
        req.flash('error_msg', 'You are not authorized to do that');
        return res.redirect('/');
      }
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