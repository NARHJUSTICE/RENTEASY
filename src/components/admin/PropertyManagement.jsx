import React, { useState, useEffect } from 'react';
import { Search, Home, User, DollarSign, Trash2, RefreshCw, Eye, MapPin } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const PropertyManagement = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/admin/properties`);
      setProperties(response.data);
    } catch (error) {
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/admin/properties/${propertyId}`);
      toast.success('Property deleted successfully');
      fetchProperties();
    } catch (error) {
      toast.error('Failed to delete property');
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          property.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || property.availability === filterStatus;
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
          <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
          <p className="text-gray-600 mt-1">Manage all properties on the platform</p>
        </div>
        <button
          onClick={fetchProperties}
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
            placeholder="Search by property or owner..."
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
          <option value="available">Available</option>
          <option value="rented">Rented</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <span className="text-sm text-gray-500">
          {filteredProperties.length} properties found
        </span>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <div key={property._id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-4 border-b">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-gray-900">{property.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  property.availability === 'available'
                    ? 'bg-green-100 text-green-800'
                    : property.availability === 'rented'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {property.availability || 'available'}
                </span>
              </div>
              {property.owner && (
                <p className="text-sm text-gray-600 flex items-center mt-1">
                  <User className="w-4 h-4 mr-1" />
                  {property.owner.name}
                </p>
              )}
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium">${property.rentPrice}/month</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Type:</span>
                <span className="capitalize">{property.propertyType}</span>
              </div>
              {property.address && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Location:</span>
                  <span className="text-gray-900">{property.address?.city}, {property.address?.region}</span>
                </div>
              )}
              {property.totalRooms && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rooms:</span>
                  <span>{property.availableRooms || 0} / {property.totalRooms} available</span>
                </div>
              )}
              <div className="pt-2 flex space-x-2">
                <button
                  onClick={() => window.location.href = `/browse`}
                  className="flex-1 bg-blue-600 text-white py-1.5 px-3 rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center"
                >
                  <Eye className="w-4 h-4 mr-1" /> View
                </button>
                <button
                  onClick={() => handleDeleteProperty(property._id)}
                  className="bg-red-600 text-white py-1.5 px-3 rounded-lg hover:bg-red-700 text-sm flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No properties found</p>
        </div>
      )}
    </div>
  );
};

export default PropertyManagement;