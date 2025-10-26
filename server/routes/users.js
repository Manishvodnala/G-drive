const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/location', userController.updateLocation);

// Ride history
router.get('/rides', userController.getRideHistory);
router.get('/rides/:rideId', userController.getRideDetails);

module.exports = router;
