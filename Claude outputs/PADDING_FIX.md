# Hero Padding Fix — Quick Reference

## The Issue

The design annotation flagged this discrepancy:

> **ASSUMPCIÓ A VERIFICAR** — I used the padding rhythm of SharedPageHero (24 / 48 / 96) and the DS scale (H1 32 / 64 / 112, ls -1 / -3 / -3). Hero.tsx in code uses px-4 md:px-8 lg:px-24, which doesn't fit.

## The Fix

**BEFORE (Current):**
```jsx
className="px-4 md:px-8 lg:px-24"
```

| Breakpoint | Class | Actual | Target | Status |
|-----------|-------|--------|--------|--------|
| Mobile | `px-4` | 16px ❌ | 24px | **WRONG** |
| Tablet | `md:px-8` | 32px ❌ | 48px | **WRONG** |
| Desktop | `lg:px-24` | 96px ✓ | 96px | CORRECT |

---

**AFTER (Corrected):**
```jsx
className="px-6 md:px-12 lg:px-24"
```

| Breakpoint | Class | Actual | Target | Status |
|-----------|-------|--------|--------|--------|
| Mobile | `px-6` | 24px ✓ | 24px | CORRECT |
| Tablet | `md:px-12` | 48px ✓ | 48px | CORRECT |
| Desktop | `lg:px-24` | 96px ✓ | 96px | CORRECT |

---

## Where to Apply

### Locations in Hero.tsx

1. **Main content wrapper** (left column with H1, claim, CTA)
   ```jsx
   <div className="px-6 md:px-12 lg:px-24 ...">
   ```

2. **Footer bar** (disciplines row)
   ```jsx
   <div className="px-6 md:px-12 lg:px-24 ...">
   ```

3. **Any full-width sections** that align with outer padding

---

## Design System Verification

✅ **Rhythm Source:** SharedPageHero (24 / 48 / 96)  
✅ **Typography Scale:** DS H1 (32 / 64 / 112px, -1 / -3 / -3 letter-spacing)  
✅ **Verified from Canvas:** Main.dc.html, Tauleta.dc.html, Mobil.dc.html

---

## No Other Changes Needed

- ✓ H1 typography already using `.text-display-h1`
- ✓ ShowcaseVideo removed
- ✓ Hero standalone
- ✓ Reactive field physics intact
- ✓ TypeScript & linting passing

**Only the padding class names need updating.**
