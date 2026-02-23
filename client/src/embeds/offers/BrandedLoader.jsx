import { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
  'Finding the best offers for you...',
  'Checking with our lending partners...',
  'Almost there, matching your profile...',
  'Curating personalized offers...',
];

const BrandedLoader = ({ message }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(messageTimer);
  }, []);

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(dotTimer);
  }, []);

  return (
    <div
      data-testid="branded-loader"
      className="flex flex-col items-center justify-center px-6 py-12 min-h-[400px] font-sans"
    >
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 rounded-full border-[3px] border-muted" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary border-r-primary animate-[pw-loader-spin_1s_linear_infinite]" />
        <div className="absolute inset-2 rounded-full border-[3px] border-transparent border-b-primary/70 animate-[pw-loader-spin_1.5s_linear_infinite_reverse]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
              className="fill-primary"
            />
          </svg>
        </div>
      </div>

      <p
        data-testid="text-loader-message"
        className="text-lg font-semibold text-foreground m-0 text-center"
      >
        {message || LOADING_MESSAGES[messageIndex]}{dots}
      </p>

      <p className="text-sm text-muted-foreground mt-3 text-center">
        This usually takes a few seconds
      </p>

      <div className="w-[200px] h-1 bg-muted rounded-sm mt-6 overflow-hidden">
        <div className="h-full rounded-sm bg-gradient-to-r from-primary to-primary/70 animate-[pw-loader-progress_2s_ease-in-out_infinite]" />
      </div>

      <style>{`
        @keyframes pw-loader-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pw-loader-progress {
          0% { width: 0%; transform: translateX(0); }
          50% { width: 60%; }
          100% { width: 0%; transform: translateX(200px); }
        }
      `}</style>
    </div>
  );
};

export default BrandedLoader;
