const express = require('express');
const router = express.Router();

//Import controllers
const userControllers = require('../controllers/userControllers');
const authControllers = require('../controllers/authControllers');

router.get('/:userId', userControllers.getUserPage);
router.post('/:userId', authControllers.isLoggedIn, userControllers.postUserPage);


//User follow another User
router.post('/:userId/follow-user', userControllers.followUser);
//User unfollow another User
router.post('/:userId/unfollow-user', userControllers.unfollowUser);


module.exports = router;