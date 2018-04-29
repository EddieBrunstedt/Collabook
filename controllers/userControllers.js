const {check, validationResult} = require('express-validator/check');
const {matchedData, sanitize} = require('express-validator/filter');

const User = require('../models/userModel');
const Book = require('../models/bookModel');

// Get profile page of a user
exports.getProfilePage = (req, res, next) => {
  User.getUserById(req.params.userId)
    .then((viewedUser) => {
      //set followingUser to true if user follows other user
      const followsUser = viewedUser.followers.some((item) => {
        return item.equals(req.user || req.user.id);
      });

      Book.findAllPublicBooksByUser(viewedUser._id, req.user ? req.user.id : null)
        .then((booksByUser) => {
          res.render('userPage', {viewedUser, followsUser, booksByUser});
        })
        .catch((err) => {
          next(err)
        });
    })
    .catch((err) => {
      next(err)
    });
};

// Make profile updates
exports.postUserPage = (req, res, next) => {
  User.getUserById(req.params.userId)
    .then((user) => {
      if (user.id !== req.user.id) {
        req.flash('error_msg', 'You are not authorized to do that.');
        return res.redirect('/')
      }
      User.updateUser(req.params.userId, {bio: req.body.bioInput})
        .then(() => {
          req.flash('success_msg', 'You have successfully updated your profile');
          res.redirect('/user/' + req.params.userId);
        })
        .catch((err) => {
          next(err);
        })
    })
    .catch((err) => {
      next(err)
    })
};

// User follow another user
exports.followUser = (req, res, next) => {
  if (req.user && req.user.id === req.params.userId) {
    req.flash('success_msg', 'You can\'t follow yourself silly')
  }

  let followedUserId;

  //Find user to follow
  User.getUserById(req.params.userId)
    .then((user) => {
      const followsUser = user.followers.some((item) => {
        return item.equals(req.user.id);
      });
      if (followsUser) {
        req.flash('error_msg', 'You are already following this person.');
        return res.redirect('/user/' + req.params.userId);
      }
      user.followers.push(req.user._id);
      followedUserId = user._id;
      user.save();

      //Next, find user currently logged in
      User.getUserById(req.user._id)
        .then((user) => {
          user.following.push(followedUserId);
          user.save();
          res.redirect('/user/' + req.params.userId);
        })
        .catch((err) => {
          next(err);
        });
    })
    .catch((err) => {
      next(err);
    });
};

// User unfollow another user
exports.unfollowUser = (req, res, next) => {
  User.getUserById(req.params.userId)
    .then((user) => {
      const followsUser = user.followers.some((item) => {
        return item.equals(req.user.id);
      });
      if (!followsUser) {
        req.flash('error_msg', 'You are not following this person');
        return res.redirect('/user/' + req.params.userId);
      }
      User.removeUserFromFollowers(req.user._id, req.params.userId)
        .then(() => {
          User.removeUserFromFollowing(req.params.userId, req.user._id)
            .then(() => {
              res.redirect('/user/' + req.params.userId);
            })
            .catch((err) => {
              next(err);
            })
        })
        .catch((err) => {
          next(err);
        })
    })
    .catch((err) => {
      next(err);
    });
};

// Validator for user registration
exports.registerValidation = [
  //Todo: Work out proper rules before production
  check('inputEmail').exists().isEmail().trim().normalizeEmail({gmail_remove_dots: false}),
  check('inputName').exists().isLength({min: 3}).withMessage('Name needs to be at least 3 characters long'),
  check('inputPassword').exists().isLength({min: 3}).withMessage('Password needs to be at least 3 characters long'),
  check('inputPasswordConf', 'Your passwords don\'t match').exists()
    .custom((value, {req}) => value === req.body.inputPassword)
];