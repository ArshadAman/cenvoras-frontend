# Cenvora Frontend Audit & Implementation Plan: Ethical Behavioral & Progression Design

**Worktree:** `/Users/arshadaman/Cenvoras/scratch/worktrees/gamification-behavioral`  
**Branch:** `audit/gamification-behavioral`  
**Skill Applied:** `gamification-and-behavioral-game-design`  
**Design & Product Alignment:** `DESIGN.md` (Precision Obsidian) & `PRODUCT.md` (Authoritative, Trustworthy Indian SME ERP)

---

## 1. Executive Summary & Ethical Guardrails

Per `PRODUCT.md`:
> *"Authoritative & Trustworthy: No playful gamification, no gimmicky animations. Cenvora handles people's real money and tax liabilities."*

Applying the `gamification-and-behavioral-game-design` framework to a high-stakes Indian SME ERP means **rejecting pointsification, cartoon badges, confetti, leaderboards, and manipulative streak traps**. Instead, we engineer **high-trust behavioral scaffolding** grounded in:

1. **Self-Determination Theory (Competence & Autonomy):** Users feel capable through clear operational readiness feedback and keyboard mastery, while retaining full control (collapsible/dismissible checklists, zero forced popups).
2. **Endowed Progress & Goal-Gradient Effect:** Onboarding and compliance checklists reflect real completed milestones (e.g., *Account Created*, *Business Identity*) with accurate `X of N` remaining-step indicators and tabular progress bars.
3. **Completion Drive without Cognitive Overload:** Consolidate scattered setup requirements into one calm, actionable readiness surface on the Dashboard.
4. **Habit Formation via Contextual Cues (No Streak Traps):** Surface statutory GST filing windows (GSTR-1 on the 11th, GSTR-3B/2B on the 20th) and reconciliation cues calmly in context, never penalizing missed days.

---

## 2. Codebase Audit Findings

### 2.1 Onboarding & Setup Completion (`src/components/OnboardingWizard.jsx`, `src/components/Layout.jsx`, `src/pages/Dashboard.jsx`)
- **Finding:** `Layout.jsx` triggers `OnboardingWizard` as a full-screen modal when `profile_completed === false`. If a user clicks **"Skip Wizard"** (`localStorage.setItem('onboarding_skipped', 'true')`), the wizard disappears permanently with **zero persistent visibility** on the Dashboard of what remains incomplete (business address/state, GST status/GSTIN, bank details for invoices, first sales invoice, first purchase/inventory entry).
- **Finding:** Even after `profile_completed === true`, new SMEs often miss critical operational setup steps (such as configuring GST status or bank details on invoices) until they hit a friction point during invoicing.
- **Behavioral Opportunity:** Replace the post-skip void with a **persistent, dismissible Business Setup & Readiness Checklist** on `Dashboard.jsx` driven by real API state (`profileData`, `metrics`, `sales`, `purchases`).

### 2.2 GST & Compliance Readiness (`src/components/dashboard/GstShieldSection.jsx`, `src/pages/reports/GSTDashboard.jsx`)
- **Finding:** `GstShieldSection.jsx` displays turnover vs. threshold (unregistered) or Prior Turnover / Output Tax / ITC / Net Payable (registered), plus a `Reconcile 2B` button and `CA Audit Pack` modal.
- **Finding:** There is **no statutory filing cadence cue** (GSTR-1 due 11th, GSTR-3B due 20th) or period readiness indicator helping accountants orient around where they are in the monthly GST cycle.
- **Behavioral Opportunity:** Add a deterministic, calm **Monthly GST Filing Cadence** indicator (using IST/Kolkata dates) inside `GstShieldSection.jsx` for registered businesses, linking directly to `Reconcile 2B` and `Tax Register`.

### 2.3 Operational Mastery & Keyboard-Shortcut Discovery (`src/components/Layout.jsx`, `src/components/common/CommandPalette.jsx`, `src/utils/counterBillingShortcuts.js`, `src/components/sales/SalesForm.jsx`)
- **Finding:** Cenvora already implements powerful keyboard ergonomics:
  - Global: `⌘K` / `Ctrl+K` (Command Palette), `⌘B` / `Ctrl+B` (Sidebar toggle)
  - Counter Billing (`useCounterBillingShortcuts.js`): `F2` / `Ctrl+S` (Save), `F3` (Focus Customer/Party), `F8` (Focus Item/Barcode), `Alt+N` (Add line item), `Enter` (Tab-advance), `Esc` (Hierarchical dismiss).
- **Finding:** Outside of a small footer hint in `SalesForm.jsx`, there is **no unified Keyboard Shortcuts & Mastery Reference** (`?` shortcut) and `CommandPalette.jsx` does not surface shortcut keycaps on quick actions. Accountants switching from Tally/legacy ERPs cannot easily discover these speed tools.
- **Behavioral Opportunity:** Add a Precision-Obsidian `KeyboardShortcutsModal` triggered by `?` (when not in an input), accessible from `CommandPalette.jsx` and `Layout.jsx`, plus subtle `<kbd>` mastery cues in `CommandPalette.jsx`.

---

## 3. Prioritized Implementation Plan

### Step 1: Pure Readiness & Compliance Cadence Utilities (Testable Domain Logic)
1. **Create `src/utils/readinessProgress.js`**
   - `computeSetupReadiness({ profile, metrics, salesCount, purchasesCount })`
   - Returns `{ steps, completedCount, totalCount, percent, nextStep, isComplete }`.
   - Steps (real, verifiable state—zero fabricated points):
     1. `account` — Account Active (always `true`, genuine endowed progress)
     2. `business_profile` — Business Name & State configured
     3. `tax_status` — GST / Tax Status confirmed (`gst_status_set` or `gstin`/`trn`)
     4. `bank_details` — Invoice Bank / UPI details configured
     5. `first_sale` — First Sales Invoice recorded
     6. `first_purchase_or_stock` — First Purchase Bill or Inventory stocked
2. **Create `src/utils/complianceCadence.js`**
   - `getGstFilingCadence(todayDateStr)` (expects `YYYY-MM-DD` IST date)
   - Returns deterministic statutory window metadata for GSTR-1 (11th) and GSTR-3B (20th): active phase label, days remaining, target route (`/reports/tax-register?tab=gstr1` or `/reports/gst-shield`), and calm status tone (`info` / `warning` when ≤3 days, never alarmist).

### Step 2: Business Setup & Readiness Card on Dashboard
1. **Create `src/components/dashboard/SetupReadinessCard.jsx`**
   - Precision Obsidian card (`bg-[var(--bg-surface)]`, 1px hairline border, `tabular-nums` progress readout).
   - Displays Goal-Gradient progress bar (`X of 6 complete`), next recommended action button, expandable/collapsible step list, and a clean "Dismiss" control persisted in `localStorage` (`cenvora_setup_readiness_dismissed`).
   - When 6/6 steps are complete, shows a dignified Emerald completion confirmation with a "Done — Hide Checklist" button (no confetti, no cartoon badges).
2. **Integrate into `src/pages/Dashboard.jsx`**
   - Render `SetupReadinessCard` above or right below `PulseSection` when not dismissed.

### Step 3: Monthly GST Cadence Cue in `GstShieldSection.jsx`
1. **Update `src/components/dashboard/GstShieldSection.jsx`**
   - For GST-registered businesses, render a compact, single-line statutory cadence cue using `getGstFilingCadence(todayStr)` with a direct link to GSTR-1 / 2B Reconciliation.

### Step 4: Keyboard Mastery & Shortcut Discovery
1. **Create `src/components/common/KeyboardShortcutsModal.jsx`**
   - Clean, Escape-dismissible modal (`useEscKey` or `keydown` Escape handler, body scroll lock) listing Global, Counter Billing, and Form Navigation shortcuts with `<kbd>` keycaps.
2. **Update `src/components/common/CommandPalette.jsx`**
   - Add a `Keyboard Shortcuts (?)` command item and display optional `shortcut` `<kbd>` badges on relevant quick actions (e.g., `F2` / `⌘K`).
3. **Update `src/components/Layout.jsx`**
   - Register global `?` (`Shift+/`) listener (ignoring `INPUT`, `TEXTAREA`, `SELECT`, `isContentEditable`) to toggle `KeyboardShortcutsModal`.
   - Add a subtle `Shortcuts (?)` button in the sidebar footer alongside collapse/sign-out controls.

### Step 5: Unit Tests & Verification
1. **Create `src/utils/readinessProgress.test.js`**
2. **Create `src/utils/complianceCadence.test.js`**
3. Run `npm run build` and `npx vitest run` to verify zero build/lint regressions and 100% passing tests.

---

## 4. Verification Criteria
- [ ] `npm run build` succeeds with zero errors.
- [ ] New unit tests for `readinessProgress` and `complianceCadence` pass.
- [ ] No playful gamification, confetti, points, or streak-trap guilt anywhere in UI or copy.
- [ ] All interactive elements respect `DESIGN.md` (1px hairlines, `tabular-nums`, `active:scale-[0.98]`, no `hover:-translate-y-*`, Escape dismissal).
- [ ] `git status` is clean and all changes are committed to `audit/gamification-behavioral`.
