// src/components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('token') !== null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-indigo-700 text-white">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">100x Buddy Finder</Link>
        
        {isAuthenticated ? (
          <div className="flex items-center space-x-6">
            <Link to="/" className="hover:text-indigo-200">Dashboard</Link>
            <Link to="/profile" className="hover:text-indigo-200">Profile</Link>
            <Link to="/matches" className="hover:text-indigo-200">Matches</Link>
            <button 
              onClick={handleLogout}
              className="bg-indigo-800 hover:bg-indigo-900 px-3 py-1 rounded"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Link to="/login" className="hover:text-indigo-200">Login</Link>
            <Link 
              to="/register" 
              className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}