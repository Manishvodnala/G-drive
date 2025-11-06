const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const User = require('../models/User');
const { getDistance } = require('geolib');

// Calculate fare based on distance and vehicle type
const calculateFare = (distance, vehicleType) => {
  const baseFares = {
    sedan: 3,
    suv: 5,
    luxury: 10,
    van: 7
  };

  const perKmRates = {
    sedan: 1.5,
    suv: 2,
    luxury: 3.5,
    van: 2.5
  };

  const baseFare = baseFares[vehicleType] || baseFares.sedan;
  const perKmRate = perKmRates[vehicleType] || perKmRates.sedan;
  const distanceKm = distance / 1000; // Convert meters to km

  const total = baseFare + (distanceKm * perKmRate);

  return {
    baseFare,
    perKmRate,
    distance: distanceKm,
    total: parseFloat(total.toFixed(2))
  };
};

// Find nearby available drivers
const findNearbyDrivers = async (location, vehicleType, maxDistance = 5000) => {
  try {
    const drivers = await Driver.find({
      isAvailable: true,
      isActive: true,
      isVerified: true,
      currentRide: null,
      'vehicleInfo.type': vehicleType,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: location.coordinates
          },
          $maxDistance: maxDistance
        }
      }
    }).limit(10);

    return drivers;
  } catch (error) {
    console.error('Error finding nearby drivers:', error);
    return [];
  }
};

// Request a ride
exports.requestRide = async (req, res) => {
  try {
    const {
      pickupLocation,
      dropoffLocation,
      vehicleType
    } = req.body;

    if (!pickupLocation || !dropoffLocation) {
      return res.status(400).json({
        success: false,
        message: 'Pickup and dropoff locations are required'
      });
    }

    // Calculate distance
    const distance = getDistance(
      { latitude: pickupLocation.coordinates[1], longitude: pickupLocation.coordinates[0] },
      { latitude: dropoffLocation.coordinates[1], longitude: dropoffLocation.coordinates[0] }
    );

    // Calculate fare
    const fare = calculateFare(distance, vehicleType || 'sedan');

    // Create ride
    const ride = await Ride.create({
      rider: req.user._id,
      pickupLocation: {
        type: 'Point',
        coordinates: pickupLocation.coordinates,
        address: pickupLocation.address
      },
      dropoffLocation: {
        type: 'Point',
        coordinates: dropoffLocation.coordinates,
        address: dropoffLocation.address
      },
      vehicleType: vehicleType || 'sedan',
      fare,
      status: 'requested'
    });

    // Find nearby drivers
    const nearbyDrivers = await findNearbyDrivers(pickupLocation, vehicleType || 'sedan');

    // Emit ride request to nearby drivers via socket
    const io = req.app.get('io');
    nearbyDrivers.forEach(driver => {
      io.to(`driver_${driver._id}`).emit('newRideRequest', {
        rideId: ride._id,
        pickup: pickupLocation,
        dropoff: dropoffLocation,
        fare: fare.total,
        distance: fare.distance
      });
    });

    res.status(201).json({
      success: true,
      data: ride,
      nearbyDriversCount: nearbyDrivers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error requesting ride',
      error: error.message
    });
  }
};

// Accept a ride (driver)
exports.acceptRide = async (req, res) => {
  try {
    const { rideId } = req.params;

    // Check if user is a driver
    if (req.user.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Only drivers can accept rides'
      });
    }

    const driver = await Driver.findById(req.user._id);

    // Check if driver is available
    if (!driver.isAvailable || driver.currentRide) {
      return res.status(400).json({
        success: false,
        message: 'Driver is not available'
      });
    }

    // Find the ride
    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    if (ride.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: 'Ride is no longer available'
      });
    }

    // Update ride
    ride.driver = driver._id;
    ride.status = 'accepted';
    ride.acceptedAt = new Date();
    await ride.save();

    // Update driver
    driver.currentRide = ride._id;
    driver.isAvailable = false;
    await driver.save();

    // Populate rider info
    await ride.populate('rider', 'name phone location');

    // Emit ride accepted event
    const io = req.app.get('io');
    io.to(`user_${ride.rider._id}`).emit('rideAccepted', {
      rideId: ride._id,
      driver: {
        id: driver._id,
        name: driver.name,
        phone: driver.phone,
        vehicleInfo: driver.vehicleInfo,
        location: driver.location,
        rating: driver.rating
      }
    });

    res.json({
      success: true,
      data: ride
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error accepting ride',
      error: error.message
    });
  }
};

// Update ride status
exports.updateRideStatus = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { status } = req.body;

    const validStatuses = ['arrived', 'in-progress', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    const userId = req.user._id.toString();
    const rideDriverId = ride.driver
      ? (ride.driver._id ? ride.driver._id.toString() : ride.driver.toString())
      : null;
    const rideRiderId = ride.rider
      ? (ride.rider._id ? ride.rider._id.toString() : ride.rider.toString())
      : null;

    const isDriver = rideDriverId && req.user.role === 'driver' && rideDriverId === userId;
    const isRider = rideRiderId === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isDriver && !isRider && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if ((status === 'arrived' || status === 'in-progress') && !isDriver && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned driver can update this status'
      });
    }

    // Update status and timestamps
    ride.status = status;
    if (status === 'arrived') ride.arrivedAt = new Date();
    if (status === 'in-progress') ride.startedAt = new Date();
    if (status === 'completed') {
      if (!rideDriverId) {
        return res.status(400).json({
          success: false,
          message: 'Ride has no assigned driver'
        });
      }
      ride.completedAt = new Date();
      ride.payment.status = 'completed';

      // Update driver stats
      const driver = await Driver.findById(ride.driver);
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Assigned driver not found'
        });
      }
      driver.totalRides += 1;
      driver.currentRide = null;
      driver.isAvailable = true;
      driver.earnings.total += ride.fare.total;
      driver.earnings.daily += ride.fare.total;
      driver.earnings.weekly += ride.fare.total;
      await driver.save();

      // Update user stats
      const user = await User.findById(ride.rider);
      user.totalRides += 1;
      await user.save();
    }

    await ride.save();

    // Emit status update
    const io = req.app.get('io');
    io.to(`user_${ride.rider}`).emit('rideStatusUpdate', {
      rideId: ride._id,
      status: ride.status
    });

    if (ride.driver) {
      io.to(`driver_${ride.driver}`).emit('rideStatusUpdate', {
        rideId: ride._id,
        status: ride.status
      });
    }

    res.json({
      success: true,
      data: ride
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating ride status',
      error: error.message
    });
  }
};

// Cancel ride
exports.cancelRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { reason } = req.body;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check authorization
    const isRider = ride.rider.toString() === req.user._id.toString();
    const isDriver = ride.driver && ride.driver.toString() === req.user._id.toString();

    if (!isRider && !isDriver) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (ride.status === 'completed' || ride.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this ride'
      });
    }

    // Update ride
    ride.status = 'cancelled';
    ride.cancelledAt = new Date();
    ride.cancelledBy = req.user.role === 'driver' ? 'driver' : 'rider';
    ride.cancellationReason = reason || 'No reason provided';
    await ride.save();

    // Update driver availability if assigned
    if (ride.driver) {
      const driver = await Driver.findById(ride.driver);
      driver.currentRide = null;
      driver.isAvailable = true;
      await driver.save();
    }

    // Emit cancellation event
    const io = req.app.get('io');
    io.to(`user_${ride.rider}`).emit('rideCancelled', {
      rideId: ride._id,
      cancelledBy: ride.cancelledBy
    });

    if (ride.driver) {
      io.to(`driver_${ride.driver}`).emit('rideCancelled', {
        rideId: ride._id,
        cancelledBy: ride.cancelledBy
      });
    }

    res.json({
      success: true,
      data: ride
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling ride',
      error: error.message
    });
  }
};

// Rate ride
exports.rateRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { rating, ratingType } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const ride = await Ride.findById(rideId);

    if (!ride || ride.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot rate this ride'
      });
    }

    // Check authorization and update rating
    if (req.user.role === 'driver' && ride.driver.toString() === req.user._id.toString()) {
      ride.rating.riderRating = rating;

      // Update rider's rating
      const user = await User.findById(ride.rider);
      const avgRating = ((user.rating * user.totalRides) + rating) / (user.totalRides + 1);
      user.rating = avgRating;
      await user.save();
    } else if (ride.rider.toString() === req.user._id.toString()) {
      ride.rating.driverRating = rating;

      // Update driver's rating
      const driver = await Driver.findById(ride.driver);
      const avgRating = ((driver.rating * driver.totalRides) + rating) / (driver.totalRides + 1);
      driver.rating = avgRating;
      await driver.save();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await ride.save();

    res.json({
      success: true,
      data: ride
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rating ride',
      error: error.message
    });
  }
};

// Get ride details
exports.getRideDetails = async (req, res) => {
  try {
    const { rideId } = req.params;

    const ride = await Ride.findById(rideId)
      .populate('rider', 'name phone rating')
      .populate('driver', 'name phone vehicleInfo rating location');

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Check authorization
    const isRider = ride.rider._id.toString() === req.user._id.toString();
    const isDriver = ride.driver && ride.driver._id.toString() === req.user._id.toString();

    if (!isRider && !isDriver && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.json({
      success: true,
      data: ride
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ride details',
      error: error.message
    });
  }
};

// Track ride in real-time
exports.trackRide = async (req, res) => {
  try {
    const { rideId } = req.params;

    const ride = await Ride.findById(rideId)
      .populate('driver', 'name phone vehicleInfo location');

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    const userId = req.user._id.toString();
    const rideDriverId = ride.driver
      ? (ride.driver._id ? ride.driver._id.toString() : ride.driver.toString())
      : null;
    const rideRiderId = ride.rider
      ? (ride.rider._id ? ride.rider._id.toString() : ride.rider.toString())
      : null;

    const isDriver = rideDriverId && req.user.role === 'driver' && rideDriverId === userId;
    const isRider = rideRiderId === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isDriver && !isRider && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.json({
      success: true,
      data: {
        rideId: ride._id,
        status: ride.status,
        driverLocation: ride.driver ? ride.driver.location : null,
        pickupLocation: ride.pickupLocation,
        dropoffLocation: ride.dropoffLocation
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error tracking ride',
      error: error.message
    });
  }
};

// Estimate fare
exports.estimateFare = async (req, res) => {
  try {
    const { pickupLocation, dropoffLocation, vehicleType } = req.body;

    if (!pickupLocation || !dropoffLocation) {
      return res.status(400).json({
        success: false,
        message: 'Pickup and dropoff locations are required'
      });
    }

    const distance = getDistance(
      { latitude: pickupLocation.coordinates[1], longitude: pickupLocation.coordinates[0] },
      { latitude: dropoffLocation.coordinates[1], longitude: dropoffLocation.coordinates[0] }
    );

    const fare = calculateFare(distance, vehicleType || 'sedan');

    res.json({
      success: true,
      data: fare
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error estimating fare',
      error: error.message
    });
  }
};
