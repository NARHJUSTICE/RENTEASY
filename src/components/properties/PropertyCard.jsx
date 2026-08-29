import React, { useState } from 'react';
import { MapPin, Bed, Bath, DollarSign, Heart, ChevronDown } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import FavoriteButton from './FavoriteButton';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = 'http://localhost:5001/api';

const PropertyCard = ({ property, onViewDetails, onShowInterest, onApplyNow, showOwnerInfo = false, index = 0 }) => {
  const { user, token } = useAuth();
  const [status, setStatus] = useState(property?.availability || 'available');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  console.log(`🔍 PropertyCard ${index} rendering with:`, property?.title || 'No title');

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
      return `http://localhost:5001${photo}`;
    }
    return `http://localhost:5001/uploads/properties/${photo}`;
  };

  const userId = user?._id || user?.id;
  const ownerId = property?.owner?._id || property?.owner?.id;
  const isOwner = userId && ownerId ? userId === ownerId : false;
  const isLandlord = user?.role === 'landlord';
  const canChangeStatus = isOwner || isLandlord;
  const isTenant = user?.role !== 'landlord' && user?.role !== 'admin';

  const handleStatusChange = async (newStatus) => {
    if (newStatus === status) {
      setShowDropdown(false);
      return;
    }

    try {
      setIsUpdating(true);
      await axios.patch(
        `${API_BASE_URL}/properties/${property._id}/status`,
        { availability: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setStatus(newStatus);
      toast.success(`Property status updated to ${newStatus}`);
      setShowDropdown(false);
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Failed to update property status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'available': 'bg-green-100 text-green-800',
      'rented': 'bg-red-100 text-red-800',
      'maintenance': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || colors['available'];
  };

  const statusOptions = [
    { value: 'available', label: 'Available' },
    { value: 'rented', label: 'Rented' },
    { value: 'maintenance', label: 'Under Maintenance' }
  ];

  if (!property) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 border-2 border-red-300">
        <p className="text-red-500">Property data missing (index: {index})</p>
      </div>
    );
  }

  if (!property._id) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-4 border-2 border-yellow-300">
        <p className="text-yellow-600">Property missing ID (index: {index})</p>
        <pre className="text-xs mt-2">{JSON.stringify(property, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow w-full">
      {/* Property Image */}
      <div className="relative bg-gray-200 aspect-video">
        {property.photos && property.photos.length > 0 ? (
          <img
            src={getImageUrl(property.photos[0])}
            alt={property.title || 'Property'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image Available
          </div>
        )}
        
        {isTenant && (
          <div className="absolute top-2 right-2">
            <FavoriteButton propertyId={property._id} />
          </div>
        )}
        
        {/* Status Badge with Dropdown */}
        <div className="absolute top-2 left-2">
          {canChangeStatus ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={isUpdating}
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(status)} hover:opacity-80 transition-opacity`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 min-w-[140px]">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusChange(option.value)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                        status === option.value ? 'bg-gray-100 font-semibold' : ''
                      }`}
                    >
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(option.value)}`}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          )}
        </div>
      </div>

      {/* Property Details */}
      <div className="p-3 sm:p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
            {property.title || 'Untitled Property'}
          </h3>
          <div className="flex items-center text-green-600 font-bold">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm sm:text-base">
              <span className="sm:hidden">{formatPrice(property.rentPrice || 0).replace('/month', '')}/mo</span>
              <span className="hidden sm:inline">{formatPrice(property.rentPrice || 0)}/month</span>
            </span>
          </div>
        </div>

        <div className="flex items-center text-gray-600 mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm sm:text-base truncate">
            {property.address?.city || 'Unknown City'}, {property.address?.region || property.address?.city || 'Unknown Region'}
          </span>
        </div>

        <div className="flex items-center space-x-4 text-gray-600 mb-3 text-sm sm:text-base">
          <div className="flex items-center">
            <Bed className="w-4 h-4 mr-1" />
            <span>{property.bedrooms || 0} beds</span>
          </div>
          <div className="flex items-center">
            <Bath className="w-4 h-4 mr-1" />
            <span>{property.bathrooms || 0} baths</span>
          </div>
          <div className="flex items-center">
            <span className="capitalize">{property.propertyType || 'N/A'}</span>
          </div>
        </div>

        {/* ✅ ENHANCED: Diet & Gender Preferences with better styling */}
        {(property.dietPreference || property.genderPreference || property.dietExceptions) && (
          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-100">
            {property.dietPreference && property.dietPreference !== 'both' && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-0.5 ${
                property.dietPreference === 'veg' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {property.dietPreference === 'veg' ? '🥬' : '🍗'}
                {property.dietPreference === 'veg' ? 'Veg' : 'Non-Veg'}
              </span>
            )}
            {property.genderPreference && property.genderPreference !== 'both' && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-0.5 ${
                property.genderPreference === 'male' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-pink-100 text-pink-700'
              }`}>
                {property.genderPreference === 'male' ? '👨' : '👩'}
                {property.genderPreference === 'male' ? 'Male' : 'Female'}
              </span>
            )}
            {property.dietPreference === 'both' && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-0.5">
                🥘 Both Diet
              </span>
            )}
            {property.genderPreference === 'both' && (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium flex items-center gap-0.5">
                👥 Both Gender
              </span>
            )}
            {property.dietExceptions && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs truncate max-w-[120px]">
                📝 {property.dietExceptions}
              </span>
            )}
          </div>
        )}

        {showOwnerInfo && property.owner && (
          <div className="border-t pt-3 mb-3">
            <p className="text-sm sm:text-base text-gray-600">
              Owner: <span className="font-medium">{property.owner.name || 'Unknown'}</span>
            </p>
            <p className="text-sm sm:text-base text-gray-600">
              Contact: <span className="font-medium">{property.owner.phone || 'N/A'}</span>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => onViewDetails(property)}
            className="flex-1 bg-blue-600 text-white py-3 sm:py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium"
          >
            View Details
          </button>
          
          {isTenant && property.availability === 'available' && onApplyNow && (
            <button
              onClick={() => onApplyNow(property)}
              className="flex-1 bg-green-600 text-white py-3 sm:py-2.5 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base font-medium"
            >
              Apply Now
            </button>
          )}
          
          {!showOwnerInfo && onShowInterest && (
            <button
              onClick={() => onShowInterest(property)}
              className="flex items-center justify-center bg-gray-100 text-gray-700 py-3 sm:py-2.5 px-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Heart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;