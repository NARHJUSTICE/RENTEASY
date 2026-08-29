import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here');

// API Base URL
const API_BASE_URL = 'http://localhost:5001/api';

const PaymentForm = ({ pricing, onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');

  const subscriptionType = user?.firstTimePayment ? 'first_time' : 'monthly_renewal';
  const amount = subscriptionType === 'first_time' 
    ? pricing?.first_time?.[user?.role] 
    : pricing?.monthly_renewal;

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/subscriptions/create-payment-intent`, {
          subscriptionType
        });
        setClientSecret(response.data.clientSecret);
      } catch (error) {
        toast.error('Failed to initialize payment');
      }
    };

    if (user && pricing) {
      createPaymentIntent();
    }
  }, [user, subscriptionType, pricing]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: user.name,
          email: user.email,
        },
      }
    });

    if (error) {
      toast.error(error.message);
      setIsProcessing(false);
    } else if (paymentIntent.status === 'succeeded') {
      try {
        const response = await axios.post(`${API_BASE_URL}/subscriptions/confirm-payment`, {
          paymentIntentId: paymentIntent.id,
          subscriptionType
        });
        
        toast.success('Payment successful! Subscription activated.');
        onPaymentSuccess();
      } catch (error) {
        toast.error('Payment succeeded but failed to update subscription');
      }
      setIsProcessing(false);
    }
  };

  // Show loading if amount is not calculated yet
  if (amount === undefined || amount === null) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium">
            {subscriptionType === 'first_time' ? 'First Time' : 'Monthly Renewal'} Subscription
          </span>
          <span className="text-2xl font-bold text-blue-600">${amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="border border-gray-300 rounded-lg p-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        <CreditCard className="w-5 h-5 mr-2" />
        {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
};

const SubscriptionPrompt = ({ onSubscriptionComplete }) => {
  const { user } = useAuth();
  const [pricing, setPricing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_BASE_URL}/subscriptions/pricing`);
        setPricing(response.data);
      } catch (error) {
        toast.error('Failed to load pricing information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPricing();
  }, []);

  // Show loading spinner while fetching pricing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!pricing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Pricing</h2>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const subscriptionType = user?.firstTimePayment ? 'first_time' : 'monthly_renewal';
  const amount = subscriptionType === 'first_time' 
    ? pricing?.first_time?.[user?.role] 
    : pricing?.monthly_renewal;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Subscription Required</h2>
          <p className="text-gray-600 mt-2">
            To access RentEasy features, please complete your subscription payment.
          </p>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What you get:</h3>
          <ul className="space-y-3">
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-gray-700">Browse available properties</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-gray-700">View property details and photos</span>
            </li>
            <li className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-gray-700">Contact property owners</span>
            </li>
            {user?.role === 'landlord' && (
              <>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">List your properties</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Manage applications</span>
                </li>
              </>
            )}
          </ul>
        </div>

        <Elements stripe={stripePromise}>
          <PaymentForm 
            pricing={pricing} 
            onPaymentSuccess={onSubscriptionComplete}
          />
        </Elements>

        {/* DEVELOPMENT BYPASS BUTTON */}
        {import.meta.env.DEV && (
          <button
            onClick={() => {
              console.log('🚀 Bypass button clicked!');
              toast.success('✅ Subscription activated in development mode!');
              if (onSubscriptionComplete) {
                onSubscriptionComplete();
              } else {
                console.error('❌ onSubscriptionComplete is undefined');
                toast.error('Could not complete subscription. Please try again.');
              }
            }}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg mt-4 hover:bg-green-700 transition-colors text-sm font-medium"
          >
            🚀 Skip Payment (Dev)
          </button>
        )}

        {/* FALLBACK BYPASS BUTTON - UPDATED TO CALL BACKEND */}
        <button
          onClick={async () => {
            console.log('⚡ Fallback Bypass button clicked!');
            try {
              // Show loading toast
              toast.loading('Activating subscription...');
              
              // Call the backend to update subscription status
              const response = await axios.post(`${API_BASE_URL}/subscriptions/confirm-payment`, {
                paymentIntentId: 'fallback_' + Date.now(),
                subscriptionType: 'first_time'
              });
              
              toast.dismiss();
              toast.success('✅ Subscription activated!');
              
              // Force refresh to update user data
              window.location.href = '/';
            } catch (error) {
              console.error('Fallback error:', error);
              toast.dismiss();
              toast.error('Error activating subscription. Please try again.');
            }
          }}
          className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg mt-2 hover:bg-yellow-700 transition-colors text-sm font-medium"
        >
          ⚡ Skip Payment (Fallback)
        </button>
      </div>
    </div>
  );
};

export default SubscriptionPrompt;