# Paisawalla (PW.com Forms) — Complete Knowledge Base

Last updated: February 23, 2026

---

## 1. PROJECT OVERVIEW

Paisawalla is a multi-form loan application platform. It consists of:
- A **React + Express full-stack app shell** (development/preview)
- A separate **Paisawalla Backend** (Express + MongoDB) handling leads, applications, BRE, offers, analytics, and auth

The platform's core purpose: provide **embeddable loan application forms** via script injection for external sites (e.g., Webflow). It supports standalone forms, authentication-then-form flows, and combined widgets.

---

## 2. MONOREPO STRUCTURE

```
├── client/                        # React frontend (TypeScript + JSX)
│   ├── src/
│   │   ├── components/            # Shared UI components
│   │   │   ├── AuthForm.jsx       # Phone OTP auth with DPDP consent
│   │   │   ├── EligibilityChecking.jsx  # Unified eligibility UI
│   │   │   ├── DynamicForm.jsx    # Dynamic JSON-schema form renderer
│   │   │   ├── FieldRenderer.jsx  # Individual field rendering
│   │   │   ├── PincodeInput.jsx   # Pincode lookup field
│   │   │   ├── GenderField.jsx    # Gender selection
│   │   │   ├── AddressFieldGroup.jsx
│   │   │   ├── FieldGroup.jsx
│   │   │   ├── FormStepper.jsx / MobileStepper.jsx / ProgressBar.jsx
│   │   │   ├── Loader.jsx
│   │   │   ├── SubmitSuccess.jsx
│   │   │   ├── ResponsiveTester.jsx
│   │   │   └── ui/               # Base UI primitives (Button, Input, ErrorBoundary, LoadingSpinner)
│   │   ├── forms/
│   │   │   ├── form1/            # Form1.jsx, form1Schema.js, form1.schema.json, index.jsx
│   │   │   ├── form2/            # Form2.jsx, form2Schema.js, form2.schema.json, index.jsx
│   │   │   └── form3/            # Form3.jsx, form3Schema.js, form3.schema.json, index.jsx
│   │   ├── embed/                # Embeddable script bundles
│   │   │   ├── injectAuth.js
│   │   │   ├── injectForm.js
│   │   │   ├── injectFormWithAuth.js
│   │   │   ├── injectOffers.js
│   │   │   ├── embed-styles.css
│   │   │   └── webflowBridge.js
│   │   ├── embeds/
│   │   │   └── offers-v2/        # Offers V2 components
│   │   │       ├── OffersListingV2.jsx   # Main listing with filters/sort
│   │   │       ├── OfferCardV2.jsx       # Individual offer card
│   │   │       └── HeroOfferCard.jsx     # Top/hero offer display
│   │   ├── pages/
│   │   │   ├── OffersTestPage.jsx
│   │   │   ├── LenderEligibility.tsx
│   │   │   └── not-found.tsx
│   │   ├── utils/
│   │   │   ├── apiClient.js      # Axios with interceptors
│   │   │   ├── retry.js          # Retry with backoff
│   │   │   ├── validationRules.js
│   │   │   └── queryEncoder.js
│   │   └── design-system/
│   │       └── tokens.js         # Centralized design tokens
│   └── public/
├── server/                        # Express dev server (TypeScript)
│   ├── routes.ts
│   ├── storage.ts                 # IStorage interface + MemStorage
│   └── vite.ts                    # Vite dev middleware (DO NOT MODIFY)
├── shared/
│   └── schema.ts                  # Drizzle schema + Zod validation
├── paisawalla/
│   ├── backend/                   # Main Paisawalla API
│   │   └── src/
│   │       ├── app.js             # Express entry point, port from env
│   │       ├── config/
│   │       │   ├── db.js          # MongoDB connection (connectDB)
│   │       │   ├── env.js         # Environment config
│   │       │   └── security.js    # CORS, helmet, rate limiting config
│   │       ├── controllers/
│   │       │   ├── authController.js
│   │       │   ├── leadController.js
│   │       │   ├── applicationController.js
│   │       │   ├── breController.js          # BRE + ECV fallback
│   │       │   ├── eligibilityController.js  # Unified eligibility endpoint
│   │       │   ├── ecvController.js
│   │       │   ├── offerController.js
│   │       │   ├── consentController.js
│   │       │   ├── analyticsController.js
│   │       │   └── lenderEligibilityController.js
│   │       ├── models/
│   │       │   ├── Lead.js
│   │       │   ├── Application.js
│   │       │   ├── BreSession.js
│   │       │   ├── EcvSession.js
│   │       │   ├── Offer.js
│   │       │   ├── Consent.js
│   │       │   ├── User.js
│   │       │   ├── Lender.js
│   │       │   ├── LenderRule.js
│   │       │   ├── PincodeLender.js
│   │       │   ├── AnalyticsEvent.js
│   │       │   └── FormAbandonment.js
│   │       ├── routes/
│   │       │   ├── authRoutes.js
│   │       │   ├── leadRoutes.js
│   │       │   ├── applicationRoutes.js
│   │       │   ├── breRoutes.js              # /api/bre/*
│   │       │   ├── eligibilityRoutes.js      # /api/eligibility/*
│   │       │   ├── ecvRoutes.js
│   │       │   ├── offerRoutes.js
│   │       │   ├── partnerRoutes.js
│   │       │   ├── pageRoutes.js
│   │       │   ├── analyticsRoutes.js
│   │       │   └── lenderEligibilityRoutes.js
│   │       ├── services/
│   │       │   ├── breService.js             # Experian BRE API client
│   │       │   ├── breTokenService.js        # BRE OAuth token management
│   │       │   ├── experianEcvService.js     # ECV credit check
│   │       │   ├── experianTokenService.js   # ECV OAuth token management
│   │       │   ├── karixOtpService.js        # Karix SMS OTP API client
│   │       │   └── lenderRuleEngine.js       # Internal rule engine
│   │       ├── middleware/
│   │       │   ├── errorHandler.js
│   │       │   ├── rateLimiter.js
│   │       │   ├── sanitizeInput.js
│   │       │   └── requestLogger.js
│   │       ├── utils/
│   │       │   ├── responseBuilder.js        # buildResponse / buildErrorResponse
│   │       │   ├── curlLogger.js             # Full curl command logging (UNMASKED for debugging)
│   │       │   ├── logger.js                 # Winston logger
│   │       │   └── sanitize.js
│   │       └── seeds/
│   │           ├── seedLenderData.js         # Reads CSVs from attached_assets/
│   │           └── testData.js               # Test lead/application variants
│   └── frontend/                  # Original Paisawalla frontend (mirrors client/ structure)
│       └── src/
│           ├── components/        # Same component set as client/
│           ├── embed/             # Same inject scripts
│           └── pages/
│               └── OffersTestPage.jsx
├── migrations/                    # Drizzle migrations
├── attached_assets/               # CSV files for lender seeding
└── vite.config.ts                 # DO NOT MODIFY
```

---

## 3. API ROUTES (Paisawalla Backend)

All routes mounted under the backend (default port from env):

| Prefix | Route File | Purpose |
|--------|-----------|---------|
| `/api/leads` | leadRoutes.js | Create/update/fetch leads |
| `/api/applications` | applicationRoutes.js | Application CRUD |
| `/api/bre` | breRoutes.js | BRE requests, status, query, customer decision, ECV fallback |
| `/api/eligibility` | eligibilityRoutes.js | **Unified eligibility check** (preferred for user journeys) |
| `/api/ecv` | ecvRoutes.js | Experian Enhanced Credit View |
| `/api/offers` | offerRoutes.js | Offer listing/management |
| `/api/auth` | authRoutes.js | Phone OTP auth |
| `/api/partners` | partnerRoutes.js | Partner management |
| `/api/pages` | pageRoutes.js | CMS pages |
| `/api/analytics` | analyticsRoutes.js | Event tracking |
| `/api/lender-eligibility` | lenderEligibilityRoutes.js | Direct lender eligibility check |

### Key BRE Routes (`/api/bre/`)
- `POST /api/bre/requests` — Initiate BRE (requires applicationId)
- `POST /api/bre/status` — Check BRE session status
- `GET /api/bre/query/:experianApplicationId` — Query application at Experian
- `POST /api/bre/customer-decision` — Record accept/reject decision
- `POST /api/bre/ecv-fallback` — Run rule engine fallback with ECV credit score

### Unified Eligibility Route (`/api/eligibility/`)
- `POST /api/eligibility/check` — **THE MAIN ENDPOINT**. Accepts `{ leadId }`, internally:
  1. Finds the lead
  2. Creates application if needed
  3. Runs BRE
  4. If BRE fails → falls back to rule engine (uses ECV session credit scores if available)
  5. Creates offers
  6. Returns `{ applicationId, offersCount, offers: [...] }`

---

## 4. RESPONSE FORMAT

### Backend Response Builder (`responseBuilder.js`)
```js
buildResponse(data, message, statusCode) → { success, message, data, timestamp }
buildErrorResponse(message, errors, statusCode) → { success, message, errors, timestamp }
```

### apiClient Interceptor (Frontend)
The `apiClient.js` Axios instance has a **response interceptor that returns `response.data`** (the Axios response body), NOT the raw Axios response object.

**Full chain explained**:
1. Backend sends HTTP response body: `{ success: true, message: "...", data: { applicationId: "abc", ... }, timestamp: "..." }`
2. Axios normally wraps this as `response.data` (where `response` has status, headers, etc.)
3. The interceptor does `return response.data`, stripping the Axios wrapper
4. So `apiClient.post(...)` resolves to the raw backend body: `{ success: true, data: { applicationId: "abc", ... }, ... }`
5. To access applicationId: `response.data?.applicationId` where `response` = the resolved value from step 4

**CRITICAL BUG PATTERN (FIXED)**: Code was doing `response.data?.data?.applicationId` — that's triple-unwrapping (Axios layer already removed by interceptor, then unwrapping `data` twice). The correct access is `response.data?.applicationId` since `response` IS the backend body, and `response.data` IS the inner data object containing `applicationId`.

### apiClient Base URL Logic
1. Checks `window.VITE_API_BASE_URL`
2. Checks `import.meta.env.VITE_API_BASE_URL`
3. Default: `http://localhost:3000`

---

## 5. EXPERIAN INTEGRATION

### Two Separate Auth Systems

**ECV (Enhanced Credit View)**
- Token endpoint: `https://uat-in-api.experian.com/oauth2/v1/token`
- Body format: `application/x-www-form-urlencoded` (form-encoded)
- Managed by: `experianTokenService.js`

**BRE (Business Rules Engine)**
- Token endpoint: `https://in-api.experian.com/auth/experianone/v1/token`
- Body format: `application/json`
- Managed by: `breTokenService.js`
- Extra requirements: cookie management (XSRF-TOKEN, session cookies), extra headers (`X-Screenless-Kill-Null`, `traceLevel`)

### BRE Credentials (Environment Secrets)
```
EXPERIAN_BRE_CLIENT_ID
EXPERIAN_BRE_CLIENT_SECRET
EXPERIAN_BRE_USERNAME
EXPERIAN_BRE_PASSWORD
```

### BRE Token Service (`breTokenService.js`)
- Caches token with 2-minute refresh buffer
- Extracts cookies from Set-Cookie headers (XSRF-TOKEN, session cookies)
- Stores refresh_token as `exp_rt` cookie
- Deduplicates concurrent token requests with `refreshPromise`
- `invalidateToken()` clears cache + cookies
- Auto-invalidates on HTTP 401

### BRE Service (`breService.js`)
- Base URL: `https://in-api.experian.com` (configurable via `EXPERIAN_BRE_BASE_URL`)
- BPS path: `/decisionanalytics/experianone/nps6t36gvswc/services`
- User domain: `theunimobile.com` (configurable via `EXPERIAN_USER_DOMAIN`)

#### BRE API Endpoints
- **NewApp**: `POST {base}{bpsPath}/v1/applications/NewApp`
- **ContinueApp**: `POST {base}{bpsPath}/v1/applications/update/ContinueApp`
- **CustomerDecision**: `POST {base}{bpsPath}/v1/applications/update/CustomerDecision`
- **AppQuery**: `POST {base}{bpsPath}/v1/applications/search/AppQuery`

#### BRE Request Payload Structure
```json
{
  "DV-Application": { "ServiceID": "NewApp" },
  "DV-Applicant": {
    "Applicant": [{
      "ApplicantType": "Primary",
      "ApplicantCategory": "Individual",
      "ExistingCustomer": "N",
      "Title": "Mr." / "Ms.",
      "FirstName": "", "MiddleName": "", "LastName": "",
      "DateOfBirth": "YYYYMMDD",
      "Gender": "1"/"2"/"3",
      "MaritalStatus": "",
      "PhoneMobile": "",
      "EmailId": "",
      "BankAccount": [{ "AccountType": "S", "AccountNumber": "", "IFSCCode": "", "BankName": "" }],
      "Address": [{ "AddressLine1": "", "City": "", "Pincode": "", "State": "27" }],
      "Identification": [{ "IdentificationType": "PAN", "IdentificationNumber": "" }],
      "Employment": [{ "EmploymentStatus": "S", "EmployerName": "", "GrossIncome": 50000, "TakeHomeSalary": 40000 }]
    }]
  },
  "DV-Product": {
    "Product": [{ "ProductType": "PL", "ProductID": "PL", "AppliedAmount": 500000, "TenureMonths": 36 }]
  },
  "DV-Collateral": { "Collateral": [{}] }
}
```

#### BRE Response Parsing (`parseNewAppResponse`)
Extracts from response:
- `DV-Application` → applicationId, status, stage, strategyName, dates, errorCount
- `DV-Applicant.Applicant[0].LenderEligibility[]` → lender decisions (name, loanAmount, tenure, ROI, decision category/text, reason codes)
- `DV-CreditReport.Applicant[0].CreditReport[0]` → Bureau_Score, NTCFlag, delinquency counts

A lender is approved if `decision.DecisionCategory === 'Approve'`

### Known Issue: IP Blocking
Experian BRE blocks certain cloud provider IPs with 403 errors. Requires IP whitelisting with Experian.

---

## 6. BRE FIELD MAPPING

Forms save fields with different names than BRE expects. The mapping layer handles this:

| Form Field | BRE Field | Notes |
|-----------|-----------|-------|
| `fullName` | `firstName` + `lastName` | Split on whitespace; first word = firstName, rest = lastName |
| `pinCode` | `pincode` | Also checks `address.zipCode` |
| `employmentType` | `employmentStatus` | Mapped to single-letter codes |
| `netMonthlyIncome` | `grossIncome` | Fallback chain: monthlyIncome → grossIncome → netMonthlyIncome |
| `panNumber` | `pan` | Also checks `panNumber` |
| `companyName` | `employerName` | Fallback: employerName → companyName → organizationName |
| `companyEmail` | `email` | Fallback: email → companyEmail |

### Employment Status Mapping (BRE expects single letters)
```
employed/salaried → S
self-employed/selfemployed/business → E
self-employed professional → P
non-salaried/unemployed/retired/homemaker → N
student → U
```

### Gender Mapping (BRE expects numeric)
```
male/m/1 → "1"
female/f/2 → "2"
transgender/other/3 → "3"
```

### State Mapping (BRE expects 2-digit codes)
Full map from state names to codes:
```
Jammu & Kashmir → 01, Himachal Pradesh → 02, Punjab → 03, Chandigarh → 04,
Uttarakhand → 05, Haryana → 06, Delhi → 07, Rajasthan → 08,
Uttar Pradesh → 09, Bihar → 10, Sikkim → 11, Arunachal Pradesh → 12,
Nagaland → 13, Manipur → 14, Mizoram → 15, Tripura → 16,
Meghalaya → 17, Assam → 18, West Bengal → 19, Jharkhand → 20,
Odisha → 21, Chhattisgarh → 22, Madhya Pradesh → 23, Gujarat → 24,
Daman & Diu → 25, Dadra & Nagar Haveli → 26, Maharashtra → 27,
Andhra Pradesh → 28, Karnataka → 29, Goa → 30, Lakshadweep → 31,
Kerala → 32, Tamil Nadu → 33, Puducherry → 34,
Andaman & Nicobar → 35, Telangana → 36, APO → 99
```

### Date Format
BRE expects `YYYYMMDD` (no separators). The `_formatDate()` method handles conversion.

---

## 7. LENDER RULE ENGINE (Fallback)

File: `paisawalla/backend/src/services/lenderRuleEngine.js`

When BRE fails (403, timeout, etc.), the system falls back to an internal rule engine.

### Lenders Evaluated (in order)
1. **Prefr** — Age 23-56, income > 25000, credit score ≥ 745
2. **ABFL** — Age 23-55, income ≥ 25000, credit score ≥ 700
3. **Hero Fincorp** — Age 21-58, income ≥ 15000, credit score ≥ 725
4. **Poonawalla Stpl** — Age 25-55, credit score ≥ 740
5. **Mpokket** — Fallback lender when no primary lender is eligible

### Rule Engine Data Sources
- **Pincode serviceability**: From MongoDB `PincodeLender` collection (seeded from CSVs)
- **Lender details**: From MongoDB `Lender` collection (max loan amount, tenure, ROI)
- **Credit score**: Checked in order: lead.creditScore → EcvSession → default 650

### Bureau Data Checks (when available)
For each lender, various checks on bureau data:
- DPD (Days Past Due) in 3/6/12/24/36 month windows
- Write-off/suit filed/settled statuses
- Overdue amounts (CC > 10K, others > 5K)
- Active unsecured loan counts
- Unsecured enquiry counts
- NTC (New To Credit) flag
- Bureau vintage (minimum months)
- PL account counts and recent openings

### Decline Codes
Each check has a specific decline code (D001-D034) for tracking.

### Unsecured Account Types
```
10, 12, 05, 08, 40, 41, 43, 51, 52, 53, 54, 14, 09, 06, 60, 55, 56, 57, 58, 35, 16, 19, 20, 18, 36, 37, 38, 39, 61, 00
```

### Unsecured Enquiry Reasons
```
0, 5, 6, 8, 9, 10, 12, 14, 16, 18, 19, 20, 40, 41, 43, 51, 52, 53, 54, 55, 56, 57, 58, 60, 33, 35, 36
```

---

## 8. UNIFIED ELIGIBILITY FLOW

File: `paisawalla/backend/src/controllers/eligibilityController.js`

### Flow (POST `/api/eligibility/check`)
```
1. Receive { leadId }
2. Validate leadId (must be valid MongoDB ObjectId)
3. Find lead in DB
4. Find or create Application (auto-generates applicationNumber: APP-{timestamp}-{count})
5. Try BRE:
   a. Map lead fields to BRE format (with fallback chains)
   b. Get BRE auth token + cookies
   c. Submit NewApp to Experian
   d. Parse response → extract lenders + credit score
   e. Create Offer documents for approved lenders
   f. Save BreSession
6. If BRE fails → Rule Engine Fallback:
   a. Get credit score: lead → EcvSession → default 650
   b. Evaluate applicant against lender rules
   c. Create Offer documents for eligible lenders
   d. Mpokket as fallback if none eligible
7. Update application status
8. Return { applicationId, offersCount, offers: [...] }
```

### Offer Creation
- From BRE: uses parsed loanAmount, tenure, ROI from lender decisions
- From Rule Engine: uses lender's maxLoanAmount, maxTenureMonths, minRoi
- EMI calculated using standard formula: `P × r × (1+r)^n / ((1+r)^n - 1)`
- Loan amounts parsed from strings ("5 Lakh" → 500000, "10K" → 10000)

---

## 9. FRONTEND ARCHITECTURE

### Tech Stack
- React 18 + TypeScript/JSX
- Vite (build tool)
- shadcn/ui (New York style) + Radix UI + Tailwind CSS
- TanStack React Query (server state)
- Zustand (paisawalla frontend state)
- Zod (validation)
- Wouter (routing)
- Lucide React (icons)

### Form System
Each form (form1, form2, form3) has:
- `Form{N}.jsx` — Component with validation + submission logic
- `form{N}Schema.js` — Zod validation schema
- `form{N}.schema.json` — JSON schema for dynamic rendering
- `index.jsx` — Re-export

### Form Validation Pattern
Forms use a `validateForm()` function that returns `{ isValid, errors }`. The form submission handler must check `validation.isValid` (NOT use the return value directly as truthy/falsy).

**Past Bug (Form2)**: `validateForm()` returns an object `{ isValid, errors }`. The code was doing `if (!validateForm())` which is always false since objects are truthy. Fixed to: `const validation = validateForm(); if (!validation.isValid) return;`

### User Journey (In-App)
Three separate journey buttons, each providing:
```
Auth Form (phone + OTP + consent)
  ↓ passes phone, consents
Form 1/2/3 (application data)
  ↓ submits to /api/leads
EligibilityChecking component
  ↓ calls POST /api/eligibility/check { leadId }
  ↓ receives { applicationId, offers }
Offers V2 page
  ↓ displays approved lender offers
```

Auth data (phone, consents) is passed in-app without page redirects.

### EligibilityChecking Component
- Shows animated progress messages while API call runs
- Uses `hasStarted` ref to prevent double API calls
- Calls `/api/eligibility/check` with leadId
- On success: passes applicationId to onComplete callback
- On error: calls onError callback

### Auth Form (DPDP Compliance)
Three separate consent checkboxes:
1. Credit bureau data access consent
2. Personal data processing consent
3. Terms and conditions agreement

Full DPDP Act-compliant notice panel with:
- Data Fiduciary details (Unimobile Messaging Solutions LLP)
- DPO email: dpo@theunimobile.com
- Grievance officer: grievance@theunimobile.com

---

## 10. EMBEDDING SYSTEM

### Inject Scripts (in `client/src/embed/` and `paisawalla/frontend/src/embed/`)
- `injectAuth.js` — Standalone auth form
- `injectForm.js` — Standalone form (any form 1-3)
- `injectFormWithAuth.js` — Auth then form flow
- `injectOffers.js` — Offers display
- `webflowBridge.js` — Webflow-specific integration

### Embedding Approach
- IIFE builds with CSS isolation
- `postMessage` communication between iframe and parent
- Auto-saves form data to localStorage for recovery

---

## 11. OFFERS PAGE V2

### Features
- Advanced filtering and sorting
- Approval probability indicators
- EMI calculator
- Comparison tray
- Session token mechanism
- Enhanced OTP gate
- Improved loading states
- Loan amount and tenure displayed on mobile offer cards
- Misleading summary card removed (was showing averages that confused users)

### Offer Filter System (Two-Tier Architecture)

Filters use two data sources — **manual lender mappings** and **data-derived values**.

#### Manual Lender Attributes (`LENDER_ATTRIBUTES` in `OffersListingV2.jsx`)
```js
const LENDER_ATTRIBUTES = {
  poonawalla: { preApproved: false, quickDisbursal: false },
  poonawaala: { preApproved: false, quickDisbursal: false },
  prefr: { preApproved: false, quickDisbursal: false },
  prefer: { preApproved: false, quickDisbursal: false },
  abfl: { preApproved: false, quickDisbursal: false },
  hero_fincorp: { preApproved: false, quickDisbursal: false },
  herofincorp: { preApproved: false, quickDisbursal: false },
  mpokket: { preApproved: false, quickDisbursal: false },
};
```
All currently set to `false` — to be configured per-lender when data is available.

#### Foreclosure Charges (`LENDER_FORECLOSURE` in `OffersListingV2.jsx`)
```js
const LENDER_FORECLOSURE = {
  poonawalla: 'Nil',
  poonawaala: 'Nil',
  prefr: '5% of Principal Outstanding',
  prefer: '5% of Principal Outstanding',
  abfl: '4% of the principal outstanding + applicable GST',
  hero_fincorp: '4-5% of the principal outstanding + applicable GST',
  herofincorp: '4-5% of the principal outstanding + applicable GST',
  mpokket: '3% of Principal Outstanding',
};
```

#### Filter Chip Logic
| Filter | Data Source | Logic |
|--------|-----------|-------|
| Pre-approved | `LENDER_ATTRIBUTES[key].preApproved` | Manual per-lender flag |
| Quick Disbursal | `LENDER_ATTRIBUTES[key].quickDisbursal` | Manual per-lender flag |
| Low Interest | Offer data | `offer.apr <= 14` |
| No Foreclosure | `LENDER_FORECLOSURE` + offer data fallback | Checks for "Nil"/"0"/"none"/"zero"/"na"/"n/a" values; falls back to `offer.offerData.charges.foreclosure` for lenders not in the mapping |

#### Lender Name Normalization
All lookups use `normalizeLenderKey()`: `name.toLowerCase().replace(/[\s_-]+/g, '_').trim()`
This prevents filter mismatches when lender names come in different formats (e.g., "Hero Fincorp" vs "hero_fincorp" vs "Hero-Fincorp").

### Lender Redirect URLs (`LENDER_APPLY_URLS`)

Defined in both `OfferCardV2.jsx` and `HeroOfferCard.jsx`:

| Lender | Redirect URL |
|--------|-------------|
| Poonawalla | `https://instant-pocket-loan.poonawallafincorp.com/?redirectto=primepl&utm_DSA_Code=PTG00338&UTM_Partner_Name=KARIX&UTM_Partner_Medium=P01&UTM_Partner_AgentCode=PFLKARIX&UTM_Partner_ReferenceID=KARIXPFL00000001` |
| Prefr | `https://marketplace.prefr.com/karixweb?utm_source=k1&utm_medium=P01` |
| Mpokket | `https://web.mpokket.in/?utm_source=karix&utm_medium=P01` |
| Hero Fincorp | `https://hipl.onelink.me/S7fO?af_ios_url=...&af_android_url=...&pid=karix_int&c=Karix_ACQ_22042025&utm_source=partnership&utm_campaign=karix_int&utm_campaignid=PP01` |

URL resolution: `offer.ctaUrl || getLenderApplyUrl(lenderName)` — offer-level CTA URL takes priority, falls back to the mapping.

The `getLenderApplyUrl()` function tries two key formats:
1. Underscore-separated: `hero_fincorp`
2. No separators: `herofincorp`

---

## 12. DATABASE (MongoDB)

### Key Models

**Lead** — Customer information from form submission
- phone, fullName, firstName, lastName, email, companyEmail
- dateOfBirth, gender, maritalStatus
- employmentType/employmentStatus, netMonthlyIncome/grossIncome
- companyName/employerName/organizationName
- panNumber/pan, loanAmount, loanTenure, loanPurpose
- pinCode/pincode, address (object with street, city, state, zipCode)
- formType, status, creditScore

**Application** — Created from a lead for eligibility processing
- leadId (ref to Lead), applicationNumber, applicationData
- status: pending → bre_completed / offers_available / completed / ecv_checked
- breStatus: completed / rule_engine_fallback / ecv_fallback

**BreSession** — Record of each BRE API call
- applicationId, correlationId, serviceContextId, experianApplicationId
- status, requestPayload, responsePayload, parsedResult
- completedAt, errorMessage

**EcvSession** — Record of ECV credit check
- leadId, phone, status, creditScore

**Offer** — Lending offer for an application
- applicationId, lenderId, lenderName
- loanAmount, interestRate, termMonths, monthlyPayment, apr
- offerType: standard / fallback
- status: available
- offerData (raw details, source, decision text)

**Consent** — DPDP consent records

**Lender** — Lender configuration (name, displayName, maxLoanAmount, maxTenureMonths, minRoi, isActive, isFallback)

**PincodeLender** — Pincode-to-lender mapping (pincode, lenderName, isServiceable)

**LenderRule** — Lender-specific eligibility rules

**AnalyticsEvent** — Form interaction tracking

**FormAbandonment** — Abandoned form tracking

**User** — Authentication

---

## 13. LENDER DATA SEEDING

File: `paisawalla/backend/src/seeds/seedLenderData.js`
- Reads CSV files from `attached_assets/` directory
- CSV files use `_1771495415955` suffix naming convention
- Seeds MongoDB on startup (non-blocking, failure is non-critical)
- Creates/updates PincodeLender and Lender documents

---

## 14. CURL LOGGER (Debug Mode)

File: `paisawalla/backend/src/utils/curlLogger.js`

Currently in **UNMASKED DEBUG MODE** — logs full curl commands including all headers, tokens, cookies, and request bodies. This is intentional for debugging but should be re-enabled with masking for production.

Previously had sensitive key masking for: password, client_secret, secret, otp, access_token, refresh_token, token, authorization, cookie, set-cookie, x-xsrf-token, xsrf-token.

---

## 15. KARIX SMS OTP INTEGRATION

File: `paisawalla/backend/src/services/karixOtpService.js`
Controller: `paisawalla/backend/src/controllers/authController.js`

### Overview
Phone-based OTP authentication via the Karix OTP Authenticator API. The system auto-detects whether Karix is configured and falls back to dev mode if not.

### Configuration Check (`isKarixConfigured()`)
Checks for two env vars:
- `KARIX_ACCESS_KEY` — required
- `KARIX_IP_ADDRESS` — required

If either is missing → **fallback/dev mode** (hardcoded OTP `123456` always accepted, locally generated OTPs stored in memory).

### Environment Variables
```
KARIX_ACCESS_KEY         (required for live mode)
KARIX_IP_ADDRESS         (required for live mode)
KARIX_BASE_URL           (optional, default: https://auth.instaalerts.zone/otpauthapi)
KARIX_DEPARTMENT_ID      (optional, default: Uni_SMS_OTP_feb20)
```

### Three API Endpoints

#### 1. OTP Generation (`otpgenservlet`)
```
POST {baseUrl}/otpgenservlet?ipaddress={ip}&mobile={91XXXXXXXXXX}
Headers:
  access_key: {KARIX_ACCESS_KEY}
  department-id: {KARIX_DEPARTMENT_ID}    ← REQUIRED for generation
```
- Phone format: Always 12-digit with `91` prefix (e.g., `919876543210`)
- Success response contains: `OTP Generated Successfully`
- Error responses: `UNAUTHERISED USER`, `Invalid Parameters`, `The feature is not enabled`, `SMSEMAILFAIL`

#### 2. OTP Validation (`otpvalidationservlet`)
```
POST {baseUrl}/otpvalidationservlet?ipaddress={ip}&otp={plaintext_otp}&mobile={91XXXXXXXXXX}
Headers:
  access_key: {KARIX_ACCESS_KEY}
  ← NO department-id header for validation
```
- **CRITICAL**: `department-id` is NOT sent for validation — only `access_key`
- **OTP is sent as plain text** — no encryption (no AES, no hashing)
- Success response contains: `Verified successfully`
- Error responses: `OTPEXPIRED`, `Max no of tries`, `Wrong PIN remaining #N`

#### 3. OTP Regeneration / Resend (`otpregenservlet`)
```
POST {baseUrl}/otpregenservlet?ipaddress={ip}&mobile={91XXXXXXXXXX}
Headers:
  access_key: {KARIX_ACCESS_KEY}
  department-id: {KARIX_DEPARTMENT_ID}    ← REQUIRED for regeneration
```
- Maps to the frontend "Resend OTP" button
- Success response contains: `OTP Generated Successfully`
- Error responses: `MAXREGEN`, `UNAUTHERISED USER`

### Header Summary
| Endpoint | `access_key` | `department-id` |
|----------|:------------:|:---------------:|
| Generate (otpgenservlet) | YES | YES |
| Validate (otpvalidationservlet) | YES | **NO** |
| Regenerate (otpregenservlet) | YES | YES |

### Dev/Fallback Mode
When Karix is not configured:
- OTP generation: creates a random 6-digit OTP, stores in memory with 10-minute expiry (`OTP_EXPIRY_MS = 10 * 60 * 1000`)
- OTP validation: accepts hardcoded `123456` OR the locally generated OTP
- In `development` environment, logs OTP to console: `[DEV ONLY] OTP for {phone}: {otp}`
- Auth tokens: generated using `crypto.randomBytes(32)` with 30-day expiry (`SESSION_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000`)

### Phone Number Formatting (`formatMobile`)
- If starts with `91` and is 12 digits → use as-is
- If 10 digits → prepend `91`
- Otherwise → use cleaned digits as-is

### Auth Routes
| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/send-otp` | POST | Generate and send OTP |
| `/api/auth/verify-otp` | POST | Validate OTP |
| `/api/auth/resend-otp` | POST | Regenerate OTP |

---

## 16. ENVIRONMENT VARIABLES & CONFIG

### Required Secrets (Experian)
```
EXPERIAN_BRE_CLIENT_ID
EXPERIAN_BRE_CLIENT_SECRET
EXPERIAN_BRE_USERNAME
EXPERIAN_BRE_PASSWORD
```

### Required Secrets (Karix OTP — for live SMS)
```
KARIX_ACCESS_KEY
KARIX_IP_ADDRESS
```

### Optional Environment Variables
```
EXPERIAN_BRE_BASE_URL    (default: https://in-api.experian.com)
EXPERIAN_BRE_PATH        (default: /decisionanalytics/experianone/nps6t36gvswc/services)
EXPERIAN_USER_DOMAIN     (default: theunimobile.com)
DECISION_MODE            (default: ECV)
VITE_API_BASE_URL        (frontend API base URL)
KARIX_BASE_URL           (default: https://auth.instaalerts.zone/otpauthapi)
KARIX_DEPARTMENT_ID      (default: Uni_SMS_OTP_feb20)
RECAPTCHA_SECRET_KEY     (optional, for bot protection)
RECAPTCHA_SITE_KEY       (optional, for bot protection)
MONGODB_URI              (required for paisawalla backend)
```

---

## 17. CRITICAL BUGS FOUND & FIXED

### Bug 1: Form2 validateForm Return
**Problem**: `validateForm()` returns `{ isValid, errors }` (an object). Code was doing `if (!validateForm())` — objects are always truthy, so validation was never blocking submission.
**Fix**: `const validation = validateForm(); if (!validation.isValid) return;`
**Applies to**: Form2 had this bug; Form3 was already correct.

### Bug 2: Double Response Unwrapping
**Problem**: `apiClient` interceptor already returns `response.data` (strips Axios wrapper). Frontend code was doing `response.data?.data?.applicationId` — double unwrapping, always getting undefined.
**Fix**: Changed to `response.data?.applicationId` in both `client/src/components/EligibilityChecking.jsx` and `paisawalla/frontend/src/components/EligibilityChecking.jsx`.

### Bug 3: Experian IP Blocking
**Problem**: Experian BRE returns 403 for requests from certain cloud provider IPs.
**Status**: Unresolved — requires IP whitelisting with Experian.

---

## 18. ARCHITECTURE DECISIONS & PRINCIPLES

1. **Frontend abstraction**: Frontend should NEVER know about BRE, ECV, or internal eligibility mechanisms. It sends leadId and receives offers.

2. **Dual backend**: Express shell for dev preview; Paisawalla backend (MongoDB) for actual data.

3. **Unified eligibility**: Single `/api/eligibility/check` endpoint replaces complex multi-step BRE polling. Old `/api/bre/*` routes remain for admin/embed use.

4. **Fallback chain**: BRE → Rule Engine (with ECV credit scores if available) → Mpokket fallback.

5. **Credit score sourcing**: lead.creditScore → EcvSession (verified, most recent) → default 650.

6. **Embeddable forms**: CSS isolation + IIFE bundles + postMessage for third-party site injection.

7. **Form data persistence**: Auto-save to localStorage for recovery.

8. **DPDP compliance**: Three separate consent checkboxes, full notice panel with DPO/grievance contacts.

---

## 19. DEVELOPMENT WORKFLOW

### Running the Project
- Workflow: `npm run dev` — starts Express server + Vite dev server
- Frontend: Port 5000 (Vite proxied)
- Backend (Paisawalla): Port 3000 (configurable)
- MongoDB: External connection via `connectDB()`

### Key Files NOT to Modify
- `vite.config.ts` — Vite setup
- `server/vite.ts` — Vite middleware
- `drizzle.config.ts` — Drizzle config

### Build Tools
- Vite: Frontend build/dev
- esbuild: Server bundling
- Drizzle Kit: DB migrations (dev shell only)

---

## 20. SECURITY

- Helmet for security headers
- CORS with configured origins
- Rate limiting on API routes
- Input sanitization middleware
- Request logging middleware
- Phone-based OTP authentication
- Session token mechanism for offers page
- reCAPTCHA v3 for bot protection

---

## 21. ANALYTICS

Built-in service tracks:
- Form interactions
- Session data
- UTM parameters
- Form abandonment
- Custom events via AnalyticsEvent model

---

## 22. TESTING

- Test data seeding via `POST /api/test-variants/seed`
- Test variants viewable at `GET /api/test-variants`
- `seedTestData()` creates test leads/applications
- OffersTestPage at `/offers-test` for offers UI testing
- ResponsiveTester component for responsive layout testing

---

## 23. QUICK REFERENCE: API CALL CHAIN

```
Frontend: apiClient.post('/api/eligibility/check', { leadId })
  ↓ (Axios interceptor strips response wrapper)
  ↓ Returns: { success, message, data: { applicationId, offersCount, offers }, timestamp }
  ↓ Frontend reads: response.data.applicationId

Backend Flow:
  eligibilityController.checkEligibility()
    → Lead.findById(leadId)
    → Application.findOne({ leadId }) || new Application()
    → runBreEligibility():
        → breTokenService.getToken() + getCookieString()
        → breService.submitNewApp(applicantData)
        → parseNewAppResponse() → lenders, creditReport
        → createOffersFromBre()
    → [on failure] runRuleEngineEligibility():
        → EcvSession.findOne() for credit score
        → lenderRuleEngine.evaluateApplicant()
        → createOffersFromRuleEngine()
    → buildResponse({ applicationId, offersCount, offers })
```

---

## 24. FILE NAMING CONVENTIONS

- CSV files: `*_1771495415955.csv` suffix
- Models: PascalCase (Lead.js, Application.js)
- Controllers: camelCase + Controller (breController.js)
- Routes: camelCase + Routes (breRoutes.js)
- Services: camelCase + Service (breService.js)
- Frontend components: PascalCase (AuthForm.jsx, EligibilityChecking.jsx)
- Embed scripts: camelCase (injectForm.js, injectAuth.js)
