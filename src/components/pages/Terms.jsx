import React from 'react';

const Terms = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms & Conditions</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: August 16, 2026</p>
      
      <div className="space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
          <p>By using RentEasy, you agree to these Terms & Conditions. If you do not agree, please do not use our platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. User Accounts</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You must be at least 18 years old to use this platform.</li>
            <li>You are responsible for maintaining the security of your account.</li>
            <li>You must provide accurate and complete information.</li>
            <li>You are solely responsible for all activities that occur under your account.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Property Listings</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Landlords must provide accurate property information.</li>
            <li>All property listings must comply with local laws and regulations.</li>
            <li>RentEasy is not responsible for the accuracy of property listings.</li>
            <li>We reserve the right to remove any listing that violates our policies.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. User Conduct</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Treat all users with respect and professionalism.</li>
            <li>Do not post false or misleading information.</li>
            <li>Do not use the platform for any illegal activities.</li>
            <li>Do not harass or discriminate against other users.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Payments and Subscriptions</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>All subscription fees are non-refundable.</li>
            <li>You are responsible for all subscription charges.</li>
            <li>We reserve the right to change pricing with prior notice.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these terms or engage in harmful behavior.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Disclaimer</h2>
          <p>RentEasy is provided "as is" without warranties of any kind. We do not guarantee the accuracy of property listings or the reliability of users.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Contact</h2>
          <p>For questions about these terms, contact us at: <a href="mailto:justicenarh9@gmail.com" className="text-blue-600 hover:underline">justicenarh9@gmail.com</a></p>
        </section>
      </div>
    </div>
  );
};

export default Terms;