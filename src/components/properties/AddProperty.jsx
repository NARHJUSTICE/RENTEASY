import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MapPin, Upload, DollarSign, Home, Bed, Bath, Users, Utensils, UserCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

// API Base URL
const API_BASE_URL = 'http://localhost:5001/api';

const normalizeRoomCount = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const AddProperty = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      dietPreference: 'both',
      genderPreference: 'both'
    }
  });

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(file => {
      formData.append('media', file);
    });

    try {
      const response = await axios.post(`${API_BASE_URL}/upload/property-media`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadedFiles(prev => [...prev, ...response.data.files]);
      toast.success(`${files.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      const totalRooms = normalizeRoomCount(data.totalRooms);

      const propertyData = {
        ...data,
        // ✅ Room fields
        totalRooms,
        availableRooms: totalRooms,
        occupiedRooms: 0,
        photos: uploadedFiles.filter(file => file.type === 'image').map(file => file.url),
        videos: uploadedFiles.filter(file => file.type === 'video').map(file => file.url),
        location: {
          type: 'Point',
          coordinates: [parseFloat(data.longitude) || 0, parseFloat(data.latitude) || 0]
        },
        address: {
          street: data.street,
          city: data.city,
          region: data.region,
          postalCode: data.postalCode,
          country: data.country
        },
        amenities: data.amenities ? data.amenities.split(',').map(a => a.trim()) : [],
        // ✅ NEW: Diet & Gender Preferences
        dietPreference: data.dietPreference || 'both',
        dietExceptions: data.dietExceptions || '',
        genderPreference: data.genderPreference || 'both'
      };

      const response = await axios.post(`${API_BASE_URL}/properties`, propertyData);
      toast.success('Property added successfully!');
      reset();
      setUploadedFiles([]);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add property';
      toast.error(message);
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Watch diet preference for dynamic display
  const dietPreference = watch('dietPreference');
  const genderPreference = watch('genderPreference');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Property</h1>
          <p className="text-gray-600 mt-2">List your property for rent</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Title *
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Beautiful 2-bedroom apartment"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type *
              </label>
              <select
                {...register('propertyType', { required: 'Property type is required' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select property type</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="room">Room</option>
                <option value="studio">Studio</option>
              </select>
              {errors.propertyType && (
                <p className="mt-1 text-sm text-red-600">{errors.propertyType.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your property..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* ✅ ENHANCED: Diet & Gender Preferences with better colors */}
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
                    onClick={() => {
                      document.querySelector('input[name="dietPreference"][value="veg"]').checked = true;
                      const event = new Event('change', { bubbles: true });
                      document.querySelector('input[name="dietPreference"][value="veg"]').dispatchEvent(event);
                    }}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      dietPreference === 'veg' 
                        ? 'border-green-500 bg-green-50 shadow-md' 
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                    }`}
                  >
                    <span className="text-2xl">🥬</span>
                    <span className="text-xs font-medium mt-1">Vegetarian</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      document.querySelector('input[name="dietPreference"][value="non-veg"]').checked = true;
                      const event = new Event('change', { bubbles: true });
                      document.querySelector('input[name="dietPreference"][value="non-veg"]').dispatchEvent(event);
                    }}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      dietPreference === 'non-veg' 
                        ? 'border-red-500 bg-red-50 shadow-md' 
                        : 'border-gray-200 hover:border-red-300 hover:bg-red-50/50'
                    }`}
                  >
                    <span className="text-2xl">🍗</span>
                    <span className="text-xs font-medium mt-1">Non-Veg</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      document.querySelector('input[name="dietPreference"][value="both"]').checked = true;
                      const event = new Event('change', { bubbles: true });
                      document.querySelector('input[name="dietPreference"][value="both"]').dispatchEvent(event);
                    }}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      dietPreference === 'both' 
                        ? 'border-purple-500 bg-purple-50 shadow-md' 
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                    }`}
                  >
                    <span className="text-2xl">🥘</span>
                    <span className="text-xs font-medium mt-1">Both Welcome</span>
                  </button>
                </div>
                {/* Hidden radio inputs for react-hook-form */}
                <div className="hidden">
                  <input type="radio" value="veg" {...register('dietPreference')} />
                  <input type="radio" value="non-veg" {...register('dietPreference')} />
                  <input type="radio" value="both" {...register('dietPreference')} />
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
                    onClick={() => {
                      document.querySelector('input[name="genderPreference"][value="male"]').checked = true;
                      const event = new Event('change', { bubbles: true });
                      document.querySelector('input[name="genderPreference"][value="male"]').dispatchEvent(event);
                    }}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      genderPreference === 'male' 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <span className="text-2xl">👨</span>
                    <span className="text-xs font-medium mt-1">Male Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      document.querySelector('input[name="genderPreference"][value="female"]').checked = true;
                      const event = new Event('change', { bubbles: true });
                      document.querySelector('input[name="genderPreference"][value="female"]').dispatchEvent(event);
                    }}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      genderPreference === 'female' 
                        ? 'border-pink-500 bg-pink-50 shadow-md' 
                        : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50'
                    }`}
                  >
                    <span className="text-2xl">👩</span>
                    <span className="text-xs font-medium mt-1">Female Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      document.querySelector('input[name="genderPreference"][value="both"]').checked = true;
                      const event = new Event('change', { bubbles: true });
                      document.querySelector('input[name="genderPreference"][value="both"]').dispatchEvent(event);
                    }}
                    className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                      genderPreference === 'both' 
                        ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'
                    }`}
                  >
                    <span className="text-2xl">👥</span>
                    <span className="text-xs font-medium mt-1">Both Welcome</span>
                  </button>
                </div>
                {/* Hidden radio inputs for react-hook-form */}
                <div className="hidden">
                  <input type="radio" value="male" {...register('genderPreference')} />
                  <input type="radio" value="female" {...register('genderPreference')} />
                  <input type="radio" value="both" {...register('genderPreference')} />
                </div>
              </div>
            </div>

            {/* Diet Exceptions */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diet Exceptions (Optional)
              </label>
              <textarea
                {...register('dietExceptions')}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., No beef allowed, only chicken, fish and eggs"
              />
              <p className="mt-1 text-sm text-gray-500">
                Specify any exceptions to the diet preference
              </p>
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
                  {...register('bedrooms', { 
                    required: 'Number of bedrooms is required',
                    min: { value: 1, message: 'Must be at least 1' }
                  })}
                  type="number"
                  min="1"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.bedrooms && (
                <p className="mt-1 text-sm text-red-600">{errors.bedrooms.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bathrooms *
              </label>
              <div className="relative">
                <Bath className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  {...register('bathrooms', { 
                    required: 'Number of bathrooms is required',
                    min: { value: 1, message: 'Must be at least 1' }
                  })}
                  type="number"
                  min="1"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.bathrooms && (
                <p className="mt-1 text-sm text-red-600">{errors.bathrooms.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rent Price ($/month) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  {...register('rentPrice', { 
                    required: 'Rent price is required',
                    min: { value: 1, message: 'Must be greater than 0' }
                  })}
                  type="number"
                  min="1"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.rentPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.rentPrice.message}</p>
              )}
            </div>
          </div>

          {/* Room Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Room Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Rooms *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    {...register('totalRooms', { 
                      required: 'Total rooms is required',
                      min: { value: 1, message: 'Must be at least 1' }
                    })}
                    type="number"
                    min="1"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Number of rooms available"
                  />
                </div>
                {errors.totalRooms && (
                  <p className="mt-1 text-sm text-red-600">{errors.totalRooms.message}</p>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Enter the total number of rooms available for rent in this property
            </p>
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
                  {...register('houseNumber', { required: 'House number is required' })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123A"
                />
                {errors.houseNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.houseNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  {...register('street', { required: 'Street address is required' })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Main Street"
                />
                {errors.street && (
                  <p className="mt-1 text-sm text-red-600">{errors.street.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  {...register('city', { required: 'City is required' })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="New York"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region/State *
                </label>
                <input
                  {...register('region', { required: 'Region is required' })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="NY"
                />
                {errors.region && (
                  <p className="mt-1 text-sm text-red-600">{errors.region.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code *
                </label>
                <input
                  {...register('postalCode', { required: 'Postal code is required' })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10001"
                />
                {errors.postalCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  {...register('country', { required: 'Country is required' })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="USA"
                />
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                )}
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
                  {...register('latitude')}
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
                  {...register('longitude')}
                  type="number"
                  step="any"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="-74.0060"
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Optional: You can get coordinates from Google Maps or other mapping services
            </p>
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amenities
            </label>
            <input
              {...register('amenities')}
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="WiFi, Parking, Gym, Pool (comma separated)"
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter amenities separated by commas
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos & Videos
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
              >
                Upload Files
              </label>
              <p className="text-gray-500 mt-2">
                Upload photos and videos of your property
              </p>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Uploaded Files ({uploadedFiles.length})
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="text-sm text-gray-600 truncate">
                      {file.originalName}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                reset();
                setUploadedFiles([]);
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Home className="w-5 h-5 mr-2" />
              {isSubmitting ? 'Adding Property...' : 'Add Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProperty;