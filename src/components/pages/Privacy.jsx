import React from 'react';

const Privacy = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: August 16, 2026</p>
      
      <div className="space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Personal Information:</strong> Name, email address, phone number, and profile information.</li>
            <li><strong>Property Information:</strong> Details about properties you list or express interest in.</li>
            <li><strong>Usage Data:</strong> How you interact with our platform.</li>
            <li><strong>ID Verification:</strong> Uploaded ID documents for verification purposes.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To provide and improve our services.</li>
            <li>To verify user identities and prevent fraud.</li>
            <li>To facilitate communication between tenants and landlords.</li>
            <li>To send important notifications about your account and activities.</li>
            <li>To analyze and improve platform performance.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Information Sharing</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We do not sell your personal information to third parties.</li>
            <li>We may share information with service providers who help us operate the platform.</li>
            <li>We may disclose information if required by law.</li>
            <li>Your profile information is visible to other users as intended by the platform.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We implement industry-standard security measures to protect your data.</li>
            <li>Your password is encrypted and never stored in plain text.</li>
            <li>We use secure HTTPS connections for all data transmission.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Your Rights</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You can access, update, or delete your personal information.</li>
            <li>You can request a copy of your data.</li>
            <li>You can opt out of marketing communications.</li>
            <li>You can close your account at any time.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Cookies</h2>
          <p>We use cookies to enhance your experience, remember your preferences, and analyze usage patterns. You can control cookie settings in your browser.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact Us</h2>
          <p>If you have any questions about this privacy policy, please contact us at: <a href="mailto:justicenarh9@gmail.com" className="text-blue-600 hover:underline">justicenarh9@gmail.com</a></p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;