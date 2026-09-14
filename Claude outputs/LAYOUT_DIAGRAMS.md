# Hero Layout Diagrams

## Desktop (1440px) with Padding Measurements

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          1440px                                              │
├──────┬──────────────────────────────────────────────────────────┬────────────┤
│  96px │                                                          │   96px     │
│ px-24 │  CONTENT AREA (744px)                   FIELD (560px)  │  px-24     │
│       │                                                          │            │
│       │  Header (navbar)                                         │            │
│       │  96px left + right padding                              │            │
│       │                                                          │            │
│       ├──────────────────────────────────────┬──────────────────┤            │
│       │  H1 Estratègia.                      │  Reactive Field  │            │
│       │     Disseny.                         │  560px × 684px   │            │
│       │     Impacte.                         │  (dot grid)      │            │
│       │  (112px, -3px spacing)               │                  │            │
│       │                                      │  left: 880px     │            │
│       │  Claim                               │  top: 96px       │            │
│       │  24px size                           │  z-index: 0      │            │
│       │                                      │                  │            │
│       │  [CTA] Veure treballs →              │                  │            │
│       │                                      │                  │            │
│       ├──────────────────────────────────────┴──────────────────┤            │
│       │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │            │
│       │  CA    Product Design · Branding & Identity · Mobile   │            │
│       │                                                          │            │
└───────┴──────────────────────────────────────────────────────────┴────────────┘
```

**Padding: `px-6 md:px-12 lg:px-24` → 24 / 48 / 96px**

---

## Tablet (810px) with Padding Measurements

```
┌─────────────────────────────────────────────────────────┐
│                      810px                              │
├────────┬──────────────────────────────────┬─────────────┤
│  48px  │                                  │   48px      │
│ px-12  │  CONTENT AREA                    │  px-12      │
│        │                                  │             │
│        │  Header                          │             │
│        │  48px left + right padding       │             │
│        │                                  │             │
│        ├──────────────────────┬───────────┤             │
│        │  H1 Estratègia.      │  Reactive │             │
│        │     Disseny.         │  Field    │             │
│        │     Impacte.         │  (dots)   │             │
│        │  (64px, -3px spacing)│           │             │
│        │                      │           │             │
│        │  Claim 24px          │           │             │
│        │                      │           │             │
│        │  [CTA]               │           │             │
│        │                      │           │             │
│        ├──────────────────────┴───────────┤             │
│        │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │             │
│        │  CA    Product Design · Brand... │             │
│        │                                  │             │
└────────┴──────────────────────────────────┴─────────────┘
```

**Padding: `px-6 md:px-12 lg:px-24` → 24 / 48 / 96px**

---

## Mobile (390px) with Padding Measurements

```
┌──────────────────────────────────┐
│           390px                  │
├──────┬──────────────────┬────────┤
│ 24px │                  │ 24px   │
│ px-6 │  CONTENT AREA    │  px-6  │
│      │                  │        │
│      │  Header          │        │
│      │  24px padding    │        │
│      │                  │        │
│      ├──────────────────┤        │
│      │  H1              │        │
│      │  Estratègia.     │        │
│      │  Disseny.        │        │
│      │  Impacte.        │        │
│      │  (32px, -1px)    │        │
│      │                  │        │
│      │  Claim           │        │
│      │  24px            │        │
│      │                  │        │
│      │  [CTA]           │        │
│      ├──────────────────┤        │
│      │  Reactive Field  │        │
│      │  (full width)    │        │
│      │  ~342px          │        │
│      │  (below headline)│        │
│      ├──────────────────┤        │
│      │ ─ ─ ─ ─ ─ ─ ─ ─ │        │
│      │ CA  Product...   │        │
│      │                  │        │
└──────┴──────────────────┴────────┘
```

**Padding: `px-6 md:px-12 lg:px-24` → 24 / 48 / 96px**

---

## Padding Rhythm Table

```
Breakpoint │ Viewport │ Padding Class │ Pixel Value │ Source Verification
───────────┼──────────┼───────────────┼─────────────┼────────────────────
Mobile     │  390px   │     px-6      │    24px     │ Mobil.dc.html
Tablet     │  810px   │    md:px-12   │    48px     │ Tauleta.dc.html  
Desktop    │ 1440px   │    lg:px-24   │    96px     │ Main.dc.html
```

---

## Reactive Field Positioning

### Desktop (1440px)
- **Position:** Absolute, right of headline
- **Coordinates:** `left: 880px; top: 96px`
- **Dimensions:** 560px wide × 684px high
- **Calculation:** `1440 - 96(right pad) - 560(field) = 784px` (approx left position)

### Tablet (810px)
- **Position:** Repositioned, may shift layout
- **Layout:** Field may move to different column or stack below headline

### Mobile (390px)
- **Position:** Full-width band below headline
- **Dimensions:** Approximately 342px wide (390 - 24×2 padding)
- **Height:** Responsive to content layout

---

## Vertical Spacing

### Desktop
```
Top padding (header): 96px

Content spacing:
  H1 to Claim:        44px
  Claim to CTA:       36px
  CTA to Footer:      ~variable (flex-grow)

Bottom padding:       48px
Footer gap:           20px (between divider and content)
```

### Tablet
```
Proportional to desktop, adjusted for 810px width
```

### Mobile
```
Compressed vertically, field spans below headline
```

---

## Typography in Layout

```
├─ H1 (lockup) ─────────────────
│  ├─ .text-display-h1
│  ├─ Font: Bricolage Grotesque, 600
│  ├─ Scales: 32px / 64px / 112px
│  ├─ Line-height: 1
│  └─ Letter-spacing: -1px / -1px / -3px
│
├─ Claim ───────────────────────
│  ├─ Font-size: 24px (consistent)
│  ├─ Line-height: 1.35
│  ├─ Color: var(--text-secondary)
│  └─ Max-width: 520px
│
├─ CTA link ────────────────────
│  ├─ Font-size: 20px
│  ├─ Font-weight: 500
│  ├─ Gap to icon: 12px
│  └─ Underline: 1px border, 3px padding
│
└─ Eyebrow (CA / disciplines) ──
   ├─ Font-size: 14px
   ├─ Font-weight: 500
   ├─ Letter-spacing: 1px
   └─ Text-transform: uppercase
```

---

## Color Reference

| Token | Value | Usage |
|-------|-------|-------|
| `--text-main` | #0b0b0b | Headlines, primary text |
| `--text-secondary` | #444749 | Claim, secondary text |
| `--surface-base` | #f2f2f2 | Background |
| `--surface-border` | #e5e7eb | Divider line |
| `--border-strong` | #999999 | Toggle, accent |
| `--accent-coral` | #f96057 | Field aberration (shadows) |
| `--accent-teal` | #1d9e75 | Field aberration (shadows) |
