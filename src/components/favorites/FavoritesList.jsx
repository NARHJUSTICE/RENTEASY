import React, { useState, useEffect } from 'react';
import { Heart, Home, MapPin, Bed, Bath, DollarSign, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import PropertyModal from '../properties/PropertyModal'; // ✅ ADD THIS IMPORT

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const FavoritesList = () => {
  const { user, token } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null); // ✅ ADDED
  const [showModal, setShowModal] = useState(false); // ✅ ADDED

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setFavorites(response.data);
    } catch (error) {
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (propertyId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/favorites/toggle/${propertyId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setFavorites(prev => prev.filter(f => f.property._id !== propertyId));
      toast.success('Removed from favorites');
    } catch (error) {
      toast.error('Failed to remove from favorites');
    }
  };

  const handleViewDetails = (property) => {
    setSelectedProperty(property);
    setShowModal(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

 const getImageUrl = (photo) => {
  if (!photo) return '';
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
  if (photo.startsWith('/uploads/')) {
    return `${API_BASE_URL}${photo}`;
  }
  return `${API_BASE_URL}/uploads/properties/${photo}`;
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
          <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
          <p className="text-gray-600 mt-1">Your saved properties</p>
        </div>
        <button
          onClick={fetchFavorites}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Favorites Yet</h3>
          <p className="text-gray-500">Start saving properties you like!</p>
          <button
            onClick={() => window.location.href = '/browse'}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Browse Properties
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(({ property }) => (
            <div key={property._id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="relative h-48 bg-gray-200">
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
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => handleRemoveFavorite(property._id)}
                    className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <Heart className="w-4 h-4 text-white fill-white" />
                  </button>
                </div>
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    property.availability === 'available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {property.availability}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{property.title}</h3>
                <p className="text-sm text-gray-600 flex items-center mt-1">
                  <MapPin className="w-4 h-4 mr-1" />
                  {property.address?.city}, {property.address?.region}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Bed className="w-4 h-4 mr-1" /> {property.bedrooms}
                    </span>
                    <span className="flex items-center">
                      <Bath className="w-4 h-4 mr-1" /> {property.bathrooms}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {formatPrice(property.rentPrice)}/mo
                  </span>
                </div>

                {/* ✅ Updated: Use handleViewDetails instead of window.location.href */}
                <button
                  onClick={() => handleViewDetails(property)}
                  className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Property Modal */}
      {showModal && selectedProperty && (
        <PropertyModal
          property={selectedProperty}
          onClose={() => {
            setShowModal(false);
            setSelectedProperty(null);
          }}
        />
      )}
    </div>
  );
};

export default FavoritesList;