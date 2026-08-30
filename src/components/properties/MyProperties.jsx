import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, MapPin, Bed, Bath, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const MyProperties = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, token } = useAuth();
  const userId = user?.id || user?._id;
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetchedRef = useRef(false);

  console.log('🔍 MyProperties rendering, user:', user?.name || 'No user', 'userId:', userId);

  const fetchMyProperties = useCallback(async () => {
    if (hasFetchedRef.current) {
      console.log('⏭️ Already fetched, skipping');
      return;
    }

    console.log('🔄 Fetching properties for user:', userId);
    
    try {
      setLoading(true);
      setError(null);
      
      // ✅ Fetch ALL properties then filter by owner
      const response = await axios.get(`${API_BASE_URL}/properties`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('📡 All properties response:', response.data);
      
      if (Array.isArray(response.data)) {
        // Filter properties where the owner matches the current user
        const userProperties = response.data.filter(property => {
          const propertyOwnerId = property.owner?._id || property.owner?.id || property.owner;
          const currentUserId = userId;
          
          console.log('🔍 Comparing:', propertyOwnerId, '===', currentUserId);
          return propertyOwnerId === currentUserId;
        });
        
        console.log('✅ User properties found:', userProperties.length);
        setProperties(userProperties);
      } else {
        console.warn('Expected array but got:', response.data);
        setProperties([]);
      }
      
      hasFetchedRef.current = true;
    } catch (error) {
      console.error('❌ Error fetching properties:', error);
      setError('Failed to load your properties');
      toast.error('Failed to load your properties');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  useEffect(() => {
    if (userId && !hasFetchedRef.current) {
      fetchMyProperties();
    }
  }, [userId, fetchMyProperties]);

  // Wait for auth to finish loading
  if (authLoading) {
    console.log('⏳ Waiting for auth to load...');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no user after auth loaded, show error
  if (!user) {
    console.log('❌ No user found after auth loaded');
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-red-600">Please log in to view your properties.</p>
        <button
          onClick={() => window.location.href = '/'}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          Go to Login
        </button>
      </div>
    );
  }

  const handleDelete = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/properties/${propertyId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Property deleted successfully');
      hasFetchedRef.current = false;
      setProperties(prev => prev.filter(p => p._id !== propertyId));
      fetchMyProperties();
    } catch (error) {
      toast.error('Failed to delete property');
    }
  };

  const handleEdit = (propertyId) => {
    navigate(`/edit-property/${propertyId}`);
  };

  const getImageUrl = (photo) => {
    if (!photo) return '';
    if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;

    const normalizedPhoto = photo.startsWith('/') ? photo : `/${photo}`;
    const baseUrl = API_BASE_URL.replace(/\/api$/, '');

    if (normalizedPhoto.startsWith('/uploads/')) {
      return `${baseUrl}${normalizedPhoto}`;
    }

    return `${baseUrl}/uploads/properties${normalizedPhoto}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => {
            hasFetchedRef.current = false;
            fetchMyProperties();
          }}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Properties</h1>
          <p className="text-gray-600 mt-1">Manage your listed properties</p>
        </div>
        <button
          onClick={() => navigate('/add-property')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add New Property
        </button>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Properties Listed</h3>
          <p className="text-gray-500">You haven't listed any properties yet.</p>
          <button
            onClick={() => navigate('/add-property')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            List Your First Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property._id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-48 bg-gray-200 relative">
                {property.photos && property.photos.length > 0 ? (
                  <img
                    src={getImageUrl(property.photos[0])}
                    alt={property.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Home className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    property.availability === 'available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {property.availability || 'available'}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{property.title}</h3>
                <p className="text-gray-600 text-sm mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {property.address?.city}, {property.address?.region}
                </p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-bold text-blue-600">${property.rentPrice}/mo</span>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="flex items-center"><Bed className="w-4 h-4 mr-1" /> {property.bedrooms}</span>
                    <span className="flex items-center"><Bath className="w-4 h-4 mr-1" /> {property.bathrooms}</span>
                  </div>
                </div>

                {property.amenities && property.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {property.amenities.slice(0, 3).map((amenity, index) => (
                      <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {amenity}
                      </span>
                    ))}
                    {property.amenities.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{property.amenities.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex space-x-2 border-t pt-3">
                  <button
                    onClick={() => handleEdit(property._id)}
                    className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(property._id)}
                    className="flex-1 flex items-center justify-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProperties;