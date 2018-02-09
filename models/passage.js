const mongoose = require('mongoose');

const PassageSchema = mongoose.Schema({
  //Todo: Change name to authorId
  author: {
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
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  }
});

const Passage = module.exports = mongoose.model('Passage', PassageSchema);

module.exports.createPassage = (newPassage) => {
  return newPassage.save();
};

module.exports.findAllPassagesInBook = (bookId) => {
  const query = {'book': bookId};
  return Passage
    .find(query)
    .populate('creator')
    .exec();
};