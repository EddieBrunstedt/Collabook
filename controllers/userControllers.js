const User = require('../models/user');

exports.getUserPage = (req, res, next) => {
  User.getUserById(req.params.id)
    .then((user) => {
      res.render('userPage', {user});
    })
    .catch((err) => {
      next(err)
    });
};

exports.postUserPage = (req, res, next) => {
  User.getUserById(req.params.id)
    .then((user) => {
      if (user.id !== req.user.id) {
        req.flash('error_msg', 'You are not authorized to do that.');
        return res.redirect('/')
      }
      User.updateUserAccount(req.params.id, {bio: req.body.inputBio})
        .then(() => {
          req.flash('success_msg', 'You have successfully updated your profile');
          res.redirect('/user/' + req.params.id);
        })
        .catch((err) => {
          next(err);
        })
    })
    .catch((err) => {
      next(err)
    })
};