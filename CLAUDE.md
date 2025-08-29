
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


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

## Important Development Notes

- Development server is expected to be always running for frontend work. Do not attempt to start or restart the development server from automated agents or scripts; assume it is already running at http://localhost:3000 for visual validation and Playwright checks.

## Components Folder Structure Rules (project-wide)

Follow these mandatory rules when creating or modifying UI components:

1. The `app/` folder contains only pages. Pages must remain short and minimal. All business/UI logic must be extracted into components.

2. The `components/` folder (never inside `app/`) contains one folder per page or feature. Example layout:

```
components/
	tournaments/
		hooks/
		ui/
		README.md
	hooks/
	ui/
	README.md
```

3. Inside each page’s components folder:
	 - `hooks/`: custom hooks only (one hook per file).
	 - `ui/`: visual components only (one component per file).
	 - `README.md`: must exist and be updated with information about the folder's purpose and components.

4. No mixing concerns: hooks and components must live in their respective subfolders. Keep files small and focused.

5. README.md is mandatory for each page’s component folder and should be updated whenever changes are made.

6. Use TypeScript and follow the project's styling and organization patterns (Tailwind CSS, shadcn/ui where applicable).

These rules are adapted from the repository's internal development instructions and should be followed by contributors and automated agents working on the frontend.

libs/                 # Core services and utilities
├── supabase/         # Supabase client configurations
├── api.ts           # API client
├── resend.ts        # Email service
└── rate-limiter.ts  # Rate limiting

types/               # TypeScript type definitions
hooks/               # Custom React hooks
middleware.ts        # Security headers and CSP
config.ts           # App configuration


## Security Implementation

This app implements comprehensive security measures:

- **Content Security Policy (CSP)** with nonces for inline scripts
- **HTTP Security Headers** (HSTS, X-Frame-Options, etc.) via middleware
- **Rate limiting** for API endpoints
- **Supabase RLS policies** for database security

Security headers are centralized in `middleware.ts`. For inline scripts, use the nonce from headers:

tsx
import { headers } from "next/headers";

const nonce = headers().get("x-nonce") ?? undefined;


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