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
    //Todo: Change to false before production
    default: true
  },
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
  //TODO: Change below to '.find({'public': true})' before production
    .find({})
    .populate('owner collaborator')
    .sort({createdDate: -1})
    .exec()
};

module.exports.findBookById = (id) => {
  return Book.findById(id)
    .populate('owner collaborator activeWriter')
    .exec()
};


/*
module.exports.findBooksWithUser = (userId, callback) => {
  Book
    .find({$or: [{owner: userId}, {collaborator: userId}]})
    .populate('owner collaborator')
    .sort({createdDate: -1})
    .exec(callback);
};

module.exports.changeTurn = (bookId, nextUser, callback) => {
  Book.findByIdAndUpdate(bookId, {activeWriter: nextUser})
    .exec(callback);
};
*/