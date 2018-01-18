const express = require('express');
const router = express.Router();

//Import controllers
const userControllers = require('../controllers/userControllers');
const authControllers = require('../controllers/authControllers');

router.get('/:id', userControllers.getUserPage);
router.post('/:id', authControllers.isLoggedIn, userControllers.postUserPage);

module.exports = router;