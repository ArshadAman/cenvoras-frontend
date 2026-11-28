# Color Theory & Precision Obsidian Audit & Implementation Plan

**Workspace:** `/Users/arshadaman/Cenvoras/scratch/worktrees/color-theory`  
**Branch:** `audit/color-theory`  
**References:** `DESIGN.md` (Cenvora Precision Obsidian), `PRODUCT.md`, `color-theory/SKILL.md` (Sections 9, 10, 17, 19)

---

## 1. Executive Summary

Cenvora's CSS custom property architecture in `src/index.css` already separates Light and Dark themes and avoids naive palette inversion. However, a quantitative color-science and WCAG 2.2 AA/AAA audit revealed **7 systemic issues**:

1. **WCAG AA Contrast Failures in Light & Dark Modes**:
   - Light mode `--text-muted` (`rgba(68, 84, 111, 0.75)` → `#6D7A91`) achieves only **3.68:1** on `--bg-surface` (`#E7EDF5`), failing the 4.5:1 requirement for 12px–14px labels, table headers, and placeholders.
   - Light mode `--accent-primary` (`#1877D2`) achieves only **3.87:1** on `--bg-surface` (`#E7EDF5`), failing WCAG AA for interactive text links and `.btn-info`.
   - Dark mode solid CTA fills `--status-danger-fill` (`#E03545` → **4.41:1** with `#FFFFFF`) and `--status-success-fill` (`#1F8A56` → **4.35:1** with `#FFFFFF`) fall just below 4.5:1.
   - Hardcoded low-opacity white text (`text-white/40`, `text-white/30`) in `src/components/AIChatWidget.jsx` and un-tokenized light text (`text-gray-100`, `text-rose-200`, `text-amber-200`, `text-cyan-300`) in `src/components/Layout.jsx` and `src/components/common/InlineProgressBar.jsx` fail contrast in Light Mode or on dark surfaces.
2. **Precision Obsidian Surface Drift (`DESIGN.md` vs `src/index.css`)**:
   - `DESIGN.md` specifies Deep Obsidian (`#090A0F` canvas, `#0F172A` card/sidebar, `#1E293B` elevated/input), whereas `.dark` in `src/index.css` currently uses `#171C26` / `#252E3D`. Aligning to Precision Obsidian increases luminance headroom and contrast across all semantic tokens.
   - `.btn-primary` in dark mode uses `#64A8FF` with dark text instead of `DESIGN.md`'s Sovereign Technical Cobalt (`#2563EB` default, `#1D4ED8` hover, `#FFFFFF` text, **5.17:1** / **6.70:1**).
3. **Missing `Converted / Processed` Technical Indigo Token**:
   - `DESIGN.md` defines four financial status roles: Emerald (Inflow/Paid), Ruby (Outflow/Unpaid), Amber (Pending/Partial/Draft), and **Technical Indigo** (Converted/Processed).
   - `src/index.css` has no `--status-converted` token or `.badge-converted` class, and `tailwind.config.js` collapses `indigo` into `var(--accent-primary)`.
4. **Indistinguishable Chart Series & Missing Categorical Palette**:
   - `--accent-secondary` and `--status-info` resolve to the **exact same hex** (`#90CAF9` dark / `#0D47A1` light). Both `Dashboard.jsx` (`Stock Splits` PieChart) and `InsightsSection.jsx` (`Profit Finder`) render adjacent series in identical colors.
   - `Dashboard.jsx` `Sales vs Purchases` LineChart uses two nearly identical blues (`--accent-primary` and `--accent-secondary`), reducing perceptual separation and CVD (color vision deficiency) legibility.
5. **Off-Brand Purple/Pink Gradients**:
   - `src/styles/landing.css` (`.pulse-glow`, `.btn-gradient`, `::-webkit-scrollbar-thumb`, `.particles::before`) and `src/components/AIChatWidget.jsx` (`from-purple-500/10 via-cyan-500/10`) violate `DESIGN.md`'s ban on gratuitous neon cyan-to-purple/pink gradients.

---

## 2. Exact File Audit & Findings

| File | Issues Found | Priority |
|---|---|---|
| `src/index.css` | Light `--text-muted` (3.68:1) & `--accent-primary` (3.87:1) fail WCAG AA; Dark `--status-danger-fill` (4.41:1) & `--status-success-fill` (4.35:1) fail AA; `.dark` surfaces drift from `#090A0F`/`#0F172A`/`#1E293B`; missing `--status-converted` & `.badge-converted`; duplicate `--accent-secondary`/`--status-info`; missing `--chart-1`..`--chart-7` tokens; `.btn-primary` not using `--action-primary` | P0 |
| `tailwind.config.js` | `indigo` collapsed to `--accent-primary` instead of `--status-converted`; `obsidian.elevated` mapped to `--bg-surface` instead of `--bg-elevated`; missing `converted` semantic color group | P0 |
| `src/utils/chartColors.js` (new) | No centralized, CVD-safe, theme-aware Recharts palette utility | P1 |
| `src/pages/Dashboard.jsx` | `stockColors` has duplicate colors (`--accent-secondary` === `--status-info`); `Sales vs Purchases` lines lack perceptual/semantic contrast | P1 |
| `src/components/dashboard/InsightsSection.jsx` | `colors` array has duplicate colors (`--accent-secondary` === `--status-info`) | P1 |
| `src/components/dashboard/MLPredictionsSection.jsx` | `fontSize={9}` on chart axes (below 12px readability); should reference semantic chart tokens | P2 |
| `src/styles/landing.css` | Off-brand `#8b5cf6` purple gradients in `.btn-gradient`, scrollbar, `.pulse-glow`, and pink `rgba(255,119,198,0.1)` in `.particles::before` | P1 |
| `src/components/AIChatWidget.jsx` | Off-brand `from-purple-500/10 via-cyan-500/10` header gradient; `text-white/40` & `text-white/30` fail contrast; `bg-black/40` hardcoded | P1 |
| `src/components/Layout.jsx` | Subscription banners (lines 948-964) use hardcoded cyan/rose/amber gradients with `text-gray-100`/`text-rose-200`/`text-amber-200` (unreadable in Light Mode); VIP badge (line 441) uses `text-emerald-300` | P1 |
| `src/components/common/InlineProgressBar.jsx` | Hardcoded `from-cyan-500 to-emerald-500`, `text-gray-300`, `text-cyan-300` (fails Light Mode contrast) | P1 |
| `src/components/quotation/QuotationTable.jsx` | `converted` / `partially_converted` statuses use `--status-success` / `--status-info` instead of `--status-converted` (Technical Indigo) | P2 |
| `src/components/customers/CustomerDetailsModal.jsx` | `converted` quotation badge uses `badge-success` instead of `badge-converted` | P2 |

---

## 3. Target Token System & Verified Contrast Matrix

### Light Mode (`:root`)
- `--bg-primary`: `#F2F5F9` (Canvas)
- `--bg-surface`: `#E7EDF5` (Card / Surface)
- `--bg-elevated`: `#FFFFFF` (Input / Modal / Popover)
- `--text-primary`: `#0F172A` (**16.33:1** on canvas, **15.16:1** on card — WCAG AAA)
- `--text-secondary`: `#334155` (**9.47:1** on canvas, **8.79:1** on card — WCAG AAA)
- `--text-muted`: `#475569` (**6.93:1** on canvas, **6.43:1** on card — WCAG AA+)
- `--accent-primary`: `#1D4ED8` (**6.13:1** on canvas, **5.69:1** on card — WCAG AA)
- `--action-primary`: `#2563EB` / hover `#1D4ED8` with `#FFFFFF` (**5.17:1** / **6.70:1** — WCAG AA)
- `--status-success`: `#176B45` (**5.53:1** on card), `--status-success-fill`: `#146C43` (**5.98:1** with `#FFFFFF`)
- `--status-warning`: `#92400E` (**6.02:1** on card)
- `--status-danger`: `#BE123C` (**5.34:1** on card), `--status-danger-fill`: `#BE123C` (**6.29:1** with `#FFFFFF`)
- `--status-converted`: `#4338CA` (**6.71:1** on card)
- `--status-info`: `#0369A1` (**5.04:1** on card)

### Dark Mode (`.dark` — Precision Obsidian)
- `--bg-primary`: `#090A0F` (Level 0 Deep Obsidian Canvas)
- `--bg-surface`: `#0F172A` (Level 1 Card / Sidebar / Panel)
- `--bg-elevated`: `#1E293B` (Level 2 Input / Grid Cell / Modal)
- `--text-primary`: `#F1F5F9` (**18.05:1** on `#090A0F`, **16.30:1** on `#0F172A`, **13.35:1** on `#1E293B` — WCAG AAA)
- `--text-secondary`: `#CBD5E1` (**13.32:1** / **12.02:1** / **9.85:1** — WCAG AAA)
- `--text-muted`: `#94A3B8` (**7.71:1** / **6.96:1** / **5.71:1** — WCAG AA+)
- `--accent-primary`: `#60A5FA` (**7.78:1** / **7.02:1** / **5.75:1** — WCAG AA+)
- `--action-primary`: `#2563EB` / hover `#1D4ED8` with `#FFFFFF` (**5.17:1** / **6.70:1** — WCAG AA)
- `--status-success`: `#34D399` (**9.29:1** on `#0F172A`), `--status-success-fill`: `#047857` (**5.48:1** with `#FFFFFF`)
- `--status-warning`: `#FBBF24` (**10.69:1** on `#0F172A`)
- `--status-danger`: `#FB7185` (**6.63:1** on `#0F172A`), `--status-danger-fill`: `#E11D48` (**4.70:1** with `#FFFFFF`)
- `--status-converted`: `#818CF8` (**5.98:1** on `#0F172A`, **4.90:1** on `#1E293B`)
- `--status-info`: `#38BDF8` (**8.33:1** on `#0F172A`)

### Categorical & Financial Chart Palette (`--chart-1` .. `--chart-7`)
Perceptually distinct hues for Recharts (light & dark calibrated, CVD-safe):
1. `--chart-1`: Technical Cobalt (`#2563EB` light / `#60A5FA` dark)
2. `--chart-2`: Clean Emerald (`#15803D` light / `#34D399` dark)
3. `--chart-3`: Crisp Amber (`#B45309` light / `#FBBF24` dark)
4. `--chart-4`: Technical Indigo (`#4338CA` light / `#818CF8` dark)
5. `--chart-5`: Precision Ruby (`#BE123C` light / `#FB7185` dark)
6. `--chart-6`: Deep Cyan/Sky (`#0369A1` light / `#38BDF8` dark)
7. `--chart-7`: Slate Neutral (`#475569` light / `#94A3B8` dark)

---

## 4. Prioritized Implementation Steps

1. **Core Token & Tailwind Foundation**:
   - Update `src/index.css` `:root` and `.dark` tokens, add `--bg-elevated`, `--status-converted*`, `--chart-1`..`--chart-7`, `.badge-converted`, and update `.btn-primary` to use `--action-primary` / `--action-primary-text`.
   - Update `tailwind.config.js` to map `obsidian.elevated` to `--bg-elevated`, `indigo` to `--status-converted`, and add `converted` semantic color group.
2. **Chart Palette Utility & Recharts Updates**:
   - Create `src/utils/chartColors.js` and `src/utils/chartColors.test.js`.
   - Update `src/pages/Dashboard.jsx`, `src/components/dashboard/InsightsSection.jsx`, and `src/components/dashboard/MLPredictionsSection.jsx` to use `CHART_PALETTE` and `FINANCIAL_SERIES_COLORS`.
3. **Gradient & Contrast Remediation**:
   - Clean up `src/styles/landing.css` (replace purple/pink gradients with Technical Cobalt/Indigo/Sky).
   - Fix `src/components/AIChatWidget.jsx`, `src/components/Layout.jsx`, and `src/components/common/InlineProgressBar.jsx` for Light/Dark contrast parity.
4. **Semantic `Converted` Status Alignment**:
   - Update `src/components/quotation/QuotationTable.jsx` and `src/components/customers/CustomerDetailsModal.jsx` to use `.badge-converted` / `--status-converted` for `converted` and `partially_converted` statuses.

---

## 5. Verification Criteria

- All modified tokens pass WCAG 2.2 AA (>= 4.5:1 for normal text, >= 3:1 for large text/UI).
- `npm run build` completes with zero errors.
- `npx vitest run` passes all existing and new unit tests (`chartColors.test.js`).
