# Implementation Plan Template

This template should be used for all feature implementations following the workflow defined in CLAUDE.md.

## Implementation Plan: [FEATURE_NAME]

**Created:** [TIMESTAMP]  
**Status:** [PLANNING/APPROVED/IN_PROGRESS/COMPLETED/FAILED]  
**Estimated Completion:** [DATE]

---

### Summary
- **Type:** [feature/enhancement/bug-fix/refactor/maintenance]
- **Complexity:** [simple/moderate/complex]
- **Priority:** [low/medium/high/critical]
- **Estimated Time:** [hours/days]
- **Agents Required:** [list of specialized agents needed]

### Requirements Analysis
- **Frontend Changes:** [yes/no - describe specific UI/UX changes needed]
- **Backend Changes:** [yes/no - describe API/logic changes needed]
- **Database Changes:** [yes/no - describe schema/migration changes needed]
- **Security Considerations:** [list any security implications or requirements]

### Impact Assessment
- **User-Facing Changes:** [describe what users will see differently]
- **API Changes:** [list new/modified endpoints]
- **Performance Impact:** [expected performance implications]
- **Breaking Changes:** [any backward compatibility issues]

---

### Sequential Implementation Steps

1. **Phase 1: [PHASE_NAME]**
   - [ ] Step 1.1: [detailed description]
   - [ ] Step 1.2: [detailed description]
   - Agent: [agent-name]
   - Estimated Time: [time]

2. **Phase 2: [PHASE_NAME]**
   - [ ] Step 2.1: [detailed description]
   - [ ] Step 2.2: [detailed description]
   - Agent: [agent-name]
   - Estimated Time: [time]

3. **Phase 3: [PHASE_NAME]**
   - [ ] Step 3.1: [detailed description]
   - [ ] Step 3.2: [detailed description]
   - Agent: [agent-name]
   - Estimated Time: [time]

---

### File Modification Plan

#### Files to Create
- `path/to/new/file1.ts` - [reason for creation]
- `path/to/new/file2.tsx` - [reason for creation]

#### Files to Modify
- `path/to/existing/file1.ts` - [specific changes needed]
- `path/to/existing/file2.tsx` - [specific changes needed]

#### Files to Delete
- `path/to/obsolete/file.ts` - [reason for deletion]

---

### Agent Task Breakdown

#### Frontend-Critic-Implementer Agent
**Assigned Tasks:**
- [ ] Component analysis and improvement recommendations
- [ ] UI/UX implementation with accessibility compliance
- [ ] Responsive design verification across devices
- [ ] Performance optimization for client-side code
- [ ] Integration with existing design system
- [ ] Playwright test creation and execution

**Specific Requirements:**
- Follow component structure rules in CLAUDE.md
- Maintain design system consistency
- Ensure accessibility compliance (WCAG 2.1)
- Implement responsive design for mobile-first approach

**Deliverables:**
- Updated/new components in `components/[feature]/`
- README.md updates for component documentation
- Playwright test coverage
- Performance optimization report

#### Supabase-DB-Modifier Agent
**Assigned Tasks:**
- [ ] Schema design and migration creation
- [ ] RLS policy implementation and testing
- [ ] Database function and trigger setup
- [ ] Data migration and validation scripts
- [ ] Performance optimization for queries
- [ ] Security audit of database changes

**Specific Requirements:**
- Follow existing database conventions
- Implement comprehensive RLS policies
- Create rollback migration scripts
- Optimize query performance

**Deliverables:**
- Migration SQL files in `docs/migrations/`
- Updated `docs/db_schema.sql`
- RLS policy documentation
- Performance test results

#### App-Architect Agent
**Assigned Tasks:**
- [ ] System design and component interaction planning
- [ ] Cross-domain integration coordination
- [ ] Performance and scalability analysis
- [ ] Security architecture review
- [ ] API design and endpoint planning
- [ ] Testing strategy coordination across domains

**Specific Requirements:**
- Coordinate between frontend and backend changes
- Ensure architectural consistency
- Plan for scalability and performance
- Review security implications

**Deliverables:**
- Architecture documentation
- API specification updates
- Integration test strategy
- Performance benchmarks

#### General-Purpose Agent
**Assigned Tasks:**
- [ ] Utility function implementation
- [ ] Configuration updates
- [ ] Documentation updates
- [ ] Basic API endpoint implementation
- [ ] Test suite execution and reporting

**Specific Requirements:**
- Follow existing code patterns
- Maintain code quality standards
- Update relevant documentation

**Deliverables:**
- Updated utility functions
- Configuration changes
- Test results and coverage reports

---

### Acceptance Criteria

#### Functional Requirements
- [ ] [Specific functional requirement 1]
- [ ] [Specific functional requirement 2]
- [ ] [Specific functional requirement 3]

#### Technical Requirements
- [ ] TypeScript compilation passes without errors
- [ ] All existing tests continue to pass
- [ ] New functionality has adequate test coverage (>80%)
- [ ] Security tests pass
- [ ] Performance benchmarks meet requirements

#### User Experience Requirements
- [ ] UI is responsive across devices (mobile, tablet, desktop)
- [ ] Accessibility standards met (WCAG 2.1)
- [ ] Loading states and error handling implemented
- [ ] User feedback mechanisms in place

---

### Testing Strategy

#### Unit Tests
- [ ] Component unit tests using Jest
- [ ] API endpoint unit tests
- [ ] Utility function tests
- [ ] Database function tests

#### Integration Tests
- [ ] API integration tests
- [ ] Database integration tests
- [ ] Component integration tests

#### End-to-End Tests
- [ ] User flow tests using Playwright
- [ ] Cross-browser compatibility tests
- [ ] Mobile responsiveness tests

#### Security Tests
- [ ] Authentication/authorization tests
- [ ] Input validation tests
- [ ] SQL injection prevention tests
- [ ] XSS prevention tests

#### Performance Tests
- [ ] Page load time measurements
- [ ] API response time tests
- [ ] Database query performance tests
- [ ] Memory usage analysis

---

### Risk Assessment

#### High Risk Items
- **Risk:** [Description of risk]
  - **Impact:** [potential impact]
  - **Probability:** [low/medium/high]
  - **Mitigation:** [mitigation strategy]

#### Medium Risk Items
- **Risk:** [Description of risk]
  - **Impact:** [potential impact]
  - **Probability:** [low/medium/high]
  - **Mitigation:** [mitigation strategy]

#### Dependencies
- External API availability: [description]
- Third-party library updates: [description]
- Database migration timing: [description]

---

### Rollback Plan

#### Quick Rollback (< 5 minutes)
- [ ] Revert deployment to previous version
- [ ] Disable feature flags if applicable
- [ ] Notify stakeholders

#### Database Rollback
- [ ] Execute rollback migration scripts
- [ ] Verify data integrity
- [ ] Update application configuration

#### Communication Plan
- [ ] Notify development team
- [ ] Update status page if applicable
- [ ] Prepare incident report

---

### Post-Implementation Tasks

#### Monitoring
- [ ] Set up application monitoring for new features
- [ ] Configure alerts for error rates and performance
- [ ] Monitor user adoption metrics

#### Documentation
- [ ] Update API documentation
- [ ] Update user documentation
- [ ] Create knowledge base articles

#### Follow-up Items
- [ ] Schedule performance review in 1 week
- [ ] Plan user feedback collection
- [ ] Schedule retrospective meeting

---

### Implementation Log

#### [DATE] - [TIME] - [AGENT_NAME]
**Status:** [started/completed/blocked/failed]  
**Summary:** [brief description of work completed]  
**Issues:** [any issues encountered]  
**Next Steps:** [what needs to be done next]

#### [DATE] - [TIME] - [AGENT_NAME]
**Status:** [started/completed/blocked/failed]  
**Summary:** [brief description of work completed]  
**Issues:** [any issues encountered]  
**Next Steps:** [what needs to be done next]

---

### Approval Status

- [ ] **Technical Review:** [Reviewer Name] - [Date] - [Approved/Rejected/Pending]
- [ ] **Security Review:** [Reviewer Name] - [Date] - [Approved/Rejected/Pending]
- [ ] **Product Review:** [Reviewer Name] - [Date] - [Approved/Rejected/Pending]
- [ ] **Final Approval:** [Approver Name] - [Date] - [Approved/Rejected/Pending]

**Implementation Authorization:** [PENDING/APPROVED/REJECTED]  
**Authorized By:** [Name]  
**Authorization Date:** [Date]

---

### Resources and References

- Related Documentation: [links]
- Design Mockups: [links]
- Technical Specifications: [links]
- Similar Implementations: [links]
- External Dependencies: [links]