---
version: alpha
name: rams v2
description: A bright, friendly activity-booking system with clean cards, rounded controls, and a single energetic orange accent.
colors:
  primary: "#FF710B"
  secondary: "#FFFFFF"
  tertiary: "#656565"
  neutral: "#E5E7EB"
  surface: "#FFFFFF"
  on-surface: "#101010"
  error: "#FF3B30"
  primary-10: "#FFF4EB"
  primary-20: "#FFE5D3"
  primary-60: "#FF9A4E"
  primary-70: "#FF8730"
  primary-80: "#E86600"
  border: "#DBDBDB"
typography:
  headline-display:
    fontFamily: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline-lg:
    fontFamily: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: "40px"
    letterSpacing: "-0.025em"
  headline-md:
    fontFamily: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
    fontSize: "29px"
    fontWeight: 700
    lineHeight: "35px"
    letterSpacing: "0px"
  headline-sm:
    fontFamily: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "29px"
    letterSpacing: "0px"
  title-lg:
    fontFamily: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "24px"
    letterSpacing: "0px"
  body-lg:
    fontFamily: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "0px"
  body-md:
    fontFamily: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "0px"
  body-sm:
    fontFamily: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "18px"
    letterSpacing: "0px"
  label-lg:
    fontFamily: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: "20px"
    letterSpacing: "0px"
  label-md:
    fontFamily: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: "16px"
    letterSpacing: "0px"
  label-sm:
    fontFamily: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: "12px"
    letterSpacing: "0px"
  caption-md:
    fontFamily: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: "12px"
    letterSpacing: "0px"
  nav-md:
    fontFamily: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "0px"
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 2px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 80px
  gutter: 24px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "0px 16px"
    height: "56px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.tertiary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "0px 16px"
    height: "56px"
  button-tertiary:
    backgroundColor: "transparent"
    textColor: "{colors.tertiary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "0px"
    height: "auto"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    padding: "0px 16px"
    height: "40px"
  chip:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.tertiary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "0px 12px"
    height: "32px"
  chip-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.secondary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "0px 12px"
    height: "32px"
  stat-pill:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "0px 12px"
    height: "32px"
---

# Rams

## Overview

Rams feels upbeat, accessible, and community-driven, with a sporty marketplace energy rather than a corporate one. The interface is spacious and airy, using a bright white canvas and warm orange accents to keep the experience energetic without feeling noisy. It is optimized for browsing, filtering, and quick decision-making, so clarity and scanability matter more than decorative flourish.

## Colors

- **Primary (#FF710B):** A vivid tangerine orange used for brand moments, active states, key CTAs, and highlighted words in headlines. It gives the product its most recognizable personality.
- **Secondary (#FFFFFF):** The main card and control background, keeping the interface clean, bright, and highly legible.
- **Tertiary (#656565):** A soft neutral gray for secondary text, icon labels, and understated control copy. It keeps the page from feeling too heavy.
- **Neutral (#E5E7EB):** The light border and divider tone used to separate pills, inputs, and cards without strong visual interruption.
- **Surface (#FFFFFF):** Default surface color for cards, panels, and form fields. In this system, surfaces generally blend into the page with minimal contrast.
- **On-surface (#101010):** Deep near-black used for headings, body copy, and core content. It provides strong readability against the white base.
- **Error (#FF3B30):** Reserved for urgent status text like remaining slots or warnings, where a stronger red is needed.
- **Primary tints (#FFF4EB, #FFE5D3, #FF9A4E, #FF8730, #E86600):** Support hover, pressed, or subtle brand backgrounds while preserving the same orange family.
- **Border (#DBDBDB):** The standard stroke color for pills, inputs, and secondary buttons when a soft but visible edge is needed.

## Typography

The system uses a single clean sans-serif family, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", with DM Sans as the fallback family in the provided source data. Headlines are bold and compact, with the largest hierarchy using tight tracking and short line heights to keep the hero sharp and editorial. Body copy stays regular-weight and comfortable at 16px/24px for readability in content-heavy browsing views.

Labels, chips, and small counters are intentionally compact, often using 10px–12px sizes and stronger weights for clarity in dense navigation areas. The UI mixes sentence case and light uppercase treatment for micro-headings like section labels, which makes the interface feel organized without becoming rigid. Orange emphasis inside large headings should be treated as semantic highlight, not as a separate font style.

## Layout

The composition is centered and content-led, with a wide desktop container and generous outer whitespace on both sides. The hero section sits above a dense discovery area, creating a clear top-to-bottom flow from marketing message to utility controls to content cards. Spacing follows a soft rhythm: small gaps for chip rows and control clusters, larger vertical breathing room between hero, filters, and grids.

Cards use a compact internal padding of 16px, while page sections rely on larger separations such as 24px, 32px, and 80px to preserve clarity. Inputs and pills are horizontally efficient, with rounded full-width controls that encourage scanning rather than deep form entry. The layout should remain grid-based and responsive, but always preserve a calm, left-aligned reading edge for titles and lists.

## Elevation & Depth

Depth is subtle and mostly structural rather than dramatic. Cards use a faint border and a light shadow to separate them from the page without creating a heavy floating effect. Inputs and pills rely more on outline contrast and tonal layering than on shadow stacking.

The visual hierarchy comes from contrast, typography weight, and color accents more than from dramatic elevation. White surfaces, soft gray borders, and occasional shadow allow the content cards to feel tactile while keeping the product lightweight. Use shadow sparingly; the system should stay mostly flat and crisp.

## Shapes

The overall shape language is friendly and rounded, especially for buttons, pills, and filters. Full-pill corners dominate interactive elements, reinforcing the approachable, consumer-facing tone. Cards use a modest 8px radius so content blocks feel tidy and modern without appearing overly soft.

The shape system should feel consistent: large radii for affordance, smaller radii for content containers. Avoid sharp geometry for primary interaction surfaces unless a control is intentionally minimal or textual. The result should be playful, but still disciplined and easy to scan.

## Components

**Buttons:** Primary and secondary buttons are pill-shaped, 56px tall, and compact in horizontal padding. Primary buttons use the orange fill (`button-primary`) with white text for strong emphasis, while secondary buttons (`button-secondary`) invert the relationship with a white background and gray text/border. Tertiary or link-style actions (`button-tertiary`) should be quiet, text-first, and used sparingly for low-priority navigation.

**Chips and filters:** Category chips and date pills are core interface patterns. Use `chip` for idle filters, `chip-active` for selected states, and keep text bold enough to remain readable at small sizes. Active chips should switch to orange fill and white text, while inactive chips stay white with a light border.

**Inputs:** Search and location fields should be wide, pill-shaped, and low-friction. Keep borders soft and text subdued until focus, where the control can gain stronger contrast or a brand-colored accent. Inputs should feel like discovery tools, not form-heavy enterprise fields.

**Cards:** Result cards should use the `card` token: white surface, 1px neutral border, 8px radius, and 16px padding. Content inside cards should be tightly structured, with imagery on top, title and meta text in the middle, and host/avatar details at the bottom. Card treatment should remain consistent across activity listings, promotional modules, and featured content.

**Stat pills:** Use `stat-pill` for quick proof points like community counts, activities created, or user totals. These should be visually similar to chips but feel informational rather than filter-driven, often pairing bold numeric text with smaller descriptive labels.

**Icons and small labels:** Icons are thin and functional, usually paired with compact labels beneath or beside them. Keep them understated unless they are active, at which point orange should signal selection clearly. Text under icons should remain small and concise to support dense navigation.

## Do's and Don'ts

- Do use orange as the only strong brand accent for active states, highlights, and major CTA emphasis.
- Do keep surfaces white or near-white and rely on light borders for separation.
- Do favor rounded pills for buttons, filters, and search controls.
- Do keep headline copy bold and compact, with tight line-height in hero areas.
- Do preserve generous whitespace above content grids so the page feels breathable.
- Don't introduce heavy gradients, dark themes, or decorative shadows that overpower the content.
- Don't make chips or buttons square or angular; that would break the friendly tone.
- Don't overuse red except for true error or urgent status messaging.
