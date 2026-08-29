import React, { useState } from 'react';
import { X, Calendar, MessageSquare, User, FileText, DollarSign, Home, CheckCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = 'http://localhost:5001/api';

const ApplyForm = ({ property, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [formData, setFormData] = useState({
    moveInDate: '',
    rentalDuration: '6',
    occupation: '',
    monthlyIncome: '',
    message: '',
    phone: user?.phone || '',
    preferredContact: 'email'
  });

  const today = new Date().toISOString().split('T')[0];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!agreed) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    if (!formData.moveInDate) {
      toast.error('Please select a move-in date');
      return;
    }

    if (!formData.occupation) {
      toast.error('Please enter your occupation');
      return;
    }

    try {
      setLoading(true);
      
      const response = await axios.post(
        `${API_BASE_URL}/applications/${property._id}/apply`,
        {
          idProofDocument: {
            url: user.idProofDetails?.url || user.idProofDocument,
            publicId: user.idProofDetails?.publicId || '',
            fileName: user.idProofDetails?.fileName || ''
          },
          moveInDate: formData.moveInDate,
          rentalDuration: formData.rentalDuration,
          occupation: formData.occupation,
          monthlyIncome: formData.monthlyIncome,
          message: formData.message,
          phone: formData.phone,
          preferredContact: formData.preferredContact
        }
      );
      
      toast.success('Application submitted successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit application';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate move-in fee (first month rent + security deposit)
  const moveInFee = property.rentPrice * 2; // First month + security deposit

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Apply for Property</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Property Info */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-900">{property.title}</h3>
          <p className="text-gray-600 text-sm mt-1">
            {property.address?.city}, {property.address?.region}
          </p>
          <p className="text-green-600 font-bold mt-1">
            ${property.rentPrice}/month
          </p>
          {user?.idVerificationStatus === 'verified' && (
            <p className="text-green-600 text-sm mt-1 flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              Your ID is verified
            </p>
          )}
        </div>

        {/* Room Availability */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Rooms Available:</span>
            <span className="font-medium">{property.availableRooms || 0} / {property.totalRooms || 1}</span>
          </div>
          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-green-500"
              style={{ width: `${property.totalRooms > 0 ? ((property.availableRooms || 0) / property.totalRooms) * 100 : 0}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Move-in Date *
            </label>
            <input
              type="date"
              name="moveInDate"
              value={formData.moveInDate}
              onChange={handleChange}
              min={today}
              required
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rental Duration (months) *
            </label>
            <select
              name="rentalDuration"
              value={formData.rentalDuration}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="12">12 months</option>
              <option value="24">24 months</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Occupation *
            </label>
            <input
              type="text"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              placeholder="e.g., Software Engineer, Student, etc."
              required
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Income ($)
            </label>
            <input
              type="number"
              name="monthlyIncome"
              value={formData.monthlyIncome}
              onChange={handleChange}
              placeholder="e.g., 3000"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Your phone number"
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
              placeholder="Tell the landlord about yourself..."
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Move-in Fee Summary */}
          <div className="p-3 bg-yellow-50 rounded-lg text-sm">
            <p className="font-medium text-yellow-800">Estimated Move-in Fee</p>
            <div className="flex justify-between mt-1">
              <span className="text-gray-600">First Month Rent:</span>
              <span>${property.rentPrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Security Deposit:</span>
              <span>${property.rentPrice}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-1 mt-1">
              <span>Total:</span>
              <span>${moveInFee}</span>
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="terms" className="text-sm text-gray-600">
              I agree to the terms and conditions, and confirm that the information provided is accurate.
              I understand that this application is subject to landlord approval.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting...
              </div>
            ) : (
              <>
                <FileText className="w-5 h-5 mr-2" />
                Submit Application
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApplyForm;