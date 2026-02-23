# PaisaWaala - Multi-Form Personal Loan Application Platform

## Overview

PaisaWaala is a multi-form personal loan application platform that lets users instantly compare loan offers from top lenders (Poonawalla, Prefr, Mpokket, Hero Fincorp, ABFL). The platform consists of two main components:

1. **React Frontend (client/)** — A Vite-powered React app that renders embeddable loan application forms, authentication flows, and offer listing pages. These components are designed to be injected into external sites (e.g., Webflow) via script tags.

2. **Paisawalla Backend (paisawalla/backend/)** — A separate Express + MongoDB API server (runs on port 3001) that handles leads, applications, BRE (Business Rules Engine), eligibility checks, offers, analytics, and authentication.

3. **Express Dev Server (server/)** — A thin Express shell that serves the Vite dev frontend and proxies `/api/*` requests to the Paisawalla backend on port 3001. This is NOT the real backend — it's just a development proxy.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (client/)

- **Framework**: React with TypeScript/JSX, bundled by Vite
- **UI Components**: shadcn/ui (new-york style) with Radix UI primitives, Tailwind CSS for styling
- **State Management**: TanStack React Query for server state; React hooks for local state
- **Design System**: Custom design tokens in `client/src/design-system/tokens.js`, CSS variables for theming (light/dark mode support), Manrope font family
- **Forms**: Three form variants (form1: 6-step personal loan, form2: 2-step quick eligibility, form3: 1-step complete application), each with JSON schema definitions and Zod validation
- **Embeddable Architecture**: Scripts in `client/src/embed/` (injectForm.js, injectAuth.js, injectFormWithAuth.js, injectOffers.js) allow forms to be embedded on external sites via `<script>` tags with data attributes for configuration. Styles are scoped via `.pw-form-container` to prevent CSS leakage.
- **Offers Pages**: Two versions (v1 and v2) for displaying loan offers with filters, EMI calculators, and comparison features
- **API Client**: Axios-based client in `client/src/utils/apiClient.js` with retry logic, session tracking, and configurable base URL (supports both `VITE_API_BASE_URL` env var and `window.VITE_API_BASE_URL` for embeds)
- **Utilities**: Form persistence (localStorage with 24hr TTL), analytics tracking with UTM params, polling helpers, reCAPTCHA integration, query parameter encoding for auth flows
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend (paisawalla/backend/)

- **Framework**: Express.js (ES modules)
- **Database**: MongoDB via Mongoose
- **Key Routes**: Leads, Applications, BRE (Business Rules Engine), Offers, Partners, Analytics, Auth (phone OTP), ECV (Employment/Credit Verification), Lender Eligibility
- **Security**: Helmet, CORS, rate limiting, input sanitization, reCAPTCHA verification
- **Logging**: Winston logger
- **Port**: 3001 (separate from the dev server)
- **Seed Data**: Test variants for offers flow testing, lender data seeding from CSV files

### Dev Server (server/)

- **Purpose**: Development-only proxy server. Proxies `/api/*` to the Paisawalla backend (port 3001) using `http-proxy-middleware`.
- **Vite Integration**: `server/vite.ts` sets up Vite dev middleware for HMR. **DO NOT MODIFY** this file.
- **Storage**: `server/storage.ts` has an in-memory user storage implementation — this is template boilerplate and not actively used by the application. The real data lives in MongoDB.
- **Static Serving**: In production, serves built files from `dist/public/`

### Shared (shared/)

- **Schema**: Drizzle ORM schema in `shared/schema.ts` defines a basic `users` table with PostgreSQL. This is boilerplate from the template and not the primary data store — MongoDB is the real database. The Drizzle/Postgres schema exists but may not be actively used.
- **Database Config**: `drizzle.config.ts` points to PostgreSQL via `DATABASE_URL` env var

### Build System

- **Client Build**: Vite builds to `dist/public/`
- **Server Build**: esbuild bundles server code to `dist/index.cjs`, with key deps bundled to reduce cold start syscalls
- **Build Command**: `npm run build` runs both client and server builds via `script/build.ts`
- **Dev Command**: `npm run dev` starts the Express dev server with Vite middleware

### Key Design Decisions

1. **Embeddable-First Architecture**: The forms are designed to be injected into any website via script tags. This drives the scoped CSS approach and the configurable API URL pattern (data attributes on script tags).

2. **Dual Database Pattern**: PostgreSQL (via Drizzle) exists in the shared schema as template infrastructure, but MongoDB (via Mongoose) is the actual production database for all business logic. Don't be confused by the Drizzle setup — the real data flows through the Paisawalla backend's MongoDB.

3. **Proxy Architecture**: The dev server doesn't implement API logic — it proxies everything to the separate backend. This means both servers must be running during development.

4. **Form Schema-Driven Rendering**: Forms use JSON schemas with dynamic rendering (DynamicForm, FieldRenderer components), allowing flexible form configurations without code changes.

## External Dependencies

### Third-Party Services
- **Google reCAPTCHA v3**: Bot protection on form submissions. Site key configured via `VITE_RECAPTCHA_SITE_KEY` env var or script data attributes.
- **Google Fonts**: Manrope, Inter, Open Sans loaded from Google Fonts CDN

### Databases
- **MongoDB**: Primary database for all business data (leads, applications, offers, lenders, analytics). Connected via `MONGODB_URI` env var in the Paisawalla backend.
- **PostgreSQL**: Referenced in Drizzle config via `DATABASE_URL` env var. Used for the shared schema's users table (template boilerplate). May or may not be actively provisioned.

### Key NPM Dependencies
- **Frontend**: React, Vite, TanStack React Query, Radix UI, shadcn/ui, Tailwind CSS, Axios, Zod, react-hook-form, class-variance-authority, date-fns, embla-carousel, recharts, vaul (drawer), cmdk (command palette)
- **Backend**: Express, Mongoose, Helmet, Winston, express-rate-limit, Axios, dotenv
- **Build**: esbuild, tsx, drizzle-kit

### Deployment
- **Frontend**: Designed for AWS Amplify (see `client/DEPLOY.md`), builds to `dist/public/`
- **Backend**: Designed for AWS EC2 with PM2 (see `paisawalla/backend/DEPLOY.md`)
- **Embed CDN**: Production embeds served from `app-paisawalla.gofo.app`, API from `api-paisawalla.gofo.app`

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (for Drizzle)
- `MONGODB_URI` — MongoDB connection string (for Paisawalla backend)
- `VITE_API_BASE_URL` — API base URL for frontend
- `VITE_RECAPTCHA_SITE_KEY` — Google reCAPTCHA v3 site key
- Various backend env vars configured in `paisawalla/backend/.env`