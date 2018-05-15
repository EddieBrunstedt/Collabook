const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const md5 = require('md5');

const logger = require('../logger');

// Define user schema
const UserSchema = new mongoose.Schema({
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
  },
  active: {
    type: Boolean,
    default: true
  },
    publicEmail: {
    type: Boolean,
    default: false
  },
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
}, {runSettersOnQuery: true});

// Virtual for Gravatar profile picture link
UserSchema.virtual('gravatar').get(function () {
  return 'https://www.gravatar.com/avatar/' + md5(this.email) + '?s=200&r=pg&d=mm';
});

const User = module.exports = mongoose.model('User', UserSchema);


// Create a useruser
module.exports.createUser = (newUser) => {
  bcrypt.genSalt(10)
    .then((salt) => {
      return bcrypt.hash(newUser.password, salt)
    })
    .then((hash) => {
      newUser.password = hash;
      newUser.save();
      logger.log({
        level: 'info',
        message: 'USER CREATED | ID: ' + newUser.id
      });
    })
    .catch((err) => {
      throw err;
    })
};

// Get user by id
module.exports.getUserById = (id) => {
  return User.findById(id);
};

// Fuzzy search for user by name
module.exports.fuzzySearchUserByName = (searchString, idToExclude) => {

  function escapeRegex(searchString) {
    return searchString.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  }

  const isId = mongoose.Types.ObjectId.isValid(searchString);

  const regex = new RegExp(escapeRegex(searchString), 'gi');

  if (isId) {
    return User
      .find({'_id': searchString})
      .nor([{'_id': idToExclude}])
      .limit(30)
  } else {
    return User
      .find({'name': regex})
      .nor([{'_id': idToExclude}])
  }
};

// Get user by email
module.exports.getUserByEmail = (email) => {
  return User.findOne({email: email});
};

// Get all users from id in array
module.exports.getFollowedUsers = (userIdArray) => {
  return User
    .where('_id')
    .in(userIdArray)
};

// Compare candidate password with stored hash
module.exports.comparePassword = (candidatePassword, hash) => {
  return bcrypt.compare(candidatePassword, hash);
};

// Update user
module.exports.updateUser = (id, updates) => {
  return User.findOneAndUpdate(
    {_id: id},
    {$set: updates},
    {new: true, runValidators: true, context: 'query'}
  )
};

// Remove user.id from user.following
module.exports.removeUserFromFollowing = (userIdToRemove, userIdToRemoveFrom) => {
  return User.update(
    {_id: userIdToRemoveFrom},
    {$pull: {following: userIdToRemove}}
  )
};

// Remove user.id from user.following
module.exports.removeUserFromFollowers = (userIdToRemove, userIdToRemoveFrom) => {
  return User.update(
    {_id: userIdToRemoveFrom},
    {$pull: {followers: userIdToRemove}}
  )
};