# PaisaWaala — Embed Integration Guide

Ready-to-copy script tags for embedding PaisaWaala components into any website (Webflow, WordPress, custom HTML, etc.).

---

## Configuration Values

Before using any snippet, replace these placeholder values with your actual ones:

| Placeholder | Description | Example |
|---|---|---|
| `YOUR_CDN_URL` | Where your built JS files are hosted | `https://app-paisawalla.gofo.app` |
| `YOUR_API_URL` | Your PaisaWaala backend API URL | `https://api-paisawalla.gofo.app` |
| `YOUR_RECAPTCHA_KEY` | Google reCAPTCHA v3 site key (public) | `6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |
| `YOUR_REDIRECT_URL` | Page URL to redirect after auth | `https://paisawaala.webflow.io/apply` |

---

## 1. Auth Form — `injectAuth.js`

Standalone phone number + OTP verification. After successful verification, redirects the user to a specified URL (typically your form page).

### HTML Snippet

```html
<div id="pw-auth"></div>

<script
  src="YOUR_CDN_URL/injectAuth.js"
  data-redirect-url="YOUR_REDIRECT_URL"
  data-api-url="YOUR_API_URL"
></script>
```

### Data Attributes

| Attribute | Required | Default | Description |
|---|---|---|---|
| `data-redirect-url` | Yes | — | URL to redirect after successful OTP verification. Auth params (phone, verified status) are appended automatically. |
| `data-api-url` | Yes | — | Backend API base URL for OTP send/verify requests. |
| `data-theme` | No | `light` | `light` or `dark` |
| `data-container` | No | `pw-auth` | ID of the container div. Change if you use a different div ID. |
| `data-title` | No | `Get a Personal loan in 10 mins` | Custom heading text. |
| `data-description` | No | `Apply for Instant Loans up to ₹10 Lakhs` | Custom subheading text. |
| `data-recaptcha-site-key` | No | — | Google reCAPTCHA v3 site key for bot protection. |

### PostMessage Events

Listen for these on the parent window via `window.addEventListener('message', handler)`:

| Event | When | Data |
|---|---|---|
| `authFormLoaded` | Auth form rendered successfully | `{ redirectUrl, theme, containerId }` |
| `authSkipped` | User was already authenticated | `{ redirectUrl, phone, containerId }` |
| `authFormError` | Auth form failed to load | `{ error }` |

All events have `type: 'pw-form-event'`.

### Example with all options

```html
<div id="pw-auth"></div>

<script
  src="https://app-paisawalla.gofo.app/injectAuth.js"
  data-redirect-url="https://paisawaala.webflow.io/apply"
  data-api-url="https://api-paisawalla.gofo.app"
  data-theme="light"
  data-container="pw-auth"
  data-title="Get a Personal loan in 10 mins"
  data-description="Apply for Instant Loans up to ₹10 Lakhs"
  data-recaptcha-site-key="YOUR_RECAPTCHA_KEY"
></script>
```

---

## 2. Loan Application Form — `injectForm.js`

Standalone loan application form. No authentication gate — the form renders immediately. Use this on a page where the user has already been authenticated (e.g., redirected from the auth page).

### HTML Snippet

```html
<div id="pw-form"></div>

<script
  src="YOUR_CDN_URL/injectForm.js"
  data-form="form1"
  data-api-url="YOUR_API_URL"
  data-recaptcha-site-key="YOUR_RECAPTCHA_KEY"
></script>
```

### Data Attributes

| Attribute | Required | Default | Description |
|---|---|---|---|
| `data-form` | Yes | `form1` | Which form to render: `form1`, `form2`, or `form3` (see form types below). |
| `data-api-url` | Yes | — | Backend API base URL. |
| `data-recaptcha-site-key` | No | — | Google reCAPTCHA v3 site key. |
| `data-theme` | No | `light` | `light` or `dark` |
| `data-container` | No | `pw-form` | ID of the container div. |
| `data-title` | No | Form-specific default | Custom form heading. |
| `data-description` | No | — | Custom form subheading. |

### Form Types

| Form | Fields | Steps | Best For |
|---|---|---|---|
| `form1` | 25 fields | 6 steps | Complete personal loan application |
| `form2` | 11 fields | 1 step | Quick eligibility check |
| `form3` | 6 fields | 1 step | Minimal application |

### PostMessage Events

| Event | When | Data |
|---|---|---|
| `formLoaded` | Form rendered successfully | `{ formType, theme, containerId }` |
| `formError` | Form failed to load | `{ error, formType }` |

All events have `type: 'pw-form-event'`.

### Example — Form 1 (full application)

```html
<div id="pw-form"></div>

<script
  src="https://app-paisawalla.gofo.app/injectForm.js"
  data-form="form1"
  data-api-url="https://api-paisawalla.gofo.app"
  data-recaptcha-site-key="YOUR_RECAPTCHA_KEY"
></script>
```

### Example — Form 2 (quick eligibility)

```html
<div id="pw-form"></div>

<script
  src="https://app-paisawalla.gofo.app/injectForm.js"
  data-form="form2"
  data-api-url="https://api-paisawalla.gofo.app"
  data-recaptcha-site-key="YOUR_RECAPTCHA_KEY"
></script>
```

### Example — Form 3 (minimal)

```html
<div id="pw-form"></div>

<script
  src="https://app-paisawalla.gofo.app/injectForm.js"
  data-form="form3"
  data-api-url="https://api-paisawalla.gofo.app"
  data-recaptcha-site-key="YOUR_RECAPTCHA_KEY"
></script>
```

---

## 3. Auth + Form Combo — `injectFormWithAuth.js`

Single-page flow that handles everything. If the user is not authenticated, it shows the auth form first. Once verified, it automatically shows the loan application form — all on the same page, no redirects needed.

This is the recommended option for most use cases.

### HTML Snippet

```html
<div id="pw-form"></div>

<script
  src="YOUR_CDN_URL/injectFormWithAuth.js"
  data-form="form1"
  data-api-url="YOUR_API_URL"
  data-recaptcha-site-key="YOUR_RECAPTCHA_KEY"
></script>
```

### Data Attributes

| Attribute | Required | Default | Description |
|---|---|---|---|
| `data-form` | Yes | `form1` | Which form to render after auth: `form1`, `form2`, or `form3`. |
| `data-api-url` | Yes | — | Backend API base URL. |
| `data-recaptcha-site-key` | No | — | Google reCAPTCHA v3 site key. |
| `data-theme` | No | `light` | `light` or `dark` |
| `data-container` | No | `pw-form` | ID of the container div. |
| `data-title` | No | `Get a Personal loan in 10 mins` | Custom heading for the auth step. |
| `data-description` | No | `Apply for Instant Loans up to ₹10 Lakhs` | Custom subheading for the auth step. |

### How It Works

1. Script checks if auth params exist in the URL (from a previous auth session).
2. If authenticated: renders the form directly.
3. If not authenticated: renders the auth form. After OTP verification, the page reloads with auth params in the URL, then the form loads.

### PostMessage Events

| Event | When | Data |
|---|---|---|
| `authFormLoaded` | Auth form rendered | `{ redirectUrl, theme, containerId, formType }` |
| `formLoaded` | Form rendered (user was already authenticated) | `{ formType, theme, containerId }` |
| `authFormError` | Auth form failed to load | `{ error }` |
| `formError` | Form failed to load | `{ error, formType }` |

All events have `type: 'pw-form-event'`.

### Example with all options

```html
<div id="pw-form"></div>

<script
  src="https://app-paisawalla.gofo.app/injectFormWithAuth.js"
  data-form="form1"
  data-api-url="https://api-paisawalla.gofo.app"
  data-theme="light"
  data-recaptcha-site-key="YOUR_RECAPTCHA_KEY"
  data-title="Get Your Personal Loan Today"
  data-description="Apply in just 10 minutes"
></script>
```

---

## 4. Offers Listing — `injectOffers.js`

Displays loan offers for a completed application. Requires an `applicationId` which is returned after a form submission. Can be passed via a data attribute or read from the URL query string.

### HTML Snippet — Application ID from data attribute

```html
<div id="offers-listing"></div>

<script
  src="YOUR_CDN_URL/injectOffers.js"
  data-application-id="APPLICATION_ID_HERE"
  data-api-url="YOUR_API_URL"
  data-container="offers-listing"
></script>
```

### HTML Snippet — Application ID from URL

If the page URL contains `?applicationId=ABC123`, the script reads it automatically:

```html
<div id="offers-listing"></div>

<script
  src="YOUR_CDN_URL/injectOffers.js"
  data-api-url="YOUR_API_URL"
  data-container="offers-listing"
></script>
```

### HTML Snippet — Dynamic (reads applicationId from URL at runtime)

Use this when you don't know the applicationId at build time:

```html
<div id="offers-listing"></div>

<script>
  var appId = new URLSearchParams(window.location.search).get('applicationId');

  if (appId) {
    var s = document.createElement('script');
    s.src = 'YOUR_CDN_URL/injectOffers.js';
    s.setAttribute('data-application-id', appId);
    s.setAttribute('data-api-url', 'YOUR_API_URL');
    s.setAttribute('data-container', 'offers-listing');
    document.body.appendChild(s);
  } else {
    document.getElementById('offers-listing').innerHTML =
      '<p style="text-align:center;color:#6b7280;">No application ID found. Please complete the application form first.</p>';
  }
</script>
```

### Data Attributes

| Attribute | Required | Default | Description |
|---|---|---|---|
| `data-application-id` | Yes* | — | The application ID to fetch offers for. *Can be omitted if present in URL as `?applicationId=`, `?id=`, or `?appId=`. |
| `data-api-url` | Yes | — | Backend API base URL. |
| `data-container` | No | `offers-listing` | ID of the container div. |
| `data-theme` | No | `light` | `light` or `dark` |
| `data-lead-id` | No | — | Optional lead ID for tracking. |

### PostMessage Events

| Event | When | Data |
|---|---|---|
| `offersLoaded` | Offers listing rendered | `{ applicationId, leadId, theme, containerId }` |
| `stateChange` | Offers state changed (loading, OTP required, success, error) | `{ status, applicationId, leadId, ...data }` |
| `offersError` | Offers failed to load | `{ error, applicationId }` |

All events have `type: 'pw-offers-event'`.

---

## Typical User Journeys

### Journey A: Two-page flow (Auth page + Form page)

**Page 1 — Auth** (`/login` or `/verify`)
```html
<div id="pw-auth"></div>
<script
  src="https://app-paisawalla.gofo.app/injectAuth.js"
  data-redirect-url="https://yoursite.com/apply"
  data-api-url="https://api-paisawalla.gofo.app"
></script>
```

**Page 2 — Form** (`/apply`)
```html
<div id="pw-form"></div>
<script
  src="https://app-paisawalla.gofo.app/injectForm.js"
  data-form="form1"
  data-api-url="https://api-paisawalla.gofo.app"
  data-recaptcha-site-key="YOUR_RECAPTCHA_KEY"
></script>
```

**Page 3 — Offers** (`/offers`)
```html
<div id="offers-listing"></div>
<script>
  var appId = new URLSearchParams(window.location.search).get('applicationId');
  if (appId) {
    var s = document.createElement('script');
    s.src = 'https://app-paisawalla.gofo.app/injectOffers.js';
    s.setAttribute('data-application-id', appId);
    s.setAttribute('data-api-url', 'https://api-paisawalla.gofo.app');
    s.setAttribute('data-container', 'offers-listing');
    document.body.appendChild(s);
  }
</script>
```

Flow: User lands on `/login` -> enters phone -> gets OTP -> verifies -> redirected to `/apply` -> fills form -> gets `applicationId` -> redirected to `/offers?applicationId=XXX` -> sees loan offers.

### Journey B: Single-page flow (recommended)

**Page 1 — Auth + Form** (`/apply`)
```html
<div id="pw-form"></div>
<script
  src="https://app-paisawalla.gofo.app/injectFormWithAuth.js"
  data-form="form1"
  data-api-url="https://api-paisawalla.gofo.app"
  data-recaptcha-site-key="YOUR_RECAPTCHA_KEY"
></script>
```

**Page 2 — Offers** (`/offers`)
```html
<div id="offers-listing"></div>
<script>
  var appId = new URLSearchParams(window.location.search).get('applicationId');
  if (appId) {
    var s = document.createElement('script');
    s.src = 'https://app-paisawalla.gofo.app/injectOffers.js';
    s.setAttribute('data-application-id', appId);
    s.setAttribute('data-api-url', 'https://api-paisawalla.gofo.app');
    s.setAttribute('data-container', 'offers-listing');
    document.body.appendChild(s);
  }
</script>
```

Flow: User lands on `/apply` -> sees auth form -> verifies phone -> form loads on same page -> fills form -> redirected to `/offers?applicationId=XXX`.

---

## Listening for PostMessage Events

All embed scripts emit events via `window.postMessage`. You can listen for them to track user progress or trigger custom behavior:

```html
<script>
  window.addEventListener('message', function(event) {
    // Filter for PaisaWaala events
    if (event.data && (event.data.type === 'pw-form-event' || event.data.type === 'pw-offers-event')) {
      console.log('PaisaWaala event:', event.data.event, event.data.data);

      // Example: track form submission
      if (event.data.event === 'formLoaded') {
        // Form is ready
      }

      // Example: track offers state
      if (event.data.event === 'stateChange' && event.data.data.status === 'success') {
        // Offers loaded successfully
      }
    }
  });
</script>
```

---

## Multiple Forms on One Page

If you need multiple forms on the same page, use unique container IDs:

```html
<div id="form-section-1"></div>
<script
  src="https://app-paisawalla.gofo.app/injectFormWithAuth.js"
  data-form="form1"
  data-container="form-section-1"
  data-api-url="https://api-paisawalla.gofo.app"
></script>

<div id="form-section-2"></div>
<script
  src="https://app-paisawalla.gofo.app/injectFormWithAuth.js"
  data-form="form2"
  data-container="form-section-2"
  data-api-url="https://api-paisawalla.gofo.app"
></script>
```

---

## Adding to Webflow

1. In the Webflow Designer, add an **Embed** element where you want the component.
2. Paste the HTML snippet from the relevant section above.
3. Replace placeholder values (`YOUR_CDN_URL`, `YOUR_API_URL`, etc.) with your actual URLs.
4. Publish the site.
5. Test on the live site (embeds don't render in Webflow's design preview).

---

## Troubleshooting

| Problem | Check |
|---|---|
| Form/auth not showing | Open browser console (F12). Look for errors starting with `PW Forms:` or `PW Auth:`. Verify the container div ID matches the `data-container` value. |
| "Script tag not found" error | Make sure the `<script>` tag has the required `data-*` attributes (like `data-form` or `data-redirect-url`). |
| API errors / form won't submit | Verify `data-api-url` is correct and the backend is running. Check CORS is enabled on the backend for your domain. |
| reCAPTCHA not working | Verify the site key is correct. Your domain must be registered in the Google reCAPTCHA console. Must use HTTPS in production. |
| Offers page shows "Application ID required" | The URL must contain `?applicationId=XXX` or the script must have `data-application-id` set. |
| Styles look broken or conflict with host page | The embed uses scoped styles via `.pw-form-container`. If your site has aggressive global CSS resets, you may need to increase specificity or use an iframe. |
| Multiple forms interfering | Use unique `data-container` IDs for each embed. |
