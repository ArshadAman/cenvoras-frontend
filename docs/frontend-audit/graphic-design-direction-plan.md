# Graphic Design Direction Audit & Implementation Plan

**Workspace:** `/Users/arshadaman/Cenvoras/scratch/worktrees/graphic-design-direction`  
**Branch:** `audit/graphic-design-direction`  
**Design System:** Cenvora Precision Obsidian (`DESIGN.md`) & Product Truth (`PRODUCT.md`)  
**Skill Reference:** `graphic-design-direction/SKILL.md`

---

## 1. Executive Summary

Cenvora's core visual foundation—`Outfit` (display), `DM Sans` (body), and `JetBrains Mono` (tabular/financial figures) paired with the 60-30-7-3 Technical Cobalt & Obsidian token architecture—is well-structured. However, auditing `src/` revealed several graphic design direction gaps that dilute visual authority, break typographic alignment in financial tables, introduce off-brand purple gradients, and create iconography inconsistency.

---

## 2. Detailed Audit Findings

### A. Typographic Hierarchy & Tabular Numerals Alignment
1. **List Table Amount Token (`src/components/common/tableHeaderClasses.js`)**:
   - `LIST_TD_AMOUNT` right-aligns currency values (`text-right`) but omits `tabular-nums`, allowing proportional digit widths to misalign decimal places across rows.
2. **Invoice & Quotation Templates (`src/components/invoice/templates/*.jsx`)**:
   - `ClassicTemplate.jsx`, `ProfessionalTemplate.jsx`, `LegendTemplate.jsx`, `BillShipTemplate.jsx`, and `ServiceTemplate.jsx` apply `fontVariantNumeric: 'tabular-nums'` only to `price`, `amount`, and `hsn` cells in the line-items table—omitting `serial`, `quantity`, `free_qty`, `discount`, and `tax`.
   - **Totals Block**: None of the 5 templates apply `fontVariantNumeric: 'tabular-nums'` to the right-aligned currency cells in the summary totals table (`Items Subtotal`, `CGST`, `SGST`, `IGST`, `Round Off`, `Grand Total`), undermining decimal-point vertical alignment on printed A4/PDF invoices.
3. **Summary KPI Cards (`src/components/inventory/InventorySummary.jsx`)**:
   - Numeric KPI values use `font-mono` without `tabular-nums` / `font-tabular`, and card geometry (`rounded-xl p-4`) diverges from `DESIGN.md`'s Summary Tier (`rounded-2xl p-5` / `p-6`).

### B. Iconography Consistency (Heroicons vs. Inline SVGs)
- `PRODUCT.md` standardizes on `@heroicons/react` (`24/outline`).
- `src/components/customers/CustomerSummary.jsx` (lines 57–59, 80–82, 103–105, 126–128) and `src/components/inventory/InventorySummary.jsx` (lines 58–60, 74–76, 89–91, 106–108, 118–120) still render raw inline `<svg>` elements with inconsistent stroke weights instead of `@heroicons/react/24/outline` icons.

### C. Brand & Color System Compliance (`src/styles/landing.css`)
- `src/styles/landing.css` contains legacy off-brand purple/pink gradients and forbidden hover transforms that directly violate `DESIGN.md` ("Absolute ban on gratuitous neon cyan-to-purple background gradients", "Never translate cards on hover"):
  - `.pulse-glow`: `rgba(147, 51, 234, 0.4)` purple glow.
  - `::-webkit-scrollbar-thumb`: `linear-gradient(180deg, #3b82f6, #8b5cf6)` purple gradient.
  - `.btn-gradient`: `linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #6366f1 100%)` purple gradient.
  - `.hover-lift:hover`: `transform: translateY(-8px) scale(1.02)` (forbidden card translation).
  - `.particles::before`: `rgba(255, 119, 198, 0.1)` pink/purple radial mesh.

### D. Editorial & Landing Page Art Direction (`src/pages/LandingPage.jsx`, `src/components/PublicNavbar.jsx`)
- **Contrast on Popular Tier Badge (`LandingPage.jsx` line 479)**: Uses `bg-[var(--accent-primary)] text-white`. In dark mode `--accent-primary` is `#64A8FF`, where `text-white` has lower contrast than `text-[var(--text-on-accent)]` (`#171C26`, WCAG AAA 8.65:1).
- **Editorial Section Eyebrows (`LandingPage.jsx`)**: Sections (`#features`, `ProductShowcase`, `#pricing`) jump straight into `<h2>` without disciplined editorial eyebrow labels (`type-caption uppercase tracking-widest`), reducing visual rhythm and scannability.
- **Navbar Micro-Physics (`PublicNavbar.jsx`)**: Uses `duration-300` and `active:scale-95` instead of `DESIGN.md`'s snappy `duration-150` and `active:scale-[0.98]`.

---

## 3. Prioritized Implementation Plan

1. **Priority 1 — Typographic & Tabular Numerals Enforcement**:
   - Update `LIST_TD_AMOUNT` in `src/components/common/tableHeaderClasses.js` to include `tabular-nums`.
   - Enforce `fontVariantNumeric: 'tabular-nums'` across all quantitative item columns (`serial`, `quantity`, `free_qty`, `price`, `discount`, `tax`, `amount`, `hsn`) and all Totals table value cells in `ClassicTemplate.jsx`, `ProfessionalTemplate.jsx`, `LegendTemplate.jsx`, `BillShipTemplate.jsx`, and `ServiceTemplate.jsx`.
2. **Priority 2 — Brand & Color Hygiene (`src/styles/landing.css`)**:
   - Replace all purple/pink gradients with Technical Cobalt (`var(--accent-primary)` / `#1877D2` / `#0D47A1`) tokens.
   - Remove `translateY(-8px) scale(1.02)` from `.hover-lift:hover` and replace with border brightening + soft shadow expansion per `DESIGN.md`.
3. **Priority 3 — Iconography & Summary Card Unification**:
   - Replace raw inline `<svg>` icons in `src/components/customers/CustomerSummary.jsx` and `src/components/inventory/InventorySummary.jsx` with `@heroicons/react/24/outline` icons.
   - Align `InventorySummary.jsx` KPI cards to `rounded-2xl p-5` and `font-tabular tabular-nums`.
4. **Priority 4 — Editorial & Landing Page Polish**:
   - Fix dark-mode contrast on the "Most Popular" badge in `src/pages/LandingPage.jsx` using `text-[var(--text-on-accent)]`.
   - Add restrained editorial eyebrow labels to major landing page sections for stronger visual hierarchy and rhythm.
   - Tighten `PublicNavbar.jsx` transitions to `duration-150` and `active:scale-[0.98]`.

---

## 4. Verification Criteria
- `npm run build` completes with zero errors.
- `npx eslint` on all modified files passes with zero errors.
- All invoice templates preserve existing business logic, tax calculations, and `TableTypography.test.jsx` contracts.
