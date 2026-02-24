# knowledge.md

## Overview
PaisaWaala is a multi-form personal loan application platform that lets users instantly compare loan offers from top lenders (Poonawalla, Prefr, Mpokket, Hero Fincorp, ABFL). It has two main directories: `client/` (React frontend) and `server/` (Express backend with MongoDB). The API code lives in `server/api/` and runs in the same process as the dev server. Forms are embeddable via script injection for external sites like Webflow.

## User Preferences
Preferred communication style: Simple, everyday language.

## Folder Structure

```
/
├── client/                         # React frontend (the ONLY frontend)
│   ├── public/                     #   Static assets (favicon.webp)
│   └── src/
│       ├── components/             #   Shared UI components (DynamicForm, AuthForm, FieldRenderer, etc.)
│       │   ├── forms/              #   Form renderers (Desktop, Mobile, Tablet, Responsive)
│       │   └── ui/                 #   shadcn/ui components (button, card, dialog, etc.)
│       ├── design-system/          #   ThemeProvider, design tokens
│       ├── embed/                  #   Embed injection scripts (injectForm, injectAuth, injectOffers, etc.)
│       ├── embeds/                 #   Embed page components
│       │   ├── breStatus/          #     BRE status polling UI
│       │   ├── offers/             #     Offers V1 listing
│       │   └── offers-v2/          #     Offers V2 listing (active, with filters, EMI calc, comparison)
│       ├── forms/                  #   Form schemas & wrappers
│       │   ├── form1/              #     Personal Loan Application (6-step)
│       │   ├── form2/              #     Quick Eligibility Check (2-step)
│       │   └── form3/              #     Complete Application (1-step)
│       ├── hooks/                  #   Custom hooks (useFormPersistence, useResponsive, etc.)
│       ├── lib/                    #   TanStack Query client, utilities
│       ├── pages/                  #   Page components (LenderEligibility, OffersTestPage)
│       └── utils/                  #   Shared utilities (analytics, apiClient, validation, etc.)
│
├── server/                         # Express server + API backend
│   ├── index.ts                    #   Entry point (starts server on port 5000)
│   ├── routes.ts                   #   Mounts API router at /api, initializes backend
│   ├── vite.ts                     #   Vite dev middleware (DO NOT MODIFY)
│   ├── static.ts                   #   Production static file serving
│   └── api/                        #   Backend API code (Express + MongoDB)
│       ├── app.js                  #     API router setup, exports apiRouter & initializeBackend()
│       ├── config/                 #     DB connection, env config, security
│       ├── controllers/            #     Route handlers (leads, applications, BRE, ECV, offers, auth, eligibility)
│       ├── middleware/             #     Error handling, rate limiting, logging, sanitization, reCAPTCHA
│       ├── models/                 #     Mongoose models (Lead, Application, Offer, Lender, PincodeLender, etc.)
│       ├── routes/                 #     Express route definitions
│       ├── seeds/                  #     Lender data seeder (reads CSVs from attached_assets/)
│       ├── services/               #     Business logic (BRE, Experian ECV, Karix OTP, lender rule engine)
│       └── utils/                  #     Logger (Winston), response builder, sanitization
│
├── docs/                           # Project documentation
│   ├── EMBED_INTEGRATION.md        #   Full embed integration guide
│   ├── WEBFLOW_QUICK_EMBED.txt     #   Webflow embed quick reference
│   ├── paisawalla.knowledge.md     #   Comprehensive platform knowledge base
│   ├── knowledge.md                #   Project overview and structure
│   ├── integration.pending.to-do   #   Experian API integration status
│   └── schema.philosophy           #   Data model relationships
│
├── attached_assets/                # Reference files: lender CSVs, Postman collections, API docs, logos
└── shared/                         # Drizzle schema (template boilerplate, not actively used)
```

## How It Runs

A single process runs via `npm run dev`:
- **Express server** (port 5000): Serves the Vite React frontend and mounts the API router at `/api`. Backend API code in `server/api/` runs directly in the same process — no proxy or child process needed.

## Frontend Architecture
- **Framework**: React 18 with TypeScript (App.tsx, pages) and JSX (forms, embeds, components).
- **Build Tool**: Vite.
- **UI Components**: shadcn/ui (New York style) built on Radix UI, styled with Tailwind CSS.
- **State Management**: React hooks, TanStack React Query for server state.
- **Form Validation**: Zod schemas.
- **Design Tokens**: `client/src/design-system/tokens.js`.

## Backend Architecture (Paisawalla API)
- **Framework**: Express.js (ESM, vanilla JS).
- **Database**: MongoDB via Mongoose.
- **Security**: Helmet, CORS, rate limiting, input sanitization.
- **Logging**: Winston.
- **Core Services**: Leads, Applications, BRE, Offers, Partners, Pages, Analytics, Auth (Karix OTP).

## Lender Eligibility System
- **Models**: PincodeLender, Lender, LenderRule (Mongoose) in `server/api/models/`.
- **Seed Script**: `server/api/seeds/seedLenderData.js` reads CSV files from `attached_assets/`.
- **Rule Engine**: `server/api/services/lenderRuleEngine.js` evaluates applicants against lender criteria.
- **Fallback**: Mpokket is the default fallback lender when no primary lender is eligible.
- **CSV Files**: Use `_1771495415955` suffix naming convention.

## API Logging System
- **Utility**: `server/api/utils/apiLogger.js` — persists every third-party API call to MongoDB (`api_logs` collection), auto-caps at 500 entries (oldest auto-deleted).
- **Model**: `server/api/models/ApiLog.js` — Mongoose model with indexes on `service` and `createdAt`.
- **Route**: `GET /api/admin/api-logs` (paginated, optional `?service=` filter), `DELETE /api/admin/api-logs` (clear all).
- **Frontend**: `client/src/pages/ApiLogs.jsx` — accessible via the "API Logs" button on the main page.
- **Instrumented Services**: Karix OTP, Experian ECV Token, Experian ECV, Experian BRE Token, Experian BRE, Google reCAPTCHA.
- **Each log entry captures**: service name, HTTP method, URL, request headers (sensitive values redacted), request body, raw response, parsed/JSONified response, status code, duration in ms, and any error.
- **Frontend features**: Auto-refresh (5s polling), filter by service, collapsible JSON tree viewer, syntax-highlighted XML viewer, plain text for non-structured data, clear logs, color-coded status indicators.
- **Persistence**: Logs are stored in MongoDB and survive server restarts. Fire-and-forget writes (don't block the API call).

## Key Design Decisions
1.  **Embeddable Forms**: Built as IIFE bundles with CSS isolation for third-party site injection.
2.  **Unified Server**: Single Express process serves both frontend (Vite) and API routes.
3.  **Form Data Persistence**: Forms auto-save to localStorage for recovery.
4.  **Analytics**: Built-in service tracks form interactions, session data, and UTM parameters.
5.  **Auth Flow**: Phone-based OTP authentication via Karix API with obfuscated URL parameters.
6.  **Offers V2**: Advanced filtering, sorting, approval probability, EMI calculator, and comparison tray.
7.  **Experian Integration**: Separate auth systems for ECV (form-encoded) and BRE (JSON). Cookie management for BRE.
8.  **Full Journey Flows**: Three journey buttons each provide Auth -> Form -> BRE/ECV -> Offers V2.
9.  **Unified Eligibility Endpoint**: `/api/eligibility/check` runs BRE with automatic rule engine fallback.
10. **Karix SMS OTP**: Auto-detects credentials; falls back to dev mode (hardcoded OTP 123456) when missing.
11. **BRE Field Mapping**: Translates form field names to BRE-expected names (fullName -> firstName/lastName, etc.).
12. **Offer Filters**: Mix of manually assigned attributes (pre-approved, quick disbursal) and derived data (low interest, no foreclosure).

## External Dependencies

### Core Services
- **MongoDB**: Primary database for all application data.
- **Google reCAPTCHA v3**: Bot protection for form submissions.
- **Experian API**: Credit checks (ECV) and Business Rules Engine (BRE).
- **Karix OTP API**: SMS OTP generation, validation, and regeneration.

### Frontend Libraries
- Radix UI, shadcn/ui, TanStack React Query, Zod, Recharts, embla-carousel, react-day-picker, Lucide React.

### Backend Libraries
- Mongoose, Helmet, Winston, express-rate-limit, Axios.

### Build & Dev Tools
- Vite, esbuild, Drizzle Kit, TypeScript.
