const mongoose = require('mongoose');

const BookSchema = mongoose.Schema({
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
  //Todo: Change to ownerId
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  //Todo: Change to collaboratorId
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
    //Todo: Change to false before production
    default: true
  },
  //Todo: Change to activeWriterId
  activeWriter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
});

const Book = module.exports = mongoose.model('Book', BookSchema);

module.exports.createBook = (newBook) => {
  return newBook.save();
};

module.exports.findAllPublicBooks = () => {
  return Book
    .find({'public': true})
    .populate('owner collaborator')
    .sort({createdDate: -1})
    .exec()
};

module.exports.findAllUserActiveBooks = (userId) => {
  return Book
    .find({activeWriter: userId})
    .populate('owner collaborator')
    .sort({createdDate: -1})
    .exec()
};

module.exports.findAllUserBooks = (userId) => {
  return Book
    .find({$or: [{owner: userId}, {collaborator: userId}]})
    .populate('owner collaborator activeWriter')
    .sort({createdDate: -1})
    .exec()
};

module.exports.findBookById = (id) => {
  return Book
    .findById(id)
    .populate('owner collaborator activeWriter')
    .exec();
};

module.exports.switchActiveWriter = (bookId, activeWriter) => {
  return Book
    .findByIdAndUpdate(bookId, {activeWriter: activeWriter})
    .exec();
};

/*
module.exports.findBooksWithUser = (userId, callback) => {
  Book
    .find({$or: [{owner: userId}, {collaborator: userId}]})
    .populate('owner collaborator')
    .sort({createdDate: -1})
    .exec(callback);
};
*/