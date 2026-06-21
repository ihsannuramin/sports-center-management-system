# Implement Design v2 (rams v2 / Kuyy Playful Booking)

## Goal
Apply the `design.v2.md` design system across the entire frontend: system font stack, semantic color tokens, pill-shaped controls, 8px card radius, typography classes, and new components (Chip, StatPill). Never break existing functionality.

## Current State
- **Tokens already defined** in `globals.css`: all colors (primary #FF710B, tertiary #656565, on-surface #101010, primary tints, neutral #E5E7EB, border #DBDBDB), typography classes (headline-display → nav-md), radius scale (sm 4px, md 8px, lg 12px, xl 16px, 4xl 9999px).
- **Components and pages use raw classes** instead of tokens: 247+ instances of `text-gray-*`, `bg-gray-*`, `border-gray-*`, `text-orange-*`, `bg-orange-*` across 12+ files, plus 28 dashboard client components.
- **Login page** (`auth/login/page.tsx`) is already migrated — uses `text-tertiary`, `text-on-surface`, `title-lg`, `body-md`, etc. This is the reference pattern.
- **Font**: Geist Sans loaded via `next/font/google`. Spec wants system font stack.

---

## Phase 1: Foundation

### 1.1 `src/app/globals.css`
- **Font**: Add to `:root`:
  ```css
  --font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  ```
- **Spacing tokens**: Add to `:root`:
  ```css
  --spacing-xs: 2px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 80px;
  --spacing-gutter: 24px;
  ```
- **Update `@theme inline`**: Change `--font-mono: var(--font-geist-mono)` → `--font-mono: var(--font-mono)`.
- **Update component classes** in `@layer components` to use semantic tokens:
  - `.data-card`: `bg-white rounded-xl border-gray-100` → `bg-surface rounded-md border-neutral shadow-sm`
  - `.section-label`: `text-gray-400` → `text-tertiary`
  - `.card-hover`: `hover:border-orange-100` → `hover:border-primary-20`
  - `.table-row-hover`: `hover:bg-gray-50/60` → `hover:bg-muted/60`
  - `.table-sticky-head`: `bg-gray-50/95` → `bg-muted/95`
  - `.empty-state-icon`: `text-gray-200` → `text-muted-foreground/40`
  - `.empty-state-title`: `text-gray-500` → `text-tertiary`
  - `.empty-state-desc`: `text-gray-400` → `text-muted-foreground`
  - `.required-mark`: `text-red-500` → `text-destructive`
- **Add new component classes**:
  ```css
  .chip { @apply inline-flex items-center h-8 px-3 rounded-full bg-surface text-tertiary border border-border text-[10px] font-bold transition-colors; }
  .chip-active { @apply inline-flex items-center h-8 px-3 rounded-full bg-primary text-surface text-[10px] font-bold transition-colors; }
  .stat-pill { @apply inline-flex items-center h-8 px-3 rounded-full bg-surface text-on-surface text-[12px] font-bold border border-neutral transition-colors; }
  ```

### 1.2 `src/app/layout.tsx`
- Remove `Geist` import from `next/font/google`
- Remove `geistSans` variable and `${geistSans.variable}` from `<html>` className
- Update `themeColor` from `#f97316` to `#FF710B` (exact spec primary)
- Update skip-link: `focus:bg-orange-500` → `focus:bg-primary`

---

## Phase 2: Core UI Components

### 2.1 `src/components/ui/button.tsx`
- Change base class from `rounded-lg` to `rounded-full` (pill shape per spec: "Full-pill corners dominate interactive elements")
- Keep all size variants (h-8, h-7, h-9, h-14) — the `xl` size (h-14 = 56px) already matches spec's button-primary height
- Update `default` variant hover: `hover:bg-primary/80` → `hover:bg-primary-80` (spec's pressed color)

### 2.2 `src/components/ui/card.tsx`
- Change `rounded-lg` to `rounded-md` (8px per spec: "Cards use a modest 8px radius")
- Change `border-border-default/50` to `border-neutral` (spec: "1px neutral border")
- Keep `shadow-sm` (spec: "light shadow")

### 2.3 `src/components/ui/chip.tsx` (NEW)
- Create Chip component with cva variants: `default` (white bg, tertiary text, border) and `active` (primary bg, white text)
- 32px height (`h-8`), pill shape (`rounded-full`), `label-sm` typography (10px bold)
- Props: `active?: boolean`, `onClick?`, standard button props
- Use `@base-ui/react/button` as primitive (consistent with Button)

### 2.4 `src/components/ui/stat-pill.tsx` (NEW)
- Create StatPill component for proof points (community counts, totals)
- 32px height (`h-8`), pill shape (`rounded-full`), `label-md` typography (12px bold)
- White bg, on-surface text, neutral border
- Props: `value: string | number`, `label?: string`, optional icon

### 2.5 `src/components/ui/table.tsx`
- `bg-gray-50/50` → `bg-muted/50`

### 2.6 `src/components/ui/empty-state.tsx`
- `bg-gray-50` → `bg-muted/50`
- `border-gray-100` → `border-neutral`
- `text-gray-300` → `text-muted-foreground/40`
- `text-gray-600` → `text-tertiary`
- `text-gray-400` → `text-muted-foreground`

### 2.7 `src/components/ui/data-pagination.tsx`
- `border-gray-100` → `border-neutral`
- `bg-gray-50/40` → `bg-muted/40`
- `text-gray-500` → `text-tertiary`
- `text-gray-400` → `text-muted-foreground`
- `text-gray-600` → `text-foreground`
- `text-gray-900` → `text-on-surface`
- `border-gray-200` → `border-border`
- `hover:text-gray-900` → `hover:text-on-surface`

---

## Phase 3: Layout Components

### 3.1 `src/components/layout/app-sidebar.tsx`
Replace all raw color classes with semantic tokens:

| Raw | Semantic |
|-----|----------|
| `border-gray-100/80` | `border-neutral` |
| `from-orange-500 to-orange-600` | `from-primary to-primary-80` |
| `shadow-orange-200/50` | `shadow-primary/20` |
| `text-gray-900` | `text-on-surface` |
| `text-gray-400` | `text-tertiary` |
| `bg-orange-50` | `bg-primary-10` |
| `text-orange-700` | `text-primary` |
| `before:bg-orange-500` | `before:bg-primary` |
| `text-orange-500` | `text-primary` |
| `text-gray-500` | `text-tertiary` |
| `hover:bg-gray-50` | `hover:bg-muted/50` |
| `hover:text-gray-800` | `hover:text-on-surface` |
| `text-orange-400/70` | `text-primary/70` |
| `text-gray-400/80` | `text-tertiary/80` |
| `hover:text-red-500` | `hover:text-destructive` |
| `hover:bg-red-50` | `hover:bg-destructive/10` |
| `group-hover:text-red-400` | `group-hover:text-destructive` |

### 3.2 `src/components/layout/header.tsx`
Same mapping as sidebar, plus:
- `bg-white/95` → `bg-surface/95`
- `ring-orange-400/50` → `ring-primary/50`
- `ring-orange-100` → `ring-primary-10`
- `bg-orange-50` → `bg-primary-10`
- `text-orange-600` → `text-primary`
- `hover:bg-orange-50` → `hover:bg-primary-10`
- `hover:text-red-500/600` → `hover:text-destructive`
- `hover:bg-red-50` → `hover:bg-destructive/10`

---

## Phase 4: Public Pages

### 4.1 `src/app/booking/booking-client.tsx` (100 raw color instances)
This is the most extensive restyle. Key changes:
- **Background**: `bg-gradient-to-br from-orange-50 via-white to-blue-50` → `bg-gradient-to-br from-primary-10 via-surface to-primary-10/30`
- **Header**: `bg-white border-gray-100` → `bg-surface border-neutral`
- **Logo**: `from-orange-500 to-orange-600` → `from-primary to-primary-80`; `shadow-orange-200` → `shadow-primary/20`
- **Cards**: `rounded-2xl border-gray-100` → `rounded-md border-neutral`
- **Inputs**: `rounded-xl border-gray-200 focus:ring-orange-400` → `rounded-full border-border focus:ring-primary`
- **Selects**: `rounded-xl border-gray-200` → `rounded-lg border-border`
- **Buttons**: `bg-orange-500 hover:bg-orange-600 rounded-xl` → `bg-primary hover:bg-primary-80 rounded-full`
- **Active court card**: `border-orange-400 bg-orange-50` → `border-primary bg-primary-10`
- **Price text**: `text-orange-600` → `text-primary`
- **Status badges**: Keep status colors (green/red/amber/blue) — they're semantic status indicators
- **Info box**: `bg-blue-50 border-blue-100 text-blue-700` → keep (informational, not brand)
- **All `text-gray-*`**: Apply standard mapping (see Phase 6 table)
- **Typography**: Add `headline-sm` to main heading, `body-md` to descriptions, `label-md` to form labels

### 4.2 `src/app/register/register-client.tsx` (81 raw color instances)
Same treatment as booking-client.tsx:
- Cards: `rounded-2xl border-gray-100` → `rounded-md border-neutral`
- Inputs: `rounded-xl border-gray-200 focus:ring-orange-400` → `rounded-full border-border focus:ring-primary`
- Buttons: `bg-orange-500 hover:bg-orange-600 rounded-xl` → `bg-primary hover:bg-primary-80 rounded-full`
- Step indicator: `bg-orange-500` → `bg-primary`; `bg-gray-100 text-gray-400` → `bg-muted text-muted-foreground`
- Summary box: `bg-orange-50 border-orange-100` → `bg-primary-10 border-primary-20`
- All `text-gray-*` → semantic tokens per mapping table

### 4.3 `src/app/auth/login/page.tsx`
Already mostly migrated. Fix remaining:
- `shadow-gray-100/80` → `shadow-neutral/40`
- `border-gray-100` → `border-neutral`
- `text-gray-700` → `text-foreground`
- `text-gray-900` → `text-on-surface`
- `bg-gray-50/50` → `bg-muted/50`
- `shadow-orange-200/60` → `shadow-primary/20`
- `text-red-500` → `text-destructive`

### 4.4 `src/app/auth/reset-password/page.tsx`
- `text-gray-600` → `text-tertiary`
- `bg-orange-500 hover:bg-orange-600` → `bg-primary hover:bg-primary-80`
- `rounded-md` → `rounded-full` (pill shape for button)

---

## Phase 5: Dashboard Core

### 5.1 `src/app/dashboard/page.tsx`
- **KPI card borders**: `border-blue-100`, `border-green-100`, `border-orange-100`, `border-purple-100` → all `border-neutral` (spec: "1px neutral border")
- **Icon backgrounds**: Keep colored (bg-blue-50, bg-green-50, etc.) — these are data viz, not brand
- **All `text-gray-*`**: Apply standard mapping
- **All `text-orange-*` / `bg-orange-*`**: Apply standard mapping
- **Alert bar**: `bg-amber-50 border-amber-200` → keep (warning status)
- **Court status badges**: Keep status colors (green/red/blue/orange) — semantic status
- **Date text**: `text-gray-400` → `text-muted-foreground`
- **Revenue card**: `border-blue-50` → `border-neutral`; dot colors keep
- **Unpaid card**: `border-red-50` → `border-neutral`; `text-red-500` → `text-destructive`
- **BI KPI cards**: `border` → `border-neutral`; status badges keep colors
- **Links**: `text-orange-500 hover:text-orange-600` → `text-primary hover:text-primary-80`

### 5.2 `src/components/dashboard/charts.tsx`
- `border-gray-100` → `border-neutral`
- `text-gray-700` → `text-foreground`
- `text-gray-500` → `text-tertiary`
- `text-gray-400` → `text-muted-foreground`
- `text-gray-800` → `text-on-surface`
- Tooltip backgrounds: `bg-white border-gray-100` → `bg-surface border-neutral`

### 5.3 `src/components/schedule/calendar-view.tsx`
- `bg-gray-100 text-gray-700` → `bg-muted text-foreground`

---

## Phase 6: All 28 Dashboard Client Components

Files (28): `waitlists-client`, `users-client`, `trial-classes-client`, `students-client`, `settings-client`, `rentals-client`, `promos-client`, `payroll-client`, `payments-client`, `parents-client`, `notifications-client`, `maintenance-client`, `leads-client`, `invoices-client`, `inventory-client`, `expenses-client`, `documents-client`, `courts-client`, `coaches-client`, `classes-client`, `branches-client`, `attendance-client`, `assets-client`, `assessments-client`, `approvals-client`, `reports-client`, `memberships-client`, `activity-log-client`.

### Standard Color Mapping (apply to ALL files)

**Gray → Semantic:**
| Raw Class | Replacement |
|-----------|-------------|
| `text-gray-900` | `text-on-surface` |
| `text-gray-800` | `text-on-surface` |
| `text-gray-700` | `text-foreground` |
| `text-gray-600` | `text-foreground` |
| `text-gray-500` | `text-tertiary` |
| `text-gray-400` | `text-muted-foreground` |
| `text-gray-300` | `text-muted-foreground/50` |
| `text-gray-200` | `text-muted-foreground/30` |
| `bg-white` | `bg-surface` |
| `bg-gray-50` | `bg-muted/50` |
| `bg-gray-100` | `bg-muted` |
| `border-gray-100` | `border-neutral` |
| `border-gray-200` | `border-border` |
| `hover:bg-gray-50` | `hover:bg-muted/50` |
| `hover:bg-gray-100` | `hover:bg-muted` |
| `hover:text-gray-700` | `hover:text-foreground` |
| `hover:text-gray-800` | `hover:text-on-surface` |
| `hover:text-gray-900` | `hover:text-on-surface` |

**Orange → Semantic:**
| Raw Class | Replacement |
|-----------|-------------|
| `text-orange-500` | `text-primary` |
| `text-orange-600` | `text-primary` |
| `text-orange-700` | `text-primary` |
| `bg-orange-50` | `bg-primary-10` |
| `bg-orange-500` | `bg-primary` |
| `bg-orange-600` | `bg-primary-80` |
| `border-orange-100` | `border-primary-20` |
| `border-orange-200` | `border-primary-20` |
| `border-orange-400` | `border-primary` |
| `ring-orange-400` | `ring-primary` |
| `from-orange-500` | `from-primary` |
| `to-orange-600` | `to-primary-80` |
| `shadow-orange-200` | `shadow-primary/20` |
| `hover:bg-orange-50` | `hover:bg-primary-10` |
| `hover:bg-orange-600` | `hover:bg-primary-80` |
| `hover:text-orange-600` | `hover:text-primary` |
| `hover:text-orange-700` | `hover:text-primary` |
| `hover:border-orange-200` | `hover:border-primary-20` |

**Red → Destructive:**
| Raw Class | Replacement |
|-----------|-------------|
| `text-red-500` | `text-destructive` |
| `text-red-600` | `text-destructive` |
| `bg-red-50` | `bg-destructive/10` |
| `border-red-100` | `border-destructive/20` |
| `hover:text-red-500` | `hover:text-destructive` |
| `hover:bg-red-50` | `hover:bg-destructive/10` |

**Keep as-is (status/data-viz colors):**
- `bg-green-50`, `text-green-500/600/700`, `border-green-100` — success status
- `bg-amber-50`, `text-amber-500/600/700`, `border-amber-100` — warning status
- `bg-blue-50`, `text-blue-500/600/700`, `border-blue-100` — info status
- `bg-purple-50`, `text-purple-500/600/700` — category indicator
- `bg-teal-50`, `text-teal-500/600/700` — category indicator
- `bg-indigo-50`, `text-indigo-500` — category indicator

**Also apply to each file:**
- Form inputs using `rounded-lg` or `rounded-xl` with raw border colors → `rounded-full border-border` (pill shape per spec for inputs)
- Buttons using raw `bg-orange-500` → use `<Button>` component or `bg-primary rounded-full`
- Cards using `rounded-xl` or `rounded-2xl` → `rounded-md` (8px per spec)
- Section headings → add `headline-sm` or `title-lg` typography class
- Body text → add `body-md` class
- Labels → add `label-md` or `label-sm` class

---

## Verification

1. **Build**: `npm run build` — must succeed with no errors
2. **Lint**: `npm run lint` — must pass
3. **Visual check** — manually verify:
   - Login page: pill-shaped inputs/buttons, orange primary, semantic text colors
   - Dashboard: KPI cards with neutral borders, orange active states, semantic text
   - Sidebar: orange active state using `bg-primary-10 text-primary`, neutral borders
   - Header: semantic tokens, no raw gray/orange
   - Booking page: pill inputs/buttons, 8px card radius, orange CTAs, system font
   - Register page: same as booking
   - 2-3 dashboard sub-pages (e.g., students, invoices, courts): semantic tokens, no raw colors
4. **Font**: Verify system font stack renders (no Geist Sans network request)
5. **Dark mode**: Toggle dark mode — tokens should adapt (dark mode vars already defined)
6. **Functionality**: Test login flow, booking flow, dashboard navigation — nothing broken
