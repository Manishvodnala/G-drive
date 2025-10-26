const Ride = require('../models/Ride');
const Driver = require('../models/Driver');

/**
 * Payment Controller
 * This is a placeholder for payment integration.
 * In production, you would integrate with payment gateways like:
 * - Stripe
 * - PayPal
 * - Razorpay
 * - Square
 */

// Process payment for a ride
exports.processPayment = async (req, res) => {
  try {
    const { rideId, paymentMethod, paymentDetails } = req.body;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    // Verify authorization
    if (ride.rider.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (ride.payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed'
      });
    }

    // TODO: Integrate with actual payment gateway
    // Example with Stripe:
    /*
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(ride.fare.total * 100), // Amount in cents
      currency: 'usd',
      payment_method: paymentDetails.paymentMethodId,
      confirm: true,
    });
    */

    // Simulated payment processing
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

    // Update ride payment status
    ride.payment.method = paymentMethod;
    ride.payment.status = 'completed';
    ride.payment.transactionId = transactionId;
    await ride.save();

    // Update driver earnings (already done in ride completion, but can be verified here)
    const driver = await Driver.findById(ride.driver);
    if (driver) {
      // Additional payment processing logic if needed
      console.log(`Payment of $${ride.fare.total} processed for driver ${driver._id}`);
    }

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        transactionId,
        amount: ride.fare.total,
        status: 'completed'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
      error: error.message
    });
  }
};

// Get payment history for a user
exports.getPaymentHistory = async (req, res) => {
  try {
    const rides = await Ride.find({
      rider: req.user._id,
      'payment.status': 'completed'
    })
      .select('fare payment createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

    const totalSpent = rides.reduce((sum, ride) => sum + ride.fare.total, 0);

    res.json({
      success: true,
      data: {
        payments: rides,
        totalSpent,
        count: rides.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history',
      error: error.message
    });
  }
};

// Initiate refund (admin or system)
exports.initiateRefund = async (req, res) => {
  try {
    const { rideId, reason } = req.body;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found'
      });
    }

    if (ride.payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'No payment to refund'
      });
    }

    // TODO: Integrate with actual payment gateway for refund
    /*
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const refund = await stripe.refunds.create({
      payment_intent: ride.payment.transactionId,
    });
    */

    // Simulated refund
    ride.payment.status = 'refunded';
    ride.payment.refundReason = reason;
    ride.payment.refundedAt = new Date();
    await ride.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: ride.payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing refund',
      error: error.message
    });
  }
};

// Get payment methods for a user
exports.getPaymentMethods = async (req, res) => {
  try {
    // TODO: Fetch saved payment methods from payment gateway
    // This would typically integrate with Stripe, PayPal, etc.

    res.json({
      success: true,
      data: {
        methods: [
          { id: 'cash', type: 'cash', name: 'Cash' },
          // In production, fetch from payment gateway
          // { id: 'card_123', type: 'card', last4: '4242', brand: 'visa' }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment methods',
      error: error.message
    });
  }
};

module.exports = exports;
