const express = require('express');
const router = express.Router();

//Import controllers
const rootControllers = require('../controllers/rootControllers');

/* GET home page. */const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Schema
const UserSchema = mongoose.Schema({
  email: {
    type: String,
    index: true,
    required: 'E-mail is required.',
    lowercase: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: 'A name is required.'
  },
  password: {
    type: String,
    required: 'A password is required.'
  },
  bio: {
    type: String,
    default: ''
  }
}, {runSettersOnQuery: true});

const User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = (newUser) => {
  bcrypt.genSalt(10)
    .then((salt) => {
      return bcrypt.hash(newUser.password, salt)
    })
    .then((hash) => {
      newUser.password = hash;
      newUser.save();
    })
    .catch((err) => {
      throw err;
    })
};

module.exports.getUserById = (id) => {
  return User.findById(id);
};

module.exports.getUserByEmail = (email) => {
  return User.findOne({email: email});
};

module.exports.comparePassword = (candidatePassword, hash) => {
  return bcrypt.compare(candidatePassword, hash);
};

module.exports.updateUserAccount = (id, updates) => {
  return User.findOneAndUpdate(
    {_id: id},
    {$set: updates},
    {new: true, runValidators: true, context: 'query'}
  )
};
router.get('/', rootControllers.homePage);


module.exports = router;