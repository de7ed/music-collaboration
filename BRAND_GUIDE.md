# Riff Session — Brand & Style Guide

## Brand Identity

**Riff Session** is a collaborative songwriting platform for musicians, bands, and producers. The brand embodies creativity, professionalism, and seamless collaboration. The visual language is **modern, minimalist, and intentional** — every design choice serves a purpose.

---

## Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|---|---|---|---|
| **Black** | `#000000` | `0, 0, 0` | Primary text, main UI elements, strong emphasis |
| **White** | `#FFFFFF` | `255, 255, 255` | Backgrounds, contrast, primary action CTA |
| **Gray 50** | `#F9FAFB` | `249, 250, 251` | Light backgrounds, subtle UI areas, hover states |
| **Gray 100** | `#F3F4F6` | `243, 244, 246` | Secondary backgrounds, borders (light) |
| **Gray 200** | `#E5E7EB` | `229, 231, 235` | Borders, dividers, inactive states |
| **Gray 400** | `#9CA3AF` | `156, 163, 175` | Secondary text, placeholder text, disabled UI |
| **Gray 500** | `#6B7280` | `107, 114, 128` | Tertiary text, muted labels |
| **Gray 700** | `#374151` | `55, 65, 81` | Strong secondary text |

### Accent Colors (Optional - for brand refinement)

| Name | Hex | RGB | Usage |
|---|---|---|---|
| **Electric Blue** | `#0066FF` | `0, 102, 255` | Interactive elements, links, primary CTAs (optional) |
| **Warm Amber** | `#FFA500` | `255, 165, 0` | Highlights, notifications, accent elements (optional) |
| **Forest Green** | `#1B6B3A` | `27, 107, 58` | Success states, positive actions |
| **Coral Red** | `#EF4444` | `239, 68, 68` | Error states, destructive actions, warnings |

### Accessibility & Contrast

All text must meet **WCAG AA** standard (4.5:1 ratio for normal text, 3:1 for large text):
- ✅ Black `#000000` on White `#FFFFFF` — **21:1** (AAA)
- ✅ Gray 700 `#374151` on Gray 50 `#F9FAFB` — **9:1** (AAA)
- ✅ Gray 400 `#9CA3AF` on White `#FFFFFF` — **4.5:1** (AA)
- ⚠️ Gray 500 `#6B7280` on White only for UI, not body text

---

## Typography

### Font Family

- **Sans Serif (Primary)**: Geist (Google Fonts) — clean, modern, friendly
  - Fallback: `system-ui, -apple-system, sans-serif`
- **Mono (Code)**: Geist Mono — for code snippets, timestamps, technical content

### Type Scale

```
Display (Hero)    — 32px, font-weight: 700, line-height: 1.2
Heading 1         — 24px, font-weight: 700, line-height: 1.3
Heading 2         — 20px, font-weight: 700, line-height: 1.4
Heading 3         — 18px, font-weight: 600, line-height: 1.4
Body (Regular)    — 14px, font-weight: 400, line-height: 1.6
Body (Small)      — 12px, font-weight: 400, line-height: 1.5
Caption           — 11px, font-weight: 500, line-height: 1.4
Overline          — 10px, font-weight: 600, letter-spacing: 0.05em, text-transform: uppercase
```

### Color Usage

- **Headers & Strong Emphasis**: Black `#000000`
- **Body Text**: Black `#000000` (high contrast required)
- **Secondary Labels**: Gray 700 `#374151`
- **Placeholder & Disabled**: Gray 400 `#9CA3AF`
- **Timestamps & Metadata**: Gray 500 `#6B7280`

---

## Spacing & Sizing Scale

### Spacing (Tailwind Units × 4px)

```
2px   (0.5 unit)  — Minimal gaps, icon spacing
4px   (1 unit)    — Tight spacing, element groups
8px   (2 units)   — Default component padding
12px  (3 units)   — Medium spacing
16px  (4 units)   — Standard section padding
24px  (6 units)   — Card padding, larger elements
32px  (8 units)   — Section spacing, layout rhythm
48px  (12 units)  — Major section breaks
64px  (16 units)  — Page-level spacing
```

### Border Radius

- **Buttons & Inputs**: `6px` (rounded-md)
- **Cards & Modals**: `8px` (rounded-lg)
- **Badges & Small Elements**: `4px` (rounded-sm)
- **Fully Rounded**: `9999px` (rounded-full)

### Shadows

- **Subtle** (hover states, cards): `0 1px 2px rgba(0, 0, 0, 0.05)`
- **Elevated** (modals, popovers): `0 4px 6px rgba(0, 0, 0, 0.1)`
- **High Elevation** (dropdowns, sticky): `0 10px 25px rgba(0, 0, 0, 0.15)`

---

## Component Styling

### Buttons

**Primary Button (White background, Black border)**
- Background: White `#FFFFFF`
- Text: Black `#000000`
- Border: Black `#000000`, 1px
- Padding: 8px 16px
- Font: 14px, font-weight: 500
- Hover: Gray 50 background, Black border
- Active: Gray 100 background, Black border

**Secondary Button (Outline)**
- Background: Transparent
- Text: Black `#000000`
- Border: Gray 200 `#E5E7EB`, 1px
- Padding: 8px 16px
- Hover: Gray 50 background
- Active: Gray 100 background

**Ghost Button**
- Background: Transparent
- Text: Gray 500 `#6B7280`
- Border: None
- Hover: Gray 100 background
- Active: Gray 200 background

### Input Fields

- **Border**: Gray 200 `#E5E7EB`, 1px
- **Background**: White `#FFFFFF`
- **Text**: Black `#000000`
- **Placeholder**: Gray 400 `#9CA3AF`
- **Focus**: Black border, no shadow (outline: none)
- **Focus Ring**: Optional subtle inset shadow
- **Disabled**: Gray 50 background, Gray 200 border, Gray 400 text

### Dividers & Borders

- **Primary Divider**: Gray 200 `#E5E7EB`, 1px solid
- **Subtle Divider**: Gray 100 `#F3F4F6`, 1px solid
- **Strong Divider**: Black `#000000`, 1px solid (rare, emphasis only)

### Status Colors

- **Success**: Forest Green `#1B6B3A` (text), Gray 50 background
- **Error**: Coral Red `#EF4444` (text), Gray 50 background
- **Warning**: Warm Amber `#FFA500` (text), Gray 50 background
- **Info**: Electric Blue `#0066FF` (text), Gray 50 background

---

## Logo Guidelines

### Logo Specifications

- **Primary Mark**: Monochromatic (Black `#000000` on White `#FFFFFF`)
- **Alternate Marks**: 
  - Solid black on white backgrounds
  - Solid white on black/dark backgrounds
  - Grayscale for restricted use
- **Minimum Size**: 16px (favicon), 32px (app icon), 48px (printed materials)
- **Clear Space**: Minimum 8px padding around logo on all sides

### Logo Applications

1. **Favicon**: 16×16px, 32×32px, 180×180px (apple-touch-icon)
2. **App Icon**: 180×180px (iOS), 192×192px (Android)
3. **Sidebar**: 24×24px (compact), 40×40px (expanded)
4. **Navigation**: 20×20px next to wordmark
5. **Email Header**: 32×32px or wordmark
6. **Social Media**: 400×400px (profile picture), 1200×630px (OG image)

---

## Visual Patterns

### Density

- **Compact**: 8px padding, 12px gaps — dashboards, lists
- **Comfortable**: 12–16px padding, 16px gaps — main UI
- **Spacious**: 20px+ padding, 24px+ gaps — landing pages, hero sections

### Emphasis Hierarchy

1. **Primary Emphasis**: Black text, white/light background
2. **Secondary Emphasis**: Gray 700 text, gray 50 background
3. **Tertiary Emphasis**: Gray 500 text, white background
4. **Disabled/Muted**: Gray 400 text, gray 50 background

### Interactive States

- **Hover**: Background shifts to Gray 50, border may lighten
- **Active/Focus**: Background Gray 100, border becomes Black
- **Loading**: Opacity 0.6, cursor changes to progress indicator
- **Disabled**: Opacity 0.5, pointer-events: none

---

## Motion & Animation

### Transitions

- **UI Interactions** (buttons, toggles): `150ms ease-in-out`
- **Navigation & Modals**: `200ms ease-in-out`
- **Page Transitions**: `300ms ease-in-out`
- **Hover States**: `150ms ease-out`

### Easing Functions

- `ease-in-out` — Default, natural motion
- `ease-out` — Enters the view quickly
- `ease-in` — Exits the view smoothly
- `linear` — For progress indicators only

---

## Dark Mode (Future Consideration)

If dark mode is implemented:

- **Dark Background**: `#0F0F0F` (near-black)
- **Dark Secondary**: `#1A1A1A`
- **Dark Tertiary**: `#2D2D2D`
- **Dark Text**: White `#FFFFFF`
- **Dark Muted**: Gray 400 `#9CA3AF`

---

## Photography & Imagery

- **Style**: Minimalist, professional, music-focused
- **Color Treatment**: Grayscale or desaturated for consistency
- **Composition**: Centered, clean backgrounds, human-focused
- **Format**: 16:9 (social), 1:1 (profile), 4:3 (content)

---

## Voice & Tone

- **Friendly but Professional**: Not too casual, not corporate
- **Clear & Direct**: Avoid jargon; explain music terms
- **Collaborative**: Emphasize "we," "together," "session"
- **Empowering**: Give users confidence in their creative process

### Example Copy Tone

❌ *"Submit your changes now"*
✅ *"Check in your changes"*

❌ *"Error: validation failed"*
✅ *"We couldn't save that — try again"*

---

## Implementation Checklist

- [ ] Update favicon to new logo
- [ ] Update app icon (Apple & Android)
- [ ] Update sidebar branding
- [ ] Update landing page hero
- [ ] Update email signatures
- [ ] Update social media assets
- [ ] Update documentation
- [ ] Test colors on accessibility tools (WebAIM, Contrast Checker)
- [ ] Test logo at all sizes
- [ ] Create logo assets in Figma/Adobe XD (SVG + PNG)

---

## Resources

- **Color Testing**: https://webaim.org/resources/contrastchecker/
- **Typography**: https://fonts.google.com (Geist, Geist Mono)
- **Icons**: Lucide Icons (currently used, compatible)
- **Component Library**: Tailwind CSS + custom base components

