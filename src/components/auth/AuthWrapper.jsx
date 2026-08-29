import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthWrapper = () => {
  const [showRegister, setShowRegister] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {showRegister ? (
        <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
      ) : (
        <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
      )}
    </div>
  );
};

export default AuthWrapper;