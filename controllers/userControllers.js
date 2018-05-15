const User = require('../models/userModel');
const Book = require('../models/bookModel');

// Get profile page of a user
exports.getProfilePage = async (req, res) => {
  const viewedUser = await User.getUserById(req.params.userId);
  const followsUser = viewedUser.followers.some((item) => {
    return item.equals(req.user || req.user.id);
  });
  const booksByUser = await Book.findAllPublicBooksByUser(viewedUser._id, req.user ? req.user.id : null);
  res.render('userProfile', {viewedUser, followsUser, booksByUser});
};

// Make profile updates
exports.postUserPage = async (req, res) => {
  const user = await User.getUserById(req.params.userId);
  if (user.id !== req.user.id) {
    req.flash('error_msg', 'You are not authorized to do that.');
    return res.redirect('/')
  }
  await User.updateUser(req.params.userId, {bio: req.body.bioInput});
  req.flash('success_msg', 'You have successfully updated your profile');
  res.redirect('/user/' + req.params.userId);
};

// User follow another user
exports.followUser = async (req, res) => {
  if (req.user && req.user.id === req.params.userId) {
    req.flash('success_msg', 'You can\'t follow yourself silly');
    return res.redirect('/');
  }

  //Find user to follow
  const userToFollow = await User.getUserById(req.params.userId);

  const followsUser = userToFollow.followers.some((item) => {
    return item.equals(req.user.id);
  });

  if (followsUser) {
    req.flash('error_msg', 'You are already following this person.');
    return res.redirect('/user/' + req.params.userId);
  }

  userToFollow.followers.push(req.user._id);

  await userToFollow.save();

  //Next, find user currently logged in
  const loggedInUser = await User.getUserById(req.user._id);

  loggedInUser.following.push(userToFollow._id);

  await loggedInUser.save();

  res.redirect('/user/' + req.params.userId);
};

// User unfollow another user
exports.unfollowUser = async (req, res) => {
  const loggedInUser = await User.getUserById(req.params.userId);
  const followsUser = loggedInUser.followers.some((item) => {
    return item.equals(req.user.id);
  });
  if (!followsUser) {
    req.flash('error_msg', 'You are not following this person');
    return res.redirect('/user/' + req.params.userId);
  }
  await User.removeUserFromFollowers(req.user._id, req.params.userId);
  await User.removeUserFromFollowing(req.params.userId, req.user._id);
  res.redirect('/user/' + req.params.userId);
};

// User set email to public or private
exports.switchEmailVisibility = async (req, res) => {
  const userToUpdate = await User.getUserById(req.params.userId);
  if (req.user.id !== userToUpdate.id) {
    req.flash('error_msg', 'You are not authorized to do that');
    return res.redirect('/user' + userToUpdate.id)
  }

  // Make the switch
  userToUpdate.publicEmail ? userToUpdate.publicEmail = false : userToUpdate.publicEmail = true;
  await userToUpdate.save();

  req.flash('success_msg', 'Your privacy preferences has been saved');
  res.redirect('/user/' + userToUpdate.id);
};