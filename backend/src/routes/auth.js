const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const JWT_SECRET="abcdefghi123456789"


const router = express.Router();



// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('password').exists().withMessage('Password is required'),
], async (req, res) => {
  try {
    console.log('Login attempt for email:', req.body.email);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    console.log('User found:', user ? user.email : 'No user found');

    if (!user) {
      console.log('No user found for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      console.log('User account deactivated:', email);
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    console.log('JWT_SECRET:', JWT_SECRET);
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    console.log('Login successful for user:', email);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user (alias for /profile)
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (Admin and Librarian only)
router.get('/users', authenticate, async (req, res) => {
  try {
    if (!['Admin', 'Librarian'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { search } = req.query;
    let query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).select('-password');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add user (Admin only)
router.post('/add-user', authenticate, [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email'),
  body('role').isIn(['User', 'Librarian', 'Admin']).withMessage('Invalid role'),
], async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ name, email, password: 'vsb@123456', role });
    await user.save();

    res.status(201).json({
      message: 'User added successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user role (Admin only)
router.put('/users/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.put('/change-password', authenticate, [
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    req.user.password = newPassword;
    await req.user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
