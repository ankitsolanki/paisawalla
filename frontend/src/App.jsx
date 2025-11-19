import React, { useState } from 'react';
import Form1 from './forms/form1';
import Form2 from './forms/form2';
import Form3 from './forms/form3';
import AuthForm from './components/AuthForm';
import ResponsiveTester, { ResponsiveTesterControls } from './components/ResponsiveTester';
import { tokens } from './design-system/tokens';

function App() {
  const [selectedForm, setSelectedForm] = useState('form1');
  const [theme, setTheme] = useState('light');
  const [containerSize, setContainerSize] = useState({ width: '100%', height: 'auto' });
  const [authTargetForm, setAuthTargetForm] = useState('form1');

  // Get redirect URL for auth form - redirects to current page with form parameter
  // The auth form will add encoded params automatically
  const getAuthRedirectUrl = (formType) => {
    const currentUrl = window.location.origin + window.location.pathname;
    return `${currentUrl}?form=${formType}`;
  };

  const renderForm = () => {
    switch (selectedForm) {
      case 'auth':
        return (
          <div>
            <div style={{ marginBottom: tokens.spacing.lg, padding: tokens.spacing.md, backgroundColor: tokens.colors.primary[50], borderRadius: tokens.borderRadius.md }}>
              <h3 style={{ fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.semibold, marginBottom: tokens.spacing.sm }}>
                Auth Form Example
              </h3>
              <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.gray[700], marginBottom: tokens.spacing.sm }}>
                This is the standalone authentication form. After successful OTP verification, it will redirect to the target form with encoded authentication parameters.
              </p>
              <div style={{ display: 'flex', gap: tokens.spacing.sm, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.gray[700] }}>Redirect to:</span>
                <button
                  onClick={() => setAuthTargetForm('form1')}
                  style={{
                    padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                    backgroundColor: authTargetForm === 'form1' ? tokens.colors.primary[600] : tokens.colors.gray[200],
                    color: authTargetForm === 'form1' ? 'white' : tokens.colors.gray[700],
                    border: 'none',
                    borderRadius: tokens.borderRadius.sm,
                    cursor: 'pointer',
                    fontSize: tokens.typography.fontSize.sm,
                  }}
                >
                  Form1
                </button>
                <button
                  onClick={() => setAuthTargetForm('form2')}
                  style={{
                    padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                    backgroundColor: authTargetForm === 'form2' ? tokens.colors.primary[600] : tokens.colors.gray[200],
                    color: authTargetForm === 'form2' ? 'white' : tokens.colors.gray[700],
                    border: 'none',
                    borderRadius: tokens.borderRadius.sm,
                    cursor: 'pointer',
                    fontSize: tokens.typography.fontSize.sm,
                  }}
                >
                  Form2
                </button>
                <button
                  onClick={() => setAuthTargetForm('form3')}
                  style={{
                    padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                    backgroundColor: authTargetForm === 'form3' ? tokens.colors.primary[600] : tokens.colors.gray[200],
                    color: authTargetForm === 'form3' ? 'white' : tokens.colors.gray[700],
                    border: 'none',
                    borderRadius: tokens.borderRadius.sm,
                    cursor: 'pointer',
                    fontSize: tokens.typography.fontSize.sm,
                  }}
                >
                  Form3
                </button>
              </div>
              <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.gray[600], marginTop: tokens.spacing.sm, fontStyle: 'italic' }}>
                After OTP verification, you'll be redirected to {authTargetForm} with encoded authentication parameters. The form will automatically skip the authentication step.
              </p>
            </div>
            <AuthForm 
              redirectUrl={getAuthRedirectUrl(authTargetForm)} 
              theme={theme} 
            />
          </div>
        );
      case 'auth-form1':
        return <Form1 theme={theme} />;
      case 'auth-form2':
        return <Form2 theme={theme} />;
      case 'auth-form3':
        return <Form3 theme={theme} />;
      case 'form1':
        return <Form1 theme={theme} />;
      case 'form2':
        return <Form2 theme={theme} />;
      case 'form3':
        return <Form3 theme={theme} />;
      default:
        return <Form1 theme={theme} />;
    }
  };

  // Check URL params on mount to handle redirects from auth form
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const formParam = urlParams.get('form');
    if (formParam && ['form1', 'form2', 'form3'].includes(formParam)) {
      setSelectedForm(formParam);
      // Don't clean up URL - keep the encoded auth params so forms can read them
      // The forms will handle the auth params via getAuthParamsFromUrl()
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: tokens.colors.gray[50], padding: tokens.spacing.lg }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div
          style={{
            backgroundColor: 'white',
            padding: tokens.spacing.lg,
            borderRadius: tokens.borderRadius.lg,
            marginBottom: tokens.spacing.lg,
            boxShadow: tokens.shadows.md,
          }}
        >
          <h1 style={{ fontSize: tokens.typography.fontSize['3xl'], fontWeight: tokens.typography.fontWeight.bold, marginBottom: tokens.spacing.md }}>
            PW.com Forms - Dynamic Form Builder
          </h1>
          <p style={{ color: tokens.colors.gray[600], marginBottom: tokens.spacing.lg }}>
            Select a form to test. All forms are dynamically rendered from JSON schemas.
          </p>

          <div style={{ display: 'flex', gap: tokens.spacing.md, flexWrap: 'wrap', marginBottom: tokens.spacing.md }}>
            <button
              onClick={() => setSelectedForm('auth')}
              style={{
                padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                backgroundColor: selectedForm === 'auth' || selectedForm.startsWith('auth-') ? tokens.colors.primary[600] : tokens.colors.gray[200],
                color: selectedForm === 'auth' || selectedForm.startsWith('auth-') ? 'white' : tokens.colors.gray[700],
                border: 'none',
                borderRadius: tokens.borderRadius.md,
                cursor: 'pointer',
                fontWeight: tokens.typography.fontWeight.medium,
              }}
            >
              Auth Form (Phone + OTP)
            </button>
            <button
              onClick={() => setSelectedForm('form1')}
              style={{
                padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                backgroundColor: selectedForm === 'form1' ? tokens.colors.primary[600] : tokens.colors.gray[200],
                color: selectedForm === 'form1' ? 'white' : tokens.colors.gray[700],
                border: 'none',
                borderRadius: tokens.borderRadius.md,
                cursor: 'pointer',
                fontWeight: tokens.typography.fontWeight.medium,
              }}
            >
              Form 1 (25 fields, 3 steps)
            </button>
            <button
              onClick={() => setSelectedForm('form2')}
              style={{
                padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                backgroundColor: selectedForm === 'form2' ? tokens.colors.primary[600] : tokens.colors.gray[200],
                color: selectedForm === 'form2' ? 'white' : tokens.colors.gray[700],
                border: 'none',
                borderRadius: tokens.borderRadius.md,
                cursor: 'pointer',
                fontWeight: tokens.typography.fontWeight.medium,
              }}
            >
              Form 2 (11 fields, 1 step)
            </button>
            <button
              onClick={() => setSelectedForm('form3')}
              style={{
                padding: `${tokens.spacing.sm} ${tokens.spacing.md}`,
                backgroundColor: selectedForm === 'form3' ? tokens.colors.primary[600] : tokens.colors.gray[200],
                color: selectedForm === 'form3' ? 'white' : tokens.colors.gray[700],
                border: 'none',
                borderRadius: tokens.borderRadius.md,
                cursor: 'pointer',
                fontWeight: tokens.typography.fontWeight.medium,
              }}
            >
              Form 3 (6 fields, 1 step)
            </button>
          </div>

          <div style={{ display: 'flex', gap: tokens.spacing.lg, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: tokens.spacing.sm, alignItems: 'center' }}>
              <span style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.gray[600] }}>Theme:</span>
              <button
                onClick={() => setTheme('light')}
                style={{
                  padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                  backgroundColor: theme === 'light' ? tokens.colors.primary[600] : tokens.colors.gray[200],
                  color: theme === 'light' ? 'white' : tokens.colors.gray[700],
                  border: 'none',
                  borderRadius: tokens.borderRadius.sm,
                  cursor: 'pointer',
                  fontSize: tokens.typography.fontSize.sm,
                }}
              >
                Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                style={{
                  padding: `${tokens.spacing.xs} ${tokens.spacing.sm}`,
                  backgroundColor: theme === 'dark' ? tokens.colors.primary[600] : tokens.colors.gray[200],
                  color: theme === 'dark' ? 'white' : tokens.colors.gray[700],
                  border: 'none',
                  borderRadius: tokens.borderRadius.sm,
                  cursor: 'pointer',
                  fontSize: tokens.typography.fontSize.sm,
                }}
              >
                Dark
              </button>
            </div>
            <ResponsiveTesterControls onSizeChange={setContainerSize} />
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'white',
            padding: tokens.spacing.lg,
            borderRadius: tokens.borderRadius.lg,
            boxShadow: tokens.shadows.md,
          }}
        >
          <ResponsiveTester containerSize={containerSize}>
            {renderForm()}
          </ResponsiveTester>
        </div>
      </div>
    </div>
  );
}

export default App;
