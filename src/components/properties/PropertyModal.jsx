import React, { useState } from 'react';
import { X, MapPin, Bed, Bath, DollarSign, Heart, Phone, Mail, Calendar, Home, Users, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import RequestBooking from '../tenant/RequestBooking';
import ApplyForm from '../tenant/ApplyForm';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const PropertyModal = ({ property, onClose }) => {
  const { user, token } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expressing, setExpressing] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [applicationForReview, setApplicationForReview] = useState(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0);

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

  const handleSendMessage = async () => {
    if (!property.owner?._id) {
      toast.error('Owner information not available');
      return;
    }

    try {
      setIsSendingMessage(true);
      const response = await axios.post(
        `${API_BASE_URL}/messages/conversations`,
        {
          receiverId: property.owner._id,
          propertyId: property._id
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      toast.success('Conversation started!');
      window.location.href = '/messages';
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleExpressInterest = async () => {
    console.log('🔍 Express Interest clicked');
    console.log('🔍 User:', user);
    console.log('🔍 ID Status:', user?.idVerificationStatus);

    if (user?.idVerificationStatus === 'not_uploaded') {
      toast.error('Please upload your ID first');
      return;
    }

    if (user?.idVerificationStatus === 'rejected') {
      toast.error('Your ID was rejected. Please upload a new one.');
      return;
    }

    try {
      setExpressing(true);
      const response = await axios.post(
        `${API_BASE_URL}/applications/${property._id}/apply`,
        {
          idProofDocument: {
            url: user.idProofDetails?.url || user.idProofDocument,
            publicId: user.idProofDetails?.publicId || '',
            fileName: user.idProofDetails?.fileName || ''
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('✅ Response:', response.data);
      toast.success('Interest expressed successfully! The landlord will review your ID.');
      onClose();
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
      const message = error.response?.data?.message || 'Failed to express interest';
      toast.error(message);
    } finally {
      setExpressing(false);
    }
  };

  const images = property.photos || [];
  const hasImages = images.length > 0;

  const totalRooms = property.totalRooms || 1;
  const availableRooms = property.availableRooms || 0;
  const occupiedRooms = property.occupiedRooms || 0;
  const hasRoomsAvailable = availableRooms > 0;

  const canReview = user?.role !== 'landlord';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">{property.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Images */}
            <div>
              {hasImages ? (
                <div className="space-y-4">
                  <div className="relative h-64 bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={getImageUrl(images[currentImageIndex])}
                      alt={`${property.title} - ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '';
                      }}
                    />
                    {images.length > 1 && (
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                        {images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {images.length > 1 && (
                    <div className="flex space-x-2 overflow-x-auto">
                      {images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                            index === currentImageIndex ? 'border-blue-500' : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={getImageUrl(image)}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">No images available</span>
                </div>
              )}

              <div className="mt-4 h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Map view coming soon</p>
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              {/* Price and Basic Info */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-green-600 text-2xl font-bold">
                    <DollarSign className="w-6 h-6" />
                    <span>{formatPrice(property.rentPrice)}/month</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    property.availability === 'available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {property.availability}
                  </span>
                </div>

                <div className="flex items-center space-x-6 text-gray-600">
                  <div className="flex items-center">
                    <Bed className="w-5 h-5 mr-2" />
                    <span>{property.bedrooms} bedrooms</span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="w-5 h-5 mr-2" />
                    <span>{property.bathrooms} bathrooms</span>
                  </div>
                  <div>
                    <span className="capitalize">{property.propertyType}</span>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Rooms Available</span>
                    </div>
                    <span className={`text-sm font-bold ${hasRoomsAvailable ? 'text-green-600' : 'text-red-600'}`}>
                      {availableRooms} / {totalRooms} rooms
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${hasRoomsAvailable ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${totalRooms > 0 ? (availableRooms / totalRooms) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {occupiedRooms > 0 ? `${occupiedRooms} room(s) occupied` : 'All rooms available'}
                  </p>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Address</h3>
                <div className="flex items-start text-gray-600">
                  <MapPin className="w-5 h-5 mr-2 mt-0.5" />
                  <div>
                    <p>{property.houseNumber} {property.address?.street}</p>
                    <p>{property.address?.city}, {property.address?.region}</p>
                    <p>{property.address?.postalCode}, {property.address?.country}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{property.description}</p>
              </div>

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Diet & Gender Preferences with better styling */}
              {(property.dietPreference || property.genderPreference || property.dietExceptions) && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-purple-500" />
                    Tenant Preferences
                  </h4>
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
                    <div className="flex flex-wrap gap-4">
                      {property.dietPreference && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">🍽️ Diet:</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                            property.dietPreference === 'veg' 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : property.dietPreference === 'non-veg' 
                              ? 'bg-red-100 text-red-700 border border-red-200' 
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                            {property.dietPreference === 'veg' && '🥬 Vegetarian Only'}
                            {property.dietPreference === 'non-veg' && '🍗 Non-Vegetarian Only'}
                            {property.dietPreference === 'both' && '🥘 Both Welcome'}
                          </span>
                        </div>
                      )}
                      
                      {property.genderPreference && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">👥 Gender:</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                            property.genderPreference === 'male' 
                              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                              : property.genderPreference === 'female' 
                              ? 'bg-pink-100 text-pink-700 border border-pink-200' 
                              : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          }`}>
                            {property.genderPreference === 'male' && '👨 Male Only'}
                            {property.genderPreference === 'female' && '👩 Female Only'}
                            {property.genderPreference === 'both' && '👥 Both Welcome'}
                          </span>
                        </div>
                      )}
                      
                      {property.dietExceptions && (
                        <div className="flex items-start gap-2 w-full md:w-auto">
                          <span className="text-sm font-medium text-gray-700 mt-0.5">📝 Exceptions:</span>
                          <span className="text-sm text-gray-700 bg-white/70 px-3 py-1 rounded-lg border border-gray-200 flex-1">
                            {property.dietExceptions}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews Section with refresh trigger */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Reviews</h3>
                <ReviewList 
                  propertyId={property._id} 
                  refreshTrigger={reviewRefreshTrigger} 
                />
                {canReview && (
                  <button
                    onClick={async () => {
                      try {
                        const response = await axios.get(`${API_BASE_URL}/applications/tenant/applications`, {
                          headers: {
                            Authorization: `Bearer ${token}`
                          }
                        });
                        
                        const approvedApplication = response.data.find(
                          app => app.property._id === property._id && app.status === 'approved'
                        );
                        
                        if (approvedApplication) {
                          setApplicationForReview(approvedApplication);
                          setShowReviewForm(true);
                        } else {
                          toast.info('You can only review properties you have been approved for');
                        }
                      } catch (error) {
                        console.error('❌ Error checking applications:', error);
                        toast.error('Failed to check application status');
                      }
                    }}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Write a Review
                  </button>
                )}
              </div>

              {/* Owner Information */}
              {property.owner && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Owner</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900 mb-2">{property.owner.name}</p>
                    <div className="space-y-1">
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{property.owner.phone}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <span>{property.owner.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2">
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      if (user?.idVerificationStatus === 'rejected') {
                        toast.error('Your ID was rejected. Please upload a new one.');
                        return;
                      }
                      setShowApplyForm(true);
                    }}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    Apply Now
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
                
                {user && property.owner && property.owner._id !== user._id && (
                  <button
                    onClick={handleSendMessage}
                    disabled={isSendingMessage}
                    className="w-full bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center disabled:opacity-50"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {isSendingMessage ? 'Starting...' : 'Message Owner'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Form Modal */}
      {showApplyForm && (
        <ApplyForm
          property={property}
          onClose={() => setShowApplyForm(false)}
          onSuccess={() => {
            toast.success('Application submitted successfully!');
          }}
        />
      )}

      {/* Booking Form Modal */}
      {showBookingForm && (
        <RequestBooking
          property={property}
          onClose={() => setShowBookingForm(false)}
          onSuccess={() => {
            toast.success('Booking request sent!');
          }}
        />
      )}

      {/* Review Form Modal with refresh trigger */}
      {showReviewForm && applicationForReview && (
        <ReviewForm
          application={applicationForReview}
          property={property}
          onClose={() => {
            setShowReviewForm(false);
            setApplicationForReview(null);
          }}
          onSuccess={() => {
            setReviewRefreshTrigger(prev => prev + 1);
            setShowReviewForm(false);
            setApplicationForReview(null);
          }}
        />
      )}
    </div>
  );
};

export default PropertyModal;