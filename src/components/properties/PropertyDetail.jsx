import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MapPin, Bed, Bath, DollarSign, ArrowLeft, Heart, CheckCircle, X, Calendar, MessageSquare, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import FavoriteButton from './FavoriteButton';
import ApplicationForm from '../common/ApplicationForm';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    fetchProperty();
    checkIfApplied();
  }, [id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/properties/${id}`);
      setProperty(response.data);
    } catch (error) {
      console.error('Error fetching property:', error);
      toast.error('Failed to load property details');
      navigate('/browse');
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/applications/check/${id}`);
      setHasApplied(response.data.hasApplied);
    } catch (error) {
      setHasApplied(false);
    }
  };

  const handleApplyClick = () => {
    // Check if user has uploaded ID
    if (user?.idVerificationStatus === 'not_uploaded') {
      toast.error('Please upload your ID first');
      return;
    }

    if (user?.idVerificationStatus === 'rejected') {
      toast.error('Your ID was rejected. Please upload a new one.');
      return;
    }

    // Show the application form
    setShowApplicationForm(true);
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

  const checkIsOwner = () => {
    if (!user || !property?.owner) return false;
    
    const userId = user._id || user.id;
    const ownerId = property.owner._id || property.owner.id;
    const userEmail = user.email;
    const ownerEmail = property.owner.email;
    
    return userId === ownerId || userEmail === ownerEmail;
  };

  const isOwner = checkIsOwner();
  const isTenant = user?.role !== 'landlord' && user?.role !== 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Property not found</p>
        <button
          onClick={() => navigate('/browse')}
          className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
        >
          ← Back to properties
        </button>
      </div>
    );
  }

  const images = property.photos || [];

  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </button>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="relative">
          {images.length > 0 ? (
            <>
              <div className="h-80 md:h-96 bg-gray-200">
                <img
                  src={getImageUrl(images[selectedImage])}
                  alt={property.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '';
                  }}
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 p-2 overflow-x-auto bg-gray-50">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index ? 'border-blue-600' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={getImageUrl(img)}
                        alt={`${property.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="h-80 bg-gray-200 flex items-center justify-center text-gray-400">
              No images available
            </div>
          )}
          
          {isTenant && (
            <div className="absolute top-4 right-4">
              <FavoriteButton propertyId={property._id} />
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {property.title}
              </h1>
              <div className="flex items-center text-gray-600 mt-1">
                <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                <span>
                  {property.address?.city}, {property.address?.region || property.address?.city}
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600 whitespace-nowrap">
              {formatPrice(property.rentPrice)}/month
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center text-gray-600">
              <Bed className="w-4 h-4 mr-1" />
              <span>{property.bedrooms} {property.bedrooms === 1 ? 'bed' : 'beds'}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Bath className="w-4 h-4 mr-1" />
              <span>{property.bathrooms} {property.bathrooms === 1 ? 'bath' : 'baths'}</span>
            </div>
            <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
              {property.propertyType}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
              property.availability === 'available' 
                ? 'bg-green-100 text-green-700' 
                : property.availability === 'rented'
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {property.availability || 'Available'}
            </div>
          </div>

          {property.description && (
            <div className="mt-6 border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">
                {property.description}
              </p>
            </div>
          )}

          {property.amenities && property.amenities.length > 0 && (
            <div className="mt-6 border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {property.owner && (
            <div className="mt-6 border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-2">Owner</h3>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">
                    {property.owner.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">{property.owner.name}</p>
                  <p className="text-gray-600">{property.owner.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Apply Button - Shows application form */}
          {isTenant && !isOwner && property.availability === 'available' && (
            <div className="mt-6 border-t pt-6">
              {!hasApplied ? (
                <button
                  onClick={handleApplyClick}
                  disabled={applying}
                  className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    applying
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {applying ? 'Processing...' : '📝 Apply Now'}
                </button>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">Application Submitted!</p>
                  <p className="text-sm text-green-600">You have already applied for this property</p>
                </div>
              )}
            </div>
          )}

          {/* Owner message */}
          {isOwner && (
            <div className="mt-6 border-t pt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-blue-700">This is your property</p>
                <button
                  onClick={() => navigate(`/edit-property/${property._id}`)}
                  className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Edit Property
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              ← Back
            </button>
            <button
              onClick={() => navigate('/browse')}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Browse More Properties
            </button>
          </div>
        </div>
      </div>

      {/* Application Form */}
      {showApplicationForm && property && (
        <ApplicationForm
          property={property}
          onClose={() => setShowApplicationForm(false)}
          onSuccess={() => {
            setHasApplied(true);
            setShowApplicationForm(false);
            toast.success('Application submitted successfully!');
          }}
        />
      )}
    </div>
  );
};

export default PropertyDetail;