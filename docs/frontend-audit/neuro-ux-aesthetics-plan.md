# Neuro-UX Aesthetics Audit & Implementation Plan

> **Scope**: `frontend/cenvoras/src` (worktree `audit/neuro-ux-aesthetics`)
> **Frameworks Applied**: Evidence-based Neuro-UX Aesthetics (`SKILL.md`), Cenvora Precision Obsidian (`DESIGN.md`), and Cenvora Domain Truth (`PRODUCT.md`).
> **Decision Priority**: Readability → Information Hierarchy → Functional Clarity → Consistency → Visual Character → Fine Polish.

---

## 1. Executive Audit Summary

Cenvora's token foundation in `src/index.css` already provides low-glare dark mode (`#171C26` canvas, `#252E3D` surface, `#E8EEF7` primary text) and soft cool-gray light mode (`#F2F5F9` canvas, `#E7EDF5` surface) suitable for 8+ hour operational shifts. `Layout.jsx` also provides `⌘K` Quick Search and collapsible navigation groups.

However, auditing key high-frequency workflows (`Dashboard.jsx`, `ReportsDashboard.jsx`, `PurchaseForm.jsx`, `SalesForm.jsx`, `EmployeeFormModal.jsx`, `Ledger.jsx`) revealed **five high-impact neuro-UX friction points** where processing fluency, F-pattern scannability, perceptual grouping, or error feedback break down:

| # | Area / File | Neuro-UX Principle Violated | Concrete Issue Found | Impact |
|---|---|---|---|---|
| 1 | `src/pages/reports/ReportsDashboard.jsx` | **Chunking (Miller's Law) & Gestalt Similarity/Proximity** | 11 report cards are rendered in one flat 3-column grid mixing Financial Statements, GST Compliance, and Inventory Reports. Cards also use `hover:scale-[1.02]` + `duration-300` (violating `DESIGN.md` zero-shift / 80–120ms rule). | High — increases linear scan time to locate GST or Financial reports. |
| 2 | `src/pages/Dashboard.jsx` | **F-Pattern Scannability, Processing Fluency & Empty State Completeness** | (a) KPI cards place the big number *above* the metric label (`lines 303-310`), forcing users to read the value before knowing what metric it represents. (b) `Recent Sales` and `Latest Purchases` amounts lack `font-mono tabular-nums` (`lines 487, 524`). (c) Empty recent lists render blank space instead of `<EmptyState />` (`DESIGN.md` §6). | High — slows daily executive scanning and breaks decimal alignment. |
| 3 | `src/pages/hr/EmployeeFormModal.jsx` | **Feedback & Error Recovery Across Multi-Tab Forms** | 6-tab form (`personal`, `employment`, `statutory`, `bank`, `kyc`, `compensation`) shows **zero error indicators** on tab headers (`lines 575-588`) when `fieldErrors` exist on another tab, and does not auto-navigate to the first tab with an error or show step progress (`Step X of 6`). | High — causes silent frustration and tab-hunting on validation failure. |
| 4 | `src/components/purchase/PurchaseForm.jsx` | **Perceptual Grouping & Typographic Hierarchy** | (a) Top card (`lines 911-1073`) blends Bill Identity and Vendor/Tax Identity without clear section anchors. (b) `Itemized Bill` table header (`line 1125`) uses `text-[15px] font-black` — louder than the `text-xs` data inputs below it, inverting visual hierarchy. | Medium-High — increases cognitive load during rapid bill entry. |
| 5 | `src/components/Layout.jsx` & `src/components/sales/SalesForm.jsx` | **Attention Contrast & Cognitive Load** | `HRMS` (9 items) and `Sales & Trade` (8 items) exceed 7 items per group (mitigated by `collapsedSections` + `⌘K`). `SalesForm.jsx` exposes 13+ sections vertically (mitigated by collapsible document notes and column pickers). | Low-Medium — already partially mitigated; documented for future progressive disclosure. |

---

## 2. Prioritized Implementation Plan

### Priority 1: `src/pages/reports/ReportsDashboard.jsx` (Chunking + Instant Filter + Tactile Polish)
- **Hypothesis**: Grouping the 11 reports into 3 semantic sections (*Financial Statements*, *GST & Tax Compliance*, *Inventory & Stock Health*) with section counts and an instant search filter will reduce time-to-find for target reports (e.g., GSTR-3B, Balance Sheet) compared to scanning an undifferentiated 11-card grid.
- **Changes**:
  1. Categorize `reports` into `Financial Statements`, `GST & Tax Compliance`, and `Inventory & Stock Health` (filtering out GST return links cleanly when `!gstReturnsOk`).
  2. Add a lightweight instant search input (`Search reports...`) with clear button and empty-state feedback (`<EmptyState />`) when no reports match.
  3. Replace `hover:scale-[1.02] duration-300` with `duration-150 hover:border-[var(--accent-primary)]/50 active:scale-[0.98]` per `DESIGN.md` §5.
- **Verification**: Visual check of all 3 category sections, search filtering, locked-plan badge behavior, and `npm run build`.

### Priority 2: `src/pages/Dashboard.jsx` (F-Pattern KPI Anchor + Tabular Figures + Empty States)
- **Hypothesis**: Placing the metric label at the top-left of each KPI card (F-pattern anchor) above the `tabular-nums` figure, applying `font-mono tabular-nums` to Recent Sales/Purchases amounts, and rendering `<EmptyState />` when lists are empty will improve vertical scannability and eliminate blank-card ambiguity.
- **Changes**:
  1. Reorder KPI card inner layout (`lines 296-323`) so the **label** sits at top-left alongside the icon, followed by the large `font-mono font-tabular` value and optional subtitle.
  2. Add `font-mono font-tabular` to `Recent Sales` and `Latest Purchases` currency amounts and document numbers (`lines 483-488, 520-525`).
  3. Render `<EmptyState />` inside `Recent Sales` and `Latest Purchases` when the fetched list is empty (`!loading && items.length === 0`) with a direct action button to `/sales` or `/purchase`.
  4. Ensure KPI card transitions use `duration-150` (`DESIGN.md` §5).
- **Verification**: `npm run build` + verify all existing queries, `ExpiryCard`, `PulseSection`, and chart rendering remain untouched.

### Priority 3: `src/pages/hr/EmployeeFormModal.jsx` (Cross-Tab Error Visibility & Step Progress)
- **Hypothesis**: Surfacing per-tab error indicators in the tab bar, auto-focusing the first tab containing validation errors on submit failure, and showing `Step X of 6` in the footer will eliminate tab-hunting and reduce form abandonment.
- **Changes**:
  1. Define a deterministic `TAB_FIELD_MAP` mapping every `fieldErrors` key to its tab (`personal`, `employment`, `statutory`, `bank`, `kyc`, `compensation`).
  2. Compute `tabErrorCounts` and render a crisp semantic error dot/count badge (`bg-[var(--status-danger)] text-white`) on any tab with errors.
  3. When `handleSubmit` sets `fieldErrors`, automatically switch `activeTab` to the first tab with an error if the current `activeTab` has none.
  4. Add a subtle `Step X of 6` indicator next to `← Back` / `Next →` in the modal footer.
- **Verification**: `npm run build` + verify all 6 tabs, statutory/compensation calculations, and quick-add department/designation modals remain intact.

### Priority 4: `src/components/purchase/PurchaseForm.jsx` (Perceptual Sub-Grouping & Table Header Hierarchy)
- **Hypothesis**: Adding clear `1. Bill Details` and `2. Vendor & Tax Details` perceptual anchors and toning down the `Itemized Bill` table header from `text-[15px] font-black` to `text-[11px] font-bold tracking-wider` will reduce visual noise and keep attention on the active input row.
- **Changes**:
  1. Add subtle section labels (`1. Bill Details`, `2. Vendor & Tax Details`) in the top card (`lines 912, 985`).
  2. Normalize the `Itemized Bill` table header (`line 1125`) from `text-[15px] font-black tracking-widest` to `text-[11px] font-bold tracking-wider` so column headers guide without overpowering row inputs.
- **Verification**: `npm run build` + verify Formik `FieldArray`, `DateInputField`, `VendorAutocomplete`, and `PurchaseItemRow` keyboard traversal (`Tab` to add row) are preserved.

---

## 3. Measurable Verification Criteria (Neuro-UX `SKILL.md`)

1. **Build & Regression Safety**: `npm run build` completes with zero errors.
2. **Structure & Hierarchy**:
   - Reports page groups 11 reports into 3 clear categories (≤ 4 items per chunk) + instant filter.
   - Dashboard KPI cards anchor label-before-value in F-pattern order; all financial figures use `tabular-nums`.
   - PurchaseForm table headers are subordinate (`11px`) to data cells (`12px`–`14px`).
3. **Feedback & Error Recovery**:
   - `EmployeeFormModal` visually flags any tab with `fieldErrors` and auto-switches to the first failing tab when errors occur off-tab.
   - Dashboard `Recent Sales` / `Latest Purchases` never render blank empty cards.
4. **Glare & Motion Hygiene**:
   - No `hover:scale-[1.02]` or `duration-300` on operational cards; snappy `duration-150` and `active:scale-[0.98]` preserved.
