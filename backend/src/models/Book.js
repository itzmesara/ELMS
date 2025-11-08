const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: String,
    required: true,
    trim: true,
  },
  isbn: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    trim: true,
  },
  year: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  fileUrl: {
    type: String, // URL to the digital file (PDF, EPUB, etc.)
    required: true,
  },
  fileType: {
    type: String,
    enum: ['PDF', 'EPUB', 'Audio', 'Video'],
    required: true,
  },
  totalCopies: {
    type: Number,
    required: true,
    default: 1,
  },
  availableCopies: {
    type: Number,
    required: true,
    default: 1,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update availableCopies when totalCopies changes
bookSchema.pre('save', function(next) {
  if (this.isModified('totalCopies') && this.availableCopies > this.totalCopies) {
    this.availableCopies = this.totalCopies;
  }
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Book', bookSchema);
