import React, { useState, useEffect } from 'react';
import { Upload, User, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const IDUpload = () => {
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // ✅ Refresh user data using axios defaults (token already included)
  useEffect(() => {
    const refreshUser = async () => {
      try {
        console.log('🔄 Refreshing user data...');
        const response = await axios.get(`${API_BASE_URL}/auth/me`);
        if (response.data.user) {
          console.log('✅ User data refreshed:', response.data.user);
          updateUser(response.data.user);
        }
      } catch (error) {
        console.error('Error refreshing user:', error);
      }
    };
    refreshUser();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('idProof', selectedFile);

    try {
      setUploading(true);
      const response = await axios.post(
        `${API_BASE_URL}/auth/upload-id-proof`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success('ID Proof uploaded successfully!');
      
      if (response.data.user) {
        updateUser(response.data.user);
      } else {
        const userResponse = await axios.get(`${API_BASE_URL}/auth/me`);
        updateUser(userResponse.data.user);
      }
      
      setSelectedFile(null);
      setPreviewUrl(null);
      document.getElementById('id-upload-input').value = '';
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to upload ID';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = () => {
    const status = user?.idVerificationStatus || 'not_uploaded';
    const statusMap = {
      'verified': { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Verified' },
      'approved': { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Verified' },
      'pending': { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending Review' },
      'rejected': { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' },
      'not_uploaded': { icon: User, color: 'text-gray-400', bg: 'bg-gray-100', label: 'Not Uploaded' }
    };
    return statusMap[status] || statusMap['not_uploaded'];
  };

  const statusInfo = getStatusBadge();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">ID Verification</h2>
      
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          Upload your government-issued ID (Passport, Driver's License, National ID)
          <br />
          <span className="text-xs text-blue-500">Supported formats: JPEG, PNG, PDF (Max 5MB)</span>
        </p>
      </div>

      <div className="mb-6 p-4 border rounded-lg flex items-center space-x-3">
        <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
        <span className={`font-medium ${statusInfo.color}`}>Status: {statusInfo.label}</span>
        {user?.idVerificationNotes && user.idVerificationStatus === 'rejected' && (
          <p className="text-sm text-red-600 ml-4">{user.idVerificationNotes}</p>
        )}
      </div>

      {user?.idVerificationStatus !== 'verified' && user?.idVerificationStatus !== 'approved' && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {previewUrl ? (
              <div className="mb-4">
                <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
              </div>
            ) : (
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            )}
            <input
              id="id-upload-input"
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="id-upload-input"
              className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Select ID File
            </label>
            <p className="text-gray-500 mt-2">
              {selectedFile ? selectedFile.name : 'Click to select a file (JPEG, PNG, PDF)'}
            </p>
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Upload ID Proof
              </>
            )}
          </button>
        </div>
      )}

      {(user?.idVerificationStatus === 'verified' || user?.idVerificationStatus === 'approved') && (
        <div className="p-4 bg-green-50 rounded-lg text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <p className="text-green-700 font-medium">Your ID has been verified!</p>
          <p className="text-sm text-green-600">You can now apply for properties.</p>
        </div>
      )}
    </div>
  );
};

export default IDUpload;