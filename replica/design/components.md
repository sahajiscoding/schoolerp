# Components — Pacific World School ERP clone (olive lock)

> OLIVE LOCK (owner decision 2026-11-07): all accent roles resolve to the live-DOM
> olive scale — primary `#5A6638` (hsl 76,29%,31%), accent-2 `#7C8D4E` (43%),
> ring `#687641` (36%), hover `#FE1616` (hsl 0,99%,54%), on-accent white.
> Dark chrome measured at `hsl(222.2,84%,4.9%)` ≈ `#020817` (see `tokens.json`
> `_referenceDark`). Source of truth: `packages/shared/src/theme.ts` +
> `apps/admin/tailwind.config.cjs` (`brand.*`); legacy `navy`/`olive` = primary,
> `terracotta` = accent-2.

Button
  variants  primary (bg accent, text on-accent), secondary (accent-2), outline, ghost, danger (bg hover-primary)
  sizes     sm (px-3 py-1.5 text-xs), md (px-4 py-2 text-sm), lg (px-6 py-3 text-base)
  states    default, hover (primary→hover-primary red; accent-2→primary), active, focus-visible (2px ring, ring 40%),
            disabled (opacity-50), loading (label preserved, e.g. "Logging in...")
  tokens    bg accent, text on-accent, radius 8, Roboto sm/500
  a11y      real <button>, visible focus, aria-expanded on toggles
  used on   S01, S04, S07, S08, S11, S13, S15, S18, S20, S22, S23, S25

StatCard
  variants  count + label + trend
  states    default, loading skeleton
  tokens    bg surface, border slate-200, text ink, muted text-muted, radius 12, shadow card
  used on   S03

Data table (Table / TableHeader / TableRow / TableHead / TableCell)
  variants  dense, striped-optional, padded=false wrapper for Card
  states    filled, empty ("No ... yet."), loading
  tokens    text sm, border slate-200/dark slate-800
  used on   S04, S10, S13, S15, S18, S20, S21

Card / CardHeader
  variants  padded, header/footer slots
  states    default
  tokens    bg white / dark slate-800, border slate-200, radius 12, shadow-sm
  used on   S03, S06, S12, S17, S19

Badge
  variants  default, olive, terracotta, navy, accent, success, warning, pending, danger, holiday, neutral
  states    default
  tokens    pill radius, text xs/500
  used on   S03, S10, S13, S14, S15

Dialog (Radix)
  states    open, validation error
  tokens    bg surface, shadow pop, radius 12-16
  used on   S08, S14

Tabs (Radix)
  states    active (accent underline), disabled
  used on   S08, S25

Avatar + dropdown (Radix)
  states    open, closed; initials from fullName
  used on   S02 (profile menu), S01 (account picker)

Notification badge + dropdown
  states    none, dot, count; popover list
  used on   S02

Calendar (month grid)
  states    filled, empty
  used on   S06

E-book card (DigitalLibrary)
  states    default, empty ("No e-books yet.")
  note      "Open e-book" is currently a no-op — punch list item
  used on   S12

Album card (SchoolGallery)
  states    default, empty ("No albums yet.")
  used on   S16, S17 (viewer: Prev/Next media links)

Progress / gauge
  states    default
  used on   S05 (bars), S14 (radial)

Inputs (email/password/search)
  states    default, focus (ring 40%), error, disabled
  tokens    border-input, ring on focus-visible
  used on   S01, S08, S11, S12
