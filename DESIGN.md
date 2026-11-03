# Design System: Cenvora Precision Obsidian

## 1. Physical Ground & Atmosphere
- **Canvas Base**: Deep Obsidian (`#090a0f` / `bg-black` / `bg-slate-950`). Zero glare for 8+ hour operational shifts.
- **Surface Elevation**:
  - `Level 0 (Canvas)`: `#090a0f`
  - `Level 1 (Card / Sidebar / Panel)`: `#0f172a` with hairline border `border-slate-800/80` or `border-white/10`
  - `Level 2 (Input / Data Grid Cell / Modal)`: `#1e293b` with soft backdrop blur `backdrop-blur-xl`
  - `Level 3 (Dropdown / Popover / Tooltip)`: `#0f172a` elevated with `shadow-2xl shadow-black/80` and `border-slate-700`
- **Border Philosophy**: Precision engineered hairlines (1px solid, subtle opacity `0.08` to `0.15`). No thick neon outlines.

## 2. Color Architecture & Semantic Roles
- **Primary Sovereign Accent**: Technical Cobalt / Blue (`#2563eb` default, hover `#1d4ed8`, active `#1e40af`). Used strictly for primary calls-to-action, active selection rings, and key focus states.
- **Financial Status Semantics**:
  - `Inflow / Paid / Credit / Active`: Clean Emerald (`text-emerald-400`, `bg-emerald-500/10`, `border-emerald-500/20`).
  - `Outflow / Unpaid / Debit / Danger`: Precision Ruby (`text-rose-400`, `bg-rose-500/10`, `border-rose-500/20`).
  - `Pending / Partial / Draft / Warning`: Crisp Amber (`text-amber-400`, `bg-amber-500/10`, `border-amber-500/20`).
  - `Converted / Processed`: Technical Indigo (`text-indigo-400`, `bg-indigo-500/10`, `border-indigo-500/20`).
- **Forbidden Color Practices**:
  - Absolute ban on gratuitous neon cyan-to-purple background gradients.
  - No using green or red for purely decorative non-financial accents.

## 3. Typographic Hierarchy & Monospace Figures
- **Interface Wayfinding Font**: Modern geometric grotesque system stack (`system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Plus Jakarta Sans`, `sans-serif`).
- **Numerical & Financial Figures**:
  - **Mandatory**: All currency values, unit rates, quantities, HSN codes, and invoice numbers must apply tabular numbers (`font-variant-numeric: tabular-nums` or `font-mono`).
  - Alignment rule: Currency and quantitative columns in tables must always right-align (`text-right`) to preserve decimal place vertical alignment.
- **Labels & Microcopy**:
  - Form labels: `text-xs font-semibold text-slate-400 uppercase tracking-wider`.
  - Helper & error text: `text-xs font-medium text-slate-400`, immediate red `text-rose-400` on validation error.

## 4. Dynamic Density & Layout Architecture
- **Summary Tier (Dashboard & Analytics)**:
  - Generous card padding (`p-6`), rounded corners (`rounded-2xl`), clear visual breathing room between KPI blocks.
- **Operational Data Tier (Invoice Line Items & Ledger Grids)**:
  - Compact row heights (36-40px per item).
  - Pinned column widths for predictable multi-line item entry.
  - Zero-waste vertical whitespace; maximizing rows per screen so accountants can review 15+ entries without excessive scrolling.
- **Universal Command Palette**:
  - Keyboard accessible via `Cmd+K` / `Ctrl+K`.
  - Fuzzy-search routing to every page and quick creation action.

## 5. Micro-Physics, Touch & Motion Grammar
- **Transition Speed**: Snappy 80ms - 120ms (`duration-100` / `duration-150`). No slow, sluggish 300ms+ animations on operational elements.
- **Tactile Click Feel**: Every clickable button and interactive row card applies physical press compression (`active:scale-[0.98]`).
- **Haptic Touch**: Trigger subtle micro-haptics (`navigator.vibrate(8)`) on supported mobile devices when tapping primary action buttons.
- **Focus Rings**: Accessible, high-contrast `:focus-visible` rings (`ring-2 ring-blue-500/60 ring-offset-2 ring-offset-slate-950`).
- **Zero Layout Shifts**: Never translate cards on hover (`hover:-translate-y-1` is strictly forbidden). Use subtle border brightening (`hover:border-slate-600`) and soft shadow expansion instead.

## 6. Component Contracts & Anti-Pattern Bans
- **Buttons**:
  - Must use TanStack Query v5 `isPending` state to disable actions during active network transactions.
  - Must maintain fixed geometry when loading (spinner inside or overlaid, preventing button resize).
- **Forms**:
  - Must include `useUnsavedPrompt` protection with debounced session autosave on extensive multi-field forms (Sales/Purchase).
- **Empty States**:
  - Never render plain text "No data found". Must use `<EmptyState icon={...} title={...} description={...} onAction={...} />`.
- **Modals & Dialogs**:
  - Must support keyboard Escape dismissal, body scroll lock, and default focus to "Cancel" on destructive confirmations.
