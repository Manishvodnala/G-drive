const Driver = require('../models/Driver');
const Ride = require('../models/Ride');

// Get driver profile
exports.getProfile = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id).populate('currentRide');

    res.json({
      success: true,
      data: driver
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Update driver profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, profileImage, vehicleInfo } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (profileImage) updateData.profileImage = profileImage;
    if (vehicleInfo) updateData.vehicleInfo = vehicleInfo;

    const driver = await Driver.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: driver
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Update driver location
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, address, heading } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const driver = await Driver.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
          address: address || '',
          heading: heading || 0
        }
      },
      { new: true }
    );

    // Emit location update via socket if driver is available
    if (driver.isAvailable) {
      const io = req.app.get('io');
      io.emit('driverLocationUpdate', {
        driverId: driver._id,
        location: driver.location
      });
    }

    res.json({
      success: true,
      data: driver.location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message
    });
  }
};

// Toggle driver availability
exports.toggleAvailability = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id);

    driver.isAvailable = !driver.isAvailable;
    await driver.save();

    const io = req.app.get('io');
    io.emit('driverAvailabilityChanged', {
      driverId: driver._id,
      isAvailable: driver.isAvailable
    });

    res.json({
      success: true,
      data: {
        isAvailable: driver.isAvailable
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling availability',
      error: error.message
    });
  }
};

// Get ride history
exports.getRideHistory = async (req, res) => {
  try {
    const rides = await Ride.find({ driver: req.user._id })
      .populate('rider', 'name phone rating')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: rides.length,
      data: rides
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching ride history',
      error: error.message
    });
  }
};

// Get current ride
exports.getCurrentRide = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id).populate({
      path: 'currentRide',
      populate: {
        path: 'rider',
        select: 'name phone rating'
      }
    });

    res.json({
      success: true,
      data: driver.currentRide
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching current ride',
      error: error.message
    });
  }
};

// Get earnings
exports.getEarnings = async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id);

    res.json({
      success: true,
      data: driver.earnings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching earnings',
      error: error.message
    });
  }
};
