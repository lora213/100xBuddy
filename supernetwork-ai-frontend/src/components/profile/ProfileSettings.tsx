// src/components/profile/ProfileSettings.tsx
'use client';

import { useState, useEffect } from 'react';
import { profileApi } from '@/lib/api';
import { useCustomAuth } from '@/lib/custom-auth';

export default function ProfileSettings() {
  const { user, token } = useCustomAuth();
  const [settings, setSettings] = useState({
    profileVisibility: 'public', // public, limited, private
    allowMessaging: true,
    showEmail: false,
    showSocialProfiles: true,
    allowInvites: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  
  // Load existing settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user || !token) return;
      
      try {
        // In a real implementation, this would fetch from your API
        // const response = await profileApi.getProfileSettings();
        
        // For now, use sample data
        const sampleSettings = {
          profileVisibility: 'public',
          allowMessaging: true,
          showEmail: false,
          showSocialProfiles: true,
          allowInvites: true
        };
        
        setSettings(sampleSettings);
        
        // Sample blocked users
        setBlockedUsers([
          'blocked-user-1',
          'blocked-user-2'
        ]);
      } catch (error) {
        console.error('Error loading settings:', error);
        setError('Failed to load your profile settings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [user, token]);
  
  // Save settings
  const saveSettings = async () => {
    if (!user || !token) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // In a real implementation, this would call your API
      // await profileApi.updateProfileSettings(settings);
      
      setSuccess('Your profile settings have been saved successfully!');
      
      // Success message disappears after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save your profile settings');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle input changes
  const handleChange = (field: keyof typeof settings, value: any) => {
    setSettings({ ...settings, [field]: value });
  };
  
  // Unblock a user
  const handleUnblock = (userId: string) => {
    setBlockedUsers(blockedUsers.filter(id => id !== userId));
    
    // In a real implementation, this would call your API
    // await profileApi.unblockUser(userId);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Profile Settings & Privacy
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Control how your profile appears to others and manage your privacy settings.
        </p>
      </div>
      
      {error && (
        <div className="mx-4 mb-4 bg-red-50 border-l-4 border-red-400 p-4">
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
      
      {success && (
        <div className="mx-4 mb-4 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
        <div className="space-y-6">
          {/* Profile Visibility */}
          <div>
            <h4 className="text-sm font-medium text-gray-900">Profile Visibility</h4>
            <p className="text-sm text-gray-500 mb-4">Control who can see your profile</p>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="visibility-public"
                  name="profileVisibility"
                  type="radio"
                  checked={settings.profileVisibility === 'public'}
                  onChange={() => handleChange('profileVisibility', 'public')}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                />
                <label htmlFor="visibility-public" className="ml-3 block text-sm text-gray-700">
                  <span className="font-medium">Public</span> - Anyone on SuperNetworkAI can see your profile
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="visibility-limited"
                  name="profileVisibility"
                  type="radio"
                  checked={settings.profileVisibility === 'limited'}
                  onChange={() => handleChange('profileVisibility', 'limited')}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                />
                <label htmlFor="visibility-limited" className="ml-3 block text-sm text-gray-700">
                  <span className="font-medium">Limited</span> - Only show up in searches that match your criteria
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="visibility-private"
                  name="profileVisibility"
                  type="radio"
                  checked={settings.profileVisibility === 'private'}
                  onChange={() => handleChange('profileVisibility', 'private')}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                />
                <label htmlFor="visibility-private" className="ml-3 block text-sm text-gray-700">
                  <span className="font-medium">Private</span> - Only visible to your connections
                </label>
              </div>
            </div>
          </div>
          
          {/* Communication */}
          <div>
            <h4 className="text-sm font-medium text-gray-900">Communication Settings</h4>
            <p className="text-sm text-gray-500 mb-4">Control how others can interact with you</p>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="allow-messaging"
                    name="allowMessaging"
                    type="checkbox"
                    checked={settings.allowMessaging}
                    onChange={(e) => handleChange('allowMessaging', e.target.checked)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="allow-messaging" className="font-medium text-gray-700">Allow messaging</label>
                  <p className="text-gray-500">Let other users send you messages</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="show-email"
                    name="showEmail"
                    type="checkbox"
                    checked={settings.showEmail}
                    onChange={(e) => handleChange('showEmail', e.target.checked)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="show-email" className="font-medium text-gray-700">Show email address</label>
                  <p className="text-gray-500">Display your email to connections</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="show-social"
                    name="showSocialProfiles"
                    type="checkbox"
                    checked={settings.showSocialProfiles}
                    onChange={(e) => handleChange('showSocialProfiles', e.target.checked)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="show-social" className="font-medium text-gray-700">Show social profiles</label>
                  <p className="text-gray-500">Display your connected social profiles to others</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="allow-invites"
                    name="allowInvites"
                    type="checkbox"
                    checked={settings.allowInvites}
                    onChange={(e) => handleChange('allowInvites', e.target.checked)}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="allow-invites" className="font-medium text-gray-700">Allow connection requests</label>
                  <p className="text-gray-500">Let others send you connection requests</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Blocked Users */}
          <div>
            <h4 className="text-sm font-medium text-gray-900">Blocked Users</h4>
            <p className="text-sm text-gray-500 mb-4">Manage users you've blocked</p>
            
            {blockedUsers.length > 0 ? (
              <div className="overflow-hidden border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {blockedUsers.map((userId) => (
                      <tr key={userId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          User ID: {userId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => handleUnblock(userId)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Unblock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-600">You haven't blocked any users.</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}