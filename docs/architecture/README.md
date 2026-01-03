# Architecture Documentation

This folder contains technical implementation documentation for key systems in EnhancedHR.ai. These documents describe **how things work** at a code level, as opposed to the PRD documents in `/docs/` which describe **what to build**.

## Purpose

Use these documents when:
- Making changes to existing systems
- Understanding how features are implemented
- Debugging issues
- Onboarding to a new area of the codebase

## Documents

| Document | Description | Last Updated |
|----------|-------------|--------------|
| [Expert_Workflow.md](./Expert_Workflow.md) | Expert signup, application, approval flow, and proposal management | Jan 2026 |

## Document Structure

Each architecture document follows a consistent structure:

1. **Overview** - What the system does
2. **User Journey** - Visual flow diagram
3. **Database Schema** - Tables and relationships
4. **File Structure** - Where code lives
5. **Key Components** - Important React components
6. **Server Actions** - Backend logic
7. **API Routes** - REST endpoints (if any)
8. **State Machine** - State transitions
9. **Admin Functionality** - Admin-specific features
10. **Common Pitfalls** - Things to watch out for
11. **Testing Checklist** - Manual verification steps
12. **SQL for Production** - Migration scripts

## Contributing

When adding new architecture docs:

1. Follow the structure above
2. Include visual diagrams where helpful (ASCII art works great)
3. List all related files
4. Document common pitfalls you've discovered
5. Add a testing checklist
6. Update this README with a link to the new doc

## Quick Reference

### Expert Workflow Files
```
src/app/(marketing)/experts/        # Landing page
src/app/(marketing)/join/expert/    # Signup
src/app/expert-application/         # Application form
src/app/admin/experts/              # Admin review
src/app/admin/proposals/            # Global proposals
src/app/actions/experts.ts          # Expert actions
src/app/actions/proposals.ts        # Proposal actions
```

### Key Database Tables
```
profiles            # User data + expert fields
course_proposals    # Course proposals
expert_credentials  # Typed credentials
admin_audit_log     # Admin action tracking
```
