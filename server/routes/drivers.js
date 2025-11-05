const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication and must belong to a driver (admins allowed for oversight)
router.use(protect);
router.use(authorize('driver', 'admin'));

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
