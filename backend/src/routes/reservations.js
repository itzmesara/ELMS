const express = require('express');
const { body, validationResult } = require('express-validator');
const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get user's reservations
router.get('/my-reservations', authenticate, async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id, status: 'Pending' })
      .populate('book', 'title author isbn availableCopies fileUrl fileType')
      .sort({ reservationDate: -1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reserve a book
router.post('/', authenticate, [
  body('bookId').isMongoId().withMessage('Valid book ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookId } = req.body;
    const book = await Book.findById(bookId);

    if (!book || !book.isActive) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if user already has this book reserved
    const existingReservation = await Reservation.findOne({
      user: req.user._id,
      book: bookId,
      status: 'Pending'
    });

    if (existingReservation) {
      return res.status(400).json({ message: 'You already have this book reserved' });
    }

    // Get queue position
    const queueCount = await Reservation.countDocuments({ book: bookId, status: 'Pending' });
    const queuePosition = queueCount + 1;

    const reservation = new Reservation({
      user: req.user._id,
      book: bookId,
      queuePosition,
    });

    await reservation.save();
    res.status(201).json({ message: 'Book reserved successfully', reservation });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel reservation
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.user.toString() !== req.user._id.toString() && req.user.role !== 'Admin' && req.user.role !== 'Librarian') {
      return res.status(403).json({ message: 'Access denied' });
    }

    reservation.status = 'Cancelled';
    await reservation.save();

    // Update queue positions for remaining reservations
    await Reservation.updateMany(
      { book: reservation.book, status: 'Pending', queuePosition: { $gt: reservation.queuePosition } },
      { $inc: { queuePosition: -1 } }
    );

    res.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all reservations (Admin/Librarian only)
router.get('/', authenticate, authorize('Admin', 'Librarian'), async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('user', 'name email')
      .populate('book', 'title author isbn')
      .sort({ reservationDate: -1 });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Fulfill reservation (Admin/Librarian only)
router.put('/fulfill/:id', authenticate, authorize('Admin', 'Librarian'), async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation || reservation.status !== 'Pending') {
      return res.status(404).json({ message: 'Reservation not found or already fulfilled' });
    }

    reservation.status = 'Fulfilled';
    await reservation.save();

    // Update queue positions for remaining reservations
    await Reservation.updateMany(
      { book: reservation.book, status: 'Pending', queuePosition: { $gt: reservation.queuePosition } },
      { $inc: { queuePosition: -1 } }
    );

    res.json({ message: 'Reservation fulfilled successfully', reservation });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
