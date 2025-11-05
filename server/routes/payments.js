const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Payment routes
router.post('/process', paymentController.processPayment);
router.get('/history', paymentController.getPaymentHistory);
router.get('/methods', paymentController.getPaymentMethods);
router.post('/refund', authorize('admin'), paymentController.initiateRefund);

module.exports = router;
