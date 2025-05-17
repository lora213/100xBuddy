// src/app/connections/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCustomAuth } from '@/lib/custom-auth';
import { connectionsApi, matchesApi } from '@/lib/api';
import { FullPageLoader, RequireLoginFallback } from '@/components/shared/PageHelpers';

// Define connection types
type ConnectionStatus = 'accepted' | 'pending' | 'received';

interface Connection {
  id: string;
  userId: string;
  name: string;
  email: string;
  profileImage?: string;
  status: ConnectionStatus;
  matchScore: number;
  matchType: 'cofounder' | 'teammate' | 'client';
  lastActive?: string;
  createdAt: string;
}

export default function ConnectionsPage() {
  const router = useRouter();
  const { user, isLoading } = useCustomAuth();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'connections' | 'incoming' | 'outgoing'>('connections');
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchConnections = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // In a real implementation, this would fetch from the API
        // const connectionsResponse = await connectionsApi.getConnections();
        // const incomingResponse = await matchesApi.getIncomingMatchRequests();
        // const outgoingResponse = await matchesApi.getOutgoingMatchRequests();
        
        // For now, use sample data
        const sampleConnections: Connection[] = [
          {
            id: '1',
            userId: 'user1',
            name: 'Alex Johnson',
            email: 'alex@example.com',
            profileImage: '/api/placeholder/64/64',
            status: 'accepted',
            matchScore: 92,
            matchType: 'cofounder',
            lastActive: '2 days ago',
            createdAt: '2025-01-15T00:00:00.000Z'
          },
          {
            id: '2',
            userId: 'user2',
            name: 'Sam Peterson',
            email: 'sam@example.com',
            profileImage: '/api/placeholder/64/64',
            status: 'accepted',
            matchScore: 87,
            matchType: 'teammate',
            lastActive: '5 hours ago',
            createdAt: '2025-02-23T00:00:00.000Z'
          }
        ];
        
        const sampleIncoming = [
          {
            id: 'req1',
            userId: 'user3',
            name: 'Jordan Lee',
            email: 'jordan@example.com',
            profileImage: '/api/placeholder/64/64',
            matchScore: 81,
            matchType: 'client',
            createdAt: '2025-05-10T00:00:00.000Z'
          },
          {
            id: 'req2',
            userId: 'user4',
            name: 'Taylor Wright',
            email: 'taylor@example.com',
            profileImage: '/api/placeholder/64/64',
            matchScore: 78,
            matchType: 'teammate',
            createdAt: '2025-05-12T00:00:00.000Z'
          }
        ];
        
        const sampleOutgoing = [
          {
            id: 'req3',
            userId: 'user5',
            name: 'Morgan Campbell',
            email: 'morgan@example.com',
            profileImage: '/api/placeholder/64/64',
            matchScore: 75,
            matchType: 'cofounder',
            createdAt: '2025-05-14T00:00:00.000Z'
          }
        ];
        
        setConnections(sampleConnections);
        setIncomingRequests(sampleIncoming);
        setOutgoingRequests(sampleOutgoing);
      } catch (error) {
        console.error('Error fetching connections:', error);
        setError('Failed to load connections');
      } finally {
        setLoading(false);
      }
    };
    
    fetchConnections();
  }, [user]);
  
  const handleAcceptRequest = async (requestId: string) => {
    try {
      // In a real implementation, this would call your API
      // await matchesApi.acceptMatchRequest(requestId);
      
      // Update local state
      const acceptedRequest = incomingRequests.find(req => req.id === requestId);
      if (acceptedRequest) {
        // Move from incoming to connections
        setConnections([
          ...connections, 
          {
            ...acceptedRequest,
            status: 'accepted',
            createdAt: new Date().toISOString()
          }
        ]);
        setIncomingRequests(incomingRequests.filter(req => req.id !== requestId));
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      setError('Failed to accept connection request');
    }
  };
  
  const handleRejectRequest = async (requestId: string) => {
    try {
      // In a real implementation, this would call your API
      // await matchesApi.rejectMatchRequest(requestId);
      
      // Update local state
      setIncomingRequests(incomingRequests.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError('Failed to reject connection request');
    }
  };
  
  const handleCancelRequest = async (requestId: string) => {
    try {
      // In a real implementation, this would call your API
      // await matchesApi.cancelMatchRequest(requestId);
      
      // Update local state
      setOutgoingRequests(outgoingRequests.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error canceling request:', error);
      setError('Failed to cancel connection request');
    }
  };
  
  if (isLoading || loading) {
    return <FullPageLoader />;
  }
  
  if (!user) {
    return <RequireLoginFallback />;
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Your Network</h1>
        <Link
          href="/matches"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Find New Connections
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('connections')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'connections'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Connections
            {connections.length > 0 && (
              <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                activeTab === 'connections' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {connections.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('incoming')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'incoming'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Incoming Requests
            {incomingRequests.length > 0 && (
              <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                activeTab === 'incoming' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {incomingRequests.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'outgoing'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Outgoing Requests
            {outgoingRequests.length > 0 && (
              <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                activeTab === 'outgoing' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {outgoingRequests.length}
              </span>
            )}
          </button>
        </nav>
      </div>
      
      {/* Active tab content */}
      {activeTab === 'connections' && (
        <div>
          {connections.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {connections.map(connection => (
                <ConnectionCard 
                  key={connection.id} 
                  connection={connection}
                  type="connection"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No connections yet</h3>
              <p className="text-gray-600 mb-6">Start by finding matches and sending connection requests.</p>
              <Link
                href="/matches"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Find Matches
              </Link>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'incoming' && (
        <div>
          {incomingRequests.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {incomingRequests.map(request => (
                <ConnectionCard 
                  key={request.id} 
                  connection={request}
                  type="incoming"
                  onAccept={() => handleAcceptRequest(request.id)}
                  onReject={() => handleRejectRequest(request.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No incoming requests</h3>
              <p className="text-gray-600">When someone sends you a connection request, it will appear here.</p>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'outgoing' && (
        <div>
          {outgoingRequests.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {outgoingRequests.map(request => (
                <ConnectionCard 
                  key={request.id} 
                  connection={request}
                  type="outgoing"
                  onCancel={() => handleCancelRequest(request.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No outgoing requests</h3>
              <p className="text-gray-600 mb-6">You haven't sent any connection requests yet.</p>
              <Link
                href="/matches"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Find Matches
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ConnectionCardProps {
  connection: any;
  type: 'connection' | 'incoming' | 'outgoing';
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
}

function ConnectionCard({ connection, type, onAccept, onReject, onCancel }: ConnectionCardProps) {
  const router = useRouter();
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="p-5">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            <img 
              src={connection.profileImage || '/api/placeholder/64/64'} 
              alt={connection.name} 
              className="w-12 h-12 rounded-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">{connection.name}</h3>
            <p className="text-sm text-gray-500 truncate">{connection.email}</p>
            <div className="mt-1 flex items-center">
              <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                {connection.matchScore}% Match
              </span>
              
              <span className="ml-2 text-xs text-gray-500">
                {type === 'connection' ? connection.lastActive : (
                  `Request sent ${new Date(connection.createdAt).toLocaleDateString()}`
                )}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
            connection.matchType === 'cofounder' ? 'bg-purple-100 text-purple-800' :
            connection.matchType === 'teammate' ? 'bg-blue-100 text-blue-800' :
            'bg-orange-100 text-orange-800'
          }`}>
            {connection.matchType === 'cofounder' ? 'Co-founder' : 
             connection.matchType === 'teammate' ? 'Teammate' : 'Client'}
          </span>
          
          {type === 'connection' && (
            <span className="ml-2 inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
              Connected
            </span>
          )}
          
          {type === 'incoming' && (
            <span className="ml-2 inline-block px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
              Incoming Request
            </span>
          )}
          
          {type === 'outgoing' && (
            <span className="ml-2 inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              Pending
            </span>
          )}
        </div>
      </div>
      
      <div className="px-5 py-3 bg-gray-50 flex justify-between">
        <button 
          onClick={() => router.push(`/connections/${connection.userId}`)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          View Profile
        </button>
        
        {type === 'connection' && (
          <button className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700">
            Message
          </button>
        )}
        
        {type === 'incoming' && (
          <div className="space-x-2">
            <button 
              onClick={onReject}
              className="text-sm border border-gray-300 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100"
            >
              Decline
            </button>
            <button 
              onClick={onAccept}
              className="text-sm bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700"
            >
              Accept
            </button>
          </div>
        )}
        
        {type === 'outgoing' && (
          <button 
            onClick={onCancel}
            className="text-sm border border-gray-300 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}