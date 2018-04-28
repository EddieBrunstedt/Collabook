const express = require('express');
const router = express.Router();

//Import controllers
const bookControllers = require('../controllers/bookControllers');
const authControllers = require('../controllers/authControllers');

// Get book page and handle possible specific page numbers
// Todo: Create checking for correct user in regards to if book is public or not
router.get('/:bookId/:currentPage(\\d+)*?', bookControllers.getBookPage);

// Get add passage form page
//Todo: not only check for logged in, check for CORRECT USER logged in.
router.get('/:bookId/addPassage', authControllers.isLoggedIn, bookControllers.getCreatePassageForm);

// Post for creating passage
router.post('/:bookId/addPassage', authControllers.isLoggedIn, bookControllers.passageValidation, bookControllers.createPassage);

// Get book introduction page
router.get('/:bookId/introduction', bookControllers.getIntroduction);

// Get for making book private
router.get('/:bookId/make-private', authControllers.isLoggedIn, bookControllers.makeBookPrivate);

// Get for making book public
router.get('/:bookId/make-public', authControllers.isLoggedIn, bookControllers.makeBookPublic);

// Get request for switching active writer in book
// Todo: Add checking for correct user
router.get('/:bookId/switch-writer', bookControllers.switchActiveWriter);

// Post for deleting a book
// Todo #1: Add checking for correct user
// Todo #2: Make this also delete all passages for this book.
router.post('/:bookId/delete', authControllers.isLoggedIn, bookControllers.deleteBookAndPassages);

module.exports = router;