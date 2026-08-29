const express = require('express');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { authenticateToken } = require('../middleware/auth');

// Mock Stripe for development (bypass the hanging issue)
console.log('⚠️ Using MOCK Stripe for development');
const stripe = {
  paymentIntents: {
    create: async ({ amount, currency, metadata }) => {
      console.log(`📊 [MOCK] Creating payment intent for $${amount/100} ${currency}`);
      // FIXED: Properly formatted client_secret that Stripe.js accepts
      const mockId = 'pi_mock_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      const mockSecret = 'secret_' + Math.random().toString(36).substring(2, 10);
      return {
        id: mockId,
        client_secret: `${mockId}_${mockSecret}`,
        amount: amount,
        currency: currency,
        status: 'requires_payment_method'
      };
    },
    retrieve: async (paymentIntentId) => {
      console.log(`📊 [MOCK] Retrieving payment intent: ${paymentIntentId}`);
      return {
        id: paymentIntentId,
        amount: 100,
        currency: 'usd',
        status: 'succeeded',
        metadata: { userId: 'mock_user', subscriptionType: 'first_time' }
      };
    },
    confirm: async (paymentIntentId) => {
      console.log(`📊 [MOCK] Confirming payment: ${paymentIntentId}`);
      return {
        id: paymentIntentId,
        status: 'succeeded'
      };
    }
  }
};

const router = express.Router();

// Get subscription pricing
router.get('/pricing', (req, res) => {
  const pricing = {
    first_time: {
      student: 1.00,
      government_worker: 2.00,
      family: 2.00,
      landlord: 3.00
    },
    monthly_renewal: 1.00
  };
  
  res.json(pricing);
});

// Create payment intent
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { subscriptionType } = req.body;
    const user = req.user;

    let amount;
    if (subscriptionType === 'first_time') {
      if (user.role === 'student') amount = 100; // $1.00 in cents
      else if (user.role === 'government_worker' || user.role === 'family') amount = 200; // $2.00
      else if (user.role === 'landlord') amount = 300; // $3.00
    } else if (subscriptionType === 'monthly_renewal') {
      amount = 100; // $1.00 for all roles
    }

    if (!amount) {
      return res.status(400).json({ message: 'Invalid subscription type' });
    }

    // Create payment intent with Stripe (or mock)
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        userId: user._id.toString(),
        subscriptionType,
        userRole: user.role
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: amount / 100
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ message: 'Error creating payment intent' });
  }
});

// Confirm payment and update subscription
router.post('/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId, subscriptionType } = req.body;
    const user = req.user;

    // Retrieve payment intent from Stripe (or mock)
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    // Calculate subscription period
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    // Create payment record
    const payment = new Payment({
      user: user._id,
      amount: paymentIntent.amount / 100 || 1.00,
      subscriptionType,
      stripePaymentIntentId: paymentIntentId,
      status: 'completed',
      subscriptionPeriod: {
        startDate,
        endDate
      }
    });

    await payment.save();

    // Update user subscription status
    await User.findByIdAndUpdate(user._id, {
      subscriptionStatus: 'active',
      subscriptionExpiryDate: endDate,
      firstTimePayment: subscriptionType === 'first_time' ? false : user.firstTimePayment
    });

    res.json({
      message: 'Payment confirmed and subscription activated',
      subscriptionExpiryDate: endDate
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ message: 'Error confirming payment' });
  }
});

// Get user's payment history
router.get('/payment-history', authenticateToken, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(payments);
  } catch (error) {
    console.error('Payment history fetch error:', error);
    res.status(500).json({ message: 'Error fetching payment history' });
  }
});

module.exports = router;