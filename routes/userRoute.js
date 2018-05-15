const express = require('express');
const router = express.Router();

// I wrap all controller functions using promises in this function
// to wrap promise rejections and remove the need for try/catch.
const asyncMiddleware = require('../handlers/asyncMiddleware');

// Import controllers
const userControllers = require('../controllers/userControllers');
const authControllers = require('../controllers/authControllers');

// Get User Profile page
router.get('/:userId',
  asyncMiddleware(userControllers.getProfilePage)
);

// Post to profile for profile updates
router.post('/:userId/update-bio',
  authControllers.isLoggedIn,
  asyncMiddleware(userControllers.postUserPage)
);

// User follow another User
router.get('/:userId/follow-user',
  asyncMiddleware(userControllers.followUser)
);

// User unfollow another User
router.get('/:userId/unfollow-user',
  asyncMiddleware(userControllers.unfollowUser)
);

// User set email to public or private
router.get('/:userId/switch-email-visibility',
  authControllers.isLoggedIn,
  asyncMiddleware(userControllers.switchEmailVisibility)
);

module.exports = router;