# Responsive Web & Mobile Engineering Audit and Implementation Plan

> **Audit Scope**: `frontend/cenvoras` (`index.html`, `src/index.css`, `src/components/`, `src/pages/`)  
> **Target Environments**: Mobile (`320px–430px`), Tablet POS (`768px–1024px`), Laptop/Desktop (`1280px+`), and Capacitor Android WebView (`app.cenvora.android`)  
> **Design System**: Cenvora Precision Obsidian (`DESIGN.md` & `PRODUCT.md`) — preserves high-density desktop operational rows (`36–40px`) while elevating mobile/tablet ergonomics, safe-area compliance, and touch targets.

---

## 1. Executive Summary & Prioritized Findings

### P0 — Critical Functionality & Safe-Area / Viewport Failures
1. **Missing `viewport-fit=cover` in `index.html`**:
   - **File**: `index.html:9`
   - **Current**: `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`
   - **Impact**: In Capacitor Android WebView (edge-to-edge / notched displays) and iOS Safari, `env(safe-area-inset-top/bottom/left/right)` resolves to `0px`. Fixed headers, drawers, and bottom-anchored widgets collide with system status bars and gesture navigation bars.
   - **Fix**: Update to `content="width=device-width, initial-scale=1.0, viewport-fit=cover"` (preserving user zoom — never disabling `user-scalable`).

2. **Zero `env(safe-area-inset-*)` & Dynamic Viewport (`100dvh`) Support Across Shell & Overlays**:
   - **Files**:
     - `src/components/Layout.jsx` (`aside` uses `h-screen`; mobile `<header>` uses `h-16` with no `safe-area-inset-top`; mobile drawer has no `safe-area-inset-top/bottom/left`; `<main>` has no `safe-area-inset-bottom` padding)
     - `src/components/PublicNavbar.jsx` (`fixed top-0` lacks `safe-area-inset-top`)
     - `src/components/common/OfflineBanner.jsx` (`fixed top-0` lacks `safe-area-inset-top`)
     - `src/components/common/Modal.jsx` (`max-h-[90vh]` instead of `max-h-[90dvh]`; backdrop lacks safe-area padding)
     - `src/components/common/CommandPalette.jsx` (`pt-20` and `max-h-[75vh]` push bottom off-screen when mobile virtual keyboard opens; lacks `100dvh` & safe-area top padding)
     - `src/components/AIChatWidget.jsx` (`h-[calc(100vh-110px)]` and `bottom-6 right-6` ignore `100dvh` and `safe-area-inset-bottom/right`)
   - **Fix**: Add safe-area utility classes in `src/index.css` and apply them to fixed/sticky headers, drawers, modals, `<main>`, and floating widgets; use `dvh` (`100dvh` / `90dvh` / `75dvh`) with `vh` fallbacks so virtual keyboards and mobile browser chrome never clip content.

3. **Unwrapped `<table>` Elements Causing Horizontal Clipping / Page Overflow on Mobile & Tablet**:
   - **Files**:
     - `src/pages/reports/StockLedgerReport.jsx:85` (`overflow-hidden` instead of `overflow-x-auto`)
     - `src/pages/reports/ProfitLossStatement.jsx:96,131` (`overflow-hidden` instead of `overflow-x-auto`)
     - `src/components/returns/DebitNoteForm.jsx:254` (`overflow-hidden` instead of `overflow-x-auto`)
     - `src/components/returns/CreditNoteForm.jsx:435` (`overflow-hidden` instead of `overflow-x-auto`)
     - `src/components/purchase/PurchaseDetailsModal.jsx:316` (`hidden sm:block ... overflow-hidden` with `table-fixed` wider than 640px)
     - `src/components/inventory/StockJournalDetailsModal.jsx:91` (`overflow-hidden` with `table-fixed`)
     - `src/components/hr/DojCorrectionModal.jsx:40` (bare `<table>` with no scroll wrapper)
   - **Fix**: Wrap or update containers to `overflow-x-auto` (`-webkit-overflow-scrolling: touch` via CSS) so wide financial/inventory tables scroll cleanly inside their card/modal without breaking page layout.

### P1 — Major Usability & Touch-Target Compliance (`44×44px` Minimum)
4. **Undersized Touch Targets on Mobile & Tablet Controls**:
   - **Files**:
     - `src/components/Layout.jsx`: Mobile header hamburger (`p-2` → `40px`), command palette trigger (`p-1.5` → `32px`), mobile drawer close button (`p-2` → `40px`).
     - `src/components/PublicNavbar.jsx`: Mobile menu toggle button (`h-8 w-8 sm:h-9 sm:w-9` → `32px/36px`).
     - `src/components/common/Modal.jsx`: Close button (`p-1.5` → `32px`).
     - `src/components/common/Pagination.jsx`: Page buttons (`w-9 h-9` → `36px`, and lacks `flex-wrap` for `320px` viewports).
     - `src/components/sales/SalesTable.jsx`: Mobile card action buttons (`View`, `Pay`, `Edit`, `Delete` are `~32–34px` tall/wide).
   - **Fix**: Enforce `min-w-[44px] min-h-[44px]` on mobile/touch interactive controls (using responsive modifiers like `min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0` where desktop density requires compact 36px buttons). Add `flex-wrap` to `Pagination.jsx` to prevent 320px overflow.

5. **Non-Wrapping Header Action Bars on Narrow Viewports (`320px–430px`)**:
   - **Files**:
     - `src/pages/ChartOfAccounts.jsx:218,221`: Uses `p-6` and `flex justify-between items-start` without `flex-col sm:flex-row gap-4` or wrapping on action buttons.
     - `src/pages/Dashboard.jsx:252,265`: `h1` uses fixed `text-3xl` (clips/wraps awkwardly at 320px) and button group lacks `flex-wrap w-full sm:w-auto`.
   - **Fix**: Use responsive padding (`p-4 sm:p-6`), `flex-col sm:flex-row` header stacking, and `flex-wrap` button groups.

### P2 — Fluid Typography (`clamp()`) & Responsive Polish
6. **Hardcoded Desktop Heading Sizes in `src/index.css`**:
   - **File**: `src/index.css:182-243`
   - **Current**: `.type-display` (`3rem`), `h1`/`.type-h1` (`2.25rem`), `h2`/`.type-h2` (`1.75rem`), `h3`/`.type-h3` (`1.375rem`) are fixed `rem` values, causing oversized headings on `320px–375px` mobile screens.
   - **Fix**: Apply CSS `clamp()` so headings scale smoothly from compact mobile sizes to the exact desktop sizes at `1280px+` (e.g., `h1`: `clamp(1.5rem, 2.5vw + 0.75rem, 2.25rem)`).
   - Add `.safe-top`, `.safe-bottom`, `.safe-x`, and `.table-scroll-touch` utilities in `src/index.css`.

---

## 2. Prioritized Implementation Steps

1. **Global Viewport & Fluid CSS Foundation**:
   - Update `index.html` viewport meta with `viewport-fit=cover`.
   - Update `src/index.css`:
     - Add fluid `clamp()` scaling for `.type-display`, `h1`/`.type-h1`, `h2`/`.type-h2`, `h3`/`.type-h3`.
     - Add safe-area utility classes and smooth touch scrolling for `.overflow-x-auto`.
     - Update `.modal-shell` `max-height` to `90dvh` (with `90vh` fallback).
2. **App Shell & Global Overlays (`Layout`, `PublicNavbar`, `Modal`, `CommandPalette`, `OfflineBanner`, `AIChatWidget`)**:
   - Apply `env(safe-area-inset-*)` and `100dvh` / `90dvh` / `75dvh`.
   - Upgrade mobile touch targets to `>= 44×44px` without altering desktop sizing.
3. **Shared Components & Table Overflow Fixes**:
   - Fix `Pagination.jsx` (`flex-wrap`, `min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px]`).
   - Fix `SalesTable.jsx` mobile card action buttons to `min-h-[44px]` / `min-w-[44px]`.
   - Fix the 7 unwrapped `<table>` containers (`StockLedgerReport.jsx`, `ProfitLossStatement.jsx`, `DebitNoteForm.jsx`, `CreditNoteForm.jsx`, `PurchaseDetailsModal.jsx`, `StockJournalDetailsModal.jsx`, `DojCorrectionModal.jsx`).
4. **Page Header & Grid Ergonomics**:
   - Fix `Dashboard.jsx` header button wrapping and fluid title sizing.
   - Fix `ChartOfAccounts.jsx` mobile padding and header stacking.
5. **Verification**:
   - Run `npm run build` (must pass with 0 errors).
   - Run `node --test tests/*.test.mjs tests/*.test.js` to confirm no regressions.
   - Run `eslint` on modified files.

---

## 3. Verification Criteria
- `npm run build` exits with code `0` and generates production + PWA bundles cleanly.
- No `<table>` in operational/report pages lacks an `overflow-x-auto` wrapper or mobile card fallback.
- All mobile navigation triggers, modal close buttons, pagination controls, and mobile card action buttons meet `44×44px` minimum hit area on touch viewports while preserving desktop density (`36–40px` operational rows).
- `index.html` includes `viewport-fit=cover` and all fixed/sticky shell elements respect `env(safe-area-inset-*)`.
