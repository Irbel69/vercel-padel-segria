
## INTELLIGENT AGENT ORCHESTRATION SYSTEM

### Core Orchestration Philosophy

CLAUDE.md now functions as an intelligent orchestrator that:

1. **Analyzes User Requests** using sequential thinking to understand complexity and scope
2. **Determines Required Agents** based on the nature of the request
3. **Generates Detailed Task Lists** for each agent with specific, actionable instructions
4. **Coordinates Agent Workflows** to ensure proper sequencing and information sharing
5. **Manages Context Sharing** through the `context/` folder for inter-agent communication

### Agent Selection Logic

### Do not invoke any agent if the task list in the context folder is not done

Use this decision tree to determine which agents to invoke:

```
User Request Analysis:
├── Frontend/UI Changes?
│   ├── Visual Review Needed? → design-review (first)
│   ├── Implementation Required? → frontend-critic-implementer (after design-review)
│   └── Both? → design-review → frontend-critic-implementer
├── Backend/API Changes?
│   ├── Database Schema? → supabase-db-modifier
│   ├── API Endpoints? → backend
│   └── Both? → supabase-db-modifier → backend
├── Research Needed?
│   └── Best Practices/Components? → documentation-expert
├── Complex Architecture?
│   └── Multiple Domains? → app-architect (coordinator)
└── Testing Required?
    └── User Flows? → playwright-flow-tester
```

### Specialized Agents and Their Roles

#### @agent-design-review
**When to Invoke**: Before any frontend implementation, for visual audits, responsive design checks
**Purpose**: Generate comprehensive visual analysis reports using Playwright MCP
**Output**: Detailed reports in `context/design-review-YYYY-MM-DD-HH-MM.md` with screenshots and issues
**Mandatory Tasks**:
- Take screenshots across mobile (375px), tablet (768px), desktop (1440px)
- Analyze against `docs/frontend-requirements.md`
- Document overflow issues, text truncation, layout breaks
- Check WCAG 2.1 AA compliance
- Identify design system violations

#### @agent-frontend-critic-implementer  
**When to Invoke**: After design-review, for UI implementation and fixes
**Purpose**: Implement frontend changes with critical design perspective
**Dependencies**: Must read `context/design-review-*.md` reports before implementation
**Mandatory Requirements**:
- ALWAYS prioritize `components/ui` for general components (buttons, modals, forms, etc.)
- Use http://172.25.192.1:3000 for Playwright testing (never localhost)
- Follow project component structure rules
- Update README.md files in component folders
- Verify implementation with Playwright post-changes

#### @agent-supabase-db-modifier
**When to Invoke**: For database schema changes, RLS policies, functions, triggers
**Purpose**: Handle all Supabase database modifications
**Output**: Schema documentation in `docs/` and change reports in `context/backend-changes-*.md`
**Mandatory Tasks**:
- Review current schema in `docs/db_schema.sql`
- Implement proper RLS policies
- Document all changes in `docs/` folder
- Create migration scripts when needed

#### @agent-backend
**When to Invoke**: For API endpoints, server logic, external service integration
**Purpose**: Implement and modify backend functionality
**Dependencies**: Read `libs/supabase/storage.ts` and `docs/db_schema.sql`
**Mandatory Tasks**:
- Create README.md in each API route folder
- Document all endpoints with examples
- Implement proper authentication and validation
- Generate reports in `context/backend-changes-*.md`

#### @agent-documentation-expert
**When to Invoke**: When research is needed for best practices or component selection
**Purpose**: Research optimal solutions using Context7
**Output**: Research reports in `context/documentation-research-YYYY-MM-DD-topic.md`
**Focus Areas**:
- Next.js, React, TypeScript, Tailwind CSS best practices
- Shadcn/ui component research and recommendations
- Performance optimization techniques
- Accessibility implementation strategies

#### @agent-app-architect
**When to Invoke**: For complex features spanning multiple domains
**Purpose**: Coordinate multiple agents and make architectural decisions
**Role**: Acts as coordinator for complex implementations

### Orchestration Workflow

#### Phase 1: Request Analysis
```markdown
1. Use sequential thinking to analyze the user's request
2. Identify the scope: frontend, backend, database, research, or combination
3. Determine complexity level: simple, moderate, or complex
4. Map to required agents using the decision tree
```

#### Phase 2: Task Generation
```markdown
For each required agent, generate specific task lists including:
- **Context Dependencies**: What reports/files to read first
- **Specific Actions**: Detailed implementation requirements
- **Output Requirements**: What files to create/modify and where
- **Success Criteria**: How to validate completion
- **Integration Points**: How the work connects to other agents
```

#### Phase 3: Agent Coordination
```markdown
Execute agents in the correct order:
1. Research first (documentation-expert) if needed
2. Database changes (supabase-db-modifier) if needed
3. Visual analysis (design-review) for frontend work
4. Backend implementation (backend) if needed
5. Frontend implementation (frontend-critic-implementer) last
6. Testing (playwright-flow-tester) for validation
```

### Context Folder Management

The `context/` folder serves as the communication hub between agents:

```
context/
├── design-review-YYYY-MM-DD-HH-MM.md    # Visual analysis reports
├── documentation-research-YYYY-MM-DD-topic.md  # Research findings
├── backend-changes-YYYY-MM-DD-feature.md       # Backend implementation notes
└── implementation-reports/                      # General implementation logs
```

### Example Orchestration Scenarios

#### Scenario 1: "Improve the mobile responsiveness of the dashboard"
```markdown
Agent Sequence:
1. design-review → Analyze current dashboard on all breakpoints
2. frontend-critic-implementer → Read design-review report and fix issues

Task Lists:
- design-review: 
  * Navigate to http://172.25.192.1:3000/dashboard
  * Test responsive behavior at 375px, 768px, 1440px
  * Document overflow, text truncation, layout breaks
  * Generate report with screenshots and specific fixes needed
- frontend-critic-implementer:
  * Read context/design-review-[timestamp].md
  * Prioritize components/ui usage for any new components
  * Fix each issue listed in the report
  * Verify fixes with Playwright testing
```

#### Scenario 2: "Add a new user profile management feature"
```markdown
Agent Sequence:
1. documentation-expert → Research best patterns for profile management
2. supabase-db-modifier → Add/modify user profile tables and RLS
3. backend → Create profile management API endpoints  
4. frontend-critic-implementer → Implement the UI components

Task Lists:
- documentation-expert:
  * Research Next.js profile management patterns
  * Find optimal Shadcn/ui components for forms and profile display
  * Research accessibility best practices for profile forms
- supabase-db-modifier:
  * Review current user schema
  * Add profile fields if needed
  * Implement RLS for profile data
  * Document changes
- backend:
  * Create /api/user/profile endpoints (GET, PUT)
  * Implement validation and error handling
  * Create README documentation
- frontend-critic-implementer:
  * Use components/ui for form elements
  * Implement profile editing interface
  * Follow the component folder structure
  * Test with Playwright
```

### Agent Communication Protocols

1. **Sequential Execution**: Agents must execute in dependency order
2. **Context Reading**: Agents must read relevant context files before starting
3. **Report Generation**: Agents must generate reports for subsequent agents when applicable
4. **Validation**: Final agents must validate the complete implementation

### Quality Assurance Integration

- **Mandatory Playwright Testing**: All frontend changes must be verified with Playwright
- **Documentation Requirements**: All changes must be documented appropriately  
- **Security Validation**: All backend changes must include security considerations
- **Performance Verification**: Complex changes must include performance analysis

This orchestration system ensures that every request receives comprehensive, coordinated attention from the most appropriate specialists while maintaining high quality standards and clear communication between agents.