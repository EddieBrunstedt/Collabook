const express = require('express');
const router = express.Router();

//Import controllers
const bookControllers = require('../controllers/bookControllers');
const authControllers = require('../controllers/authControllers');

router.get('/:id', bookControllers.getBookPage);
//Todo:
router.post('/:id', authControllers.isLoggedIn, bookControllers.passageValidation, bookControllers.postBookPage);

router.get('/:id/switch-writer', bookControllers.switchActiveWriter);

module.exports = router;