# Design System Standardization - Mobile-First Guide

## Overview
This document ensures all pages follow a **consistent layout, colors, and presentation** with a **mobile-first approach**.

---

## Color Palette (Unified)

### Primary Colors
- **Primary Blue**: `#00BFFF` (`primary-blue`) - Main brand color
- **Secondary Blues**: 
  - Light Blue: `blue-50` - Backgrounds
  - Medium Blue: `blue-100` - Containers
  - Dark Blue: Navy `#1a1a2e` - Footer background

### Accent Colors
- **Success**: `green-600`
- **Warning**: `yellow-600`
- **Error**: `red-600`
- **Info**: `blue-600`

### Text Colors
- **Dark Text**: `#1F2937` (`text-dark`)
- **Muted Text**: `#6B7280` (`text-muted`)
- **White**: `#FFFFFF`
- **Light Gray**: `gray-300`

### Background Colors
- **Card Background**: `card-white` (#FFFFFF)
- **Page Background**: `background-light` (#F5F8FF)
- **Footer Background**: `#1a1a2e`

---

## Spacing System

### Mobile-First Spacing Progression
```
Mobile (base):   p-3    (12px)
Tablet (sm):     sm:p-4 (16px)
Desktop (lg):    lg:p-6 (24px)

Vertical gaps:   space-y-3 sm:space-y-4 lg:space-y-6
Horizontal gaps: gap-2 sm:gap-3 lg:gap-4
```

### Apply to All Pages
- **Page Container**: `p-3 sm:p-4 lg:p-6`
- **Section Spacing**: `space-y-3 sm:space-y-4 lg:space-y-6`
- **Card Padding**: `p-4 sm:p-5 lg:p-6`
- **Content Gaps**: `gap-3 sm:gap-4 lg:gap-6`

---

## Typography System

### Heading Sizes (Mobile-First)
```
H1 (Page Title):     text-xl sm:text-2xl lg:text-3xl font-bold
H2 (Section Title):  text-lg sm:text-xl lg:text-2xl font-semibold
H3 (Subsection):     text-base sm:text-lg font-semibold
H4 (Label):          text-sm sm:text-base font-semibold
```

### Body Text Sizes
```
Body Regular:  text-sm sm:text-base
Body Small:    text-xs sm:text-sm
Label:         text-xs
```

### Font Weights
```
Regular:    font-normal
Medium:     font-medium (labels, buttons)
Semibold:   font-semibold (headings, strong text)
Bold:       font-bold (main titles)
```

---

## Layout Patterns

### 1. Full-Width Page Container
```jsx
<div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
  {/* Content */}
</div>
```

### 2. Header with Action Button
```jsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
  <div>
    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-dark">Title</h1>
    <p className="text-sm sm:text-base text-text-muted mt-1">Subtitle</p>
  </div>
  <button className="w-full sm:w-auto flex items-center justify-center gap-2 
    bg-primary-blue text-white px-4 sm:px-5 py-2 rounded-lg 
    hover:opacity-90 transition-opacity text-sm sm:text-base font-medium">
    <Icon size={18} className="sm:size-5" />
    <span>Action</span>
  </button>
</div>
```

### 3. Responsive Grid
```jsx
{/* Cards grid - 1 col mobile → 2 cols tablet → 3+ cols desktop */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
  {items.map(item => (
    <div key={item.id} className="bg-card-white rounded-lg shadow-custom p-4 sm:p-5 lg:p-6">
      {/* Content */}
    </div>
  ))}
</div>
```

### 4. Two-Column Layout (Mobile: stacked, Tablet+: side-by-side)
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
  <div>{/* Left column */}</div>
  <div>{/* Right column */}</div>
</div>
```

### 5. Flex Layout (Mobile: stacked, Tablet+: horizontal)
```jsx
<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6">
  {/* Items */}
</div>
```

---

## Button System

### Primary Button
```jsx
<button className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2
  bg-primary-blue text-white px-4 sm:px-5 py-2 rounded-lg
  hover:opacity-90 transition-opacity text-sm sm:text-base font-medium">
  <Icon size={18} className="sm:size-5" />
  <span>Button Text</span>
</button>
```

### Secondary Button
```jsx
<button className="w-full sm:w-auto px-4 sm:px-5 py-2 border border-gray-200 
  bg-white text-text-dark rounded-lg hover:bg-gray-50 transition-colors 
  text-sm sm:text-base font-medium">
  Button Text
</button>
```

### Danger Button
```jsx
<button className="px-4 sm:px-5 py-2 bg-red-600 text-white rounded-lg
  hover:bg-red-700 transition-colors text-sm sm:text-base font-medium">
  Delete
</button>
```

---

## Form Elements

### Input Styling
```jsx
<input
  type="text"
  placeholder="Placeholder..."
  className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg 
    text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary-blue"
/>
```

### Label Styling
```jsx
<label className="block text-xs sm:text-sm font-medium text-text-dark mb-2">
  Label Text
</label>
```

### Form Grid (Mobile: 1 col, Tablet+: 2 cols)
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
  <div>
    <label className="block text-xs sm:text-sm font-medium mb-2">Field 1</label>
    <input type="text" />
  </div>
  <div>
    <label className="block text-xs sm:text-sm font-medium mb-2">Field 2</label>
    <input type="text" />
  </div>
</div>
```

---

## Card Components

### Standard Card
```jsx
<div className="bg-card-white rounded-lg shadow-custom p-4 sm:p-5 lg:p-6">
  <h3 className="text-base sm:text-lg font-semibold text-text-dark mb-3 sm:mb-4">
    Card Title
  </h3>
  <p className="text-sm sm:text-base text-text-muted">
    Card content here
  </p>
</div>
```

### Info Card
```jsx
<div className="bg-blue-50 rounded-lg p-4 sm:p-5 lg:p-6">
  <p className="text-xs sm:text-sm text-text-muted mb-2">Label</p>
  <p className="text-lg sm:text-xl font-semibold text-primary-blue">Value</p>
</div>
```

---

## Table Display

### Mobile-Friendly Table
```jsx
<div className="bg-card-white rounded-lg shadow-custom overflow-hidden">
  <div className="overflow-x-auto -mx-3 sm:mx-0">
    <table className="w-full min-w-max sm:min-w-0">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="text-left px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold">Column</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-gray-100 hover:bg-gray-50">
          <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">Data</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## Navigation & Sidebars

### Responsive Sidebar
```jsx
{/* Fixed overlay on mobile, static on desktop */}
<aside className="fixed inset-0 z-40 md:static md:w-64 bg-white border-r border-gray-200">
  {/* Navigation items */}
</aside>
```

### Responsive Header
```jsx
<header className="bg-card-white shadow-sm border-b border-gray-100 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
  {/* Header content */}
</header>
```

---

## Responsive Breakpoints

### Used Consistently
- **Mobile (base)**: 0-639px - Default styles
- **Tablet (sm)**: 640px+ - Small tablets/landscape phones
- **Tablet+ (md)**: 768px+ - Full tablets
- **Desktop (lg)**: 1024px+ - Desktops
- **Desktop XL (xl)**: 1280px+ - Large desktops

### Hiding/Showing Elements
```jsx
<div className="hidden sm:block">Show on tablet+</div>
<div className="sm:hidden">Show on mobile only</div>
<div className="hidden lg:block">Show on desktop only</div>
```

---

## Icon Sizing

### Consistent Icon Sizes
```jsx
<Icon size={18} className="sm:size-5 lg:size-6" />
// Mobile: 18px, Tablet: 20px, Desktop: 24px

// Button icons
<Icon size={16} className="sm:size-4" />
```

---

## Shadows & Borders

### Consistent Shadows
```
Standard Shadow: shadow-custom (0 8px 24px rgba(0,0,0,0.05))
Subtle Shadow:   shadow-sm
No Shadow:       shadow-none
```

### Consistent Borders
```
Primary Border:   border-gray-200
Subtle Border:    border-gray-100
Colored Border:   border-primary-blue
```

### Border Radius
```
Standard Radius: rounded-lg (8px)
Card Radius:     rounded-custom (12px)
Full Circle:     rounded-full
```

---

## Implementation Checklist

### For Every Page
- [ ] Page container has responsive padding: `p-3 sm:p-4 lg:p-6`
- [ ] Spacing uses progression: `space-y-3 sm:space-y-4 lg:space-y-6`
- [ ] Headings scale responsively: `text-xl sm:text-2xl lg:text-3xl`
- [ ] Grids use: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- [ ] Buttons are full-width on mobile: `w-full sm:w-auto`
- [ ] Forms use responsive grid layout
- [ ] Tables have horizontal scroll on mobile
- [ ] Icons scale responsively: `size-4 sm:size-5`
- [ ] All text uses `text-text-dark` or `text-text-muted`
- [ ] All cards use `bg-card-white rounded-lg shadow-custom`

### For Data Tables
- [ ] Headers have `bg-gray-50 border-b border-gray-200`
- [ ] Rows have `border-b border-gray-100 hover:bg-gray-50`
- [ ] Cells have `px-3 sm:px-4 py-3 text-xs sm:text-sm`

### For Forms
- [ ] Labels have `text-xs sm:text-sm font-medium text-text-dark`
- [ ] Inputs have `px-3 sm:px-4 py-2 border border-gray-200 rounded-lg`
- [ ] Form grid: `grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4`

---

## Summary

All pages should follow these patterns to ensure:
✅ **Consistent Design** - Same colors, spacing, typography everywhere
✅ **Mobile-First** - Optimized for small screens first
✅ **Responsive** - Scales beautifully across all devices
✅ **Professional** - Polished, cohesive appearance
✅ **User-Friendly** - Clear hierarchy and easy navigation

