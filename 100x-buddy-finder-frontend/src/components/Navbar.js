// src/components/Navbar.js
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('token') !== null;

  // Check if the current route is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token'); // Also remove refresh token
    navigate('/login');
  };

  return (
    <nav className="bg-indigo-600 text-white px-4 py-2 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="font-bold text-xl">
          Buddy Finder
        </Link>
        
        {isAuthenticated ? (
          <div className="flex items-center space-x-1">
            <NavLink to="/dashboard" isActive={isActive('/dashboard')}>
              Dashboard
            </NavLink>
            
            <NavLink to="/profile" isActive={isActive('/profile')}>
              Profile
            </NavLink>
            
            <NavLink to="/matches" isActive={isActive('/matches')}>
              Matches
            </NavLink>
            
            <NavLink to="/connections" isActive={isActive('/connections')}>
              Buddies
            </NavLink>
            
            <div className="ml-2">
              <NotificationBell />
            </div>
            
            <button
              onClick={handleLogout}
              className="ml-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-sm"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Link to="/login" className="hover:text-indigo-200">Login</Link>
            <Link 
              to="/register" 
              className="bg-indigo-500 hover:bg-indigo-400 px-3 py-1 rounded"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

// Helper component for nav links
const NavLink = ({ to, isActive, children }) => (
  <Link
    to={to}
    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
      isActive 
        ? 'bg-indigo-700 text-white' 
        : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
    }`}
  >
    {children}
  </Link>
);