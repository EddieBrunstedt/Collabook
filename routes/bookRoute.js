const express = require('express');
const router = express.Router();

// I wrap all controller functions using promises in this function
// to wrap promise rejections and remove the need for try/catch.
const asyncMiddleware = require('../handlers/asyncMiddleware');

//Import controllers
const bookControllers = require('../controllers/bookControllers');
const authControllers = require('../controllers/authControllers');

// Get book page and handle possible specific page numbers
router.get('/:bookId/:currentPage(\\d+)*?',
  asyncMiddleware(bookControllers.getBookPage)
);

// Get book introduction page
router.get('/:bookId/introduction',
  asyncMiddleware(bookControllers.getIntroduction)
);

// Get add passage form page
router.get('/:bookId/addPassage',
  authControllers.isLoggedIn,
  asyncMiddleware(bookControllers.getCreatePassageForm)
);

// Post for creating passage
router.post('/:bookId/addPassage',
  authControllers.isLoggedIn,
  bookControllers.passageValidation,
  asyncMiddleware(bookControllers.createPassage)
);

// Get for making book public
router.get('/:bookId/switch-visibility',
  asyncMiddleware(bookControllers.switchBookVisibility)
);

// Get request for switching active writer in book
router.get('/:bookId/switch-writer',
  asyncMiddleware(bookControllers.switchActiveWriter)
);

// Post for deleting a book
router.post('/:bookId/delete',
  asyncMiddleware(bookControllers.deleteBookAndPassages)
);

module.exports = router;