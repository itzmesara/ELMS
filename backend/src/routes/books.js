const express = require('express');
const { body, validationResult } = require('express-validator');
const Book = require('../models/Book');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all books with search and filter
router.get('/', async (req, res) => {
  try {
    const { search, category, author, year, page = 1, limit = 10 } = req.query;
    let query = { isActive: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) query.category = { $regex: category, $options: 'i' };
    if (author) query.author = { $regex: author, $options: 'i' };
    if (year) query.year = parseInt(year);

    const books = await Book.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Book.countDocuments(query);

    res.json({
      books,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalBooks: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get book by ID
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book || !book.isActive) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new book (Admin/Librarian only)
router.post('/', authenticate, authorize('Admin', 'Librarian'), [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('author').trim().isLength({ min: 1 }).withMessage('Author is required'),
  body('isbn').trim().isLength({ min: 10 }).withMessage('Valid ISBN is required'),
  body('category').trim().isLength({ min: 1 }).withMessage('Category is required'),
  body('year').isInt({ min: 1000, max: new Date().getFullYear() }).withMessage('Valid year is required'),
  body('fileUrl').optional().trim().isLength({ min: 1 }).withMessage('File URL is required'),
  body('fileType').isIn(['PDF', 'EPUB', 'Audio', 'Video']).withMessage('Valid file type is required'),
  body('totalCopies').isInt({ min: 1 }).withMessage('Total copies must be at least 1'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const book = new Book(req.body);
    await book.save();
    res.status(201).json({ message: 'Book added successfully', book });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'ISBN already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Update book (Admin/Librarian only)
router.put('/:id', authenticate, authorize('Admin', 'Librarian'), async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json({ message: 'Book updated successfully', book });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete book (Admin only)
router.delete('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
