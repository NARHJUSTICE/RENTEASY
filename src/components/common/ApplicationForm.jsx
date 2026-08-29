import React, { useState } from 'react';
import { X, Calendar, Users, DollarSign, Phone, MessageSquare, CheckCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = 'http://localhost:5001/api';

const ApplicationForm = ({ property, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    moveInDate: '',
    rentalDuration: '6',
    occupation: '',
    monthlyIncome: '',
    phoneNumber: user?.phone || '',
    message: '',
    agreeToTerms: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.moveInDate) {
      toast.error('Please select a move-in date');
      return;
    }
    if (!formData.occupation) {
      toast.error('Please enter your occupation');
      return;
    }
    if (!formData.agreeToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    try {
      setLoading(true);

      // Calculate estimated fees
      const firstMonthRent = property.rentPrice || 0;
      const securityDeposit = property.rentPrice || 0;
      const totalEstimated = firstMonthRent + securityDeposit;

      await axios.post(
        `${API_BASE_URL}/applications/${property._id}/apply`,
        {
          idProofDocument: {
            url: user.idProofDetails?.url || user.idProofDocument,
            publicId: user.idProofDetails?.publicId || '',
            fileName: user.idProofDetails?.fileName || ''
          },
          applicationDetails: {
            moveInDate: formData.moveInDate,
            rentalDuration: formData.rentalDuration,
            occupation: formData.occupation,
            monthlyIncome: formData.monthlyIncome,
            phoneNumber: formData.phoneNumber || user?.phone,
            message: formData.message,
            estimatedFees: {
              firstMonthRent: firstMonthRent,
              securityDeposit: securityDeposit,
              total: totalEstimated
            }
          }
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

  const firstMonthRent = property?.rentPrice || 0;
  const securityDeposit = property?.rentPrice || 0;
  const totalEstimated = firstMonthRent + securityDeposit;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Apply for Property</h2>
            <p className="text-sm text-gray-600">{property?.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">{property?.address?.city}</span>
              <span className="text-sm font-bold text-green-600">${property?.rentPrice}/month</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Move-in Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Preferred Move-in Date *
            </label>
            <input
              type="date"
              name="moveInDate"
              value={formData.moveInDate}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Rental Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rental Duration (months) *
            </label>
            <select
              name="rentalDuration"
              value={formData.rentalDuration}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              required
            >
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="9">9 months</option>
              <option value="12">12 months</option>
              <option value="18">18 months</option>
              <option value="24">24 months</option>
            </select>
          </div>

          {/* Occupation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Occupation *
            </label>
            <input
              type="text"
              name="occupation"
              value={formData.occupation}
              onChange={handleInputChange}
              placeholder="e.g., Software Engineer, Student, etc."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              required
            />
          </div>

          {/* Monthly Income */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Monthly Income ($)
            </label>
            <input
              type="number"
              name="monthlyIncome"
              value={formData.monthlyIncome}
              onChange={handleInputChange}
              placeholder="e.g., 3000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              min="0"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="w-4 h-4 inline mr-1" />
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Message (Optional)
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows="3"
              placeholder="Tell the landlord about yourself..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
            />
          </div>

          {/* Estimated Fees */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Estimated Move-in Fee</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">First Month Rent:</span>
                <span className="font-medium">${firstMonthRent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Security Deposit:</span>
                <span className="font-medium">${securityDeposit}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                <span>Total:</span>
                <span className="text-green-600">${totalEstimated}</span>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              required
            />
            <label className="text-sm text-gray-600">
              I agree to the terms and conditions, and confirm that the information provided is accurate. 
              I understand that this application is subject to landlord approval.
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-base font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-3 text-white rounded-lg transition-colors text-base font-medium ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationForm;