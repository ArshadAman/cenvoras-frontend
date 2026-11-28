# Apple Motion Engineering Audit & Implementation Plan

> **Target**: Cenvora Frontend (`frontend/cenvoras`)
> **Worktree**: `/Users/arshadaman/Cenvoras/scratch/worktrees/apple-motion-engineering` (`audit/apple-motion-engineering`)
> **Design System**: `DESIGN.md` (Cenvora Precision Obsidian) + `PRODUCT.md`
> **Skill Reference**: `apple-motion-engineering` (Motion Philosophy, Physics, Continuity, Accessibility, 60/120fps Performance)

---

## 1. Executive Audit Summary

Cenvora already has `framer-motion` (`^12.23.12`), `animejs` (`^4.2.0`), and `@floating-ui/react` (`^0.26.28`) installed, plus `active:scale-[0.98]` and `navigator.vibrate(8)` on `Button.jsx`. However, motion across the application is currently **fragmented, sluggish in key operational paths, and incomplete for `prefers-reduced-motion` accessibility**:

### Key Findings

| Priority | Area | Issue Found | Impact |
|---|---|---|---|
| **P0** | **Global Accessibility (`prefers-reduced-motion`)** | `App.jsx` does not wrap the tree in Framer Motion's `<MotionConfig reducedMotion="user">`. `src/index.css` `.animate-fade-up` (used on 30+ pages and 25+ modals) has **no** `@media (prefers-reduced-motion: reduce)` override. | Users with vestibular sensitivity receive unattenuated `20px` translations and Framer Motion animations. |
| **P0** | **Forbidden Layout-Shift Hover (`DESIGN.md` §5)** | `src/components/FinancialDashboard.tsx` (L15) and `src/components/3d/HeroPrismCanvas.jsx` (L376, L383) use `hover:-translate-y-1`. | Explicitly forbidden by `DESIGN.md` ("Never translate cards on hover (`hover:-translate-y-1` is strictly forbidden)"). |
| **P0** | **Sluggish Page & Modal Entrance (`.animate-fade-up`)** | `src/index.css` (L1096–1104) defines `.animate-fade-up` as `0.8s` (`800ms`) with `translateY(20px)`. | Violates `DESIGN.md` §5 ("Snappy 80ms - 120ms... No slow, sluggish 300ms+ animations on operational elements") and makes every ERP page/modal feel heavy. |
| **P0** | **Undefined CSS Animation Classes** | `src/components/common/CommandPalette.jsx` (L363) uses `animate-in fade-in zoom-in-95` (`tailwindcss-animate` is not installed). `OfflineBanner.jsx`, `GSTShieldPage.jsx`, `Attendance.jsx`, `PaymentForm.jsx`, etc. use `animate-fade-in`, which is not defined in `src/index.css` (only `fadeIn` camelCase exists in `tailwind.config.js`). | Modals/palettes/banners pop in abruptly without any transition. |
| **P1** | **No Centralized Motion System** | Durations (`duration-100`, `duration-150`, `duration-200`, `duration-300`, `0.8s`) and easings are scattered ad hoc across components. | Inconsistent physical feel across modals, drawers, popovers, and buttons. |
| **P1** | **Modal & Command Palette Continuity** | `Modal.jsx` and `CommandPalette.jsx` return `null` immediately when closed (`if (!isOpen) return null;`), preventing exit transitions and abrupting spatial context. | Jarring disappearance on Escape / backdrop click. |
| **P1** | **Mobile Drawer & Sidebar Ergonomics (`Layout.jsx`)** | Mobile drawer (`L788–804`) uses `duration-300` linear/default easing and lacks `Escape` key dismissal. Desktop sidebar (`L421`) uses `duration-300` on `width`. | Sluggish drawer feel on mobile/Capacitor Android; missing keyboard parity. |
| **P2** | **Tactile Micro-Interactions & `transition-all` Overuse** | `Button.jsx` (`L45`), `CommandPalette.jsx` (`L402`), `ReportsDashboard.jsx` (`L158, L177`), `ThemeToggle.jsx` (`L43`), and `InfoTip.jsx` (`L54`) use `transition-all` (triggering unnecessary style checks) or `duration-300` instead of GPU-composited properties at 100–150ms. | Suboptimal frame pacing on low-end Android WebViews and inconsistent tactile feedback. |

---

## 2. Motion Architecture (`src/utils/motion.js`)

Create a single source of truth for Cenvora's Precision Obsidian motion grammar, bridging `DESIGN.md` (80–150ms operational speed) with `apple-motion-engineering` physics:

- **Durations (seconds for Framer Motion / ms tokens for CSS)**:
  - `instant`: `0.08` (80ms) — tactile press, hover state, immediate feedback
  - `fast`: `0.12` (120ms) — operational micro-transitions, popovers, tooltips, list highlights
  - `standard`: `0.15` (150ms) — modals, command palette, drawers, view entrances
  - `deliberate`: `0.22` (220ms) — larger mobile drawer slide
- **Easing Curves**:
  - `easeOut`: `[0.16, 1, 0.3, 1]` (Apple deceleration curve — crisp entry, zero overshoot)
  - `easeIn`: `[0.4, 0, 1, 1]` (clean exit)
  - `easeInOut`: `[0.22, 1, 0.36, 1]` (stateful toggle / sidebar)
- **Spring Presets (Critically / Near-Critically Damped — no playful bounce)**:
  - `responsive`: `{ type: 'spring', stiffness: 550, damping: 38, mass: 0.7 }`
  - `modal`: `{ type: 'spring', stiffness: 480, damping: 36, mass: 0.8 }`
  - `drawer`: `{ type: 'spring', stiffness: 420, damping: 38, mass: 0.9 }`
- **Variant Presets** (GPU-composited `opacity` + `transform` only):
  - `backdropVariants`, `modalSurfaceVariants`, `commandPaletteVariants`, `popoverVariants`, `drawerLeftVariants`
  - `reducedMotionTransition`: `{ duration: 0.01 }`

---

## 3. Prioritized Implementation Plan

### Step 1: Motion Tokens & Unit Tests (P1)
- Create `src/utils/motion.js` exporting durations, easings, springs, and Framer Motion variants.
- Create `tests/motion.test.mjs` (runnable via `node --test`) verifying:
  - All operational durations stay within snappy bounds (`<= 0.25s`).
  - Springs are critically/near-critically damped (no excessive bounce).
  - Variants only animate GPU-composited properties (`opacity`, `scale`, `x`, `y`).

### Step 2: Global Reduced-Motion & CSS Keyframes (P0)
- **`src/App.jsx`**: Wrap `<Router>` in `<MotionConfig reducedMotion="user">` from `framer-motion`.
- **`src/index.css`**:
  - Refine `.animate-fade-up` from `0.8s` (`translateY(20px)`) to `0.15s cubic-bezier(0.16, 1, 0.3, 1)` (`translateY(6px)`), matching `DESIGN.md` operational speed.
  - Add `@keyframes fade-in` and `.animate-fade-in` (`0.12s cubic-bezier(0.16, 1, 0.3, 1)`) so all 20+ existing usages work cleanly.
  - Add comprehensive `@media (prefers-reduced-motion: reduce)` rules for `.animate-fade-up`, `.animate-fade-in`, `.animate-pulse`, and `.glass-nav-item` / `.glass-sidebar`.

### Step 3: Remove Forbidden `hover:-translate-y-1` (P0)
- **`src/components/FinancialDashboard.tsx`**: Replace `transition-all hover:shadow-md hover:-translate-y-1` with `transition-[border-color,box-shadow] duration-150 hover:border-slate-600 hover:shadow-md` per `DESIGN.md` §5.
- **`src/components/3d/HeroPrismCanvas.jsx`**: Replace `transform hover:-translate-y-1 transition-all` on fallback cards with `transition-[border-color,box-shadow] duration-150 hover:border-sky-400/50 hover:shadow-sky-500/10` (and `emerald-400/50`).

### Step 4: Upgrade Core Interactive Primitives (P1 / P2)
- **`src/components/common/Modal.jsx`**: Use `AnimatePresence` + `motion.div` with `backdropVariants` and `modalSurfaceVariants` for GPU-composited enter/exit without breaking `useEscKey`, `document.body.style.overflow`, or `ConfirmDialog` focus timing.
- **`src/components/common/CommandPalette.jsx`**: Replace broken `animate-in fade-in zoom-in-95` with `AnimatePresence` + `motion.div` (`commandPaletteVariants`), and replace `transition-all` on items with `transition-colors duration-100`.
- **`src/components/common/Button.jsx`**: Narrow `transition-all duration-150` to `transition-[transform,background-color,border-color,box-shadow,filter,opacity] duration-100` and add `motion-reduce:active:scale-100 motion-reduce:transition-none`.
- **`src/components/common/ThemeToggle.jsx`**: Tighten thumb transition to `duration-150` with `motion-reduce:transition-none`.
- **`src/components/common/InfoTip.jsx`**: Add subtle `100ms` CSS opacity/scale reveal (`animate-fade-in`) on the floating tooltip.
- **`src/components/common/OfflineBanner.jsx`**: Add `motion-reduce:animate-none` to the pulsing icon and `duration-150` on the banner.
- **`src/components/Layout.jsx`**: Tighten desktop sidebar & mobile drawer transitions from `duration-300` to `duration-150` / `duration-200` with `ease-[cubic-bezier(0.22,1,0.36,1)]`, add `motion-reduce:transition-none`, and add `Escape` key handler to close the mobile drawer.
- **`src/pages/reports/ReportsDashboard.jsx`**: Replace `transition-all duration-300 hover:scale-[1.02]` with `DESIGN.md`-compliant `transition-[border-color,box-shadow,transform] duration-150 hover:border-[var(--accent-primary)]/50 hover:shadow-md active:scale-[0.98] motion-reduce:active:scale-100`.

---

## 4. Verification Criteria
1. `npm run build` completes with zero errors.
2. `node --test tests/motion.test.mjs` passes 100% of motion token & variant assertions.
3. `rg "hover:-translate-y-1" src/` returns zero matches.
4. `MotionConfig reducedMotion="user"` is active at the application root, and `@media (prefers-reduced-motion: reduce)` covers custom CSS animations.
5. All business logic, API calls, TanStack Query `isPending` states, and keyboard shortcuts (`Esc`, `Cmd+K`, `Tab`) remain intact.
