const mongoose = require('mongoose');

const PassageSchema = mongoose.Schema({
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
  console.log(1, pageNumber);
  return Passage
    .find({'bookId': bookId})
    //for each page we need to skip ([perPage] * [currentPage]) - [perPage]) values
    .skip((2 * pageNumber) - 2)
    .limit(2)
    .populate('authorId')
    .exec();
};

module.exports.findAllPassagesInBook = (bookId) => {
  const query = {'bookId': bookId};
  return Passage
    .find(query)
    .populate('authorId')
    .exec();
};