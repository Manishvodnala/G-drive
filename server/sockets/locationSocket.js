const Driver = require('../models/Driver');
const Ride = require('../models/Ride');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join user/driver specific room
    socket.on('join', (data) => {
      const { userId, userType } = data;
      const room = `${userType}_${userId}`;
      socket.join(room);
      console.log(`${userType} ${userId} joined room: ${room}`);
    });

    // Driver location update
    socket.on('updateLocation', async (data) => {
      try {
        const { driverId, latitude, longitude, heading } = data;

        // Update driver location in database
        await Driver.findByIdAndUpdate(driverId, {
          location: {
            type: 'Point',
            coordinates: [longitude, latitude],
            heading: heading || 0
          }
        });

        // Get driver's current ride
        const driver = await Driver.findById(driverId).populate('currentRide');

        if (driver && driver.currentRide) {
          // Send location update to rider
          io.to(`user_${driver.currentRide.rider}`).emit('driverLocationUpdate', {
            driverId,
            location: {
              latitude,
              longitude,
              heading
            }
          });

          // Update ride route
          await Ride.findByIdAndUpdate(driver.currentRide._id, {
            $push: {
              route: {
                type: 'Point',
                coordinates: [longitude, latitude],
                timestamp: new Date()
              }
            }
          });
        }

        // Broadcast to nearby riders looking for drivers
        socket.broadcast.emit('nearbyDriverUpdate', {
          driverId,
          location: {
            latitude,
            longitude
          },
          isAvailable: driver.isAvailable
        });
      } catch (error) {
        console.error('Error updating location:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // Rider location update (for tracking during ride)
    socket.on('updateRiderLocation', async (data) => {
      try {
        const { riderId, latitude, longitude } = data;

        // Broadcast to driver if there's an active ride
        const activeRide = await Ride.findOne({
          rider: riderId,
          status: { $in: ['accepted', 'arrived', 'in-progress'] }
        });

        if (activeRide && activeRide.driver) {
          io.to(`driver_${activeRide.driver}`).emit('riderLocationUpdate', {
            riderId,
            location: {
              latitude,
              longitude
            }
          });
        }
      } catch (error) {
        console.error('Error updating rider location:', error);
      }
    });

    // Request nearby drivers
    socket.on('getNearbyDrivers', async (data) => {
      try {
        const { latitude, longitude, vehicleType, maxDistance } = data;

        const drivers = await Driver.find({
          isAvailable: true,
          isActive: true,
          isVerified: true,
          'vehicleInfo.type': vehicleType || 'sedan',
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
              },
              $maxDistance: maxDistance || 5000
            }
          }
        }).limit(20);

        socket.emit('nearbyDrivers', {
          drivers: drivers.map(d => ({
            id: d._id,
            name: d.name,
            vehicleInfo: d.vehicleInfo,
            location: d.location,
            rating: d.rating
          }))
        });
      } catch (error) {
        console.error('Error getting nearby drivers:', error);
        socket.emit('error', { message: 'Failed to get nearby drivers' });
      }
    });

    // Driver accepts ride notification
    socket.on('acceptRide', (data) => {
      const { rideId, riderId, driverInfo } = data;
      io.to(`user_${riderId}`).emit('rideAccepted', {
        rideId,
        driver: driverInfo
      });
    });

    // Ride status updates
    socket.on('rideStatusUpdate', (data) => {
      const { rideId, riderId, driverId, status } = data;

      io.to(`user_${riderId}`).emit('rideStatusUpdate', {
        rideId,
        status
      });

      if (driverId) {
        io.to(`driver_${driverId}`).emit('rideStatusUpdate', {
          rideId,
          status
        });
      }
    });

    // Chat messages (optional feature)
    socket.on('sendMessage', (data) => {
      const { rideId, from, to, message } = data;
      io.to(`${to.type}_${to.id}`).emit('newMessage', {
        rideId,
        from,
        message,
        timestamp: new Date()
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};
