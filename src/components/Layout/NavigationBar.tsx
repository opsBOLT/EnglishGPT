import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

const NavigationBar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Study Tasks', path: '/study' },
    { name: 'Practice', path: '/practice' },
    { name: 'Calendar', path: '/calendar' },
    { name: 'Analytics', path: '/analytics' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EP</span>
              </div>
              <span className="font-semibold text-gray-900">ExamPrep</span>
            </Link>

            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
              <Search className="w-5 h-5" />
            </button>

            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.full_name || 'User'}
                </span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowDropdown(false)}
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setShowDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
