const User = require('../models/user');
const Book = require('../models/book');

exports.getProfilePage = (req, res, next) => {
  User.getUserById(req.params.userId)
    .then((viewedUser) => {
      //set followingUser to true if user follows other user
      const followsUser = viewedUser.followers.some((item) => {
        return item.equals(req.user.id);
      });
      Book.findAllUserPublicBooks(viewedUser._id)
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

exports.postUserPage = (req, res, next) => {
  User.getUserById(req.params.userId)
    .then((user) => {
      if (user.id !== req.user.id) {
        req.flash('error_msg', 'You are not authorized to do that.');
        return res.redirect('/')
      }
      User.updateUserProfile(req.params.userId, {bio: req.body.bioInput})
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