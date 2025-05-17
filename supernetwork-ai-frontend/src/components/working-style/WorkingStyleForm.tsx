// src/components/working-style/WorkingStyleForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomAuth } from '@/lib/custom-auth';
import { workingStyleApi } from '@/lib/api';
import {
  COMMUNICATION_STYLES,
  WORK_HOUR_PREFERENCES,
  DECISION_MAKING_STYLES,
  FEEDBACK_PREFERENCES
} from '@/lib/constants/working-style-constants';

export function WorkingStyleForm() {
  const router = useRouter();
  const { user, token } = useCustomAuth();
  const [formData, setFormData] = useState({
    communicationStyle: '',
    workHours: '',
    decisionMaking: '',
    feedbackPreference: '',
    additionalNotes: ''
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load existing working style data on mount
  useEffect(() => {
    const loadWorkingStyle = async () => {
      if (!user || !token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await workingStyleApi.getWorkingStyle();
        if (data.workingStyle) {
          setFormData({
            communicationStyle: data.workingStyle.communication_style || '',
            workHours: data.workingStyle.work_hours || '',
            decisionMaking: data.workingStyle.decision_making || '',
            feedbackPreference: data.workingStyle.feedback_preference || '',
            additionalNotes: data.workingStyle.additional_notes || ''
          });
        }
      } catch (err) {
        console.error('Failed to load working style:', err);
      } finally {
        setLoading(false);
      }
    };

    loadWorkingStyle();
  }, [user, token]);

  const handleRadioChange = (field: keyof typeof formData, value: string) => {
    setFormData(f => ({ ...f, [field]: value }));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(f => ({ ...f, additionalNotes: e.target.value }));
  };

  const handleSave = async () => {
    if (!user || !token) {
      setError('You must be logged in to save your working style preferences');
      return;
    }
    // Validate required
    const { additionalNotes, ...required } = formData;
    if (Object.values(required).some(v => !v)) {
      setError('Please complete all required fields');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await workingStyleApi.saveWorkingStyle(formData, token)
      setSuccess('Your working style preferences have been saved!');
      setTimeout(() => router.push('/custom-dashboard'), 2000);
    } catch {
      setError('Failed to save your preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      {/* COMMUNICATION */}
      <Section
        title="Communication Style"
        help="How do you typically prefer to communicate in professional settings?"
        options={COMMUNICATION_STYLES}
        name="communicationStyle"
        selected={formData.communicationStyle}
        onChange={(field, value) => handleRadioChange(field as keyof typeof formData, value)}
      />

      {/* WORK HOURS */}
      <Section
        title="Work Hours"
        help="What's your preferred working schedule?"
        options={WORK_HOUR_PREFERENCES}
        name="workHours"
        selected={formData.workHours}
        onChange={(field, value) => handleRadioChange(field as keyof typeof formData, value)}
      />

      {/* DECISION MAKING */}
      <Section
        title="Decision Making"
        help="How do you typically approach making decisions?"
        options={DECISION_MAKING_STYLES}
        name="decisionMaking"
        selected={formData.decisionMaking}
        onChange={(field, value) => handleRadioChange(field as keyof typeof formData, value)}
      />

      {/* FEEDBACK */}
      <Section
        title="Feedback Preferences"
        help="How do you prefer to receive feedback?"
        options={FEEDBACK_PREFERENCES}
        name="feedbackPreference"
        selected={formData.feedbackPreference}
        onChange={(field, value) => handleRadioChange(field as keyof typeof formData, value)}
      />

      {/* ADDITIONAL NOTES */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Notes</h2>
        <p className="text-gray-600 mb-4">
          Any other info that'd help potential matches know about your style?
        </p>
        <textarea
          rows={4}
          value={formData.additionalNotes}
          onChange={handleTextChange}
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Optional notes…"
        />
      </div>

      {/* SUBMIT */}
      <div className="mt-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Preferences'}
        </button>
      </div>

      {error && <Message type="error" text={error} />}
      {success && <Message type="success" text={success} />}
    </div>
  );
}

// ——— small helper components ———

type Option = { id: string; label: string; description: string; };
type FormData = {
  communicationStyle: string;
  workHours: string;
  decisionMaking: string;
  feedbackPreference: string;
  additionalNotes: string;
};

type SectionProps = {
  title: string;
  help: string;
  options: Option[];
  name: keyof FormData;
  selected: string;
  onChange: (field: keyof FormData, value: string) => void;
};

function Section({ title, help, options, name, selected, onChange }: SectionProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      <p className="text-gray-600 mb-4">{help}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map(opt => (
          <div
            key={opt.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selected === opt.id
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-indigo-300'
            }`}
            onClick={() => onChange(name, opt.id)}
          >
            <div className="flex items-start">
              <input
                id={`${name}-${opt.id}`}
                name={name}
                type="radio"
                checked={selected === opt.id}
                onChange={() => onChange(name, opt.id)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
              />
              <div className="ml-3">
                <label htmlFor={`${name}-${opt.id}`} className="font-medium text-gray-800">
                  {opt.label}
                </label>
                <p className="text-sm text-gray-500">{opt.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Message({ type, text }: { type: 'error' | 'success'; text: string }) {
  const colors = {
    error: { bg: 'bg-red-50', border: 'border-red-400', icon: 'text-red-400', text: 'text-red-700' },
    success: { bg: 'bg-green-50', border: 'border-green-400', icon: 'text-green-400', text: 'text-green-700' }
  }[type];

  return (
    <div className={`mt-4 ${colors.bg} border-l-4 ${colors.border} p-4`}>
      <div className="flex">
        <svg className={`h-5 w-5 ${colors.icon}`} viewBox="0 0 20 20" fill="currentColor">
          {type === 'error' ? (
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          ) : (
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          )}
        </svg>
        <p className={`ml-3 text-sm ${colors.text}`}>{text}</p>
      </div>
    </div>
  );
}
