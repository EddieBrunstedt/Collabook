const express = require('express');
const router = express.Router();

//Import controllers
const bookControllers = require('../controllers/bookControllers');
const authControllers = require('../controllers/authControllers');

router.get('/:bookId/:currentPage(\\d+)*?', bookControllers.getBookPage);

//Todo: not only check for logged in, check for CORRECT USER logged in.
router.get('/:bookId/addPassage', bookControllers.writePassagePage);
router.post('/:bookId/addPassage', authControllers.isLoggedIn, bookControllers.passageValidation, bookControllers.createPassage);

router.get('/:bookId/introduction', bookControllers.getIntroduction);

router.get('/:bookId/switch-writer', bookControllers.switchActiveWriter);
router.post('/:bookId/delete', bookControllers.deleteBook);

module.exports = router;