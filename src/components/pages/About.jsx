import React from 'react';
import { Home, Users, Shield, Heart, Award, Globe } from 'lucide-react';

const About = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">About RentEasy</h1>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 text-lg mb-8">
          RentEasy is a modern house renting platform connecting tenants with landlords for a seamless rental experience.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-blue-50 p-6 rounded-lg">
            <Home className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">Find Your Home</h3>
            <p className="text-gray-600 text-sm">Browse thousands of properties and find your perfect home.</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <Users className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">Connect Directly</h3>
            <p className="text-gray-600 text-sm">Communicate directly with landlords through our platform.</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <Shield className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">Secure & Verified</h3>
            <p className="text-gray-600 text-sm">Identity verification ensures a safe community for everyone.</p>
          </div>
          <div className="bg-red-50 p-6 rounded-lg">
            <Heart className="w-8 h-8 text-red-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">Made with ❤️</h3>
            <p className="text-gray-600 text-sm">Built with love for renters and landlords alike.</p>
          </div>
        </div>

        <div className="bg-gray-50 p-8 rounded-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-700">
            To simplify the house renting process by creating a transparent, secure, and efficient platform 
            where tenants and landlords can connect with confidence.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">What We Offer</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Easy property search and filtering</li>
            <li>Secure ID verification system</li>
            <li>Direct messaging between tenants and landlords</li>
            <li>Application and booking management</li>
            <li>Property reviews and ratings</li>
            <li>Favorites and wishlist</li>
            <li>Subscription-based model for fair access</li>
          </ul>
        </div>

        <div className="flex items-center space-x-2 text-gray-600 border-t pt-6">
          <Award className="w-5 h-5 text-blue-600" />
          <span>Built by <strong>Narh Justice Tetteh</strong></span>
        </div>
      </div>
    </div>
  );
};

export default About;