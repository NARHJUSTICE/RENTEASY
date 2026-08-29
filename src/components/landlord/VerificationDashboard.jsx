import React, { useState, useEffect } from 'react';
import { User, CheckCircle, XCircle, Clock, Eye, Mail, Phone, FileText, Filter, Search } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:5001/api';

const VerificationDashboard = () => {
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

  // ✅ Verify ID proof only
  const handleVerifyID = async (applicationId, idStatus, notes = '') => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/applications/${applicationId}/verify-id`, {
        idStatus: idStatus,
        idVerificationNotes: notes
      });
      
      toast.success(`ID ${idStatus} successfully`);
      fetchApplications();
      setSelectedApp(null);
    } catch (error) {
      toast.error('Failed to verify ID');
    }
  };

  // Filter applications by ID status
  const getFilteredApplications = () => {
    let filtered = applications;
    
    if (filter === 'pending') {
      filtered = filtered.filter(app => app.idStatus === 'pending');
    } else if (filter === 'approved') {
      filtered = filtered.filter(app => app.idStatus === 'approved');
    } else if (filter === 'rejected') {
      filtered = filtered.filter(app => app.idStatus === 'rejected');
    } else if (filter === 'probation') {
      filtered = filtered.filter(app => app.idStatus === 'probation');
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

  const pendingIDs = applications.filter(app => app.idStatus === 'pending');
  const totalApps = applications.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ID Verifications</h1>
          <p className="text-gray-600 mt-1">Verify tenant ID proofs</p>
        </div>
        <button
          onClick={fetchApplications}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Applications</p>
          <p className="text-2xl font-bold">{totalApps}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Pending Verification</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingIDs.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Verified</p>
          <p className="text-2xl font-bold text-green-600">
            {applications.filter(app => app.idStatus === 'approved').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">On Probation</p>
          <p className="text-2xl font-bold text-purple-600">
            {applications.filter(app => app.idStatus === 'probation').length}
          </p>
        </div>
      </div>

      {/* Filters */}
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
              <option value="probation">Probation</option>
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

      {/* Applications List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {/* ID Status Only */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      app.idStatus === 'approved' ? 'bg-green-100 text-green-800' :
                      app.idStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                      app.idStatus === 'probation' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {app.idStatus || 'pending'}
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

      {/* Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">ID Verification Details</h2>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Tenant Info */}
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
                    {selectedApp.tenant?.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Property</p>
                  <p className="font-medium">{selectedApp.property?.title}</p>
                </div>
              </div>

              {/* ID Proof Document */}
              {selectedApp.idProofDocument?.url && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">ID Proof Document</p>
                  <a
                    href={`http://localhost:5001${selectedApp.idProofDocument.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    View Document
                  </a>
                </div>
              )}

              {/* ID Verification Actions Only */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Verify ID</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleVerifyID(selectedApp._id, 'approved')}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" /> Verify ID
                  </button>
                  <button
                    onClick={() => {
                      const notes = prompt('Reason for rejecting ID:');
                      if (notes !== null) {
                        handleVerifyID(selectedApp._id, 'rejected', notes);
                      }
                    }}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-1" /> Reject ID
                  </button>
                  <button
                    onClick={() => handleVerifyID(selectedApp._id, 'probation')}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <Clock className="w-4 h-4 mr-1" /> Probation
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

export default VerificationDashboard;