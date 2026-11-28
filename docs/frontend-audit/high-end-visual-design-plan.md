# High-End Visual Design Audit & Implementation Plan — Cenvora

**Worktree:** `/Users/arshadaman/Cenvoras/scratch/worktrees/high-end-visual-design`  
**Branch:** `audit/high-end-visual-design`  
**References:**
- `DESIGN.md` (Cenvora Precision Obsidian Design System)
- `PRODUCT.md` (Indian SME ERP / GST Billing / Inventory / Accounting / HRMS)
- `high-end-visual-design/SKILL.md` (Awwwards-tier craft, surface depth, typography, motion, performance guardrails)

---

## 1. Executive Audit Findings

### 1.1 Typography & Font Hygiene
- **`index.html:27`**: Loads `Inter` (`Inter:wght@400;500;600;700`), which is explicitly listed as a banned generic font in `high-end-visual-design/SKILL.md`. `DESIGN.md` specifies `Plus Jakarta Sans` / `Outfit` / `DM Sans` / `JetBrains Mono`.
- **`src/index.css:173, 178`**: Body and heading fallback stacks include `Roboto` (also banned).

### 1.2 Banned Purple Gradients, Harsh Shadows & Layout-Shifting Hovers
- **`src/styles/landing.css`**:
  - `.btn-gradient` (`#3b82f6 -> #8b5cf6 -> #6366f1`) uses a banned blue-to-purple gradient and `translateY(-2px)` on hover.
  - `.pulse-glow` uses `rgba(147, 51, 234, 0.4)` (purple glow).
  - `::-webkit-scrollbar-thumb` uses `linear-gradient(180deg, #3b82f6, #8b5cf6)`.
  - `.particles::before` injects pink/purple radial blobs (`rgba(255, 119, 198, 0.1)`).
  - `.hover-lift:hover` applies `transform: translateY(-8px) scale(1.02)`, violating `DESIGN.md`'s strict zero-layout-shift hover rule.
- **`src/components/FinancialDashboard.tsx:15`**: `MetricCard` uses `hover:-translate-y-1` (explicitly forbidden in `DESIGN.md` Section 5) and lacks `font-mono font-tabular` on the currency figure (line 22).
- **`src/components/AIChatWidget.jsx:154`**: Uses `from-purple-500/10 via-cyan-500/10` gradient.
- **`src/pages/financial/BankReconciliation.jsx:160, 171`**: Uses hardcoded `text-purple-400` / `bg-purple-500/20` instead of semantic `--accent-primary` / `--action-primary-bg` tokens.

### 1.3 Surface Depth, Card Architecture & Haptic Micro-Aesthetics
- **`src/index.css`**:
  - `.bento-card` (`lines 841-855`) and `.modal-shell` (`lines 409-422`) sit flatly with single-border styling and generic `rgba(0,0,0,0.25)` shadows rather than machined hardware depth (subtle top specular highlight `inset 0 1px 0 rgba(255,255,255,0.06)` and diffused obsidian ambient shadow).
  - Missing reusable **Double-Bezel (Doppelrand)** container classes (`.bezel-shell` / `.bezel-core`), **Eyebrow Pill** utility (`.eyebrow-pill`), and **Button-in-Button** pill CTA utilities (`.btn-pill-cta` / `.btn-pill-icon`) for landing/marketing hero surfaces.
- **`src/pages/LandingPage.jsx`**:
  - Uses `min-h-screen` instead of `min-h-[100dvh]` (`line 234`), risking iOS Safari / Capacitor viewport jumps.
  - Hero, Core Pillars Bento, Product Showcase frame, and Pricing cards use flat single-border containers with `shadow-xl` / `shadow-2xl` / `shadow-md` rather than nested Double-Bezel architecture and concentric radii.
  - Major section headings lack editorial eyebrow badges.
  - Primary Hero & Final CTA buttons use rectangular `btn-primary` instead of pill-shaped Button-in-Button architecture with trailing circular icon badge and `cubic-bezier(0.32,0.72,0,1)` kinetic tension.
- **`src/pages/Dashboard.jsx`**:
  - Overview KPI cards (`line 296`) use `shadow-sm` without top specular hairline depth; can be elevated with crisp `shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]` and refined hover border brightening (`hover:border-[var(--accent-primary)]/50`) while preserving snappy 150ms operational physics.
- **`src/components/PublicNavbar.jsx` & `src/components/DetailedFeatures.jsx`**:
  - Use generic `shadow-lg` / `shadow-md` instead of diffused obsidian elevation + inner specular highlight.

---

## 2. Prioritized Implementation Plan

### Step 1: Typography & Global Design Tokens (`index.html`, `src/index.css`, `src/styles/landing.css`)
1. **`index.html`**: Replace `Inter:wght@400;500;600;700` with `Plus+Jakarta+Sans:wght@400;500;600;700` in the Google Fonts `<link>`.
2. **`src/index.css`**:
   - Remove `Roboto` from `body` and `h1..h6` font-family stacks; include `'Plus Jakarta Sans'`.
   - Upgrade `.bento-card` and `.modal-shell` with subtle top-edge specular highlights and diffused obsidian ambient shadows.
   - Add `.bezel-shell`, `.bezel-core`, `.eyebrow-pill`, `.btn-pill-cta`, and `.btn-pill-icon` utilities in `@layer components`, using custom `cubic-bezier(0.32, 0.72, 0, 1)` for landing/marketing interactions while keeping operational `.btn-primary` / `.btn-secondary` snappy at `150ms`.
3. **`src/styles/landing.css`**:
   - Purge all purple gradients, `.pulse-glow`, `.hover-lift` vertical translation, and pink/purple `.particles::before` blobs.
   - Replace with Precision Obsidian ambient radial lighting (`var(--accent-primary)`), clean neutral scrollbar styling, and zero-shift surface transitions.

### Step 2: Eliminate Banned Hover Shifts & Purple Tokens in App Components
1. **`src/components/FinancialDashboard.tsx`**: Remove `hover:-translate-y-1`, apply `hover:border-[var(--accent-primary)]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]`, and add `font-mono font-tabular` to the KPI value.
2. **`src/components/AIChatWidget.jsx`**: Replace `from-purple-500/10 via-cyan-500/10` with `from-[var(--accent-primary)]/10 via-[var(--accent-secondary)]/5`.
3. **`src/pages/financial/BankReconciliation.jsx`**: Replace `purple-*` classes with `--accent-primary` / `--action-primary-bg` semantic tokens.

### Step 3: Elevate Landing Page, Navbar & Feature Explorer (`src/pages/LandingPage.jsx`, `src/components/PublicNavbar.jsx`, `src/components/DetailedFeatures.jsx`)
1. **`src/pages/LandingPage.jsx`**:
   - Switch root wrapper to `min-h-[100dvh]`.
   - Add `.eyebrow-pill` badges above Hero, Core Pillars, Product Showcase, Pricing, and Final CTA.
   - Apply Double-Bezel (`.bezel-shell` + `.bezel-core`) to the Core Pillars asymmetric Bento cards, Product Showcase browser frame, and Featured Lifetime Pricing tier.
   - Upgrade Hero & Final CTA buttons to `.btn-pill-cta` with `.btn-pill-icon` trailing circular icon wrapper.
   - Replace `shadow-md` / `shadow-xl` with diffused obsidian shadows.
2. **`src/components/PublicNavbar.jsx`**:
   - Refine floating pill navbar with crisp hairline border, diffused ambient shadow, and `shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]`.
3. **`src/components/DetailedFeatures.jsx`**:
   - Replace `shadow-md` with diffused obsidian elevation + inner specular highlight.

### Step 4: Elevate Dashboard & Common Modal Craft (`src/pages/Dashboard.jsx`, `src/components/common/Modal.jsx`)
1. **`src/pages/Dashboard.jsx`**:
   - Refine KPI overview cards with `shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]` and crisp hairline borders.
   - Ensure consistent `150ms` transitions without layout shift.
2. **`src/components/common/Modal.jsx`**:
   - Add subtle inner top specular highlight (`shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]`) and refined diffused shadow on `.modal-surface`.

---

## 3. Verification Criteria
1. **Zero Banned Fonts/Colors**: No `Inter` or `Roboto` in `index.html` / `src/index.css`; zero purple gradients or `hover:-translate-y-1` in `src/styles/landing.css` and `FinancialDashboard.tsx`.
2. **Design System Compliance**: All colors remain driven by Cenvora's CSS custom properties (`--bg-primary`, `--bg-surface`, `--accent-primary`, `--border-subtle`, `--border-default`).
3. **Build & Tests**: `npm run build` completes with zero errors; any available tests pass.
4. **Git Hygiene**: Clean diff on branch `audit/high-end-visual-design`, committed with `feat(ui): high-end visual design audit and surface polish`.
