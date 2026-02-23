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
      <h2 className="text-2xl font-bold text-foreground mb-2">Success!</h2>
      <p className="text-muted-foreground mb-6">{message || 'Your information has been submitted successfully.'}</p>
      
      {onCheckEligibility && (
        <button
          onClick={onCheckEligibility}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-colors"
          data-testid="button-check-eligibility"
        >
          Check Eligibility
        </button>
      )}
      
      {redirectUrl && (
        <a
          href={redirectUrl}
          className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-colors"
          data-testid="link-continue"
        >
          Continue
        </a>
      )}
    </div>
  );
};

export default SubmitSuccess;
