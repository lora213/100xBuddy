'use client';

import { useState } from 'react';

interface IkigaiStepProps {
  title: string;
  description: string;
  placeholder: string;
  example: string;
  value: string;
  onChange: (value: string) => void;
}

export default function IkigaiStep({ 
  title, 
  description, 
  placeholder, 
  example, 
  value, 
  onChange 
}: IkigaiStepProps) {
  const [showExample, setShowExample] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-5">{description}</p>
      
      <div className="mb-4">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        ></textarea>
      </div>
      
      <div>
        <button
          type="button"
          onClick={() => setShowExample(!showExample)}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          {showExample ? 'Hide Example' : 'See Example'}
        </button>
        
        {showExample && (
          <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-md">
            <p className="text-sm text-indigo-800">
              <span className="font-medium">Example:</span> {example}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
