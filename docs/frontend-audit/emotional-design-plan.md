# Emotional Design Audit & Implementation Plan — Cenvora

**Worktree:** `/Users/arshadaman/Cenvoras/scratch/worktrees/emotional-design`  
**Branch:** `audit/emotional-design`  
**Framework:** Emotional Design (`emotional-design` skill) + Cenvora Precision Obsidian (`DESIGN.md`, `PRODUCT.md`)

---

## 1. Emotional Design Strategy for Cenvora

Cenvora is an Indian SME business operating system handling real money, double-entry ledgers, payroll, and statutory GST compliance (GSTR-1, GSTR-3B, e-Way bills).  
Per `PRODUCT.md` and the Fintech / Enterprise Software emotional objectives in `SKILL.md`:
- **Primary Emotional Objectives:** Trust, clarity, precision, control, calm reassurance, and proportional completion satisfaction.
- **Voice & Personality:** Authoritative, calm, direct, and blame-free. Never playful or gimmicky around money or tax liabilities; never robotic or punitive on errors.
- **Design Guardrails (`DESIGN.md`):** Precision Obsidian (`#090a0f` / `#0f172a` / semantic CSS tokens `--bg-surface`, `--status-warning-*`, `--status-danger-*`, `--status-success-*`), snappy 80–150ms transitions, `Cancel` focused by default on destructive confirmations, and zero fake backend states.

---

## 2. Audit Findings (Prioritized P0 → P2)

### P0 — High-Stakes Trust & Destructive Action Reassurance
1. **Native `window.confirm()` and `alert()` in Financial, GST & Team Flows**
   - `src/pages/Sales.jsx` (L186): Invoice series prefix change uses `window.confirm()`. Changing an invoice prefix affects statutory sequential numbering; an OS popup breaks visual trust and does not guarantee Cancel-first focus.
   - `src/pages/PurchaseOrders.jsx` (L54, L63): PO deletion and PO-to-Purchase-Bill conversion use `window.confirm()`.
   - `src/pages/SalesOrderList.jsx` (L150): Sales order deletion uses `window.confirm()`.
   - `src/pages/settings/TeamSettings.jsx` (L66, L78, L148): Team member errors use `alert()` and member removal uses `window.confirm()`.
   - `src/components/dashboard/GstShieldSection.jsx` (L88), `src/components/purchase/PurchaseDetailsModal.jsx` (L125), `src/components/customers/CustomerDetailsModal.jsx` (L208), `src/components/vendors/VendorDetailsModal.jsx` (L154): PDF/report generation failures use blocking `alert()` instead of non-blocking, actionable `toast.error()`.
   - `src/components/StoreSettingsForm.tsx` (L53): Uses `alert('Settings saved successfully!')` instead of `toast.success()`.

2. **Crash & Compliance Error Recovery**
   - `src/components/ErrorBoundary.jsx`: Renders raw `text-red-300` without Precision Obsidian surface framing, offers no recovery actions ("Reload page", "Go to Dashboard"), and does not reassure the user that their saved ledger records and local drafts remain intact.
   - `src/components/GstStatusConfirmBanner.jsx`: Uses hardcoded light-mode classes (`bg-amber-50 text-amber-900 border-amber-300 bg-white`) that clash with Precision Obsidian dark mode, and lacks reassuring context explaining *why* GST status matters (determines CGST/SGST vs. Composition rules on invoices).
   - `src/pages/Dashboard.jsx` (L76): `smartError` from `useQuery` is destructured but never rendered, leaving users with silent blank panels if `/analytics/smart-dashboard/` fails.

### P1 — First Successful Moment, Onboarding & Empty States
3. **Dashboard Empty & First-Run Experience (`src/pages/Dashboard.jsx`)**
   - `Recent Sales` (L460–494) and `Latest Purchases` (L497–531) render an empty list container when a new business has 0 invoices/bills, instead of an actionable `<EmptyState>` guiding them to their first sale or purchase.
   - Subtitle (L258) reads `"Your intelligent business assistant"` (generic AI copy) instead of grounded, authoritative ERP copy.
4. **Onboarding Wizard Craft & Trust (`src/components/OnboardingWizard.jsx`)**
   - Placeholders (`"E.g. John"`, `"E.g. Doe"`, `"E.g. Acme Retailers"`) feel generic rather than tailored to Indian SMEs.
   - GSTIN field (L429) lacks reassuring microcopy explaining what entering a GSTIN enables (automatic B2B tax invoice formatting & GSTR-1 readiness) and that it can be added later.
   - Completion toast (L107) is generic (`"Onboarding details saved successfully!"`) instead of confirming readiness for their first invoice.

### P2 — Loading, Offline & Confirmation Polish
5. **Offline & Loading Communication**
   - `src/components/common/OfflineBanner.jsx` (L55): Uses a bright `bg-gradient-to-r from-amber-600 to-rose-600` gradient that clashes with Precision Obsidian semantic tokens.
   - `src/components/Loader.jsx` (L17): Generic `"Still working..."` copy; can be calmer and more transparent (`"Preparing your workspace…"`).
   - `src/components/common/ConfirmDialog.jsx`: Supports `destructive` and `warning` icon badges well, and should also clearly style `info`/`primary` confirmations (e.g., PO-to-Bill conversion, invoice prefix updates) with appropriate non-danger icons and semantic tokens.

---

## 3. Prioritized Implementation Steps

1. **Upgrade Core Trust & Recovery Components**
   - `src/components/ErrorBoundary.jsx`: Precision Obsidian card, blame-free copy reassuring local draft & ledger safety, "Reload Page" + "Return to Dashboard" buttons, collapsible technical details.
   - `src/components/GstStatusConfirmBanner.jsx`: Migrate to semantic CSS variables (`--status-warning-bg`, `--status-warning-border`, `--bg-surface`, `--text-primary`), add concise explanation of GST impact, and show `toast.success` on confirmation.
   - `src/components/common/OfflineBanner.jsx`: Replace gradient with clean semantic `--status-warning-fill` / `--status-success-fill` styling and clear local-draft reassurance.
   - `src/components/Loader.jsx`: Calm, Precision Obsidian backdrop and reassuring copy.
   - `src/components/common/ConfirmDialog.jsx`: Support `variant="info"` / `variant="primary"` cleanly alongside `destructive` and `warning`.

2. **Replace Blocking `window.confirm()` and `alert()` in High-Stakes Flows**
   - `src/pages/Sales.jsx`: Replace `window.confirm` on invoice prefix change with `<ConfirmDialog>` showing the exact next invoice number and consequence.
   - `src/pages/PurchaseOrders.jsx`: Replace `window.confirm` for PO delete and PO-to-Bill conversion with `<ConfirmDialog>`.
   - `src/pages/SalesOrderList.jsx`: Replace `window.confirm` for SO delete with `<ConfirmDialog>`.
   - `src/pages/settings/TeamSettings.jsx`: Replace `alert()` with `showErrorToast()` and `window.confirm()` with `<ConfirmDialog>`.
   - `src/components/dashboard/GstShieldSection.jsx`, `src/components/purchase/PurchaseDetailsModal.jsx`, `src/components/customers/CustomerDetailsModal.jsx`, `src/components/vendors/VendorDetailsModal.jsx`, `src/components/StoreSettingsForm.tsx`: Replace `alert()` with `toast.error()` / `toast.success()` / `showErrorToast()`.

3. **Elevate First Successful Moment & Onboarding**
   - `src/pages/Dashboard.jsx`:
     - Add calm recovery banner when `smartError` is true with a "Retry" button.
     - Add `<EmptyState>` for empty `Recent Sales` and `Latest Purchases` with direct CTA buttons ("Create First Invoice", "Record Purchase Bill").
     - Refine subtitle to `"Real-time sales, inventory, and GST compliance overview"`.
   - `src/components/OnboardingWizard.jsx`:
     - Update placeholders to Indian SME context, add reassuring GSTIN helper copy, and refine completion toast to `"Business profile ready — you can now issue GST-compliant invoices."`

---

## 4. Verification Criteria
- `npm run build` completes with zero errors.
- `npx eslint` on all modified files passes with zero new errors.
- All replaced `window.confirm` / `alert` flows preserve exact mutation logic, query invalidations, and state transitions.
- Keyboard Escape & Cancel-first focus behavior preserved in all `ConfirmDialog` usages.
