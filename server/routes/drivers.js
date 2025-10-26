const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Driver profile routes
router.get('/profile', driverController.getProfile);
router.put('/profile', driverController.updateProfile);
router.put('/location', driverController.updateLocation);
router.put('/availability', driverController.toggleAvailability);

// Ride management
router.get('/rides', driverController.getRideHistory);
router.get('/current-ride', driverController.getCurrentRide);
router.get('/earnings', driverController.getEarnings);

module.exports = router;
