# Optimization Roadmap

This file is the working improvement roadmap for the `weR1` system.

Purpose:

- Track quality, security, reliability, maintainability, and scalability work alongside feature development
- Keep a shared source of truth for what is done, what is pending, and what should be prioritized next
- Make it easy to continue from this plan in future sessions

How to use this file:

- When a task is completed, strike it through instead of deleting it
- If a task changes scope, update the wording rather than replacing the whole section
- Add notes or links to related files when useful
- Keep pending items visible so they can be planned into future work

Example update style:

- `~~Add server-side validation for tutor form~~`
- `Add E2E regression test coverage for tutor search`

## Current Strategy

We will not try to do everything at once.

Instead, we will work in parallel across:

- Ongoing frontend development
- Ongoing backend development
- Incremental optimization and quality improvements

This means the roadmap should be treated as a living checklist, not a one-time cleanup exercise.

## Target Quality Levels

Current approximate average maturity after first hardening pass:

- Around `6.5/10` to `7/10`

Target levels:

- `8/10`: solid production-ready baseline with reliable testing, maintainable structure, and stronger UX/accessibility
- `9/10`: strong engineering maturity with better privacy, observability, automation, and scale-readiness

## Work Phases

## Phase 1: Immediate Foundation

Goal:

- Preserve current functionality
- Continue safe hardening
- Build a dependable development workflow

Items:

- [x] Prevent stored XSS in rendered tutor and requirement data
- [x] Validate form submissions server-side before writing to Sheets
- [x] Show form success only after confirmed backend success
- [x] Add baseline functionality documentation
- [x] Add initial QA/security validation test coverage
- [ ] Add a release checklist for future deployments
- [ ] Add a small developer setup guide for sheet schema, Apps Script deployment, and config values
- [ ] Add a manual smoke-test checklist to run after every meaningful change

## Phase 2: Reach 8/10

Goal:

- Improve maintainability, regression safety, UX quality, and accessibility without changing the core product behavior

Items:

- [ ] Split `app.js` into smaller frontend modules by responsibility
- [ ] Separate data-fetching, rendering, filtering, and form submission logic
- [ ] Add automated regression tests for tutor search and filters
- [ ] Add automated tests for requirements board rendering and status grouping
- [ ] Add automated tests for tutor and requirement submission success/failure flows
- [ ] Improve form error handling from browser alerts to inline user-friendly messages
- [ ] Add consistent loading, empty, and retry states across pages
- [ ] Improve modal accessibility:
- [ ] Keyboard focus trap
- [ ] Escape key close
- [ ] Focus return to trigger button
- [ ] Better accessible labels and states
- [ ] Review and improve color contrast and keyboard navigation
- [ ] Add duplicate-submission protection beyond button disabling
- [ ] Add CI automation for syntax checks and test runs
- [ ] Add clearer configuration management for URLs and environment-dependent settings

## Phase 3: Reach 9/10

Goal:

- Improve security model, production operations, privacy posture, and scale-readiness

Items:

- [ ] Move tutor directory search/filtering to the backend so the full dataset is not exposed on first load
- [ ] Revisit public exposure of email and phone numbers and define a safer contact model
- [ ] Add anti-spam or bot protection for public submission forms
- [ ] Add logging and operational monitoring for backend failures
- [ ] Add structured error reporting for frontend and backend issues
- [ ] Add stronger schema controls and safer row/header mapping in Apps Script
- [ ] Add larger-dataset performance review and rendering optimization if needed
- [ ] Add staging vs production deployment guidance
- [ ] Add admin/approval workflow hardening if the product grows beyond simple sheet moderation

## Ongoing Development Rules

While continuing feature work, we should follow these rules:

- Do not break current user-visible functionality unless explicitly intended
- Prefer small, reversible improvements
- Add tests whenever behavior is changed
- Update `functionality.md` when functionality changes
- Update this file when optimization tasks are completed or reprioritized
- Keep security, accessibility, and testability in scope during new feature work

## Recommended Execution Order

Best near-term order:

1. Developer setup and release documentation
2. Manual smoke checklist
3. Frontend refactor of `app.js`
4. Regression test expansion
5. Better form UX and accessibility
6. CI automation
7. Backend search/privacy improvements
8. Monitoring, anti-spam, and deployment maturity

## What Can Be Done Directly

These are items I can implement directly in this repo:

- Frontend refactoring
- Backend Apps Script hardening
- Test creation and expansion
- Accessibility improvements
- UX improvements for forms and error handling
- Documentation updates
- CI workflow setup
- Performance review and code-level optimizations

## What May Need Your Help

These items may require deployment access, platform decisions, or external services:

- Redeploying Apps Script changes to production
- Validating against live Google Sheets/App Script environments
- Anti-bot integrations like CAPTCHA
- Production monitoring/alerting setup
- Access-control or admin workflow changes tied to real accounts or permissions

## Current Next Actions

Recommended next batch:

- [ ] Add `README` or setup/deployment documentation
- [ ] Add a manual smoke/regression checklist document
- [ ] Start modular refactor of `app.js`
- [ ] Add broader automated regression coverage for current flows

## Progress Log

Use this section for short dated notes when needed.

- `2026-04-19`: Added initial optimization roadmap and phased quality plan
- `2026-04-19`: Fixed deployment ID mismatch, removed `clasp push -f` to respect `.claspignore`, excluded `app.js` from Apps Script push (caused `ReferenceError: window is not defined`), verified new deployment ID works via curl
- `2026-04-19`: Updated documentation to reflect correct deployment workflow
