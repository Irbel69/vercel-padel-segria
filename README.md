# Padel Segrià

A modern pàdel tournament management platform built with Next.js, Supabase, and security-first principles.

## 🔒 Security Implementation

This application implements comprehensive HTTP security headers and strict Content Security Policy (CSP) for production-ready security:

### Security Headers Included
- **Content Security Policy (CSP)** - Strict policy with nonces for inline scripts
- **X-Frame-Options** - Prevents clickjacking attacks
- **X-Content-Type-Options** - Prevents MIME sniffing
- **Referrer-Policy** - Controls referrer information leakage
- **Permissions-Policy** - Restricts browser features
- **Cross-Origin Policies** - Controls resource sharing and isolation
- **Strict-Transport-Security** - Forces HTTPS in production

### Supported Third-Party Services
- ✅ **Supabase** - Authentication and database
- ✅ **Crisp** - Customer support chat
- ✅ **Google Fonts** - Typography (Inter font)
- ✅ **Resend** - Email services
- ✅ **Vercel** - Hosting and analytics
- ✅ **Next.js Image** - Optimized image loading

For detailed security configuration, see [Security Documentation](./docs/SECURITY.md).

## Get Started

1. Follow the [Get Started Tutorial](https://www.padelsegria.com/docs) to clone the repo and run your local server 💻

<sub>**Looking for the /pages router version?** Use this [documentation](https://www.padelsegria.com/docs-old) instead</sub>

2. Follow the [Ship In 5 Minutes Tutorial](https://www.padelsegria.com/docs/tutorials/ship-in-5-minutes) to learn the foundation and ship your app quickly ⚡️

## Environment Configuration

Create a `.env.local` file with your configuration:

```bash
# Required for security headers
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional - App URL for security context
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production domain

# Email service
RESEND_API_KEY=your_resend_api_key
```

## Links

-   [📚 Documentation](https://www.padelsegria.com/docs)
-   [🔒 Security Documentation](./docs/SECURITY.md)
	[📣 Updates](https://www.padelsegria.com/updates)
-   [🧑‍💻 Discord](https://www.padelsegria.com/dashboard)
-   [🥇 Leaderboard](https://www.padelsegria.com/leaderboard)
 -   [✅ Project Testing (Jest)](./docs/testing.md)
 -   [🛡️ Rate Limiting Docs](./docs/rate-limiting.md)

## Recent changes (pairs branch)

This repository contains an active feature branch that enhances event management and adds a "pair invites" flow. See the linked docs below for implementation and migration details.

- Pair invites (invite a partner by email or short code): `docs/pair-invites-implementation.md` and `docs/pair-invites-next-steps.md`
- Dashboard events refactor: React Query hooks for events and mutations (`hooks/use-events.ts`) — see `docs/dashboard-architecture.md`
- Event cover images: admin upload + storage guidance and migration (`docs/event-images.md`, `docs/migrations/2025-08-28_add_image_url_to_events.sql`) (uses `images` bucket)
- UI refactor: `EventCard` split into modular components (`components/tournaments/ui/EventCard/README.md`)

If you're reviewing the code for the "pairs" feature, start with those docs and the `app/dashboard/tournaments/page.tsx` and `hooks/use-events.ts` files.

## Support

Reach out at hello@padelsegria.com

Let's ship it, FAST ⚡️

\_

**📈 Insights & Analytics**

-   Track user engagement and tournament metrics with our built-in analytics dashboard at https://www.padelsegria.com/analytics

Contact sales for premium analytics and integrations.

---

## Playwright / E2E tests

This project includes Playwright tests under `__tests__/playwright/` for UI flows such as `complete-profile`.

Two ways to run Playwright without permanently modifying your project dependencies:

- Quick (no package.json changes): run via `npm exec` or `npx` which downloads the CLI temporarily:

```powershell
# install browsers to cache (optional, will download binaries)
npx -p @playwright/test playwright install --with-deps

# run the playwright tests in the folder (temporary package, no package.json change)
npx -p @playwright/test playwright test __tests__/playwright
```

- Project-local (recommended for CI/team): add `@playwright/test` as a devDependency and use npm scripts. This repo already contains a devDependency entry and two npm scripts:

```json
"scripts": {
	"playwright:install": "playwright install --with-deps",
	"test:e2e": "playwright test __tests__/playwright --project=chromium"
}
```

Then run:

```powershell
# install playwright and browsers locally
npm i -D @playwright/test
npm run playwright:install

# run the tests
npm run test:e2e
```

Notes:
- Playwright will download browser binaries (Chromium/Firefox/WebKit) — this does not modify package.json but stores binaries in the Playwright cache or in the path defined by `PLAYWRIGHT_BROWSERS_PATH`.
- Use `npm exec` / `npx` for one-off runs. Use the project-local installation for CI or repeated runs.

