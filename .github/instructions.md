# Padel Segria - Project Instructions

## Overview
Padel Segria is a web platform for managing padel tournaments across the Segria province in Spain. The platform allows users to view tournaments, rankings, and manage their personal statistics.

## Development Priorities
- **Phase 1 (Current Focus)**: Develop the landing page with all its sections
- **Phase 2**: Implement user authentication and personal area features
- **Phase 3**: Complete backend functionality and database integration

The initial development should focus on creating an engaging and responsive landing page, with backend features considered secondary and subject to future modifications.

## Project Structure

```
web/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   │   ├── contact/        # Contact form API
│   │   └── user/           # User data API endpoints
│   ├── dashboard/          # Personal area for logged-in users
│   │   ├── highlights/     # User highlights page
│   │   ├── performance/    # User performance statistics
│   │   ├── rankings/       # User rankings view
│   │   └── settings/       # User settings
│   └── (site)/             # Public website pages
│       ├── events/         # Upcoming tournaments
│       ├── players/        # Players directory
│       └── rankings/       # Public rankings
├── components/             # Shared components
│   ├── dashboard/          # Personal area components
│   ├── layout/             # Layout components (Header, Footer, etc)
│   ├── sections/           # Main page sections components
│   │   ├── hero/           # Hero section components
│   │   ├── contact/        # Contact section components
│   │   ├── events/         # Events section components
│   │   ├── players/        # Top players section components
│   │   └── rankings/       # Rankings section components
│   └── ui/                 # shadcn UI components
├── lib/                    # Utility functions and shared logic
│   ├── email/              # Email sending utilities
│   ├── statistics/         # Statistics calculation logic
│   └── validators/         # Form validation schemas
└── public/                 # Static assets
```

## Design System

### Colors
- Primary: #e5f000 (Bright Yellow)
- Secondary: #051c2c (Dark Navy Blue)
- Use shadcn's theming system for consistent application of these colors

### Components
- Use shadcn components exclusively for UI elements
- Extend shadcn components when necessary rather than creating new component types
- Follow the component structure documented in the shadcn documentation

## Page Sections

### Landing Page

#### Header
- Implement using shadcn navigation component
- Include links to main sections
- Add login/register buttons for accessing the personal area

#### Hero Section
- Full-width banner with engaging headline and call-to-action
- Include a featured upcoming tournament
- Use shadcn card component for featured content

#### Top Players
- Display top 3 players with their avatars, names, and key stats
- Use shadcn avatar and card components
- Implement a "View All" link to the full rankings

#### Rankings
- Show global rankings in a compact table
- Highlight user's own position when logged in
- Use shadcn table component with pagination

#### Contact Form ("Contacta'ns")
- Implement form with name, email, subject, and message fields
- Use shadcn form components with proper validation
- Include reCAPTCHA integration to prevent spam

#### Upcoming Events/Tournaments
- Display in card grid format with date, location, and registration status
- Use shadcn card component with hover effects
- Include filtering options by date and location

### Personal Area

#### Dashboard
- Overview of user's statistics and upcoming tournaments
- Include notifications for new achievements or tournament registrations
- Use shadcn card components for different info sections

#### Performance Statistics
- Chart showing performance over time
- Table with detailed match statistics
- Use shadcn components for data visualization

#### Highlights
- Display special achievements and notable plays
- Include media (images/videos) when available
- Use shadcn card and badge components

#### User Rankings
- Show personal ranking in different categories
- Compare with previous periods
- Use shadcn progress and badge components

## API Implementation

### Contact Form
- Implement an API route at `/api/contact` for form submission
- Use email service (Resend.com) to deliver messages to admin email
- Include proper validation and rate limiting

### User Statistics
- Implement CRUD operations at `/api/user/statistics`
- Only tournament managers can create/edit statistics
- Regular users can only view their statistics

### Rankings
- Implement read operations at `/api/rankings`
- Calculate rankings periodically using a background job
- Cache results for improved performance

## Authentication and Authorization

- Use NextAuth.js for authentication
- Implement role-based access control:
  - Visitors: Can view public content
  - Registered Users: Can access personal area
  - Tournament Managers: Can edit player statistics
  - Admins: Full access to all features

## Development Guidelines

### State Management
- Use React hooks for local state
- For global state, use Context API or Zustand

### API Requests
- Use React Query for data fetching and caching
- Implement proper loading and error states

### Performance Optimization
- Implement code-splitting for large page components
- Use Next.js Image component for optimized images
- Cache API responses when appropriate

### Testing
- Write unit tests for utility functions and components
- Implement integration tests for key user flows
- Use Cypress for end-to-end testing

## Database

- Use **Supabase** as the database and backend service
- Implement tables for users, players, tournaments, matches, statistics, and highlights
- Leverage Supabase authentication for user management
- Use Supabase storage for media files (player photos, highlight videos)

Note: While the database structure is outlined here, initial development should focus on the landing page UI. Database implementation and backend functionality are considered secondary priorities and may be subject to future modifications.

## Deployment

- Deploy on Vercel for optimal Next.js support
- Set up proper environment variables for production
- Configure monitoring and error tracking

## Additional Resources

- Design mockups: [Figma Link]
- API documentation: [Swagger Link]
- shadcn UI documentation: [Link to shadcn docs]
- Supabase documentation: [https://supabase.com/docs]
