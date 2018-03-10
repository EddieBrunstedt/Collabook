const express = require('express');
const router = express.Router();

//Import controllers
const bookControllers = require('../controllers/bookControllers');
const authControllers = require('../controllers/authControllers');

router.get('/:id', bookControllers.getBookPage);
//Todo: not only check for logged in, check for CORRECT USER logged in.
router.post('/:id/addPassage', authControllers.isLoggedIn, bookControllers.passageValidation, bookControllers.createPassage);

router.get('/:id/switch-writer', bookControllers.switchActiveWriter);
router.post('/:id/delete', bookControllers.deleteBook);

module.exports = router;