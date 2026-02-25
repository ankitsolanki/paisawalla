import { useState, useEffect, useCallback } from 'react';
import Form1 from './forms/form1';
import Form2 from './forms/form2';
import Form3 from './forms/form3';
import AuthForm from './components/AuthForm';
import OffersPage from './embeds/offers/OffersPage';
import OffersPageV2 from './embeds/offers-v2/OffersPageV2';
import ResponsiveTester, { ResponsiveTesterControls } from './components/ResponsiveTester';
import LenderEligibility from './pages/LenderEligibility';
import ApiLogs from './pages/ApiLogs';

const TEST_VARIANTS = [
  { id: 'bbb000000000000000000001', label: 'Multiple Offers', description: '3 offers from major banks (HDFC, ICICI, SBI) with different rates and tenures', scenario: 'happy_path', offerCount: 3, color: '#10b981' },
  { id: 'bbb000000000000000000002', label: 'Single Offer', description: '1 pre-approved offer from Axis Bank — minimal case', scenario: 'single', offerCount: 1, color: '#3b82f6' },
  { id: 'bbb000000000000000000003', label: 'No Offers', description: 'Application processed but no offers generated — empty state', scenario: 'empty', offerCount: 0, color: '#ef4444' },
  { id: 'bbb000000000000000000004', label: 'Many Offers', description: '7 offers from banks and NBFCs — stress test with scrolling', scenario: 'stress', offerCount: 7, color: '#f59e0b' },
  { id: 'bbb000000000000000000005', label: 'Mixed Types', description: '3 offers: pre-approved, standard, and conditional from different lender types', scenario: 'mixed', offerCount: 3, color: '#8b5cf6' },
];

function OffersDemo({ theme, version = 'v1' }: { theme: string; version?: 'v1' | 'v2' }) {
  const [selectedVariant, setSelectedVariant] = useState<typeof TEST_VARIANTS[0] | null>(null);
  const [customAppId, setCustomAppId] = useState('');
  const [activeAppId, setActiveAppId] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const OffersComponent = version === 'v2' ? OffersPageV2 : OffersPage;

  const handleSeedData = useCallback(async () => {
    setSeeding(true);
    setSeedStatus('idle');
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${apiBase}/api/test-variants/seed`, { method: 'POST' });
      if (res.ok) {
        setSeedStatus('success');
      } else {
        setSeedStatus('error');
      }
    } catch {
      setSeedStatus('error');
    }
    setSeeding(false);
    setTimeout(() => setSeedStatus('idle'), 3000);
  }, []);

  const handleSelectVariant = (variant: typeof TEST_VARIANTS[0]) => {
    setSelectedVariant(variant);
    setActiveAppId(variant.id);
    setCustomAppId('');
  };

  const handleCustomLoad = () => {
    if (customAppId.trim()) {
      setSelectedVariant(null);
      setActiveAppId(customAppId.trim());
    }
  };

  const handleBack = () => {
    setSelectedVariant(null);
    setActiveAppId('');
    setCustomAppId('');
  };

  if (activeAppId) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-4 flex-wrap">
          <button
            onClick={handleBack}
            data-testid="button-back-to-variants"
            className="px-4 py-1 bg-muted text-foreground border-none rounded-md cursor-pointer text-sm font-medium"
          >
            Back to Variants
          </button>
          {selectedVariant && (
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: selectedVariant.color }}
              />
              <span className="text-sm font-semibold text-foreground">
                {selectedVariant.label}
              </span>
              <span className="text-xs text-muted-foreground">
                ({selectedVariant.offerCount} offer{selectedVariant.offerCount !== 1 ? 's' : ''})
              </span>
            </div>
          )}
          <span className="text-xs text-muted-foreground font-mono">
            ID: {activeAppId}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mb-2 italic">
          Test OTP: 123456
        </div>
        <div className="relative min-h-96">
          <OffersComponent
            key={activeAppId}
            applicationId={activeAppId}
            theme={theme}
            onStateChange={(status: string, data: any) => {
              console.log('Offers state:', status, data);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 p-4 bg-accent rounded-md">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold mb-1">
              Offers Page {version === 'v2' ? '(V2 — New Design)' : '(V1 — Original)'} — Test Variants
            </h3>
            <p className="text-sm text-foreground mb-1">
              Click a variant below to test the full offers flow: OTP gate, branded loader, and offers listing.
            </p>
            <p className="text-xs text-muted-foreground italic">
              Test OTP code: 123456
            </p>
          </div>
          <button
            onClick={handleSeedData}
            disabled={seeding}
            data-testid="button-seed-data"
            className={`px-4 py-2 text-white border-none rounded-md text-sm font-medium whitespace-nowrap transition-all ${
              seedStatus === 'success'
                ? 'bg-success'
                : seedStatus === 'error'
                  ? 'bg-destructive'
                  : 'bg-primary'
            } ${seeding ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
          >
            {seeding ? 'Seeding...' : seedStatus === 'success' ? 'Seeded' : seedStatus === 'error' ? 'Failed — Retry' : 'Seed Test Data'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 mb-6">
        {TEST_VARIANTS.map((variant) => (
          <button
            key={variant.id}
            onClick={() => handleSelectVariant(variant)}
            data-testid={`card-variant-${variant.scenario}`}
            className="p-6 bg-white border-2 border-muted rounded-lg cursor-pointer text-left transition-all duration-150 flex flex-col gap-2"
            style={{
              borderColor: variant.color,
              boxShadow: `0 2px 8px ${variant.color}22`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = variant.color;
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 2px 8px ${variant.color}22`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = variant.color;
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 2px 8px ${variant.color}22`;
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                style={{
                  backgroundColor: `${variant.color}18`,
                  color: variant.color,
                }}
              >
                {variant.offerCount}
              </span>
              <span className="text-base font-semibold text-foreground">
                {variant.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-1.5 m-0">
              {variant.description}
            </p>
            <div className="flex items-center gap-1 mt-auto pt-2">
              <span
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color: variant.color }}
              >
                {variant.scenario.replace('_', ' ')}
              </span>
              <span className="text-xs text-muted-foreground/50">
                {' \u2192'}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="p-4 bg-secondary rounded-md flex gap-2 items-center flex-wrap">
        <span className="text-sm text-muted-foreground">Custom ID:</span>
        <input
          type="text"
          value={customAppId}
          onChange={(e) => setCustomAppId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCustomLoad()}
          placeholder="Enter any Application ID"
          data-testid="input-custom-app-id"
          className="px-4 py-2 border border-border rounded-md text-sm font-mono min-w-72 flex-1"
        />
        <button
          onClick={handleCustomLoad}
          disabled={!customAppId.trim()}
          data-testid="button-load-custom"
          className={`px-4 py-2 text-white border-none rounded-md text-sm font-medium ${
            customAppId.trim()
              ? 'bg-primary cursor-pointer'
              : 'bg-muted cursor-not-allowed'
          }`}
        >
          Load
        </button>
      </div>
    </div>
  );
}

function App() {
  const [selectedForm, setSelectedForm] = useState('form1');
  const [theme, setTheme] = useState('light');
  const [containerSize, setContainerSize] = useState({ width: '100%', height: 'auto' });
  const [authTargetForm, setAuthTargetForm] = useState('form1');
  const [offersAppId, setOffersAppId] = useState('');
  const [journeyAuthData, setJourneyAuthData] = useState<{ phone: string; consents: Record<string, boolean>; targetForm: string } | null>(null);

  const getAuthRedirectUrl = (formType: string) => {
    const currentUrl = window.location.origin + window.location.pathname;
    return `${currentUrl}?form=${formType}`;
  };

  const renderForm = () => {
    switch (selectedForm) {
      case 'auth':
        return (
          <div>
            <div className="mb-6 p-4 bg-accent rounded-md">
              <h3 className="text-lg font-semibold mb-2">
                Auth Form Example
              </h3>
              <p className="text-sm text-foreground mb-2">
                This is the standalone authentication form. After successful OTP verification, it will redirect to the target form with encoded authentication parameters.
              </p>
              <div className="flex gap-2 flex-wrap items-center">
                <span className="text-sm text-foreground">Redirect to:</span>
                {(['form1', 'form2', 'form3'] as const).map((form) => (
                  <button
                    key={form}
                    onClick={() => setAuthTargetForm(form)}
                    data-testid={`button-auth-target-${form}`}
                    className={`px-2 py-1 border-none rounded text-sm cursor-pointer transition-colors ${
                      authTargetForm === form
                        ? 'bg-primary text-white'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {form.charAt(0).toUpperCase() + form.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2 italic">
                After OTP verification, you'll be redirected to {authTargetForm} with encoded authentication parameters.
              </p>
            </div>
            <AuthForm
              redirectUrl={getAuthRedirectUrl(authTargetForm)}
              theme={theme}
            />
          </div>
        );
      case 'form1':
      case 'auth-form1':
        return <Form1 theme={theme} />;
      case 'form2':
      case 'auth-form2':
        return <Form2 theme={theme} />;
      case 'form3':
      case 'auth-form3':
        return <Form3 theme={theme} />;
      case 'offers':
        return <OffersDemo theme={theme} version="v1" />;
      case 'offers-v2':
        return <OffersDemo theme={theme} version="v2" />;
      case 'lender-eligibility':
        return <LenderEligibility />;
      case 'api-logs':
        return <ApiLogs />;
      case 'journey-form1':
      case 'journey-form2':
      case 'journey-form3': {
        const journeyFormTarget = selectedForm.replace('journey-', '');
        if (!journeyAuthData || journeyAuthData.targetForm !== journeyFormTarget) {
          return (
            <AuthForm
              onAuthComplete={(authData: { phone: string; verified: boolean; consents: Record<string, boolean> }) => {
                setJourneyAuthData({ phone: authData.phone, consents: authData.consents, targetForm: journeyFormTarget });
              }}
              theme={theme}
            />
          );
        }
        if (journeyFormTarget === 'form2') return <Form2 theme={theme} authPhone={journeyAuthData.phone} />;
        if (journeyFormTarget === 'form3') return <Form3 theme={theme} authPhone={journeyAuthData.phone} />;
        return <Form1 theme={theme} authPhone={journeyAuthData.phone} />;
      }
      default:
        return <Form1 theme={theme} />;
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const formParam = urlParams.get('form');
    if (formParam && ['form1', 'form2', 'form3'].includes(formParam)) {
      setSelectedForm(formParam);
    }
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const offersPageApplicationId = urlParams.get('applicationId');
  const offersPageLeadId = urlParams.get('leadId') || undefined;
  const isOffersPage = urlParams.get('page') === 'offers' && !!offersPageApplicationId;

  if (isOffersPage) {
    return (
      <OffersPageV2
        applicationId={offersPageApplicationId}
        leadId={offersPageLeadId}
        theme="light"
      />
    );
  }

  return (
    <div className="min-h-screen bg-secondary p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white p-6 rounded-lg mb-6 shadow-md">
          <h1 className="text-4xl font-bold mb-4">
            PaisaWaala
          </h1>
          <p className="text-muted-foreground mb-6">
            Instantly compare personal loans from top lenders. Unlock the best rates and fastest approvals.
          </p>

          <div className="flex gap-4 flex-wrap mb-4">
            {[
              { key: 'journey-form1', label: 'Journey: Form 1' },
              { key: 'journey-form2', label: 'Journey: Form 2' },
              { key: 'journey-form3', label: 'Journey: Form 3' },
              { key: 'auth', label: 'Auth Form (Phone + OTP)' },
              { key: 'form1', label: 'Form 1 (25 fields, 3 steps)' },
              { key: 'form2', label: 'Form 2 (11 fields, 1 step)' },
              { key: 'form3', label: 'Form 3 (6 fields, 1 step)' },
              { key: 'offers', label: 'Offers (V1)' },
              { key: 'offers-v2', label: 'Offers (V2 New)' },
              { key: 'lender-eligibility', label: 'Lender Eligibility' },
              { key: 'api-logs', label: 'API Logs' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedForm(key);
                  if (key.startsWith('journey-')) {
                    setJourneyAuthData(null);
                  }
                }}
                data-testid={`button-select-${key}`}
                className={`px-4 py-2 border-none rounded-md cursor-pointer font-medium transition-colors ${
                  selectedForm === key || (key === 'auth' && selectedForm.startsWith('auth-'))
                    ? 'bg-primary text-white'
                    : 'bg-muted text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-6 items-center flex-wrap">
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">Theme:</span>
              {(['light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  data-testid={`button-theme-${t}`}
                  className={`px-2 py-1 border-none rounded cursor-pointer text-sm transition-colors ${
                    theme === t
                      ? 'bg-primary text-white'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <ResponsiveTesterControls onSizeChange={setContainerSize} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <ResponsiveTester containerSize={containerSize}>
            {renderForm()}
          </ResponsiveTester>
        </div>
      </div>
    </div>
  );
}

export default App;
