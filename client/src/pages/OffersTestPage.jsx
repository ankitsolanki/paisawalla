import React, { useState } from 'react';
import OffersListing from '../embeds/offers/OffersListing';

const OffersTestPage = () => {
  const [applicationId, setApplicationId] = useState('');
  const [theme, setTheme] = useState('light');
  const [showOffers, setShowOffers] = useState(false);

  const handleLoad = () => {
    if (applicationId.trim()) {
      setShowOffers(true);
    } else {
      alert('Please enter an Application ID');
    }
  };

  return (
    <div className="min-h-screen bg-muted p-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="bg-background p-8 rounded-lg mb-8 shadow-md">
          <h1 className="text-3xl font-bold mb-6">
            Offers Listing Test Page
          </h1>

          <div className="flex gap-4 items-center flex-wrap mb-6">
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium">
                Application ID:
              </label>
              <input
                type="text"
                value={applicationId}
                onChange={(e) => {
                  setApplicationId(e.target.value);
                  setShowOffers(false);
                }}
                placeholder="e.g., A12345"
                className="px-3 py-2 border border-border rounded-md text-base min-w-[200px]"
              />
            </div>

            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium">
                Theme:
              </label>
              <button
                onClick={() => setTheme('light')}
                className={`px-2 py-1 border-none rounded-sm cursor-pointer text-sm ${theme === 'light' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-2 py-1 border-none rounded-sm cursor-pointer text-sm ${theme === 'dark' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                Dark
              </button>
            </div>

            <button
              onClick={handleLoad}
              className="px-6 py-2 bg-primary text-primary-foreground border-none rounded-md cursor-pointer text-base font-semibold"
            >
              Load Offers
            </button>
          </div>

          <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground">
            <strong>Test Scenarios:</strong>
            <ul className="mt-1 pl-6">
              <li>Valid ID: Use a real application ID to test success state</li>
              <li>Empty: Use an ID that returns no offers</li>
              <li>Error: Use an invalid ID to test error state</li>
              <li>Timeout: Modify timeout in OffersListing to test timeout state</li>
            </ul>
          </div>
        </div>

        {showOffers && (
          <div className="bg-background p-8 rounded-lg shadow-md">
            <OffersListing
              applicationId={applicationId}
              theme={theme}
              onStateChange={(status, data) => {
                console.log('Offers state changed:', status, data);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OffersTestPage;
