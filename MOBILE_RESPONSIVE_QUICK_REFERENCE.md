# Mobile-First Responsive Design - Quick Reference

## Breakpoints
```
Base Mobile:    No prefix      (< 640px)   - Default, mobile-first
sm:             sm:            (≥ 640px)   - Small tablets
md:             md:            (≥ 768px)   - Medium tablets, navigation changes
lg:             lg:            (≥ 1024px)  - Desktops
xl:             xl:            (≥ 1280px)  - Large desktops
```

## Common Responsive Patterns

### Spacing Progression
```jsx
// Always start with mobile spacing, add larger breakpoints
<div className="p-3 sm:p-4 lg:p-6">...</div>
<div className="space-y-3 sm:space-y-4 lg:space-y-6">...</div>
<div className="gap-2 sm:gap-3 lg:gap-4">...</div>
```

### Grid Layouts
```jsx
// Mobile-first grid: 1 column → 2 columns → 3-4 columns
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">...</div>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">...</div>
```

### Flex Layouts
```jsx
// Stack on mobile, arrange on larger screens
<div className="flex flex-col sm:flex-row gap-2 sm:gap-4">...</div>

// Center content on mobile, left-align on tablet+
<div className="flex flex-col sm:flex-row justify-center sm:justify-start">...</div>
```

### Typography
```jsx
// Scale text from mobile to desktop
<h1 className="text-xl sm:text-2xl lg:text-3xl">Title</h1>
<p className="text-sm sm:text-base lg:text-lg">Body text</p>
```

### Icons & Images
```jsx
// Responsive sizing for icons
<Icon size={18} className="sm:size-5 lg:size-6" />

// Responsive image sizing
<img className="w-16 sm:w-20 lg:w-24" src="..." />
```

### Hide/Show Elements
```jsx
// Hide on mobile, show on tablet+
<div className="hidden sm:block">Content for tablet+</div>

// Show on mobile, hide on tablet+
<div className="sm:hidden">Mobile only</div>

// Hide on mobile, show only on desktop
<div className="hidden lg:block">Desktop only</div>
```

### Buttons
```jsx
// Mobile-friendly button layout
<button className="flex items-center justify-center sm:justify-start gap-2 
  bg-primary-blue text-white px-3 sm:px-4 py-2 rounded-lg 
  hover:bg-primary-blue/90 transition-colors text-sm sm:text-base font-medium">
  <Icon size={18} className="sm:size-5" />
  <span>Button Text</span>
</button>
```

### Form Inputs
```jsx
// Mobile-first form input
<input 
  type="text"
  placeholder="Search..."
  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base 
    border border-gray-200 rounded-lg focus:outline-none 
    focus:ring-2 focus:ring-primary-blue"
/>
```

### Tables (Responsive Columns)
```jsx
// Hide columns on smaller screens
<th className="hidden sm:table-cell">Column 1</th>
<th className="hidden md:table-cell">Column 2</th>
<th className="hidden lg:table-cell">Column 3</th>
<th className="hidden xl:table-cell">Column 4</th>
```

## Component Structure Example

```jsx
function MyComponent() {
  return (
    // Main container with responsive spacing and padding
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
      
      {/* Header with responsive flex */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Title</h1>
          <p className="text-sm sm:text-base text-text-muted mt-1">Subtitle</p>
        </div>
        
        {/* Responsive button */}
        <button className="flex items-center justify-center sm:justify-start gap-2 
          bg-primary-blue text-white px-3 sm:px-4 py-2 rounded-lg 
          text-sm sm:text-base font-medium">
          <Icon size={18} className="sm:size-5" />
          <span>Action</span>
        </button>
      </div>

      {/* Content card with responsive padding */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
        
        {/* Search with responsive sizing */}
        <input 
          className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg mb-4 sm:mb-6"
          placeholder="Search..."
        />

        {/* Responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Cards auto-responsive */}
          <div className="p-3 sm:p-4">Item</div>
        </div>
      </div>
    </div>
  )
}
```

## Mobile-First Development Workflow

1. **Start with mobile**: Write all base styles for mobile (< 640px)
   ```jsx
   <div className="p-3 text-sm flex flex-col">...</div>
   ```

2. **Add tablet enhancements** (sm:, md:):
   ```jsx
   <div className="p-3 sm:p-4 md:p-5 text-sm sm:text-base md:text-lg flex flex-col sm:flex-row">...</div>
   ```

3. **Add desktop optimizations** (lg:, xl:):
   ```jsx
   <div className="p-3 sm:p-4 md:p-5 lg:p-6 text-sm sm:text-base md:text-lg lg:text-xl flex flex-col sm:flex-row lg:gap-6">...</div>
   ```

## Responsive CSS Utilities Available

### `responsive-table`
Mobile card view for tables - headers hidden, data as labeled cards
```jsx
<div className="responsive-table">
  <table>...</table>
</div>
```

### `responsive-grid`
Auto-responsive grid: 1 col mobile → 2 cols tablet → 4 cols desktop
```jsx
<div className="responsive-grid">...</div>
```

### `responsive-flex`
Auto-responsive flex: column mobile → row tablet
```jsx
<div className="responsive-flex">...</div>
```

### `form-grid`
Mobile-first form layout: 1 col mobile → 2 cols tablet+
```jsx
<div className="form-grid">
  <input />
  <input />
  <input className="form-grid full" /> {/* Full width */}
</div>
```

### `card-responsive`
Auto-responsive card padding: 1rem → 1.5rem → 2rem
```jsx
<div className="card-responsive">...</div>
```

### `text-responsive-sm`
Responsive small text: 0.875rem → 1rem
```jsx
<p className="text-responsive-sm">Small responsive text</p>
```

### `text-responsive-lg`
Responsive large text: 1.25rem → 1.5rem → 1.875rem
```jsx
<p className="text-responsive-lg">Large responsive text</p>
```

## Touch-Friendly Guidelines

- Minimum button size: 44x44px (all platforms)
- Minimum touch target: 44x44px
- Adequate spacing between interactive elements: gap-2 or p-1
- Avoid small text: Use `text-sm` or larger
- Use `sm:` prefix for tablet enhancements

## Common Mobile Issues & Fixes

### Issue: Overflow on mobile
```jsx
// ❌ Wrong
<div className="w-full px-6">...</div>

// ✅ Correct
<div className="w-full px-3 sm:px-4 lg:px-6">...</div>
```

### Issue: Text too small on mobile
```jsx
// ❌ Wrong
<h1 className="text-2xl">Heading</h1>

// ✅ Correct
<h1 className="text-lg sm:text-xl lg:text-2xl">Heading</h1>
```

### Issue: Grid too crowded on mobile
```jsx
// ❌ Wrong
<div className="grid grid-cols-3 gap-6">...</div>

// ✅ Correct
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">...</div>
```

### Issue: Buttons too small to tap
```jsx
// ❌ Wrong
<button className="px-2 py-1 text-xs">Click</button>

// ✅ Correct
<button className="px-3 sm:px-4 py-2 text-sm sm:text-base min-h-[44px] min-w-[44px]">Click</button>
```

## Tailwind Responsive Utilities Cheat Sheet

| Utility | Mobile | sm: | md: | lg: | xl: |
|---------|--------|-----|-----|-----|-----|
| p-3 / p-4 / p-6 | 12px | - | - | - | - |
| space-y-3 / space-y-6 | 12px | - | - | - | - |
| text-sm / text-base / text-lg | Small | - | - | - | - |
| grid-cols-1 / grid-cols-2 / grid-cols-3 | 1 col | 2 cols | - | 3 cols | - |
| flex-col / flex-row | Column | - | - | Row | - |
| hidden / block | Hidden | Show | - | - | - |
| gap-2 / gap-3 / gap-4 | 8px | - | - | 16px | - |

## Best Practices

✅ Always start with mobile-first approach
✅ Test on actual mobile devices
✅ Use semantic breakpoints (sm:, md:, lg:, xl:)
✅ Keep spacing consistent across breakpoints
✅ Ensure minimum 44x44px touch targets
✅ Hide non-critical content on mobile
✅ Progressive enhancement pattern
✅ Test forms on mobile
✅ Optimize images for mobile
✅ Keep mobile CSS minimal

## Resources

- Tailwind CSS Responsive Design: https://tailwindcss.com/docs/responsive-design
- Mobile-First Design: https://www.interaction-design.org/literature/topics/mobile-first-design
- Touch Targets: https://www.smashingmagazine.com/2012/02/finger-friendly-design-ideal-mobile-touchscreen-target-sizes/

---

**Last Updated**: January 15, 2026
**Applicable To**: All frontend components
