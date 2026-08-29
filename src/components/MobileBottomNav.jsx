import React from 'react';
import { Home, Search, PlusCircle, MessageSquare, User } from 'lucide-react';

const items = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'browse', label: 'Search', icon: Search },
  { id: 'add-property', label: 'Add', icon: PlusCircle },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'profile', label: 'Profile', icon: User }
];

const MobileBottomNav = ({ activeTab = 'dashboard', onNavigate = () => {} }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-bottom">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex-1 flex flex-col items-center justify-center space-y-0.5 py-2 focus:outline-none ${isActive ? 'text-blue-600' : 'text-gray-600'}`}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
