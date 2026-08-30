import React, { useState } from 'react';
import { Calendar, DollarSign, Home, MapPin, Send, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const RequestBooking = ({ property, onClose, onSuccess }) => {
  const { user, token } = useAuth(); // ✅ Get token from AuthContext
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    message: ''
  });

  // Calculate minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      setLoading(true);
      
      // ✅ Use token from AuthContext
      const response = await axios.post(
        `${API_BASE_URL}/bookings/request`,
        {
          propertyId: property._id,
          startDate: formData.startDate,
          endDate: formData.endDate,
          message: formData.message
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Booking response:', response.data);
      toast.success('Booking request sent successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ Booking error:', error);
      const message = error.response?.data?.message || 'Failed to request booking';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total price preview
  const calculateTotal = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const months = diffDays / 30;
      return Math.ceil(months) * property.rentPrice;
    }
    return 0;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Request Booking</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-900">{property.title}</h3>
          <p className="text-gray-600 flex items-center mt-1">
            <MapPin className="w-4 h-4 mr-1" />
            {property.address?.city}, {property.address?.region}
          </p>
          <p className="text-green-600 font-bold mt-1">
            ${property.rentPrice}/month
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              min={today}
              required
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              min={formData.startDate || today}
              required
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message (Optional)
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={3}
              placeholder="Any special requests or questions..."
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {formData.startDate && formData.endDate && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Price:</span>
                <span className="font-bold text-green-600">${calculateTotal()}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                * Based on ${property.rentPrice}/month rental rate
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Sending...
              </div>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Booking Request
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RequestBooking;