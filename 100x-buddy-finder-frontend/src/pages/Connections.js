import React from 'react';
import ConnectionsList from '../components/ConnectionsList';

const ConnectionsPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-indigo-800 mb-6">Your Coding Buddies</h1>
      
      <ConnectionsList />
    </div>
  );
};

export default ConnectionsPage;