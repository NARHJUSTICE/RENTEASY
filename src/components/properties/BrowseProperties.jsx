import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, DollarSign } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import PropertyCard from './PropertyCard';
import PropertyModal from './PropertyModal';
import ApplicationForm from '../common/ApplicationForm';

const API_BASE_URL = 'http://localhost:5001/api';

const BrowseProperties = () => {
  const { user } = useAuth();
  const [allProperties, setAllProperties] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [appliedProperty, setAppliedProperty] = useState(null);
  const [filters, setFilters] = useState({
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    city: '',
    // ✅ NEW: Diet & Gender Filters
    dietPreference: '',
    genderPreference: ''
  });

  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    applyFilters();
  }, [debouncedFilters, allProperties]);

  // ✅ Fetch ALL properties once on mount
  useEffect(() => {
    fetchAllProperties();
  }, []);

  const fetchAllProperties = async () => {
    try {
      setLoading(true);
      // ✅ Fetch ALL properties WITHOUT any status filtering
      const response = await axios.get(`${API_BASE_URL}/properties`);
      
      if (Array.isArray(response.data)) {
        setAllProperties(response.data);
      } else {
        console.warn('Expected array but got:', response.data);
        setAllProperties([]);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
      setAllProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Apply filters to ALL properties (client-side)
  const applyFilters = () => {
    let filtered = [...allProperties];
    
    // ✅ Show ALL properties regardless of status (available, maintenance, rented)
    // No status filtering - show everything
    
    // Property Type filter
    if (debouncedFilters.propertyType) {
      filtered = filtered.filter(p => p.propertyType === debouncedFilters.propertyType);
    }
    
    // Min Price filter
    if (debouncedFilters.minPrice) {
      filtered = filtered.filter(p => p.rentPrice >= parseInt(debouncedFilters.minPrice));
    }
    
    // Max Price filter
    if (debouncedFilters.maxPrice) {
      filtered = filtered.filter(p => p.rentPrice <= parseInt(debouncedFilters.maxPrice));
    }
    
    // Bedrooms filter
    if (debouncedFilters.bedrooms) {
      filtered = filtered.filter(p => p.bedrooms === parseInt(debouncedFilters.bedrooms));
    }
    
    // ✅ City filter - case insensitive, partial match
    if (debouncedFilters.city && debouncedFilters.city.trim() !== '') {
      const citySearch = debouncedFilters.city.trim().toLowerCase();
      filtered = filtered.filter(property => {
        const propertyCity = property.address?.city?.toLowerCase() || '';
        return propertyCity.includes(citySearch);
      });
    }

    // ✅ NEW: Diet Preference filter
    if (debouncedFilters.dietPreference) {
      filtered = filtered.filter(p => p.dietPreference === debouncedFilters.dietPreference);
    }

    // ✅ NEW: Gender Preference filter
    if (debouncedFilters.genderPreference) {
      filtered = filtered.filter(p => p.genderPreference === debouncedFilters.genderPreference);
    }
    
    setProperties(filtered);
  };

  const handleViewDetails = (property) => {
    setSelectedProperty(property);
    setShowModal(true);
  };

  const handleApplyNow = (property) => {
    if (user?.idVerificationStatus === 'not_uploaded') {
      toast.error('Please upload your ID first');
      return;
    }

    if (user?.idVerificationStatus === 'rejected') {
      toast.error('Your ID was rejected. Please upload a new one.');
      return;
    }

    setAppliedProperty(property);
    setShowApplicationForm(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      city: '',
      dietPreference: '',
      genderPreference: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Properties</h1>
          <p className="text-gray-600 mt-1">Find your perfect home</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4 justify-between">
          <div className="flex items-center">
            <Filter className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className="md:hidden inline-flex items-center px-3 py-2 rounded-lg bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 focus:outline-none"
            aria-label="Open filters"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <select
            value={filters.propertyType}
            onChange={(e) => handleFilterChange('propertyType', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="room">Room</option>
            <option value="studio">Studio</option>
          </select>

          <input
            type="number"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            onKeyDown={(e) => e.stopPropagation()}
          />

          <input
            type="number"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            onKeyDown={(e) => e.stopPropagation()}
          />

          <select
            value={filters.bedrooms}
            onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Any Bedrooms</option>
            <option value="1">1 Bedroom</option>
            <option value="2">2 Bedrooms</option>
            <option value="3">3 Bedrooms</option>
            <option value="4">4+ Bedrooms</option>
          </select>

          <input
            type="text"
            placeholder="City"
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => e.stopPropagation()}
          />

          {/* ✅ NEW: Diet Preference Filter */}
          <select
            value={filters.dietPreference}
            onChange={(e) => handleFilterChange('dietPreference', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Diets</option>
            <option value="veg">🥬 Vegetarian</option>
            <option value="non-veg">🍗 Non-Veg</option>
            <option value="both">🥘 Both Welcome</option>
          </select>

          {/* ✅ NEW: Gender Preference Filter */}
          <select
            value={filters.genderPreference}
            onChange={(e) => handleFilterChange('genderPreference', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Genders</option>
            <option value="male">👨 Male Only</option>
            <option value="female">👩 Female Only</option>
            <option value="both">👥 Both Welcome</option>
          </select>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={clearFilters}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isFilterOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black bg-opacity-40"
            onClick={() => setIsFilterOpen(false)}
            aria-hidden="true"
          />

          <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-xl shadow-lg max-h-[80vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 rounded-md hover:bg-gray-100">
                Close
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Property Type</label>
                <select
                  value={filters.propertyType}
                  onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="room">Room</option>
                  <option value="studio">Studio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Min Price</label>
                <input
                  type="number"
                  placeholder="Min Price"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Max Price</label>
                <input
                  type="number"
                  placeholder="Max Price"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Bedrooms</label>
                <select
                  value={filters.bedrooms}
                  onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Bedrooms</option>
                  <option value="1">1 Bedroom</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3 Bedrooms</option>
                  <option value="4">4+ Bedrooms</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  placeholder="City"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ✅ NEW: Diet Preference Filter in Mobile */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Diet Preference</label>
                <select
                  value={filters.dietPreference}
                  onChange={(e) => handleFilterChange('dietPreference', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Diets</option>
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-Veg</option>
                  <option value="both">Both Welcome</option>
                </select>
              </div>

              {/* ✅ NEW: Gender Preference Filter in Mobile */}
              <div>
                <label className="block text-sm text-gray-700 mb-2">Gender Preference</label>
                <select
                  value={filters.genderPreference}
                  onChange={(e) => handleFilterChange('genderPreference', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Genders</option>
                  <option value="male">Male Only</option>
                  <option value="female">Female Only</option>
                  <option value="both">Both Welcome</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => { setDebouncedFilters(filters); setIsFilterOpen(false); }}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-3 text-base font-medium"
                >
                  Apply
                </button>
                <button
                  onClick={() => { clearFilters(); }}
                  className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-3 text-base font-medium"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {properties ? properties.length : 0} Properties Found
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (!properties || properties.length === 0) ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No properties found matching your criteria</p>
            <p className="text-gray-400">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {properties.map((property, index) => (
              <PropertyCard
                key={property._id}
                property={property}
                onViewDetails={handleViewDetails}
                onApplyNow={handleApplyNow}
                showOwnerInfo={true}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Property Modal */}
      {showModal && selectedProperty && (
        <PropertyModal
          property={selectedProperty}
          onClose={() => {
            setShowModal(false);
            setSelectedProperty(null);
          }}
          onApplyNow={handleApplyNow}
        />
      )}

      {/* Application Form - Unified */}
      {showApplicationForm && appliedProperty && (
        <ApplicationForm
          property={appliedProperty}
          onClose={() => {
            setShowApplicationForm(false);
            setAppliedProperty(null);
          }}
          onSuccess={() => {
            setShowApplicationForm(false);
            setAppliedProperty(null);
            toast.success('Application submitted successfully!');
          }}
        />
      )}
    </div>
  );
};

export default BrowseProperties;