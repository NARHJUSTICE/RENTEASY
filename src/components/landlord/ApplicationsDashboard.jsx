import React, { useState, useEffect } from 'react';
import { User, CheckCircle, XCircle, Clock, Eye, Mail, Phone, FileText, Filter, Search, Home, Calendar, DollarSign, Briefcase, MessageSquare } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:5001/api';

const ApplicationsDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/applications/landlord/applications`);
      setApplications(response.data);
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewApplication = async (applicationId, status, notes = '') => {
    try {
      await axios.patch(`${API_BASE_URL}/applications/${applicationId}/review`, {
        status: status,
        notes: notes
      });
      
      toast.success(`Application ${status} successfully`);
      fetchApplications();
      setSelectedApp(null);
    } catch (error) {
      toast.error('Failed to review application');
    }
  };

  const getFilteredApplications = () => {
    let filtered = applications;
    
    if (filter === 'pending') {
      filtered = filtered.filter(app => app.status === 'pending');
    } else if (filter === 'approved') {
      filtered = filtered.filter(app => app.status === 'approved');
    } else if (filter === 'rejected') {
      filtered = filtered.filter(app => app.status === 'rejected');
    }
    
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.property?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const filteredApplications = getFilteredApplications();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingApps = applications.filter(app => app.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenant Applications</h1>
          <p className="text-gray-600 mt-1">Review and manage rental applications</p>
        </div>
        <button
          onClick={fetchApplications}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Applications</p>
          <p className="text-2xl font-bold">{applications.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingApps.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Approved</p>
          <p className="text-2xl font-bold text-green-600">
            {applications.filter(app => app.status === 'approved').length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 flex-1">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by tenant or property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No applications found</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredApplications.map((app) => (
              <div key={app._id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{app.tenant?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{app.property?.title}</p>
                      <p className="text-xs text-gray-500">
                        Applied: {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                      {app.occupation && (
                        <p className="text-xs text-gray-500 flex items-center">
                          <Briefcase className="w-3 h-3 mr-1" />
                          {app.occupation}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      app.status === 'approved' ? 'bg-green-100 text-green-800' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {app.status || 'pending'}
                    </span>
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Application Details</h2>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{selectedApp.tenant?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    {selectedApp.tenant?.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    {selectedApp.phone || selectedApp.tenant?.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Property</p>
                  <p className="font-medium">{selectedApp.property?.title}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Application Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Move-in Date:</span>
                    <span className="ml-2 font-medium">
                      {selectedApp.moveInDate ? new Date(selectedApp.moveInDate).toLocaleDateString() : 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Rental Duration:</span>
                    <span className="ml-2 font-medium">{selectedApp.rentalDuration || '6'} months</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Occupation:</span>
                    <span className="ml-2 font-medium">{selectedApp.occupation || 'Not specified'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Monthly Income:</span>
                    <span className="ml-2 font-medium">${selectedApp.monthlyIncome || 'Not specified'}</span>
                  </div>
                </div>
                
                {/* ✅ Show phone number if provided in application */}
                {selectedApp.phone && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Contact Phone:</span>
                    <span className="ml-2 font-medium">{selectedApp.phone}</span>
                  </div>
                )}

                {/* ✅ Show rental duration details */}
                {selectedApp.rentalDuration && (
                  <div className="mt-2 text-sm">
                    <span className="text-gray-600">Preferred Duration:</span>
                    <span className="ml-2 font-medium">{selectedApp.rentalDuration} months</span>
                  </div>
                )}

                {selectedApp.message && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Message from tenant:
                    </p>
                    <p className="text-gray-900">{selectedApp.message}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Review Application</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleReviewApplication(selectedApp._id, 'approved')}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </button>
                  <button
                    onClick={() => {
                      const notes = prompt('Reason for rejection:');
                      if (notes !== null) {
                        handleReviewApplication(selectedApp._id, 'rejected', notes);
                      }
                    }}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsDashboard;