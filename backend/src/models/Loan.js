const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  returnDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Active', 'Returned', 'Overdue'],
    default: 'Active',
  },
  fine: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Check for overdue loans
loanSchema.methods.checkOverdue = function() {
  if (this.status === 'Active' && new Date() > this.dueDate) {
    this.status = 'Overdue';
    // Calculate fine (e.g., $1 per day overdue)
    const daysOverdue = Math.floor((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
    this.fine = daysOverdue * 1; // $1 per day
  }
};

module.exports = mongoose.model('Loan', loanSchema);
