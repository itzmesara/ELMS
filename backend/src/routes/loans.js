const express = require('express');
const { body, validationResult } = require('express-validator');
const Loan = require('../models/Loan');
const Book = require('../models/Book');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get user's loans
router.get('/my-loans', authenticate, async (req, res) => {
  try {
    const loans = await Loan.find({ user: req.user._id })
      .populate('book', 'title author isbn')
      .sort({ issueDate: -1 });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Borrow a book
router.post('/borrow', authenticate, [
  body('bookId').isMongoId().withMessage('Valid book ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookId } = req.body;
    const book = await Book.findById(bookId);

    if (!book || !book.isActive || book.availableCopies <= 0) {
      return res.status(400).json({ message: 'Book not available' });
    }

    // Check if user already has this book borrowed
    const existingLoan = await Loan.findOne({
      user: req.user._id,
      book: bookId,
      status: 'Active'
    });

    if (existingLoan) {
      return res.status(400).json({ message: 'You already have this book borrowed' });
    }

    // Calculate due date (14 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const loan = new Loan({
      user: req.user._id,
      book: bookId,
      dueDate,
    });

    await loan.save();

    // Update available copies
    book.availableCopies -= 1;
    await book.save();

    res.status(201).json({ message: 'Book borrowed successfully', loan });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Return a book
router.post('/return/:id', authenticate, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('book');

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan.user.toString() !== req.user._id.toString() && req.user.role !== 'Admin' && req.user.role !== 'Librarian') {
      return res.status(403).json({ message: 'Access denied' });
    }

    loan.returnDate = new Date();
    loan.status = 'Returned';
    loan.checkOverdue(); // Calculate fine if overdue

    await loan.save();

    // Update available copies
    loan.book.availableCopies += 1;
    await loan.book.save();

    res.json({ message: 'Book returned successfully', loan });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new loan (Admin/Librarian only)
router.post('/', authenticate, authorize('Admin', 'Librarian'), [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('bookId').isMongoId().withMessage('Valid book ID is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('status').optional().isIn(['Active', 'Returned', 'Overdue']).withMessage('Valid status is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, bookId, dueDate, status = 'Active' } = req.body;

    const book = await Book.findById(bookId);
    if (!book || !book.isActive || book.availableCopies <= 0) {
      return res.status(400).json({ message: 'Book not available' });
    }

    // Check if user already has this book borrowed
    const existingLoan = await Loan.findOne({
      user: userId,
      book: bookId,
      status: 'Active'
    });

    if (existingLoan) {
      return res.status(400).json({ message: 'User already has this book borrowed' });
    }

    const loan = new Loan({
      user: userId,
      book: bookId,
      dueDate: new Date(dueDate),
      status,
    });

    await loan.save();

    // Update available copies if status is Active
    if (status === 'Active') {
      book.availableCopies -= 1;
      await book.save();
    }

    const populatedLoan = await Loan.findById(loan._id)
      .populate('user', 'name email')
      .populate('book', 'title author isbn');

    res.status(201).json({ message: 'Loan created successfully', loan: populatedLoan });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all loans (Admin/Librarian only)
router.get('/', authenticate, authorize('Admin', 'Librarian'), async (req, res) => {
  try {
    const { search } = req.query;

    let aggregationPipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'books',
          localField: 'book',
          foreignField: '_id',
          as: 'book'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $unwind: '$book'
      },
      {
        $sort: { issueDate: -1 }
      }
    ];

    if (search) {
      aggregationPipeline.splice(4, 0, {
        $match: {
          $or: [
            { 'user.name': { $regex: search, $options: 'i' } },
            { 'user.email': { $regex: search, $options: 'i' } },
            { 'book.title': { $regex: search, $options: 'i' } },
          ]
        }
      });
    }

    const loans = await Loan.aggregate(aggregationPipeline);

    // Format the response to match the expected structure
    const formattedLoans = loans.map(loan => ({
      _id: loan._id,
      user: {
        _id: loan.user._id,
        name: loan.user.name,
        email: loan.user.email
      },
      book: {
        _id: loan.book._id,
        title: loan.book.title,
        author: loan.book.author,
        isbn: loan.book.isbn
      },
      issueDate: loan.issueDate,
      dueDate: loan.dueDate,
      returnDate: loan.returnDate,
      status: loan.status,
      fine: loan.fine
    }));

    res.json(formattedLoans);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update loan (Admin/Librarian only)
router.put('/:id', authenticate, authorize('Admin', 'Librarian'), [
  body('dueDate').optional().isISO8601().withMessage('Valid due date is required'),
  body('status').optional().isIn(['Active', 'Returned', 'Overdue']).withMessage('Valid status is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const loan = await Loan.findById(req.params.id).populate('book');
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const { dueDate, status } = req.body;

    if (dueDate) {
      loan.dueDate = new Date(dueDate);
    }

    if (status) {
      loan.status = status;
      // If status is changed to Returned, update return date and available copies
      if (status === 'Returned' && loan.status !== 'Returned') {
        loan.returnDate = new Date();
        loan.book.availableCopies += 1;
        await loan.book.save();
      }
      // If status is changed from Returned to Active, decrement available copies
      else if (status === 'Active' && loan.status === 'Returned') {
        loan.returnDate = undefined;
        loan.book.availableCopies -= 1;
        await loan.book.save();
      }
    }

    await loan.save();

    res.json({ message: 'Loan updated successfully', loan });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Extend due date (Admin/Librarian only)
router.put('/extend/:id', authenticate, authorize('Admin', 'Librarian'), async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Extend by 7 days
    loan.dueDate.setDate(loan.dueDate.getDate() + 7);
    await loan.save();

    res.json({ message: 'Due date extended successfully', loan });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
