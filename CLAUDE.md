
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

## Comprehensive Analysis & Implementation Workflow

This section defines a complete workflow for analyzing requirements, making implementation decisions, and automatically orchestrating specialized agents to execute the work.

### Phase 1: Codebase Discovery & Analysis

When receiving a new feature request or bug report, follow this systematic approach:

1. **Codebase Scanning**
   - Scan all files in `app/`, `components/`, `libs/`, `docs/`, and root-level files
   - Index all README.md files for feature documentation
   - Catalog existing API endpoints in `app/api/`
   - Review database schema in `docs/db_schema.sql` and migration files
   - Examine existing component patterns and hooks

2. **Documentation Analysis**
   - Search `docs/` for relevant design documents, migration plans, and API specifications
   - Review feature-specific README.md files in component folders
   - Check for existing similar implementations or patterns
   - Identify security considerations and rate limiting requirements

### Phase 2: Sequential Reasoning & Decision Making

Use the sequential reasoning tool to systematically analyze the request:

1. **Requirement Classification**
   - Categorize as: feature enhancement, bug fix, refactor, or new feature
   - Identify scope: frontend-only, backend-only, or fullstack
   - Determine complexity: simple, moderate, or complex

2. **Impact Analysis**
   - **Frontend Impact**: Changes to components, pages, styling, or user interactions
   - **Backend Impact**: API routes, database queries, authentication, or business logic
   - **Database Impact**: Schema changes, migrations, new tables, or RLS policies
   - **Security Impact**: Authentication flow, authorization, data validation, or CSP

3. **Agent Requirements Decision Tree**
   ```
   IF frontend-impact OR UI/UX changes OR responsive design OR accessibility
   THEN require frontend-critic-implementer agent
   
   IF database-impact OR schema changes OR RLS policies OR migrations
   THEN require supabase-db-modifier agent
   
   IF complex fullstack feature OR architectural decisions OR multiple domains
   THEN require app-architect agent as orchestrator
   
   IF general development OR single-domain tasks
   THEN require general-purpose agent
   ```

4. **File Modification Planning**
   - List specific files to be created, modified, or deleted
   - Identify dependencies between changes
   - Plan the sequence of modifications to avoid conflicts

### Phase 3: Implementation Plan Generation

Create a detailed implementation plan using this template structure:

```markdown
# Implementation Plan: [FEATURE_NAME]

## Summary
- **Type**: [feature/bug/refactor]
- **Complexity**: [simple/moderate/complex]
- **Estimated Time**: [hours/days]
- **Agents Required**: [list of specialized agents]

## Requirements Analysis
- **Frontend Changes**: [yes/no with details]
- **Backend Changes**: [yes/no with details]
- **Database Changes**: [yes/no with details]
- **Security Considerations**: [list any security implications]

## Sequential Implementation Steps
[Ordered list of implementation steps with agent assignments]

## File Modification Plan
- **Files to Create**: [list with reasons]
- **Files to Modify**: [list with specific changes]
- **Files to Delete**: [list with reasons]

## Agent Task Breakdown
[Detailed tasks for each specialized agent]

## Acceptance Criteria
[Specific criteria for completion verification]

## Testing Strategy
[Testing approach for the changes]

## Risk Assessment
[Potential risks and mitigation strategies]
```

### Phase 4: Implementation Plan Presentation

1. **Plan Review**
   - Present the complete implementation plan to the user
   - Highlight key decisions, risks, and dependencies
   - Request explicit approval before proceeding

2. **User Approval Gate**
   - Wait for explicit user confirmation: "APPROVED" or similar
   - Address any questions or requested modifications
   - Do not proceed without clear approval

### Phase 5: Automated Agent Orchestration

Once approved, automatically launch the required specialized agents:

1. **Agent Coordination**
   - Launch agents in the correct sequence based on dependencies
   - Pass detailed task specifications to each agent
   - Monitor progress and handle inter-agent communication

2. **Quality Assurance**
   - Run TypeScript compilation checks
   - Execute relevant test suites

### Playwright MCP requirement (mandatory)

- Before starting any UI implementation: run the Playwright MCP to capture the current styling and UI state. This ensures you have a visual baseline of the application prior to changes.
- After completing the implementation: run the Playwright MCP again to validate that the styling and layout changes are correct and no regressions were introduced.
- The Playwright MCP checks are compulsory for any change that affects UI, styling, layout, or responsive behavior.
- The application server for Playwright checks is always running at http://172.25.192.1:3000 — use this URL when pointing Playwright to the live app during MCP runs.
   - Perform security validation
   - Conduct Playwright tests for frontend changes

3. **Documentation Updates**
   - Update relevant README.md files
   - Create or update migration documentation
   - Update API documentation if applicable

### Phase 6: Verification & Reporting

1. **Change Validation**
   - Verify all acceptance criteria are met
   - Confirm no regressions were introduced
   - Validate security measures remain intact

2. **Implementation Summary**
   - Generate a summary of all changes made
   - List any remaining manual tasks
   - Provide recommendations for follow-up work

### Agent Task Templates

#### Frontend-Critic-Implementer Tasks
```markdown
## Frontend Tasks for [AGENT_NAME]
- [ ] Component analysis and improvement recommendations
- [ ] UI/UX implementation with accessibility compliance
- [ ] Responsive design verification across devices
- [ ] Performance optimization for client-side code
- [ ] Integration with existing design system
- [ ] Playwright test creation and execution
```

#### Supabase-DB-Modifier Tasks
```markdown
## Database Tasks for [AGENT_NAME]
- [ ] Schema design and migration creation
- [ ] RLS policy implementation and testing
- [ ] Database function and trigger setup
- [ ] Data migration and validation scripts
- [ ] Performance optimization for queries
- [ ] Security audit of database changes
```

#### App-Architect Tasks
```markdown
## Architecture Tasks for [AGENT_NAME]
- [ ] System design and component interaction planning
- [ ] Cross-domain integration coordination
- [ ] Performance and scalability analysis
- [ ] Security architecture review
- [ ] API design and endpoint planning
- [ ] Testing strategy coordination across domains
```

### Implementation File Storage

All implementation plans are stored in `claude/[FEATURE_NAME].md` with:
- Timestamped creation and approval dates
- Complete task breakdown for each agent
- Progress tracking and completion status
- Links to related documentation and resources

### Emergency Procedures

1. **Implementation Rollback**
   - If critical issues arise, immediately halt agent execution
   - Provide rollback instructions for any completed changes
   - Create incident report with lessons learned

2. **Agent Failure Handling**
   - If an agent fails, assess impact on other agents
   - Provide manual completion instructions
   - Update implementation plan with alternative approaches

This workflow ensures systematic, safe, and comprehensive implementation of features while maintaining code quality and security standards.