const mongoose = require('mongoose');

const Book = require('./bookModel');

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


// Count passages in a specific book
module.exports.countPassagesInBook = (bookId) => {
  return Passage
    .count({'bookId': bookId})
    .exec()
};

// Get the two passages corresponding to current page number
module.exports.findPassagesForPage = (bookId, pageNumber) => {
  return Passage
    .find({'bookId': bookId})
    //for each page we need to skip: ([passages per page] * [current page]) - [passages per page]) passages
    .skip((2 * pageNumber) - 2)
    .limit(2)
    .populate()
    .exec();
};

// Get the last passage of specific book
module.exports.findLastPassageInBook = (bookId) => {
  return Passage
    .find({'bookId': bookId})
    .sort('-createdDate')
    .limit(1)
    .populate('authorId')
    .exec();
};

// FInd Passage by Id
module.exports.findPassageById = (id) => {
  return Passage
    .findById(id)
    .populate('authorId')
    .exec();
};

// Get all passages for a specific book
// Todo: Not used as of writing this. Find usage or remove
module.exports.findAllPassagesInBook = (bookId) => {
  return Passage
    .find({'bookId': bookId})
    .populate()
    .exec();
};

// Remove all passages with specific passage.book.id
// Only use when completely removing a book
module.exports.deletePassagesFromBook = (bookId) => {
  return Passage
    .deleteMany({bookId: bookId})
    .exec();
};