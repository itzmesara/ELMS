const express = require('express');
const PDFDocument = require('pdfkit');
const Loan = require('../models/Loan');
const Book = require('../models/Book');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics (Admin/Librarian only)
router.get('/dashboard', authenticate, authorize('Admin', 'Librarian'), async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments({ isActive: true });
    const activeLoans = await Loan.countDocuments({ status: 'Active' });
    const overdueLoans = await Loan.countDocuments({ status: 'Overdue' });
    const pendingReservations = await Reservation.countDocuments({ status: 'Pending' });

    // Most borrowed books
    const mostBorrowed = await Loan.aggregate([
      { $match: { status: { $in: ['Active', 'Returned'] } } },
      { $group: { _id: '$book', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: '$book' },
      { $project: { title: '$book.title', author: '$book.author', count: 1 } }
    ]);

    // User activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userActivity = await Loan.aggregate([
      { $match: { issueDate: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$user', loans: { $sum: 1 } } },
      { $sort: { loans: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $project: { name: '$user.name', email: '$user.email', loans: 1 } }
    ]);

    res.json({
      totalBooks,
      totalUsers,
      activeLoans,
      overdueLoans,
      pendingReservations,
      mostBorrowed,
      userActivity
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get loan statistics report
router.get('/loans', authenticate, authorize('Admin', 'Librarian'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let matchQuery = {};

    if (startDate && endDate) {
      matchQuery.issueDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const loans = await Loan.find(matchQuery)
      .populate('user', 'name email')
      .populate('book', 'title author isbn')
      .sort({ issueDate: -1 });

    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user statistics report
router.get('/users', authenticate, authorize('Admin', 'Librarian'), async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select('name email role createdAt')
      .sort({ createdAt: -1 });

    // Add loan count for each user
    const usersWithLoans = await Promise.all(
      users.map(async (user) => {
        const loanCount = await Loan.countDocuments({ user: user._id });
        return {
          ...user.toObject(),
          totalLoans: loanCount
        };
      })
    );

    res.json(usersWithLoans);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get basic statistics for reports page
router.get('/stats', authenticate, authorize('Admin', 'Librarian'), async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments({ isActive: true });
    const activeLoans = await Loan.countDocuments({ status: 'Active' });

    res.json({
      totalBooks,
      totalUsers,
      activeLoans
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get popular books report
router.get('/popular-books', authenticate, authorize('Admin', 'Librarian'), async (req, res) => {
  try {
    const popularBooks = await Loan.aggregate([
      { $match: { status: { $in: ['Active', 'Returned'] } } },
      { $group: { _id: '$book', borrowCount: { $sum: 1 } } },
      { $sort: { borrowCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: '$book' },
      { $project: { title: '$book.title', author: '$book.author', borrowCount: 1 } }
    ]);

    res.json(popularBooks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user activity report
router.get('/user-activity', authenticate, authorize('Admin', 'Librarian'), async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('name email');

    const userActivity = await Promise.all(
      users.map(async (user) => {
        const totalBorrowed = await Loan.countDocuments({ user: user._id });
        const currentLoans = await Loan.countDocuments({ user: user._id, status: 'Active' });
        return {
          name: user.name,
          email: user.email,
          totalBorrowed,
          currentLoans
        };
      })
    );

    res.json(userActivity);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Export reports as CSV (simplified - in real app, use a library like csv-writer)
router.get('/export/:type', authenticate, authorize('Admin', 'Librarian'), async (req, res) => {
  try {
    const { type } = req.params;
    let data = [];
    let filename = '';

    switch (type) {
      case 'popular-books':
        data = await Loan.aggregate([
          { $match: { status: { $in: ['Active', 'Returned'] } } },
          { $group: { _id: '$book', borrowCount: { $sum: 1 } } },
          { $sort: { borrowCount: -1 } },
          {
            $lookup: {
              from: 'books',
              localField: '_id',
              foreignField: '_id',
              as: 'book'
            }
          },
          { $unwind: '$book' },
          { $project: { title: '$book.title', author: '$book.author', borrowCount: 1 } }
        ]);
        filename = 'popular_books_report.csv';
        break;
      case 'user-activity':
        const users = await User.find({ isActive: true }).select('name email');
        data = await Promise.all(
          users.map(async (user) => {
            const totalBorrowed = await Loan.countDocuments({ user: user._id });
            const currentLoans = await Loan.countDocuments({ user: user._id, status: 'Active' });
            return {
              name: user.name,
              email: user.email,
              totalBorrowed,
              currentLoans
            };
          })
        );
        filename = 'user_activity_report.csv';
        break;
      case 'loans':
        data = await Loan.find()
          .populate('user', 'name email')
          .populate('book', 'title author isbn');
        filename = 'loans_report.csv';
        break;
      case 'books':
        data = await Book.find({ isActive: true });
        filename = 'books_report.csv';
        break;
      case 'users':
        data = await User.find({ isActive: true }).select('name email role createdAt');
        filename = 'users_report.csv';
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    // Simple CSV generation (in production, use proper CSV library)
    const csvData = data.map(item => Object.values(item).join(',')).join('\n');
    const csvHeaders = Object.keys(data[0] || {}).join(',');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(`${csvHeaders}\n${csvData}`);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Export active loans as PDF
router.get('/export/active-loans/pdf', authenticate, authorize('Admin', 'Librarian'), async (req, res) => {
  try {
    const activeLoans = await Loan.find({ status: 'Active' })
      .populate('user', 'name email')
      .populate('book', 'title author isbn')
      .sort({ issueDate: -1 });

    const doc = new PDFDocument();
    const filename = 'active_loans_report.pdf';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Title
    doc.fontSize(20).text('Active Loans Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Table headers
    const tableTop = 150;
    const itemHeight = 25;
    const margin = 30;

    // Column positions with better spacing (removed author and issue date columns)
    const colPositions = {
      name: margin,
      email: margin + 100,
      title: margin + 200,
      dueDate: margin + 330
    };

    doc.fontSize(10).text('User Name', colPositions.name, tableTop);
    doc.text('Email', colPositions.email, tableTop);
    doc.text('Book Title', colPositions.title, tableTop);
    doc.text('Due Date', colPositions.dueDate, tableTop);

    // Draw header line
    doc.moveTo(margin, tableTop + 15).lineTo(780, tableTop + 15).stroke();

    let yPosition = tableTop + itemHeight;

    activeLoans.forEach((loan, index) => {
      if (yPosition > 700) { // New page if needed
        doc.addPage();
        yPosition = 50;
      }

      // Truncate long text to fit columns
      const userName = loan.user.name.length > 15 ? loan.user.name.substring(0, 15) + '...' : loan.user.name;
      const userEmail = loan.user.email.length > 20 ? loan.user.email.substring(0, 20) + '...' : loan.user.email;
      const bookTitle = loan.book.title.length > 30 ? loan.book.title.substring(0, 30) + '...' : loan.book.title;

      // Format due date as DD/MM/YYYY
      const dueDate = new Date(loan.dueDate);
      const formattedDueDate = `${dueDate.getDate().toString().padStart(2, '0')}/${(dueDate.getMonth() + 1).toString().padStart(2, '0')}/${dueDate.getFullYear()}`;

      doc.fontSize(9);
      doc.text(userName, colPositions.name, yPosition);
      doc.text(userEmail, colPositions.email, yPosition);
      doc.text(bookTitle, colPositions.title, yPosition);
      doc.text(formattedDueDate, colPositions.dueDate, yPosition, { width: 80, align: 'left' });

      yPosition += itemHeight;
    });

    // Summary
    doc.moveDown(2);
    doc.fontSize(12).text(`Total Active Loans: ${activeLoans.length}`, margin);

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
