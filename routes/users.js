const express = require('express');
const router = express.Router();

const rootControllers = require('../controllers/rootControllers');

router.get('/', rootControllers.homePage);

module.exports = router;
