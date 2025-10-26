const User = require('../models/User');
const Ride = require('../models/Ride');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, profileImage } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (profileImage) updateData.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Update user location
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
          address: address || ''
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      data: user.location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message
    });
  }
};

// Get ride history
exports.getRideHistory = async (req, res) => {
  try {
    const rides = await Ride.find({ rider: req.user._id })
      .populate('driver', 'name phone vehicleInfo rating')
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

// Get specific ride details
exports.getRideDetails = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      _id: req.params.rideId,
      rider: req.user._id
    }).populate('driver', 'name phone vehicleInfo rating');

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
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
