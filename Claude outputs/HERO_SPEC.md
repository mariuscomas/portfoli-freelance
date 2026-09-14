# Hero Component Specification

## Design System Alignment

**Padding Rhythm Resolved:** The design uses a consistent `24 / 48 / 96` padding rhythm across all three breakpoints, as verified from the canvas design files.

### Verified Measurements from Design Canvas

| Breakpoint | Width | Left/Right Padding | Tailwind Class |
|------------|-------|-------------------|-----------------|
| Mobile | 390px | 24px | `px-6` |
| Tablet | 810px | 48px | `md:px-12` |
| Desktop | 1440px | 96px | `lg:px-24` |

**Source:** Extracted from Main.dc.html (desktop), Tauleta.dc.html (tablet), Mobil.dc.html (mobile)

---

## Layout Structure

### Desktop (1440px)
```
┌─── 96px ──────────────────────────────────────────────────────────────────── 96px ───┐
│                                                                                        │
│  H1 · Estratègia. Disseny. Impacte.                          [Reactive Field]        │
│                                                               560px × 684px           │
│  Claim text                                                   left: 880px, top: 96px  │
│  CTA link                                                     z-index: 0              │
│                                                                                        │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  CA    Product Design · Branding & Identity · Mobile App · UI/UX Audit · Website   │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────┘
```

**Horizontal Layout:**
- Left content column: width 744px, left: 96px, centered vertically
- Reactive field: 560px width, left: 880px (1440 - 560 = 880px from left edge)
- Spacing between content and field: ~16px gap

### Tablet (810px)
```
┌─── 48px ──────────────────────────────────────────────── 48px ───┐
│                                                                    │
│  H1 · Estratègia.                         [Reactive Field]        │
│      Disseny.                             (repositioned)           │
│      Impacte.                                                      │
│                                                                    │
│  Claim text                                                        │
│  CTA link                                                          │
│                                                                    │
│  ─────────────────────────────────────────────────────────────  │
│  CA    Product Design · Branding & Identity · Mobile App · ... │
│                                                                    │
└────────────────────────────────────────────────────────────────┘
```

**Changes:**
- Reactive field repositions (column layout adjusts)
- Same 48px padding rhythm maintained

### Mobile (390px)
```
┌─ 24px ──────────────────────────────────────── 24px ─┐
│                                                       │
│  H1 · Estratègia. Disseny. Impacte.                 │
│                                                       │
│  Claim text                                           │
│  CTA link                                             │
│                                                       │
│  ─────────────────────────────────────────────────  │
│  [Reactive Field]                                     │
│  (below headline)                                     │
│                                                       │
│  CA    Product Design · Branding &...               │
│                                                       │
└───────────────────────────────────────────────────┘
```

**Changes:**
- Reactive field moves from right column to full-width band below headline
- Cursor ring disabled on touch devices (`pointer:coarse`)
- Field reference point animates autonomously (no cursor input)
- When dragging/touching: field follows touch input

---

## Text & Typography

### Heading (H1)
- **Class:** `.text-display-h1`
- **DS Scale:** 32px (mobile) / 64px (tablet) / 112px (desktop)
- **Line Height:** 1 (1.0)
- **Letter Spacing:** -1px (mobile) / -3px (tablet & desktop)
- **Font:** Bricolage Grotesque, 600 weight

### Claim Text
- **Font Size:** 24px (stays consistent across breakpoints)
- **Line Height:** 1.35
- **Color:** var(--text-secondary) / #444749
- **Max Width:** 520px
- **Margin Top:** 44px (from H1)

### CTA Link
- **Font Size:** 20px
- **Font Weight:** 500
- **Min Height:** 44px (touch target)
- **Gap to Icon:** 12px
- **Underline:** 1px solid border-bottom, 3px padding

### Footer / Disciplines
- **Class:** `.eyebrow`
- **Font Size:** 14px
- **Font Weight:** 500
- **Letter Spacing:** 1px
- **Text Transform:** uppercase
- **Gap (CA toggle to disciplines):** 14px
- **Gap (disciplines to CTA):** 40px (desktop)

---

## Reactive Field Specifications

### Dot Grid
- **Dot Size:** 3px × 3px (border-radius: 100%)
- **Grid Gap:** 32px
- **Field Dimensions:** 560px wide × 684px high
- **Fade Gradient:** 
  - Left fade: 210px (smoothstep)
  - Right fade: 0px (no fade)
  - Top fade: 150px (smoothstep)
  - Bottom fade: 150px (smoothstep)
- **Resting Opacity:** 16% + (weight × 0%)
- **Color:** #0b0b0b

### Physics
- **Magnet Radius:** 170px (distance from cursor/reference point)
- **Magnet Strength (default):** 30px (configurable, range 0-60px)
- **Repel Force:** Inversely proportional to distance
- **Letter Aberration (Coral/Teal):**
  - Coral: #f96057
  - Teal: #1d9e75
  - Shadow blur: proportional to proximity strength

### Behavior
**Desktop/Tablet (with pointer):**
- Reference point follows cursor when active
- When inactive (pointer leave): autonomously animates across viewport
  - Horizontal: `sin(t × 0.00042) × width × 0.46`
  - Vertical: `sin(t × 0.00097) × height × 0.30`
- Dots and letters update every frame (60fps target)

**Mobile (touch / `pointer: coarse`):**
- Cursor ring disabled (`opacity: 0`)
- Reference point autonomously animates
- On touch/drag: field follows touch input instead
- Field layout shifts to full-width band below headline

### Performance
- **Settled Optimization:** Dots at rest (drift < 0.05px, alpha < 0.005) skip DOM updates
- **Will-change:** transform, opacity
- **No canvas/SVG:** All dots are native `<div>` elements for best compatibility

---

## Code Fixes Required

### Padding Classes
**Current (WRONG):**
```jsx
<div className="px-4 md:px-8 lg:px-24">
```

**Corrected (matches 24/48/96 rhythm):**
```jsx
<div className="px-6 md:px-12 lg:px-24">
```

**Verification:**
- `px-6` = 1.5rem = 24px ✓ (mobile)
- `md:px-12` = 3rem = 48px ✓ (tablet)
- `lg:px-24` = 6rem = 96px ✓ (desktop)

---

## Component Props

```typescript
interface HeroProps {
  introPending?: boolean;  // Sync with IntroLoader animation
}
```

---

## Color System

```css
--text-main: #0b0b0b;
--text-secondary: #444749;
--surface-base: #f2f2f2;
--surface-border: #e5e7eb;
--border-strong: #999999;
--accent-coral: #f96057;
--accent-teal: #1d9e75;
```

---

## Responsive Breakpoints

- **Mobile:** 390px (base)
- **Tablet:** `md:` breakpoint → 810px
- **Desktop:** `lg:` breakpoint → 1440px

These align with Tailwind's default `md` (768px) and `lg` (1024px), but the Hero content width is constrained within these viewport sizes per design.

---

## Claim Text Options

The design provides three claim options (user to select):

**Option A (Current):**
> Dissenyo i construeixo productes digitals.  
> Un sol interlocutor, de principi a fi.

**Option B:**
> Product designer i desenvolupador.  
> Del problema a la interfície, i de la interfície al codi.

**Option C:**
> Disseny de producte i front-end per a marques i agències.

---

## Linked Design Files

- `Main.dc.html` — Desktop 1440px interactive design
- `Tauleta.dc.html` — Tablet 810px interactive design
- `Mobil.dc.html` — Mobile 390px interactive design
- `Camp.dc.html` — Isolated demo of reactive field physics
