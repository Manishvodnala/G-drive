const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Ride booking
router.post('/request', rideController.requestRide);
router.post('/:rideId/accept', rideController.acceptRide);
router.put('/:rideId/status', rideController.updateRideStatus);
router.post('/:rideId/cancel', rideController.cancelRide);
router.post('/:rideId/rate', rideController.rateRide);

// Ride tracking
router.get('/:rideId', rideController.getRideDetails);
router.get('/:rideId/track', rideController.trackRide);

// Calculate fare estimate
router.post('/estimate-fare', rideController.estimateFare);

module.exports = router;
