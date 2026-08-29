import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = 'http://localhost:5001/api';

const FavoriteButton = ({ propertyId, onToggle }) => {
  const { user, token } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && propertyId) {
      checkFavoriteStatus();
    }
  }, [user, propertyId]);

  const checkFavoriteStatus = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/favorites/check/${propertyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setIsFavorited(response.data.isFavorited);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleToggle = async () => {
    if (!user) {
      toast.error('Please login to save favorites');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/favorites/toggle/${propertyId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setIsFavorited(response.data.isFavorited);
      toast.success(response.data.message);
      
      if (onToggle) {
        onToggle(response.data.isFavorited);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update favorite';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`p-2 rounded-full transition-colors ${
        isFavorited
          ? 'bg-red-50 text-red-500 hover:bg-red-100'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      } disabled:opacity-50`}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={`w-5 h-5 ${isFavorited ? 'fill-red-500' : ''}`}
      />
    </button>
  );
};

export default FavoriteButton;