const {check, validationResult} = require('express-validator/check');
const slug = require('slug');

const logger = require('../logger');

const Book = require('../models/bookModel');
const Passage = require('../models/passageModel');

// Get book page and handle possible specific page numbers
exports.getBookPage = async (req, res) => {

  const book = await Book.findBookById(req.params.bookId);

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

  const totalNumOfPassages = await Passage.countPassagesInBook(book.id);

  if (totalNumOfPassages <= 0) {
    return res.redirect('/book/' + book.id + '/introduction');
  }

  const totalBookPages = totalNumOfPassages <= 0 ? 1 : Math.ceil(totalNumOfPassages / 2);
  const currentPage = req.params.currentPage || totalBookPages;
  const currentPassages = await Passage.findPassagesForPage(book.id, currentPage);
  const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

  res.render('bookPage', {
    fullUrl,
    totalNumOfPassages,
    book,
    totalBookPages: Number(totalBookPages),
    currentPassages,
    currentPage: Number(currentPage),
    viewingIntroduction: false
  });
};

// Get book introduction page
exports.getIntroduction = async (req, res) => {

  const book = await Book.findBookById(req.params.bookId);
  const totalNumOfPassages = await Passage.countPassagesInBook(book.id);

  const totalBookPages = totalNumOfPassages < 1 ? 1 : Math.ceil(totalNumOfPassages / 2);
  const currentPage = req.params.currentPage || totalBookPages;
  const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

  res.render('bookPage', {
    fullUrl,
    totalNumOfPassages,
    book,
    totalBookPages: Number(totalBookPages),
    currentPage: Number(currentPage),
    viewingIntroduction: true
  })

};

// Get form page for adding passage
exports.getCreatePassageForm = async (req, res) => {
  const book = await Book.findBookById(req.params.bookId)
  if (req.user.id !== book.activeWriter.id) {
    req.flash('error_msg', 'You are not authorized to do that');
    return res.redirect('/');
  }
  const passage = await Passage.findLastPassageInBook(book.id);
  res.render('createPassageForm', {book, passage: passage[0]})
};

// Create passage
exports.createPassage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.array().map(error => {
      req.flash('error_msg', error.msg);
    });
    return res.redirect('back');
  }

  const newPassage = new Passage({
    author: req.user._id,
    body: req.body.inputPassageBody,
    book: req.params.bookId,
  });

  const passage = await Passage.createPassage(newPassage);

  const book = await Book.findBookById(req.params.bookId);

  // Find who to set as activeWriter
  const activeWriter = req.user.id === book.owner.id ? book.collaborator.id : book.owner.id;

  await Book.updateActiveWriter(book.id, activeWriter);


  book.passages.push(passage._id);
  book.save();

  logger.log({
    level: 'info',
    message: 'PASSAGE CREATED | ID: ' + passage.id + ' / by ' + passage.author
  });

  req.flash('success_msg', 'Your passage was successfully saved');
  res.redirect('/book/' + book.id);

};

// Switch book visibility private/public
exports.switchBookVisibility = async (req, res) => {
  const book = await Book.findBookById(req.params.bookId);
  if (!req.user || req.user.id !== book.owner.id) {
    req.flash('error_msg', 'You are not authorized to do that');
    return res.redirect('/');
  }
  book.public ? await Book.setPrivate(book.id) : await Book.setPublic(book.id);
  res.redirect('back')
};

// Switch active writer on book
exports.switchActiveWriter = async (req, res) => {
  const book = await Book.findBookById(req.params.bookId);
  if (req.user.id !== book.owner.id) {
    req.flash('error_msg', 'You are not authorized to do that');
    return res.redirect('/');
  }
  let activeWriter;
  book.owner.id === book.activeWriter.id ? activeWriter = book.collaborator.id : activeWriter = book.owner.id;
  await Book.updateActiveWriter(book.id, activeWriter);
  res.redirect('back');
};

// Delete book and all its passages
exports.deleteBookAndPassages = async (req, res) => {
  const book = await Book.findBookById(req.params.bookId)

  if (req.user.id !== book.owner.id) {
    req.flash('error_msg', 'You are not authorized to do that');
    return res.redirect('/');
  }

  if (slug(book.title, {lower: true}) !== req.body.inputConfirmation) {
    req.flash('error_msg', 'The text you entered didn\'t match.');
    return res.redirect('back');
  }

  await Book.deleteBook(book.id);
  await Passage.deletePassagesFromBook(book.id);

  logger.log({
    level: 'info',
    message: 'BOOK DELETED | ID: ' + book.id + ' / by ' + req.user.id
  });

  req.flash('success_msg', 'Book successfully deleted.');
  return res.redirect('/');
};

// Validator for book creation
exports.bookValidation = [
  check('inputTitle').exists().trim().isLength({
    min: 1,
    max: 100
  }).withMessage('Your book title must be between 1 and 100 characters long')
];

// Validator for passage creation
exports.passageValidation = [
  check('inputPassageBody')
    .exists()
    .isLength({
      min: 1,
      max: 10000
    })
    .withMessage('The passage needs to be between 1 and 10000 characters long')
];