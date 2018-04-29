const express = require('express');
const router = express.Router();

// Import controllers
const userControllers = require('../controllers/userControllers');
const authControllers = require('../controllers/authControllers');

// Get User Profile page
router.get('/:userId', userControllers.getProfilePage);

// Post to profile for profile updates
router.post('/:userId/update-bio', authControllers.isLoggedIn, userControllers.postUserPage);

// User follow another User
router.get('/:userId/follow-user', userControllers.followUser);

// User unfollow another User
router.get('/:userId/unfollow-user', userControllers.unfollowUser);


module.exports = router;