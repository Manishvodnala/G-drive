const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  pickupLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  dropoffLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['requested', 'accepted', 'arrived', 'in-progress', 'completed', 'cancelled'],
    default: 'requested'
  },
  vehicleType: {
    type: String,
    enum: ['sedan', 'suv', 'luxury', 'van'],
    default: 'sedan'
  },
  fare: {
    baseFare: {
      type: Number,
      default: 0
    },
    perKmRate: {
      type: Number,
      default: 0
    },
    distance: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'wallet'],
      default: 'cash'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    transactionId: String
  },
  rating: {
    riderRating: {
      type: Number,
      min: 0,
      max: 5
    },
    driverRating: {
      type: Number,
      min: 0,
      max: 5
    }
  },
  route: [{
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number],
    timestamp: Date
  }],
  requestedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: Date,
  arrivedAt: Date,
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancelledBy: {
    type: String,
    enum: ['rider', 'driver', 'system']
  },
  cancellationReason: String
}, {
  timestamps: true
});

// Indexes
rideSchema.index({ rider: 1, status: 1 });
rideSchema.index({ driver: 1, status: 1 });
rideSchema.index({ status: 1 });
rideSchema.index({ pickupLocation: '2dsphere' });
rideSchema.index({ dropoffLocation: '2dsphere' });

module.exports = mongoose.model('Ride', rideSchema);
