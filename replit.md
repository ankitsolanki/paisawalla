# PaisaWaala - Multi-Form Personal Loan Application Platform

## Overview

PaisaWaala is a multi-form personal loan application platform that lets users instantly compare loan offers from top lenders (Poonawalla, Prefr, Mpokket, Hero Fincorp, ABFL). The platform has two main directories:

1. **client/** — Frontend React app (Vite-powered) with embeddable loan forms, authentication, and offer listing pages
2. **server/** — Backend Express server with API logic (MongoDB), dev server infrastructure (Vite middleware), and all server-side code

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (client/)

- **Framework**: React with TypeScript/JSX, bundled by Vite
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives, Tailwind CSS for styling
- **Custom Components**: Custom UI components in `client/src/components/ui/` prefixed with `Custom` (CustomButton.jsx, CustomInput.jsx, CustomSelect.jsx) to avoid filename conflicts with shadcn components (button.tsx, input.tsx, select.tsx)
- **State Management**: TanStack React Query for server state; React hooks for local state
- **Design System**: Custom design tokens in `client/src/design-system/tokens.js`, CSS variables for theming (light/dark mode support), Manrope font family
- **Forms**: Three form variants (form1: 6-step personal loan, form2: 2-step quick eligibility, form3: 1-step complete application), each with JSON schema definitions and Zod validation
- **Embeddable Architecture**: Scripts in `client/src/embed/` allow forms to be embedded on external sites via `<script>` tags with data attributes. Styles are scoped via `.pw-form-container` to prevent CSS leakage.
- **Offers Pages**: Two versions (v1 and v2) for displaying loan offers with filters, EMI calculators, and comparison features
- **API Client**: Axios-based client in `client/src/utils/apiClient.js` with retry logic, session tracking, and configurable base URL
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`, `@assets/` maps to `attached_assets/`

### Backend (server/)

- **API Code**: `server/api/` contains all backend business logic (Express.js, ES modules)
  - `server/api/app.js` — Main API router setup, exports `apiRouter` and `initializeBackend()`
  - `server/api/controllers/` — Business logic (leads, applications, BRE, eligibility, offers, analytics, auth)
  - `server/api/models/` — MongoDB/Mongoose schemas (Lead, Application, Offer, Lender, etc.)
  - `server/api/routes/` — API route definitions
  - `server/api/services/` — External integrations (Experian ECV, Karix OTP, rule engines)
  - `server/api/middleware/` — Error handling, rate limiting, input sanitization, request logging
  - `server/api/config/` — Database connection, environment validation, security config
  - `server/api/seeds/` — Database seeding scripts (lender data, test data)
  - `server/api/utils/` — Logger, API logger, response builder
- **Dev Server Infrastructure**: 
  - `server/index.ts` — Main entry point, starts Express server on port 5000
  - `server/routes.ts` — Mounts API router at `/api` and initializes backend
  - `server/vite.ts` — Vite dev middleware for HMR. **DO NOT MODIFY**
  - `server/static.ts` — Production static file serving from `dist/public/`
- **Database**: MongoDB via Mongoose, connected via `MONGODB_URI` env var
- **Security**: Helmet, CORS, rate limiting, input sanitization, reCAPTCHA verification
- **Logging**: Winston logger

### Shared (shared/)

- Minimal Drizzle ORM schema (`shared/schema.ts`) — template boilerplate, not the primary data store. MongoDB is the real database.
- Referenced by `drizzle.config.ts` and `vite.config.ts` (do not remove)

### Build System

- **Client Build**: Vite builds to `dist/public/`
- **Server Build**: esbuild bundles server code to `dist/index.cjs` via `script/build.ts`
- **Build Command**: `npm run build`
- **Dev Command**: `npm run dev` starts the Express server with Vite middleware on port 5000

### Key Design Decisions

1. **Unified Server**: The backend API and dev server run in a single process on port 5000. API routes are mounted at `/api` via an Express router. No child processes or proxies needed.

2. **Embeddable-First Architecture**: Forms are designed to be injected into any website via script tags, driving the scoped CSS approach and configurable API URL pattern.

3. **MongoDB as Primary Database**: All business data (leads, applications, offers, lenders, analytics) lives in MongoDB. The Drizzle/PostgreSQL setup in `shared/` is template boilerplate.

4. **Form Schema-Driven Rendering**: Forms use JSON schemas with dynamic rendering, allowing flexible form configurations without code changes.

## External Dependencies

### Third-Party Services
- **Google reCAPTCHA v3**: Bot protection on form submissions
- **Experian**: Credit verification (ECV) and BRE services
- **Karix**: OTP delivery

### Databases
- **MongoDB**: Primary database for all business data. Connected via `MONGODB_URI` env var.
- **PostgreSQL**: Referenced in Drizzle config via `DATABASE_URL` env var (template boilerplate)

### Key NPM Dependencies
- **Frontend**: React, Vite, TanStack React Query, Radix UI, shadcn/ui, Tailwind CSS, Axios, Zod, react-hook-form
- **Backend**: Express, Mongoose, Helmet, Winston, express-rate-limit, Axios, dotenv
- **Build**: esbuild, tsx, drizzle-kit

### Environment Variables
- `MONGODB_URI` — MongoDB connection string
- `VITE_API_BASE_URL` — API base URL for frontend
- `VITE_RECAPTCHA_SITE_KEY` — Google reCAPTCHA v3 site key
- `RECAPTCHA_SECRET_KEY` — reCAPTCHA server-side secret
- `EXPERIAN_CLIENT_ID`, `EXPERIAN_CLIENT_SECRET`, `EXPERIAN_USERNAME`, `EXPERIAN_PASSWORD` — Experian ECV credentials
- `EXPERIAN_BRE_CLIENT_ID`, `EXPERIAN_BRE_CLIENT_SECRET`, `EXPERIAN_BRE_USERNAME`, `EXPERIAN_BRE_PASSWORD` — Experian BRE credentials
