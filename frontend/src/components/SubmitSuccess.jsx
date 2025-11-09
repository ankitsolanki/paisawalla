import React from 'react';

const SubmitSuccess = ({ message, onCheckEligibility, redirectUrl }) => {
  return (
    <div className="text-center py-8">
      <div className="mb-4">
        <svg
          className="mx-auto h-16 w-16 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Success!</h2>
      <p className="text-gray-600 mb-6">{message || 'Your information has been submitted successfully.'}</p>
      
      {onCheckEligibility && (
        <button
          onClick={onCheckEligibility}
          className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
        >
          Check Eligibility
        </button>
      )}
      
      {redirectUrl && (
        <a
          href={redirectUrl}
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
        >
          Continue
        </a>
      )}
    </div>
  );
};

export default SubmitSuccess;

