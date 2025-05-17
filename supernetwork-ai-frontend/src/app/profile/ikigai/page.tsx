'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomAuth } from '@/lib/custom-auth';
import IkigaiStep from '../../../components/ikigai/ikigai-step';
import IkigaiDiagram from '../../../components/ikigai/ikigai-diagram';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Define the steps of the Ikigai profile
const STEPS = [
  {
    id: 'passion',
    title: 'What You Love',
    description: 'What activities bring you joy, fulfillment, and make you lose track of time?',
    placeholder: 'I love creating digital products that solve real problems. I enjoy working with user interface design and find satisfaction in creating systems that are both beautiful and functional.',
    example: 'I\'m passionate about creating systems that help people connect and work together more effectively.'
  },
  {
    id: 'profession',
    title: 'What You\'re Good At',
    description: 'What skills, talents, and areas of expertise have you developed?',
    placeholder: 'I excel at frontend development, particularly React and design systems. I\'m also skilled at breaking down complex problems into manageable components.',
    example: 'I have strong technical skills in web development, UX design, and project management.'
  },
  {
    id: 'vocation',
    title: 'What You Can Be Paid For',
    description: 'What services or skills do people value enough to compensate you for?',
    placeholder: 'I can be paid for building web applications, creating user interfaces, and improving product workflows. Companies value my ability to translate business requirements into technical solutions.',
    example: 'I can be compensated for full-stack development, technical leadership, and creating scalable software architectures.'
  },
  {
    id: 'mission',
    title: 'What The World Needs',
    description: 'What problems or needs in society align with your skills and interests?',
    placeholder: 'The world needs intuitive software that solves real problems. There\'s a need for tools that help people collaborate more efficiently and products that respect users\' time and attention.',
    example: 'The world needs better tools for remote collaboration, education technology that adapts to different learning styles, and sustainable technology solutions.'
  }
];

export default function IkigaiProfilePage() {
  const router = useRouter();
  const { user, token, isLoading } = useCustomAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    passion: '',
    profession: '',
    vocation: '',
    mission: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Handle input changes for the current step
  const handleInputChange = (value: string) => {
    const currentStepId = STEPS[currentStep].id;
    setFormData(prev => ({
      ...prev,
      [currentStepId]: value
    }));
  };

  // Go to the next step
  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Go to the previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Save the Ikigai profile
  const handleSave = async () => {
    if (!user || !token) {
      setError('You must be logged in to save your Ikigai profile');
      return;
    }

    // Validate that all fields are filled
    const isEmpty = Object.values(formData).some(value => !value.trim());
    if (isEmpty) {
      setError('Please complete all sections of your Ikigai profile');
      return;
    }

    try {
      setSaving(true);
      setError('');

      console.log('Saving Ikigai profile with token:', token.substring(0, 10) + '...');

      // Send the Ikigai data to the API
      const response = await axios.post(
        `${API_URL}/profile/ikigai`, 
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Save response:', response.data);
      
      // Redirect to dashboard or profile page
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Error saving Ikigai profile:', err);
      setError(`Failed to save your Ikigai profile: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // Display loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-700 mb-4">Please log in to create your Ikigai profile.</p>
          <button
            onClick={() => router.push('/custom-login')}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Discover Your Ikigai</h1>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-500">
            Ikigai is a Japanese concept that means "a reason for being." 
            It's the intersection of what you love, what you're good at, what the world needs, and what you can be paid for.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column - Form */}
          <div className="lg:w-1/2 space-y-6">
            {/* Progress indicator */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Your Ikigai Profile</h2>
                <span className="text-sm text-gray-500">Step {currentStep + 1} of {STEPS.length}</span>
              </div>
              
              <div className="relative">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                  <div 
                    style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-500 ease-in-out"
                  ></div>
                </div>
              </div>
              
              {/* Step dots */}
              <div className="flex justify-between">
                {STEPS.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(index)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      index === currentStep
                        ? 'bg-indigo-600 text-white'
                        : index < currentStep
                        ? 'bg-indigo-200 text-indigo-700'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Current step form */}
            <IkigaiStep
              title={STEPS[currentStep].title}
              description={STEPS[currentStep].description}
              placeholder={STEPS[currentStep].placeholder}
              example={STEPS[currentStep].example}
              value={formData[STEPS[currentStep].id as keyof typeof formData]}
              onChange={handleInputChange}
            />

            {/* Navigation buttons */}
            <div className="flex justify-between pt-6">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Previous
              </button>
              
              {currentStep < STEPS.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={!formData[STEPS[currentStep].id as keyof typeof formData]}
                  className="ml-3 inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving || !formData[STEPS[currentStep].id as keyof typeof formData]}
                  className="ml-3 inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Ikigai Profile'}
                </button>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
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
          </div>

          {/* Right column - Ikigai Diagram */}
          <div className="lg:w-1/2">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your Ikigai Visualization</h2>
              <IkigaiDiagram
                passion={formData.passion}
                profession={formData.profession}
                vocation={formData.vocation}
                mission={formData.mission}
              />
              <div className="mt-4 text-sm text-gray-500">
                <p className="mb-2">Complete all four areas to visualize your Ikigai - the intersection of your passion, profession, mission, and vocation.</p>
                <p>This profile will help us match you with founders, teammates, and clients who align with your purpose.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}