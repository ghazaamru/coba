---
name: Ledger XP
description: Technical Precision financial journal and expense tracking interface. Dark monochrome canvas with monospace financial alignments, high-density ledger rows, and disciplined categorical accents.
tokens:
  colors:
    background: "#09090b" # zinc-950
    surface: "#18181b"    # zinc-900
    surface-subtle: "#27272a" # zinc-800
    border: "#27272a"     # zinc-800
    border-subtle: "#18181b" # zinc-900
    text-primary: "#f4f4f5" # zinc-100
    text-secondary: "#a1a1aa" # zinc-400
    text-muted: "#71717a" # zinc-500
    inflow: "#22c55e"     # green-500 / emerald-400
    outflow: "#f43f5e"    # rose-500
    categories:
      food: "#f59e0b"
      groceries: "#10b981"
      transportation: "#3b82f6"
      housing: "#6366f1"
      healthcare: "#ec4899"
      entertainment: "#8b5cf6"
      shopping: "#14b8a6"
      income: "#22c55e"
      investments: "#06b6d4"
      other: "#71717a"
  typography:
    sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
  radii:
    sm: "0.375rem" # 6px
    md: "0.5rem"   # 8px
    lg: "0.75rem"  # 12px
    full: "9999px"
  spacing:
    container: "56rem" # max-w-4xl (896px)
---

# Design System: Ledger XP

## 1. Overview & Atmosphere
Ledger XP is a personal finance interface styled with **Technical Precision**. It prioritizes high data density, tabular monospace numerical alignment, zero-latency feedback, and an uncluttered dark zinc canvas. The design communicates speed, local data sovereignty, and audit-grade financial tracking.

## 2. Color & Hierarchy
- **Canvas (`#09090b`)**: Deep zinc background minimizing optical fatigue and creating high contrast against numeric readouts.
- **Surfaces & Cards (`#18181b` / `#27272a`)**: Subtle contrast levels for cards, segmented bars, and date groupings with crisp 1px borders.
- **Financial Status Colors**:
  - **Inflow / Credit**: `#22c55e` (Emerald/Green) — used for positive net balances, income entries, and active network pills.
  - **Outflow / Debit**: `#f43f5e` (Rose) — used for expenses and deficit indicators.
- **Categorical Palette**: Discrete hues assigned per expense domain (`#f59e0b`, `#10b981`, `#3b82f6`, `#6366f1`, `#ec4899`, `#8b5cf6`, `#14b8a6`, `#06b6d4`, `#71717a`) to support glanceable categorical distribution bars.

## 3. Typography & Numerical Layout
- **Body & Controls**: Clean UI sans-serif for UI labels, category titles, and navigation triggers.
- **Financial Metrics & Tables**: Strict monospace (`font-mono`) with `tabular-nums` enabled for all currency amounts, dates, percentages, and metrics to prevent horizontal jitter during updates.
- **Hierarchy**:
  - Metric Values: `2xl` (`1.5rem`), bold, mono.
  - Section Headings: `xs` (`0.75rem`), uppercase, `tracking-wider`, font-semibold.
  - Date Headers: `xs` (`0.75rem`), mono, font-semibold.
  - Secondary Metadata: `11px` (`0.6875rem`), mono, `text-zinc-500`.

## 4. Spacing & Visual Rhythm
- **Page Wrapper**: Max width `max-w-4xl` (`896px`) centered with `px-4 py-6` padding.
- **Card Spacing**: `p-4` to `p-5` with `gap-3` between metric blocks.
- **Dense Transaction Rows**: Height ~48px (`p-3.5`) with full-bleed divider borders (`border-zinc-800/40`).

## 5. Shapes & Elevation
- **Cards & Modals**: `rounded-xl` (`12px`) with `border border-zinc-800`.
- **Badges & Tags**: `rounded-md` (`6px`) with 1px zinc borders.
- **Floating Actions**: `rounded-full` with high-contrast inverted styling (`bg-zinc-100 text-zinc-950`).
- **Shadows**: Restrained elevation (`shadow-xs` / `shadow-2xl` on modal backdrop).

## 6. Components & Interactive Patterns
- **Summary Cards**: Three-metric grid showing Net Position, Total Inflow, and Total Outflow.
- **Segmented Distribution Bar**: Proportional stacked horizontal progress bar visualizing category allocation.
- **Date-Grouped Activity Stream**: Chronological postings grouped by transaction date with daily income/expense sub-totals.
- **Fast Entry Modal / Sheet**: Quick-record form with inline type toggle, formatted numeric input, and instant local commitment.
- **Offline / Sync Pill**: Real-time navigator status pill with pulsing indicator on offline detection.

## 7. Rules & Anti-Patterns
- **Do**: Always use `font-mono tabular-nums` for numeric financial values.
- **Do**: Keep border lines crisp (`border-zinc-800`) and avoid blurry, high-spread dropshadows.
- **Don't**: Use decorative gradients or low-contrast washed-out grays on critical numeric text.
- **Don't**: Introduce slow floating transitions or bouncy easing curves into ledger list items.
