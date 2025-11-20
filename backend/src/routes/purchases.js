const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const auth = require('../middleware/auth');

// Get user's purchases
router.get('/my-purchases', auth, async (req, res) => {
  try {
    const purchases = await Purchase.find({ user: req.user.id })
      .populate('book')
      .sort({ purchaseDate: -1 });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new purchase
router.post('/', auth, async (req, res) => {
  try {
    const { bookId } = req.body;

    // Check if user already purchased this book
    const existingPurchase = await Purchase.findOne({
      user: req.user.id,
      book: bookId
    });

    if (existingPurchase) {
      return res.status(400).json({ message: 'Book already purchased' });
    }

    // Get book details for price
    const Book = require('../models/Book');
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const purchase = new Purchase({
      user: req.user.id,
      book: bookId,
      price: book.price
    });

    const savedPurchase = await purchase.save();
    await savedPurchase.populate('book');
    res.status(201).json(savedPurchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all purchases (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const purchases = await Purchase.find()
      .populate('user', 'name email')
      .populate('book', 'title author price')
      .sort({ purchaseDate: -1 });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
