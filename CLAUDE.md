# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

Essential commands for development:

- `npm run dev` - Start Next.js development server
- `npm run build` - Build the application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run Jest tests
- `npm run test:security` - Run security tests

## Tech Stack & Architecture

This is a Next.js 14 App Router application with the following stack:

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components, DaisyUI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Email**: Resend
- **Testing**: Jest
- **Deployment**: Configured for Vercel

## Project Structure

```
app/                    # Next.js App Router pages
├── api/               # API routes
├── dashboard/         # Protected dashboard pages
├── auth/             # Authentication pages
└── layout.tsx        # Root layout with security headers

components/            # React components
├── ui/               # Shadcn UI components
├── sections/         # Page sections (hero, rankings, etc.)
├── dashboard/        # Dashboard-specific components
└── lessons/          # Lesson booking components

libs/                 # Core services and utilities
├── supabase/         # Supabase client configurations
├── api.ts           # API client
├── resend.ts        # Email service
└── rate-limiter.ts  # Rate limiting

types/               # TypeScript type definitions
hooks/               # Custom React hooks
middleware.ts        # Security headers and CSP
config.ts           # App configuration
```

## Security Implementation

This app implements comprehensive security measures:

- **Content Security Policy (CSP)** with nonces for inline scripts
- **HTTP Security Headers** (HSTS, X-Frame-Options, etc.) via middleware
- **Rate limiting** for API endpoints
- **Supabase RLS policies** for database security

Security headers are centralized in `middleware.ts`. For inline scripts, use the nonce from headers:

```tsx
import { headers } from "next/headers";

const nonce = headers().get("x-nonce") ?? undefined;
```

## Database & API

- Uses Supabase for authentication and database
- API routes in `app/api/` with rate limiting
- Database schema available in `docs/db_schema.sql`
- Supabase client setup in `libs/supabase/`

## Key Features

- **Tournament Management**: Events, matches, player rankings
- **Lesson Booking**: Court scheduling and booking system
- **User Dashboard**: Profile management and statistics
- **Admin Panel**: Tournament and user administration
- **PWA Support**: Service worker and manifest for mobile

## Development Patterns

- Use Supabase client from `libs/supabase/client.ts`
- Follow existing component patterns in `components/ui/`
- Implement rate limiting for new API endpoints
- Use React Query for data fetching (via `@tanstack/react-query`)
- Follow the existing authentication flow with Supabase

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL` (for security headers)

## Testing

- Jest configuration in `jest.config.js`
- Security tests in `__tests__/security.test.ts`
- Rate limiter tests in `__tests__/rate-limiter.test.ts`
- Run `npm run test:security` for security validation