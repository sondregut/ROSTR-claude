# RostrDating UI/UX Design System

## 🎨 Color Scheme

### Primary Brand Colors
- **Primary Color**: `#F07A7A` (Coral Pink) - Main brand color
- **Primary Dark Mode**: `#F28C8C` (Lighter Coral) - Better contrast in dark mode
- **Secondary**: `#FFE5E5` (Light Pink) / `#495057` (Dark mode)

### Light Mode Palette
```typescript
{
  text: '#343A40',           // Dark gray text
  textSecondary: '#6C757D',   // Medium gray text
  background: '#F5F5F5',      // Light gray background
  card: '#FFFFFF',            // White cards
  border: '#E9ECEF',          // Light gray borders
  primary: '#F07A7A',         // Coral pink
  secondary: '#FFE5E5',       // Light pink
}
```

### Dark Mode Palette
```typescript
{
  text: '#E9ECEF',            // Light gray text
  textSecondary: '#ADB5BD',   // Muted text
  background: '#1A1D21',      // Very dark blue-gray
  card: '#2C2F33',            // Dark gray cards
  border: '#495057',          // Medium gray borders
  primary: '#F28C8C',         // Lighter coral
  secondary: '#495057',       // Medium gray
}
```

### Status Colors
- **Active/Success**: `#10B981` (Green)
- **New**: `#3B82F6` (Blue)
- **Fading/Warning**: `#F59E0B` (Orange)
- **Ended**: `#6B7280` (Gray)
- **Ghosted/Error**: `#EF4444` (Red)

## 📐 Typography

### Font Sizes
- **Extra Large**: 36px - Main headings
- **Large**: 28-32px - Section headings
- **Title**: 24px - Screen titles
- **Heading**: 18-20px - Card headers
- **Body**: 16px - Default text
- **Small**: 14px - Secondary text
- **Caption**: 12-13px - Labels and hints

### Font Weights
- **Bold**: 700 - Main headings
- **Semibold**: 600 - Buttons, titles, emphasis
- **Medium**: 500 - Navigation, labels
- **Regular**: 400 - Body text

### Font Family
- System default fonts (San Francisco on iOS, Roboto on Android)

## 🔲 Layout & Spacing

### Border Radius
- **Small**: 2px - Progress bars, indicators
- **Medium**: 8px - Buttons, inputs
- **Large**: 12px - Cards, modals
- **Extra Large**: 16-20px - Large cards
- **Round**: 24-30px - Pills, tags
- **Circle**: 50% - Avatars

### Common Border Radii Used
- **Buttons**: 8px (standard), 24-30px (pill buttons)
- **Cards**: 12-16px
- **Input Fields**: 8-12px
- **Tags/Badges**: 20px
- **Avatars**: 50% (circular)
- **Modals**: 16px

### Padding & Margins
- **Extra Small**: 4px
- **Small**: 8px
- **Medium**: 12-16px
- **Large**: 20-24px
- **Extra Large**: 32px

### Standard Spacing
- **Card Padding**: 16px
- **Screen Padding**: 16px horizontal
- **Button Padding**: 10-14px vertical, 16-20px horizontal
- **Section Spacing**: 16-24px between sections

## 🎯 Components

### Buttons
```typescript
{
  borderRadius: 8,
  paddingVertical: 10-14,
  paddingHorizontal: 16-20,
  fontSize: 16,
  fontWeight: '600'
}
```

**Variants:**
- Primary: Coral background, white text
- Secondary: Light pink/gray background
- Outline: Transparent with border
- Text: Transparent, no border

**Sizes:**
- Small: 6px vertical, 12px horizontal
- Medium: 10px vertical, 16px horizontal
- Large: 14px vertical, 20px horizontal

### Cards
```typescript
{
  backgroundColor: colors.card,
  borderRadius: 12-16,
  padding: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1-2 },
  shadowOpacity: 0.05-0.1,
  shadowRadius: 2-3,
  elevation: 2-3 (Android)
}
```

### Input Fields
```typescript
{
  borderRadius: 8-12,
  borderWidth: 1,
  borderColor: colors.border,
  padding: 12,
  fontSize: 16
}
```

### Tags/Badges
```typescript
{
  borderRadius: 20,
  paddingVertical: 6-8,
  paddingHorizontal: 12-16,
  fontSize: 14,
  backgroundColor: colors.tagBackground
}
```

### Navigation
- **Tab Bar**: Icons with labels, coral accent for selected
- **Headers**: 24px font size, semibold (600)
- **Tab Icons**: Default gray, coral when selected

## 🎭 Visual Effects

### Shadows (iOS)
```typescript
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1-2 },
  shadowOpacity: 0.05-0.1,
  shadowRadius: 2-3
}
```

### Elevation (Android)
- Cards: `elevation: 2-3`
- Buttons: `elevation: 2` (when pressed)
- Modals: `elevation: 5`

### Press States
- Opacity: 0.8 when pressed
- Scale: 0.98 for some interactive elements

## 🎨 Theme Support

### Light/Dark Mode
- Automatic system theme detection
- Manual theme toggle in settings
- Smooth transitions between themes
- Optimized color contrast for each mode

### Accessibility
- High contrast text colors
- Minimum touch target: 44x44px
- Clear focus states
- Screen reader labels on all interactive elements

## 📱 Responsive Design

### Screen Sizes
- Optimized for iPhone and Android phones
- Tablet support with adaptive layouts
- Safe area insets for notched devices
- Keyboard-aware scroll views

### Platform Differences
- iOS: San Francisco font, specific shadows
- Android: Roboto font, elevation for depth
- Platform-specific navigation patterns

## 🎯 Key UI Patterns

### Lists
- Card-based layouts with 12-16px margins
- Swipeable actions where appropriate
- Pull-to-refresh functionality
- Infinite scroll with loading states

### Forms
- Floating labels or top labels
- Clear error states with red accent
- Helper text in gray
- Progressive disclosure for complex forms

### Feedback
- Loading spinners with brand color
- Success/error toasts
- Haptic feedback on key actions
- Skeleton screens for loading states

## 🔄 Animation & Transitions

### Standard Durations
- Fast: 200ms (quick feedback)
- Normal: 300ms (standard transitions)
- Slow: 500ms (complex animations)

### Common Animations
- Fade in/out: opacity transitions
- Slide: translateY/translateX
- Scale: press feedback
- Spring: bounce effects for playful elements

## 📐 Grid System

### Layout Grid
- 16px base unit
- 8px for small spacing
- 4px for micro adjustments
- Consistent margins and padding

### Breakpoints
- Small: < 375px width
- Medium: 375-414px
- Large: > 414px
- Tablet: > 768px

This design system ensures consistency across the entire RostrDating app, creating a cohesive and delightful user experience with its distinctive coral pink branding and clean, modern interface.