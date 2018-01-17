const express = require('express');
const router = express.Router();

//Import controllers
const rootControllers = require('../controllers/rootControllers');

/* GET home page. */
router.get('/', rootControllers.homePage);


module.exports = router;