const express = require('express');
const router = express.Router();

//Import controllers
const bookControllers = require('../controllers/bookControllers');
const authControllers = require('../controllers/authControllers');

// Get book page and handle possible specific page numbers
router.get('/:bookId/:currentPage(\\d+)*?', bookControllers.getBookPage);

// Get add passage form page
router.get('/:bookId/addPassage', authControllers.isLoggedIn, bookControllers.getCreatePassageForm);

// Post for creating passage
router.post('/:bookId/addPassage', authControllers.isLoggedIn, bookControllers.passageValidation, bookControllers.createPassage);

// Get book introduction page
router.get('/:bookId/introduction', bookControllers.getIntroduction);

// Get for making book private
router.get('/:bookId/make-private', bookControllers.makeBookPrivate);

// Get for making book public
router.get('/:bookId/make-public', bookControllers.makeBookPublic);

// Get request for switching active writer in book
router.get('/:bookId/switch-writer', bookControllers.switchActiveWriter);

// Post for deleting a book
router.post('/:bookId/delete', bookControllers.deleteBookAndPassages);

module.exports = router;