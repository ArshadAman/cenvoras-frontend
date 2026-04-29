## Plan: SaaS Launch Readiness

### Current Implementation Status

- [x] Phase 1 plan model normalization around Free/Pro/Business (`subscription` foundation in place).
- [x] Backend feature-gate helpers added for plan-based access decisions.
- [x] Backend enforcement for locked modules via middleware.
- [x] Frontend locked-module UX with upgrade prompts (visible-but-locked pattern).
- [x] Free-plan route behavior aligned to current policy (Sales Invoices, Customers, Profile, Payments allowed; Sales Orders locked).
- [x] VIP/lifetime-free bypass implemented (no locking for VIP users).
- [x] VIP controls exposed in Django Admin (`is_lifetime_free` + bulk admin actions).
- [ ] cashfree subscription lifecycle and webhook idempotency flow.
- [ ] Dunning flow (past_due reminders, retry policy, grace handling).
- [ ] SaaS billing artifacts (subscription invoices/history/downloads).
- [ ] Cross-tenant enforcement audit across all modules (billing/inventory/reports/integration).
- [ ] RBAC hardening for sensitive write operations.
- [ ] Expanded audit trail coverage and soft-delete rollout for critical records.
- [ ] Reliability/performance hardening (background exports, cache invalidation strategy, ops alerts).
- [ ] Onboarding wizard + activation checklist.
- [ ] Product analytics funnel + pricing/GTM surfaces.

Build launch controls in phases around the current codebase: package plans and feature gates first, then subscription lifecycle and billing webhooks, then tenant safety and auditability, then performance/observability, onboarding, analytics, and GTM surfaces. The plan should reuse the existing `subscription`, `users`, `billing`, `audit_log`, `analytics`, and dashboard code instead of introducing a parallel system.

**Steps**
1. Phase 1: Define packaging and entitlement rules.
2. Normalize the plan model around `Free`, `Pro`, and `Business` in `cenvoras/subscription/models.py`, using the existing `Plan`, `Feature`, and `TenantSubscription` tables as the source of truth. Keep subscriptions anchored to the tenant user and model feature access as plan-gated capabilities rather than hardcoding UI roles. *Blocks UI gating and backend enforcement work.*
3. Add backend feature-gate helpers that answer “can this tenant use this module/action?” for inventory, analytics, integrations, dashboard insights, reports, and team management. Reuse `User.active_tenant` from `cenvoras/users/models.py` so limits are enforced at tenant scope, not per login.
4. Enforce free-tier caps in the backend for invoices/month, customers, and team users. The launch assumption from your direction is: free users may use customer management and invoice generation only, while paid modules remain locked behind upgrade prompts; Pro allows 2 team members, Business allows 5.
5. Add upgrade prompts in the frontend for locked modules and limit hits. Locked cards, reports, and forecast widgets should remain visible but disabled, with a modal or CTA that explains the benefit of upgrading rather than hiding the feature entirely.

6. Phase 2: Implement subscription lifecycle and billing.
7. Extend `TenantSubscription` and related user status fields to fully support `trial`, `active`, `past_due`, and `canceled`, with a clear grace-period path for `past_due`. Use cashfree subscriptions and webhooks as the primary billing integration, with provider-agnostic boundaries only if they do not delay launch.
8. Add webhook handlers for subscription activated, payment failed, payment retried, canceled, and reactivated states. Verify signatures, store event idempotency, and make webhook processing safe to retry.
9. Implement dunning: retry policy, reminder emails, grace-period warnings, and subscription downgrade/lockout behavior after grace expiry. Keep invoice/customer access rules explicit so users know what happens before and after the grace window.
10. Add internal SaaS billing artifacts: invoices for your own subscription charges, tax-compliant for India if required, plus payment history and downloadable invoice records for customers.

11. Phase 3: Harden tenant safety and record integrity.
12. Audit every API in billing, inventory, analytics, integrations, and reports to ensure it is scoped through `request.user.active_tenant` or equivalent tenant filter. This is especially important for list endpoints, detail endpoints, and bulk operations.
13. Add RBAC hardening for sensitive actions such as bulk delete, ledger changes, stock adjustments, and returns. Use the existing `role` and `permissions` fields in `cenvoras/users/models.py` for action-level checks rather than assuming all authenticated users can mutate finance data.
14. Add audit-trail coverage for financial and inventory mutations using `cenvoras/audit_log/models.py` so create/update/delete actions capture before/after state, user snapshot, and IP address.
15. Introduce soft-delete and recovery for critical records first: invoices, payments, customers, products, stock moves, returns, and subscription records. Keep physical delete only where cleanup is safe and business rules allow it.

16. Phase 4: Reliability, performance, and operational control.
17. Finish the large-table performance pass with server pagination consistency, virtualized or windowed UI where needed, and query reuse on the heaviest dashboards. Target the inventory and dashboard list pages first because those are most likely to exceed p95 budget.
18. Add background jobs for expensive exports and reports instead of doing them inline in HTTP requests. Keep export jobs trackable with status records and downloadable artifacts.
19. Tighten the Redis caching strategy for common list and dashboard endpoints, with explicit invalidation on stock, invoice, and payment writes.
20. Add error monitoring and uptime alerting through Sentry and external checks, and define the key operational signals that matter for launch: subscription webhook failures, export failures, 5xx rates, and job backlog growth.

21. Phase 5: Onboarding and activation.
22. Build a first-run setup wizard that collects business profile, GST/tax settings, first product/customer, first invoice, and demo-data choice. Reuse `users` profile fields and existing invoice/customer forms so the setup flow seeds the same objects used by the app.
23. Add an in-app checklist/progress indicator tied to onboarding completion. The checklist should drive users toward the activation funnel, not just show a static setup page.
24. Use a 14-day Pro trial as the default launch offer, rather than a hard paywall. Trial users should be able to experience paid modules that are not permanently locked in free, so conversion has a real product signal.

25. Phase 6: Trust layer and monetization readiness.
26. Establish a backup/restore policy with visible status and a basic status page or status card in-app. The launch bar should make backup recency and restore readiness visible to admins.
27. Add security basics: rate limiting beyond registration, brute-force protection, secrets hygiene, and operational guardrails for sensitive endpoints and webhooks.
28. Verify legal pages are present and linked: Terms, Privacy, and Refund/Cancellation policy. The current India-focused legal pages should be reviewed for subscription billing language and trial/upgrade behavior.
29. Define support channels by plan. Recommended launch SLA: free = email only, best effort within 2 business days; Pro = email support within 1 business day; Business = priority email plus phone support with same-business-day response target.

30. Phase 7: Product analytics and GTM surfaces.
31. Add analytics for the activation funnel: sign up, create first customer, create first invoice, and return within 7 days. Reuse the `analytics` app and extend `smart_dashboard`/dashboard data rather than building a separate reporting stack.
32. Add conversion analytics for free to trial, trial to paid, churn reasons, and cohort retention. These metrics should inform pricing and onboarding decisions after launch.
33. Create a pricing page with plan comparison, ROI messaging, annual discount, and referral-friendly copy. Keep landing pages segmented by audience, such as retail, wholesale, and pharma, so the sales story matches the buyer profile.

**Relevant files**
- `/Users/arshadaman/Cenvoras/cenvoras/subscription/models.py` — source of truth for plans, features, statuses, and tenant subscriptions.
- `/Users/arshadaman/Cenvoras/cenvoras/subscription/views.py` — currently empty; expected home for plan, subscribe, billing, and webhook APIs.
- `/Users/arshadaman/Cenvoras/cenvoras/users/models.py` — tenant model, `active_tenant`, roles, trial/subscription state, and per-tenant access helpers.
- `/Users/arshadaman/Cenvoras/cenvoras/billing/views.py` and `/Users/arshadaman/Cenvoras/cenvoras/billing/serializers.py` — invoice, customer, payment, and bulk-action enforcement points.
- `/Users/arshadaman/Cenvoras/cenvoras/inventory/views.py` and `/Users/arshadaman/Cenvoras/cenvoras/inventory/serializers.py` — stock, batch, warehouse, and list endpoint isolation points.
- `/Users/arshadaman/Cenvoras/cenvoras/audit_log/models.py` and `/Users/arshadaman/Cenvoras/cenvoras/audit_log/signals.py` — audit trail schema and mutation capture.
- `/Users/arshadaman/Cenvoras/cenvoras/analytics/views.py` and `/Users/arshadaman/Cenvoras/cenvoras/analytics/smart_dashboard.py` — dashboard metrics and launch analytics endpoints.
- `/Users/arshadaman/Cenvoras/cenvoras/cenvoras/settings.py` — caching, throttling, webhook security, and notification/runtime settings.
- `/Users/arshadaman/Cenvoras/cenvoras/cenvoras/celery.py` and `/Users/arshadaman/Cenvoras/cenvoras/integration/tasks.py` — webhook follow-up jobs, reminders, exports, and retry handling.
- `/Users/arshadaman/Cenvoras/frontend/cenvoras/src/pages/Dashboard.jsx` and `/Users/arshadaman/Cenvoras/frontend/cenvoras/src/components/dashboard/WarningsSection.jsx` — upgrade prompts, locked module surfaces, and alert-driven CTA placement.
- `/Users/arshadaman/Cenvoras/frontend/cenvoras/src/pages/Onboarding*.jsx` or equivalent onboarding route files — first-run wizard and checklist implementation targets.
- `/Users/arshadaman/Cenvoras/frontend/cenvoras/src/pages/TermsOfService.jsx` and `/Users/arshadaman/Cenvoras/frontend/cenvoras/src/pages/PrivacyPolicy.jsx` — legal page review and subscription language alignment.
- `/Users/arshadaman/Cenvoras/frontend/cenvoras/src/pages/reports/ReportsDashboard.jsx` — report gate presentation and paid-only visibility logic.

**Verification**
1. Subscription and limits:
- Create tenants across Free, Pro, and Business and verify plan-gated features, team-member caps, and free-tier limits are enforced server-side.
- Confirm locked UI modules show upgrade CTAs instead of disappearing or failing silently.
2. Webhooks and billing:
- Simulate cashfree webhook success/failure/retry flows and confirm idempotent processing, subscription status changes, and dunning state transitions.
- Verify invoice records for SaaS charges are generated and downloadable.
3. Tenant safety:
- Run access tests that attempt cross-tenant reads/writes on invoices, customers, stock, returns, and ledger entries; every attempt should be blocked.
- Confirm bulk delete and ledger mutation actions require the correct role/permission.
4. Onboarding and activation:
- Complete the first-run wizard and verify checklist state updates and activation funnel events are emitted.
5. Performance and ops:
- Measure p95 for key list pages after pagination/caching changes, and confirm background exports report status asynchronously.
- Validate Sentry/uptime alerts, backup status visibility, and audit log coverage for financial/inventory mutations.

**Decisions**
- Payment provider: cashfree only for launch.
- Soft delete scope: financial + inventory records first, then expand if needed.
- Trial offer: 14-day Pro trial.
- Support SLA: free email best effort, Pro email within 1 business day, Business priority phone/email.
- Free-tier position: unlock only customer management and basic invoice generation; everything else remains locked and surfaces an upgrade prompt.
- Business positioning: Business unlocks advanced reporting and priority support, while Pro keeps some advanced analytics visible but locked behind upgrade prompts.

**Further Considerations**
1. Confirm the exact free-tier quotas for invoices/month, customers, and users if you want hard numeric caps instead of feature-only gating.
2. Decide whether upgrade prompts should be modal paywalls, inline disabled states, or persistent dashboard banners; I recommend inline disabled cards plus one modal on click.
3. Decide whether onboarding should be mandatory until profile/GST setup is complete or skippable with reminders; I recommend skippable with a prominent checklist and repeated nudges.
