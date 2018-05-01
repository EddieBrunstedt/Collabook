const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: 'A book title is required',
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  introduction: {
    type: String,
    trim: true,
    default: '',
  },
  passages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Passage'
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  collaborator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completed: {
    type: Boolean,
    default: false
  },
  public: {
    type: Boolean,
    default: false
  },
  activeWriter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  lastPassageStamp: {
    type: Date,
    default: Date.now
  }
});

const Book = module.exports = mongoose.model('Book', BookSchema);

// Create a book
module.exports.createBook = (newBook) => {
  return newBook.save();
};

// Find all public books by a specific user
module.exports.findAllPublicBooksByUser = (userId, idToExclude) => {
  if (idToExclude) {
    return Book
      .find({$or: [{owner: userId}, {collaborator: userId}]})
      .where({public: true})
      .nor([{owner: idToExclude}, {collaborator: idToExclude}])
      .populate('collaborator owner')
      .sort({lastPassageStamp: -1})
      .exec()
  } else {
    return Book
      .find({$or: [{owner: userId}, {collaborator: userId}]})
      .where({public: true})
      .populate('collaborator owner')
      .sort({lastPassageStamp: -1})
      .exec()
  }
};

// Find all books where user is owner or collaborator
module.exports.findAllBooksWithUser = (userId) => {
  return Book
    .find({$or: [{owner: userId}, {collaborator: userId}]})
    .populate('owner collaborator activeWriter passages')
    .populate({path: 'passages', options: {sort: {'createdDate': -1}}})
    .sort({lastPassageStamp: -1})
    .exec()
};

// Find all public books from users that a user is following
module.exports.findFollowedUsersBooks = (userIDArray, idToExclude) => {
  return Book
  //.find({'_id': {$in: userIDArray}})
    .find({})
    .where({public: true})
    .or([{owner: {$in: userIDArray}}, {collaborator: {$in: userIDArray}}])
    .nor([{owner: idToExclude}, {collaborator: idToExclude}])
    .populate('activeWriter owner collaborator')
    .populate({path: 'passages', options: {sort: {'createdDate': -1}}})
    .sort({lastPassageStamp: -1})
    .exec()
};

// Find a book by id
module.exports.findBookById = (id) => {
  return Book
    .findById(id)
    .populate('owner collaborator activeWriter passages')
    .exec();
};

// Update active writer for book
module.exports.updateActiveWriter = (bookId, userIdToActive) => {
  return Book
    .findByIdAndUpdate(bookId, {activeWriter: userIdToActive})
    .exec();
};

// Set a book to private
module.exports.setPrivate = (bookId) => {
  return Book
    .findOneAndUpdate({_id: bookId}, {public: false})
    .exec();
};

// Set a book to public
module.exports.setPublic = (bookId) => {
  return Book
    .findOneAndUpdate({_id: bookId}, {public: true})
    .exec();
};

// Delete a book by id
module.exports.deleteBook = (id) => {
  return Book
    .remove({_id: id})
    .exec();
};