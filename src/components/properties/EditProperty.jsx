import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Upload, DollarSign, Home, Bed, Bath, ArrowLeft, Users, X, Trash2, Image, Video, Plus } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const EditProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    rentPrice: '',
    houseNumber: '',
    street: '',
    city: '',
    region: '',
    postalCode: '',
    country: '',
    latitude: '',
    longitude: '',
    amenities: '',
    availability: 'available',
    dietPreference: 'both',
    dietExceptions: '',
    genderPreference: 'both'
  });
  
  // ✅ Enhanced file management
  const [existingFiles, setExistingFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [filesToDelete, setFilesToDelete] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    console.log('🔍 [EditProperty] useEffect triggered with id:', id);
    if (id) {
      fetchProperty();
    } else {
      console.error('❌ [EditProperty] No ID provided in URL!');
      setError('No property ID provided');
      setLoading(false);
    }
  }, [id]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/properties/${id}`);
      console.log('✅ [EditProperty] Property data received:', response.data);
      
      const property = response.data;
      
      setFormData({
        title: property.title || '',
        description: property.description || '',
        propertyType: property.propertyType || '',
        bedrooms: property.bedrooms || '',
        bathrooms: property.bathrooms || '',
        rentPrice: property.rentPrice || '',
        houseNumber: property.address?.houseNumber || '',
        street: property.address?.street || '',
        city: property.address?.city || '',
        region: property.address?.region || '',
        postalCode: property.address?.postalCode || '',
        country: property.address?.country || '',
        latitude: property.location?.coordinates?.[1] || '',
        longitude: property.location?.coordinates?.[0] || '',
        amenities: property.amenities?.join(', ') || '',
        availability: property.availability || 'available',
        dietPreference: property.dietPreference || 'both',
        dietExceptions: property.dietExceptions || '',
        genderPreference: property.genderPreference || 'both'
      });
      
      // ✅ Set existing files with preview URLs
      if (property.photos && property.photos.length > 0) {
        const files = property.photos.map((url, index) => ({
          id: `existing-${index}`,
          url: url,
          name: url.split('/').pop() || `Image ${index + 1}`,
          isExisting: true,
          preview: getImageUrl(url)
        }));
        setExistingFiles(files);
      }
      
      console.log('✅ [EditProperty] Form data set successfully');
    } catch (error) {
      console.error('❌ [EditProperty] Error fetching property:', error);
      setError('Failed to load property');
      toast.error('Failed to load property');
      setTimeout(() => {
        navigate('/my-properties');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (photo) => {
    if (!photo) return '';
    if (photo.startsWith('http://') || photo.startsWith('https://')) return photo;
    if (photo.startsWith('/uploads/')) {
      return `${API_BASE_URL}${photo}`;
    }
    if (photo.includes('property-')) {
      return `${API_BASE_URL}/uploads/properties/${photo}`;
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Handle new file uploads
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('media', file);
      });

      const response = await axios.post(`${API_BASE_URL}/upload/property-media`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // ✅ Add new files with preview
      const newUploads = response.data.files.map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        url: file.url,
        name: file.originalName,
        isExisting: false,
        preview: file.url.startsWith('http') ? file.url : `${API_BASE_URL}${file.url}`
      }));

      setNewFiles(prev => [...prev, ...newUploads]);
      toast.success(`${files.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('❌ [EditProperty] File upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  // ✅ Remove an existing file (mark for deletion)
  const removeExistingFile = (fileId) => {
    const file = existingFiles.find(f => f.id === fileId);
    if (file) {
      setFilesToDelete(prev => [...prev, file.url]);
      setExistingFiles(prev => prev.filter(f => f.id !== fileId));
    }
  };

  // ✅ Remove a newly uploaded file
  const removeNewFile = (fileId) => {
    setNewFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // ✅ Get all files for display (existing + new)
  const getAllFiles = () => {
    return [...existingFiles, ...newFiles];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const propertyData = {
        ...formData,
        rentPrice: Number(formData.rentPrice),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        address: {
          houseNumber: formData.houseNumber,
          street: formData.street,
          city: formData.city,
          region: formData.region,
          postalCode: formData.postalCode,
          country: formData.country
        },
        location: {
          type: 'Point',
          coordinates: [
            parseFloat(formData.longitude) || 0,
            parseFloat(formData.latitude) || 0
          ]
        },
        amenities: formData.amenities ? formData.amenities.split(',').map(a => a.trim()) : [],
        dietPreference: formData.dietPreference || 'both',
        dietExceptions: formData.dietExceptions || '',
        genderPreference: formData.genderPreference || 'both',
        // ✅ Send new photos and files to delete
        newPhotos: newFiles.map(f => f.url),
        deletePhotos: filesToDelete
      };

      console.log('🔍 [EditProperty] Sending data:', propertyData);
      
      const response = await axios.put(`${API_BASE_URL}/properties/${id}`, propertyData);
      console.log('✅ [EditProperty] Update successful:', response.data);
      
      toast.success('Property updated successfully!');
      navigate('/my-properties');
    } catch (error) {
      console.error('❌ [EditProperty] Error updating property:', error);
      const message = error.response?.data?.message || 'Failed to update property';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // If there's an error, show it
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => navigate('/my-properties')}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          Back to Properties
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalFiles = getAllFiles().length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/my-properties')}
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-1" /> Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Property</h1>
            <p className="text-gray-600 mt-1">Update your property details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Title *
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Beautiful 2-bedroom apartment"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type *
              </label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select property type</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="room">Room</option>
                <option value="studio">Studio</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your property..."
            />
          </div>

          {/* Tenant Preferences */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Tenant Preferences
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Diet Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Diet Preference
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, dietPreference: 'veg' }))}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      formData.dietPreference === 'veg' 
                        ? 'border-green-500 bg-green-50 shadow-md' 
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                    }`}
                  >
                    <span className="text-2xl">🥬</span>
                    <span className="text-xs font-medium mt-1">Vegetarian</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, dietPreference: 'non-veg' }))}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      formData.dietPreference === 'non-veg' 
                        ? 'border-red-500 bg-red-50 shadow-md' 
                        : 'border-gray-200 hover:border-red-300 hover:bg-red-50/50'
                    }`}
                  >
                    <span className="text-2xl">🍗</span>
                    <span className="text-xs font-medium mt-1">Non-Veg</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, dietPreference: 'both' }))}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      formData.dietPreference === 'both' 
                        ? 'border-purple-500 bg-purple-50 shadow-md' 
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                    }`}
                  >
                    <span className="text-2xl">🥘</span>
                    <span className="text-xs font-medium mt-1">Both Welcome</span>
                  </button>
                </div>
              </div>

              {/* Gender Preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Gender Preference
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, genderPreference: 'male' }))}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      formData.genderPreference === 'male' 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <span className="text-2xl">👨</span>
                    <span className="text-xs font-medium mt-1">Male Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, genderPreference: 'female' }))}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      formData.genderPreference === 'female' 
                        ? 'border-pink-500 bg-pink-50 shadow-md' 
                        : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50'
                    }`}
                  >
                    <span className="text-2xl">👩</span>
                    <span className="text-xs font-medium mt-1">Female Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, genderPreference: 'both' }))}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      formData.genderPreference === 'both' 
                        ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    <span className="text-2xl">👥</span>
                    <span className="text-xs font-medium mt-1">Both Welcome</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Diet Exceptions */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diet Exceptions (Optional)
              </label>
              <textarea
                name="dietExceptions"
                value={formData.dietExceptions}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., No beef allowed, only chicken, fish and eggs"
              />
            </div>
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedrooms *
              </label>
              <div className="relative">
                <Bed className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  type="number"
                  min="1"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bathrooms *
              </label>
              <div className="relative">
                <Bath className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  type="number"
                  min="1"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rent Price ($/month) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  name="rentPrice"
                  value={formData.rentPrice}
                  onChange={handleChange}
                  type="number"
                  min="1"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Address</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  House Number *
                </label>
                <input
                  name="houseNumber"
                  value={formData.houseNumber}
                  onChange={handleChange}
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Main Street"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="New York"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region/State *
                </label>
                <input
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="NY"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code *
                </label>
                <input
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="USA"
                />
              </div>
            </div>
          </div>

          {/* Location Coordinates */}
          <div className="space-y-4">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Location Coordinates</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  type="number"
                  step="any"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="40.7128"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  type="number"
                  step="any"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="-74.0060"
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amenities
            </label>
            <input
              name="amenities"
              value={formData.amenities}
              onChange={handleChange}
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="WiFi, Parking, Gym, Pool (comma separated)"
            />
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Availability
            </label>
            <select
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>

          {/* ✅ ENHANCED: File Management Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos & Videos
            </label>
            
            {/* Upload Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploading ? 'Uploading...' : 'Upload New Files'}
              </label>
              <p className="text-gray-500 mt-2">
                {uploading ? 'Please wait...' : 'Upload new photos and videos of your property'}
              </p>
              {uploading && (
                <div className="mt-2 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-500">Uploading files...</span>
                </div>
              )}
            </div>

            {/* File List */}
            {totalFiles > 0 && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-medium text-gray-700">
                    Files ({totalFiles})
                  </p>
                  <span className="text-xs text-gray-500">
                    {existingFiles.length} existing, {newFiles.length} new
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {/* Existing Files */}
                  {existingFiles.map((file) => (
                    <div key={file.id} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '';
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            if (parent) {
                              const fallback = document.createElement('div');
                              fallback.className = 'w-full h-full flex items-center justify-center text-gray-400';
                              fallback.innerHTML = '🖼️ No Image';
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      </div>
                      <div className="absolute top-1 right-1">
                        <button
                          type="button"
                          onClick={() => removeExistingFile(file.id)}
                          className="p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                          title="Delete this image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="absolute bottom-1 left-1">
                        <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded">
                          Existing
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Newly Uploaded Files */}
                  {newFiles.map((file) => (
                    <div key={file.id} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-green-400">
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '';
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="absolute top-1 right-1">
                        <button
                          type="button"
                          onClick={() => removeNewFile(file.id)}
                          className="p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                          title="Remove this file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="absolute bottom-1 left-1">
                        <span className="px-1.5 py-0.5 bg-green-600 text-white text-xs rounded">
                          New
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* File Count Summary */}
                <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                  <span>
                    {filesToDelete.length > 0 && (
                      <span className="text-red-600">
                        {filesToDelete.length} file(s) marked for deletion
                      </span>
                    )}
                  </span>
                  <span>
                    {totalFiles} total files
                  </span>
                </div>
              </div>
            )}

            {totalFiles === 0 && (
              <div className="text-center py-4 text-gray-500">
                No files uploaded yet. Upload some photos of your property.
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/my-properties')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Home className="w-5 h-5 mr-2" />
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProperty;