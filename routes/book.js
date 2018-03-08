const express = require('express');
const router = express.Router();

//Import controllers
const bookControllers = require('../controllers/bookControllers');
const authControllers = require('../controllers/authControllers');

router.get('/:id', bookControllers.getBookPage);
router.post('/:id', authControllers.isLoggedIn, bookControllers.passageValidation, bookControllers.postBookPage);

router.get('/:id/switch-writer', bookControllers.switchActiveWriter);
router.post('/:id/delete', bookControllers.deleteBook);

module.exports = router;