const User = require('../models/user');

exports.getUserPage = (req, res, next) => {
  User.getUserById(req.params.userId)
    .then((viewedUser) => {
      res.render('userPage', {viewedUser});
    })
    .catch((err) => {
      next(err)
    });
};

exports.postUserPage = (req, res, next) => {
  User.getUserById(req.params.userId)
    .then((user) => {
      if (user.id !== req.user.id) {
        req.flash('error_msg', 'You are not authorized to do that.');
        return res.redirect('/')
      }
      User.updateUserProfile(req.params.userId, {bio: req.body.inputBio})
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

exports.followUser = (req, res, next) => {
  let followedUserId;
  User.getUserById(req.params.userId)
    .then((user) => {
      user.followers.push(req.user._id);
      followedUserId = user._id;
      user.save();
    })
    .catch((err) => {
      next(err);
    });
  User.getUserById(followedUserId)
    .then((user) => {
      console.log('This log should output the FOLLOWED users id. OUTPUT: ' + followedUserId);
      user.following.push(followedUserId);
      user.save();
    })
    .catch((err) => {
      next(err);
    })
};