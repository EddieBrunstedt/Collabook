const mongoose = require('mongoose');

const Book = require('../models/book');

const PassageSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  body: {
    type: String,
    required: true
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  //Todo: Change name to bookId
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  }
});

PassageSchema.post('save', function (doc, next) {
  Book.findBookById(this.bookId)
    .then((book) => {
      book.lastPassageStamp = this.createdDate;
      book.save();
      next();
    })
    .catch((err) => {
      next(err);
    });
});

PassageSchema.post('remove', function (doc, next) {
  Book.findBookById(this.bookId)
    .then((book) => {
      if (!book.passages[0]) {
        book.lastPassageStamp = book.createdDate;
        book.save();
        next();
      }
      book.lastPassageStamp = book.passages[0].createdDate;
      book.save();
      next();
    })
    .catch((err) => {
      next(err);
    });
});

const Passage = module.exports = mongoose.model('Passage', PassageSchema);

module.exports.createPassage = (newPassage) => {
  return newPassage.save();
};

module.exports.countPassagesInBook = (bookId) => {
  return Passage
    .count({'bookId': bookId})
    .exec()
};


module.exports.findPassagesForPage = (bookId, pageNumber) => {
  return Passage
    .find({'bookId': bookId})
    //for each page we need to skip ([perPage] * [currentPage]) - [perPage]) values
    .skip((2 * pageNumber) - 2)
    .limit(2)
    .populate()
    .exec();
};

module.exports.findLastPassageInBook = (bookId) => {
  return Passage
    .find({'bookId': bookId})
    .sort('-createdDate')
    .limit(1)
    .populate('authorId')
    .exec();
};

module.exports.findAllPassagesInBook = (bookId) => {
  const query = {'bookId': bookId};
  return Passage
    .find(query)
    .populate()
    .exec();
};