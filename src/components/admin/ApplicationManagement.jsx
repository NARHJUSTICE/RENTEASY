import React, { useState, useEffect } from 'react';
import { Search, FileText, User, Home, CheckCircle, XCircle, Clock, RefreshCw, Eye, X, Mail, Phone, Calendar, DollarSign, MapPin } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:5001/api';

const ApplicationManagement = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/admin/applications`);
      setApplications(response.data);
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending' },
      'approved': { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Approved' },
      'rejected': { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' },
      'cancelled': { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Cancelled' }
    };
    return statusMap[status] || statusMap['pending'];
  };

  const handleUpdateStatus = async (applicationId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this application as ${newStatus}?`)) {
      return;
    }

    try {
      setUpdating(true);
      await axios.patch(
        `${API_BASE_URL}/admin/applications/${applicationId}`,
        { status: newStatus }
      );
      toast.success(`Application ${newStatus} successfully`);
      fetchApplications();
      setShowDetailModal(false);
    } catch (error) {
      toast.error('Failed to update application status');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetailModal(true);
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.tenant?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Application Management</h1>
          <p className="text-gray-600 mt-1">View all applications across the platform</p>
        </div>
        <button
          onClick={fetchApplications}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center flex-1 min-w-[200px]">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search by tenant, property, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className="text-sm text-gray-500">
          {filteredApplications.length} applications found
        </span>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredApplications.map((app) => {
                const statusInfo = getStatusBadge(app.status);
                const StatusIcon = statusInfo.icon;
                return (
                  <tr key={app._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{app.tenant?.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{app.tenant?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Home className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{app.property?.title || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3 inline mr-1" />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(app)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredApplications.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No applications found</p>
        </div>
      )}

      {/* ✅ Application Detail Modal */}
      {showDetailModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
                <p className="text-sm text-gray-500">Review application information</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Applicant Info */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Applicant Information</h3>
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedApplication.tenant?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      {selectedApplication.tenant?.email || 'No email'}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      {selectedApplication.tenant?.phone || 'No phone'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Property Info */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Property Information</h3>
                <div>
                  <p className="font-semibold text-gray-900">{selectedApplication.property?.title || 'Unknown'}</p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {selectedApplication.property?.address?.city || 'Unknown city'}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    ${selectedApplication.property?.rentPrice || 0}/month
                  </p>
                </div>
              </div>

              {/* Application Status */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Application Status</h3>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedApplication.status).bg} ${getStatusBadge(selectedApplication.status).color}`}>
                    {getStatusBadge(selectedApplication.status).label}
                  </span>
                  <span className="text-sm text-gray-500 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Submitted on {new Date(selectedApplication.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Application Details */}
              {selectedApplication.applicationDetails && (
                <div className="border-b pb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Application Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedApplication.applicationDetails.moveInDate && (
                      <div>
                        <p className="text-xs text-gray-500">Move-in Date</p>
                        <p className="text-sm font-medium">{new Date(selectedApplication.applicationDetails.moveInDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedApplication.applicationDetails.numberOfTenants && (
                      <div>
                        <p className="text-xs text-gray-500">Number of Tenants</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationDetails.numberOfTenants}</p>
                      </div>
                    )}
                    {selectedApplication.applicationDetails.employmentStatus && (
                      <div>
                        <p className="text-xs text-gray-500">Employment Status</p>
                        <p className="text-sm font-medium">{selectedApplication.applicationDetails.employmentStatus}</p>
                      </div>
                    )}
                    {selectedApplication.applicationDetails.monthlyIncome && (
                      <div>
                        <p className="text-xs text-gray-500">Monthly Income</p>
                        <p className="text-sm font-medium">${selectedApplication.applicationDetails.monthlyIncome}</p>
                      </div>
                    )}
                    {selectedApplication.applicationDetails.additionalNotes && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500">Additional Notes</p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">{selectedApplication.applicationDetails.additionalNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => handleUpdateStatus(selectedApplication._id, 'approved')}
                  disabled={updating || selectedApplication.status === 'approved'}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                    selectedApplication.status === 'approved'
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  {selectedApplication.status === 'approved' ? 'Already Approved' : 'Approve'}
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedApplication._id, 'rejected')}
                  disabled={updating || selectedApplication.status === 'rejected'}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                    selectedApplication.status === 'rejected'
                      ? 'bg-red-100 text-red-700 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  <XCircle className="w-4 h-4 inline mr-2" />
                  {selectedApplication.status === 'rejected' ? 'Already Rejected' : 'Reject'}
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationManagement;