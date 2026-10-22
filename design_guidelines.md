# AI Geolocation Application - Design Guidelines

This is a design brief, not a description of the app as built. Several items here were not built: there is no history or gallery view, no recent-uploads sidebar and no downloadable report, and the map uses Leaflet only.

## Design Approach

**System Selected**: Material Design 3 with custom adaptations for data visualization
**Justification**: This is a utility-focused, information-dense application requiring clear data presentation, professional credibility, and efficient workflows. Material Design 3 provides robust patterns for forms, data display, and interactive elements while maintaining a modern, clean aesthetic suitable for professional tools.

**Reference Inspiration**: Linear (clean data presentation), Notion (intuitive interfaces), professional OSINT tools aesthetic

## Core Design Principles

1. **Clarity Over Decoration**: Every element serves a functional purpose
2. **Visual Hierarchy**: Analysis results and map visualization are primary focus areas
3. **Professional Credibility**: Design conveys trustworthiness and technical competence
4. **Progressive Disclosure**: Show simple upload first, reveal complex analysis progressively

## Color Palette

**Dark Mode (Primary)**
- Background: 220 15% 8% (deep slate)
- Surface: 220 12% 12% (elevated slate)
- Surface Variant: 220 10% 16% (card background)
- Primary: 210 100% 60% (bright blue for interactive elements)
- Primary Container: 210 80% 20% (dark blue for buttons)
- On-Surface: 0 0% 95% (primary text)
- On-Surface Variant: 0 0% 70% (secondary text)
- Success: 142 70% 50% (location confirmed)
- Warning: 38 95% 60% (moderate confidence)
- Error: 0 70% 60% (low confidence/errors)
- Border: 220 10% 25% (subtle dividers)

**Light Mode**
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Surface Variant: 220 10% 96%
- Primary: 210 100% 50%
- Primary Container: 210 100% 95%
- On-Surface: 0 0% 10%
- On-Surface Variant: 0 0% 40%

## Typography

**Font Families**
- Primary: Inter (system UI, clean readability for data)
- Monospace: JetBrains Mono (coordinates, technical data)

**Scale**
- Hero: 4xl/5xl, font-bold (main headings)
- Section Headers: 2xl, font-semibold
- Card Titles: lg, font-semibold
- Body: base, font-normal
- Labels: sm, font-medium, uppercase tracking-wide
- Captions: xs, font-normal
- Coordinates/Data: sm, font-mono

## Layout System

**Spacing Primitives**: Use 4, 6, 8, 12, 16, 24 (e.g., p-4, gap-6, mt-8, space-y-12)

**Grid Structure**
- Container: max-w-7xl mx-auto
- Two-column layout: 40% upload/controls, 60% map/results on desktop
- Single column stack on mobile
- Consistent padding: px-6 py-8 on desktop, px-4 py-6 on mobile

## Component Library

### Primary Upload Interface
- Drag-and-drop zone with dashed border (border-dashed border-2)
- Height: min-h-[400px] with centered content
- Icon: Large upload icon (w-16 h-16) with subtle animation on hover
- States: Default, hover (border-primary), drag-over (bg-primary/5), uploading (progress indicator)

### Analysis Results Panel
- Card design with rounded-xl and shadow-lg
- Sections: Confidence Score (large percentage with radial progress), Predicted Coordinates (monospace, copyable), Visual Analysis (bulleted insights with icons), Reasoning Chain (expandable accordion)
- Each section separated by subtle dividers (border-t border-border)

### Map Visualization
- Full-height interactive map (min-h-[600px])
- Confidence radius overlay (semi-transparent circle)
- Location pin with pulsing animation
- Zoom controls in bottom-right corner
- Address display in top-left overlay card

### Navigation Header
- Fixed top bar with backdrop-blur-md
- Logo/title on left
- Mode toggle (dark/light) on right
- Minimal height (h-16) to maximize workspace

### Confidence Indicators
- High (>70%): Green accent with filled icon
- Medium (40-70%): Amber accent with partial icon
- Low (<40%): Red accent with outline icon
- Visual: Horizontal bar chart showing confidence distribution

### Feature Analysis Cards
- Grid layout: grid-cols-2 md:grid-cols-3 gap-4
- Each card: p-4, rounded-lg, bg-surface-variant
- Icon + Label + Description format
- Categories: Architecture, Vegetation, Infrastructure, Signage, Environment

### Action Buttons
- Primary: bg-primary hover:bg-primary/90, rounded-lg, px-6 py-3
- Secondary: variant="outline", rounded-lg
- Icon buttons: Square (w-10 h-10), rounded-md for controls

### Image Preview
- Aspect ratio maintained with object-cover
- Max height: max-h-[500px]
- Rounded corners: rounded-lg
- Shadow for depth when displayed

## Images

**No Hero Image**: This is a functional application, not a marketing page. The upload interface IS the primary visual focus.

**Placeholder States**: Use subtle illustrations or icons for empty states (not photos)

## Animations

**Minimal and Purposeful**
- Upload zone: Gentle border pulse on drag-over
- Location pin: Soft pulsing effect (scale 100% to 105%)
- Loading states: Spinner or skeleton screens
- Transitions: transition-colors duration-200 for interactive elements
- NO scroll-based animations or parallax effects

## Accessibility

- Consistent dark mode across all inputs and form fields
- WCAG AAA contrast ratios for text
- Focus states with visible rings (ring-2 ring-primary ring-offset-2)
- Keyboard navigation support throughout
- Screen reader labels for all interactive elements
- Color-blind safe palette (never rely on color alone)

## Key Application Screens

1. **Upload Screen**: Centered upload zone, recent uploads sidebar, getting started tips
2. **Analysis Screen**: Split view - image preview (left), map + results (right)
3. **Results Detail**: Full analysis breakdown with expandable sections, downloadable report option
4. **History/Gallery**: Grid of previous analyses with thumbnails and quick stats

## Critical Implementation Notes

- Map uses Leaflet or Mapbox GL for interactive visualization
- Coordinates displayed as copyable text with click-to-copy functionality
- Analysis reasoning uses expandable accordion pattern to manage information density
- All data displays use consistent spacing (gap-4 between items, gap-8 between sections)
- Confidence visualization uses combination of percentage, color coding, and radial progress
- Professional tool aesthetic prioritizes function over decoration - no unnecessary gradients or complex backgrounds