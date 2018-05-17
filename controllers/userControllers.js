const User = require('../models/userModel');
const Book = require('../models/bookModel');

// Get profile page of a user
exports.getProfilePage = async (req, res) => {
  const viewedUser = await User.getUserById(req.params.userId);

  const followsUser = viewedUser.followers.some((item) => {
    return item.equals(req.user.id);
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

//User follow another user
exports.followOrUnfollow = async (req, res) => {
  //Find target user
  const targetUser = await User.getUserById(req.body.targetUserId);

  //Check if user is trying to follow/unfollow herself
  if (req.user.id === targetUser.id) {
    req.flash('success_msg', 'This action is not possible on your own account, you silly.');
    return res.redirect('/');
  }

  //Check if user is alrady following target user
  const userFollowsTargetUser = targetUser.followers.some((item) => {
    return item.equals(req.user.id);
  });

  if (userFollowsTargetUser) {
    await User.removeUserFromFollowers(req.user._id, targetUser._id);
    await User.removeUserFromFollowing(targetUser._id, req.user._id);
    return res.redirect('/user/' + targetUser.id);

  } else {

    await User.addUserToFollowers(req.user._id, targetUser._id);
    await User.addUserFromFollowing(targetUser._id, req.user._id);
    return res.redirect('/user/' + targetUser.id);
  }
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