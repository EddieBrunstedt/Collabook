const User = require('../models/userModel');
const Book = require('../models/bookModel');

// Get profile page of a user
exports.getProfilePage = (req, res, next) => {

  let viewedUser;
  let followsUser;
  let booksByUser;

  User.getUserById(req.params.userId)
    .then((response) => {
      viewedUser = response;
      //set followsUser to true if user follows other user
      followsUser = viewedUser.followers.some((item) => {
        return item.equals(req.user || req.user.id);
      });
      return Book.findAllPublicBooksByUser(viewedUser._id, req.user ? req.user.id : null);
    })
    .then((response) => {
      booksByUser = response;
      return res.render('userProfile', {viewedUser, followsUser, booksByUser});
    })
    .catch(err => next(err));
};

// Make profile updates
exports.postUserPage = (req, res, next) => {
  let user;
  User.getUserById(req.params.userId)
    .then((response) => {
      user = response;
      if (user.id !== req.user.id) {
        req.flash('error_msg', 'You are not authorized to do that.');
        return res.redirect('/')
      }
      return User.updateUser(req.params.userId, {bio: req.body.bioInput});
    })
    .then(() => {
      req.flash('success_msg', 'You have successfully updated your profile');
      return res.redirect('/user/' + req.params.userId);
    })
    .catch(err => next(err));
};

// User follow another user
exports.followUser = (req, res, next) => {
  if (req.user && req.user.id === req.params.userId) {
    req.flash('success_msg', 'You can\'t follow yourself silly')
    return res.redirect('/');
  }

  let userToFollow;
  let loggedInUser;

  //Find user to follow
  User.getUserById(req.params.userId)
    .then((response) => {
      userToFollow = response;
      const followsUser = userToFollow.followers.some((item) => {
        return item.equals(req.user.id);
      });
      if (followsUser) {
        req.flash('error_msg', 'You are already following this person.');
        return res.redirect('/user/' + req.params.userId);
      }
      userToFollow.followers.push(req.user._id);
      userToFollow.save();
      //Next, find user currently logged in
      return User.getUserById(req.user._id)
    })
    .then((response) => {
      loggedInUser = response;
      loggedInUser.following.push(userToFollow._id);
      loggedInUser.save();
      return res.redirect('/user/' + req.params.userId);
    })
    .catch(err => next(err));
};

// User unfollow another user
exports.unfollowUser = (req, res, next) => {
  let loggedInUser;
  User.getUserById(req.params.userId)
    .then((response) => {
      loggedInUser = response;
      const followsUser = loggedInUser.followers.some((item) => {
        return item.equals(req.user.id);
      });
      if (!followsUser) {
        req.flash('error_msg', 'You are not following this person');
        return res.redirect('/user/' + req.params.userId);
      }
      return User.removeUserFromFollowers(req.user._id, req.params.userId)
    })
    .then(() => {
      return User.removeUserFromFollowing(req.params.userId, req.user._id)
    })
    .then(() => {
      return res.redirect('/user/' + req.params.userId);
    })
    .catch(err => next(err));
};