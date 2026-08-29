import React, { useState, useEffect } from 'react';
import { Home, MapPin, CheckCircle, XCircle, Clock, Calendar, AlertCircle, Trash2, Undo2, Eye, RefreshCw, Info } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5001/api';

const MyApplications = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/applications/tenant/applications`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (application) => {
    const status = application.status || 'pending';
    const statusMap = {
      'approved': { 
        icon: CheckCircle, 
        color: 'text-green-600', 
        bg: 'bg-green-100', 
        label: 'Approved',
        date: application.approvedAt 
      },
      'pending': { 
        icon: Clock, 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-100', 
        label: 'Pending Review',
        date: null 
      },
      'rejected': { 
        icon: XCircle, 
        color: 'text-red-600', 
        bg: 'bg-red-100', 
        label: 'Rejected',
        date: application.rejectedAt 
      },
      'probation': { 
        icon: AlertCircle, 
        color: 'text-purple-600', 
        bg: 'bg-purple-100', 
        label: 'On Probation',
        date: application.probationAt 
      },
      'cancelled': { 
        icon: XCircle, 
        color: 'text-gray-600', 
        bg: 'bg-gray-100', 
        label: 'Cancelled',
        date: null 
      },
      'withdrawn': { 
        icon: XCircle, 
        color: 'text-gray-600', 
        bg: 'bg-gray-100', 
        label: 'Withdrawn',
        date: application.withdrawnAt 
      }
    };
    return statusMap[status] || statusMap['pending'];
  };

  const getStatusActions = (status) => {
    const actions = {
      'pending': ['withdraw'],
      'approved': [],
      'rejected': ['delete'],
      'withdrawn': ['delete'],
      'cancelled': ['delete'],
      'probation': []
    };
    return actions[status] || [];
  };

  const handleWithdraw = async () => {
    if (!selectedApplication) return;
    
    try {
      await axios.patch(
        `${API_BASE_URL}/applications/${selectedApplication._id}/withdraw`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      toast.success('Application withdrawn successfully!');
      setShowConfirmModal(false);
      setSelectedApplication(null);
      fetchApplications();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to withdraw application';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!selectedApplication) return;
    
    try {
      await axios.delete(
        `${API_BASE_URL}/applications/${selectedApplication._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      toast.success('Application deleted successfully!');
      setShowConfirmModal(false);
      setSelectedApplication(null);
      fetchApplications();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete application';
      toast.error(message);
    }
  };

  const openConfirmModal = (application, action) => {
    setSelectedApplication(application);
    setActionType(action);
    setShowConfirmModal(true);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getImageUrl = (photo) => {
    if (!photo) return '';
    if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
    if (photo.startsWith('/uploads/')) {
      return `http://localhost:5001${photo}`;
    }
    return `http://localhost:5001/uploads/properties/${photo}`;
  };

  // ✅ Check if property exists
  const isPropertyDeleted = (property) => {
    return !property || !property._id;
  };

  const filteredApplications = applications.filter(app => {
    if (selectedStatus === 'all') return true;
    return app.status === selectedStatus;
  });

  const getStatusCounts = () => {
    const counts = { all: applications.length };
    applications.forEach(app => {
      counts[app.status] = (counts[app.status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600 mt-1">Track and manage your rental applications</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchApplications}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Refresh</span>
          </button>
          <button
            onClick={() => navigate('/browse')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">Browse Properties</span>
          </button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'approved', 'rejected', 'withdrawn'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {statusCounts[status] > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                selectedStatus === status ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                {statusCounts[status]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Applications</h3>
          <p className="text-gray-500">You haven't applied to any properties yet.</p>
          <button
            onClick={() => navigate('/browse')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Properties
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredApplications.map((application) => {
            const statusInfo = getStatusBadge(application);
            const StatusIcon = statusInfo.icon;
            const availableActions = getStatusActions(application.status);
            const property = application.property || {};
            const isDeleted = isPropertyDeleted(property);
            const mainPhoto = !isDeleted && property.photos && property.photos.length > 0 ? property.photos[0] : null;

            return (
              <div key={application._id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row">
                  {/* Property Image */}
                  <div className="md:w-40 h-48 md:h-auto bg-gray-200 flex-shrink-0">
                    {!isDeleted && mainPhoto ? (
                      <img
                        src={getImageUrl(mainPhoto)}
                        alt={property.title || 'Property'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                          const parent = e.target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center text-gray-400">
                                <Home class="w-12 h-12" />
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                        <div className="text-center">
                          <Home className="w-12 h-12 mx-auto mb-2" />
                          <span className="text-xs">Property Removed</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Application Details */}
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        {!isDeleted ? (
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {property.title || 'Unknown Property'}
                          </h3>
                        ) : (
                          <h3 className="text-lg font-semibold text-gray-400 truncate flex items-center gap-2">
                            🗑️ Property Removed
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              Deleted by landlord
                            </span>
                          </h3>
                        )}
                      </div>
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </div>

                    {!isDeleted ? (
                      <>
                        <div className="flex items-center text-gray-600 text-sm mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span className="truncate">
                            {property.address?.city}, {property.address?.region}
                          </span>
                        </div>

                        <div className="flex items-center text-gray-600 text-sm mt-1">
                          <span className="font-medium">${property.rentPrice}/month</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center text-gray-400 text-sm mt-1">
                        <Info className="w-3 h-3 mr-1" />
                        <span>This property is no longer available</span>
                      </div>
                    )}

                    <div className="flex items-center text-gray-500 text-xs mt-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>Applied on {formatShortDate(application.createdAt)}</span>
                    </div>

                    {application.moveInDate && !isDeleted && (
                      <div className="flex items-center text-gray-500 text-xs mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>Move-in: {formatShortDate(application.moveInDate)}</span>
                      </div>
                    )}

                    {/* Review Notes */}
                    {application.reviewNotes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm">
                        <p className="text-gray-600">Landlord's Notes:</p>
                        <p className="text-gray-900">{application.reviewNotes}</p>
                      </div>
                    )}

                    {application.probationEndDate && (
                      <div className="mt-2 p-2 bg-purple-50 rounded-lg text-sm">
                        <p className="text-purple-600">Probation until: {formatShortDate(application.probationEndDate)}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                      <button
                        onClick={() => {
                          if (!isDeleted && property._id) {
                            navigate(`/property/${property._id}`);
                          } else {
                            toast.info('This property has been removed by the landlord');
                          }
                        }}
                        disabled={isDeleted}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                          isDeleted 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        title={isDeleted ? 'Property no longer available' : 'View property details'}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Property
                      </button>

                      {availableActions.includes('withdraw') && (
                        <button
                          onClick={() => openConfirmModal(application, 'withdraw')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          Withdraw
                        </button>
                      )}

                      {availableActions.includes('delete') && (
                        <button
                          onClick={() => openConfirmModal(application, 'delete')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      )}

                      {application.status === 'pending' && !isDeleted && (
                        <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Awaiting review
                        </span>
                      )}

                      {isDeleted && (
                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg flex items-center">
                          <Info className="w-3 h-3 mr-1" />
                          Property removed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                actionType === 'withdraw' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                {actionType === 'withdraw' ? (
                  <Undo2 className="w-8 h-8 text-yellow-600" />
                ) : (
                  <Trash2 className="w-8 h-8 text-red-600" />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {actionType === 'withdraw' ? 'Withdraw Application' : 'Delete Application'}
              </h3>
              <p className="text-gray-600 mt-2">
                {actionType === 'withdraw' 
                  ? `Are you sure you want to withdraw your application for "${selectedApplication.property?.title || 'this property'}"?`
                  : `Are you sure you want to delete your application for "${selectedApplication.property?.title || 'this property'}"? This action cannot be undone.`
                }
              </p>
              {actionType === 'withdraw' && (
                <p className="text-sm text-yellow-600 mt-2">
                  ⚠️ This will release the room for other applicants.
                </p>
              )}
              {actionType === 'delete' && (
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ This action is permanent and cannot be reversed.
                </p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedApplication(null);
                  setActionType('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={actionType === 'withdraw' ? handleWithdraw : handleDelete}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  actionType === 'withdraw' 
                    ? 'bg-yellow-600 hover:bg-yellow-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionType === 'withdraw' ? 'Yes, Withdraw' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplications;