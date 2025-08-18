# Padel Segrià

A modern padel tournament management platform built with Next.js, Supabase, and security-first principles.

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

1. Follow the [Get Started Tutorial](https://shipfa.st/docs) to clone the repo and run your local server 💻

<sub>**Looking for the /pages router version?** Use this [documentation](https://shipfa.st/docs-old) instead</sub>

2. Follow the [Ship In 5 Minutes Tutorial](https://shipfa.st/docs/tutorials/ship-in-5-minutes) to learn the foundation and ship your app quickly ⚡️

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

-   [📚 Documentation](https://shipfa.st/docs)
-   [🔒 Security Documentation](./docs/SECURITY.md)
-   [📣 Updates](https://shipfast.beehiiv.com/)
-   [🧑‍💻 Discord](https://shipfa.st/dashboard)
-   [🥇 Leaderboard](https://shipfa.st/leaderboard)
 -   [✅ Project Testing (Jest)](./docs/testing.md)
 -   [🛡️ Rate Limiting Docs](./docs/rate-limiting.md)

## Support

Reach out at hello@shipfa.st

Let's ship it, FAST ⚡️

\_

**📈 Grow your startup with [DataFast](https://datafa.st?ref=shipfast_readme)**

-   Analyze your traffic
-   Get insights on your customers
-   Make data-driven decisions

ShipFast members get 30% OFF on all plans! 🎁

![datafast](https://github.com/user-attachments/assets/2a9710f8-9a39-4593-b4bf-9ee933529870)
