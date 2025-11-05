# BharatApp Design Tokens & Style Guide

This guide defines BharatApp’s design tokens and usage patterns to deliver an India-local vibe with minimal, modern UI.

## Colors
- Primary: `#0B3D91` (deep blue) — trust, fintech-friendly
- Primary.Darken: `#072A66`
- Primary.Light: `#4C7BD9`
- Accent: `#F57C00` (saffron) — energy, high visibility
- Accent.Darken: `#E65100`
- Accent.Light: `#FF9E3D`
- Semantic.Success: `#1B8F3A`
- Semantic.Warning: `#F59E0B`
- Semantic.Error: `#D32F2F`
- Neutral: `neutral.25/50/100/800` for surfaces and text

Tailwind classes:
- `bg-brand-primary`, `text-brand-accent`, `border-brand-primary`, `text-neutral-800`

## Typography Scale
- `text-display` 36px / 44px
- `text-headline` 30px / 36px
- `text-title` 24px / 32px
- `text-subtitle` 20px / 28px
- `text-body` 16px / 24px
- `text-caption` 14px / 20px
- `text-micro` 12px / 16px

Font family: `font-sans` maps to Inter/system stack.

## Spacing Scale (extensions)
- `p-18` (4.5rem), `p-22` (5.5rem), `p-30` (7.5rem)
Use standard Tailwind spacing for everything else.

## Shadow Styles
- `shadow-elev-1`, `shadow-elev-2`, `shadow-elev-3`, `shadow-elev-4`

## Border Radius Tokens
- `rounded-brand-xs`, `rounded-brand-sm`, `rounded-brand-md`, `rounded-brand-lg`, `rounded-brand-xl`, `rounded-brand-2xl`

## Button Variants
- Base: `btn`
- Primary: `btn-primary` — deep blue filled
- Secondary: `btn-secondary` — saffron filled
- Outline: `btn-outline` — deep blue outline
- Ghost: `btn-ghost` — text-driven, subtle background on hover

Example:
```jsx
<button className="btn-primary">Buy Now</button>
<button className="btn-secondary">Add to Cart</button>
<button className="btn-outline">View</button>
<button className="btn-ghost">Learn more</button>
```

## Input Form System
- Label: `form-label`
- Input: `form-input`
- Select: `form-select`
- Textarea: `form-textarea`
- Helper text: `form-helper`
- Error text: `form-error`

Example:
```jsx
<label className="form-label">Store Name</label>
<input className="form-input" placeholder="e.g., Annapurna Grocers" />
<p className="form-helper">This will be visible to customers.</p>
```

## Card Styles
- Base: `card`
- Store card: `card-store` — subtle elevation, interactive hover
- Product card: `card-product` — stronger hover elevation
- Dashboard card: `card-dashboard` — neutral background panel

Example:
```jsx
<div className="card-store p-4">Store content</div>
<div className="card-product p-4">Product content</div>
<div className="card-dashboard p-4">Metrics</div>
```

## Motion Presets
- `motion-fade-in`
- `motion-slide-up`
- `motion-scale-in`

Example:
```jsx
<div className="motion-slide-up">Arriving content</div>
```

## Tailwind Config Extension
- See `tailwind.config.cjs` for tokens (colors, radius, shadows, typography, spacing, keyframes/animation).

## Usage Notes
- Prefer `btn-*` and `form-*` classes for consistent UX across pages.
- Use primary (deep blue) for key actions; accent (saffron) for highlights.
- Ensure contrast with `text-white` or `text-neutral-800` depending on background.