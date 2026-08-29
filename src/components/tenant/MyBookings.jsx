import React, { useState, useEffect } from 'react';
import { Home, MapPin, Calendar, DollarSign, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:5001/api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/bookings/my-bookings`);
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending' },
      'approved': { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Approved' },
      'rejected': { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' },
      'active': { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Active' },
      'completed': { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Completed' },
      'cancelled': { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Cancelled' }
    };
    return statusMap[status] || statusMap['pending'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-1">Track your rental bookings</p>
        </div>
        <button
          onClick={fetchBookings}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Bookings</h3>
          <p className="text-gray-500">You haven't made any booking requests yet.</p>
          <button
            onClick={() => window.location.href = '/browse'}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Browse Properties
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map((booking) => {
            const StatusIcon = getStatusBadge(booking.status).icon;
            const statusInfo = getStatusBadge(booking.status);
            
            return (
              <div key={booking._id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900">{booking.property?.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                      <StatusIcon className="w-3 h-3 inline mr-1" />
                      {statusInfo.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {booking.property?.address?.city}, {booking.property?.address?.region}
                  </p>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-medium">{new Date(booking.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">End Date:</span>
                    <span className="font-medium">{new Date(booking.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Price:</span>
                    <span className="font-bold text-green-600">${booking.totalPrice}</span>
                  </div>
                  {booking.message && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm">
                      <p className="text-gray-600">Message:</p>
                      <p className="text-gray-900">{booking.message}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;