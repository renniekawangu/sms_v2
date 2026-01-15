# Mobile-First Responsive Patterns - Quick Reference

## Quick Copy-Paste Patterns

### 1. Page Container (Apply to all pages)
```jsx
<div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
  {/* Page content */}
</div>
```

### 2. Page Header with Button
```jsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
  <div>
    <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-dark">Title</h1>
    <p className="text-sm sm:text-base text-text-muted mt-1">Subtitle</p>
  </div>
  <button className="flex items-center justify-center sm:justify-start gap-2 bg-primary-blue text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors text-sm sm:text-base font-medium">
    <Plus size={18} className="sm:size-5" />
    <span>Action</span>
  </button>
</div>
```

### 3. Search + Filter Container
```jsx
<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
  <div className="flex-1 relative">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
    <input
      type="text"
      placeholder="Search..."
      className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
    />
  </div>
  <select className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue min-w-[120px] sm:min-w-[140px]">
    <option>All</option>
  </select>
</div>
```

### 4. Responsive Table
```jsx
<div className="overflow-x-auto">
  <table className="w-full text-xs sm:text-sm">
    <thead>
      <tr className="border-b border-gray-200">
        <th className="hidden sm:table-cell text-left py-3 px-2 sm:px-4 font-semibold">ID</th>
        <th className="text-left py-3 px-2 sm:px-4 font-semibold">Name</th>
        <th className="hidden md:table-cell text-left py-3 px-4 font-semibold">Email</th>
        <th className="hidden lg:table-cell text-left py-3 px-4 font-semibold">Phone</th>
        <th className="text-left py-3 px-2 sm:px-4 font-semibold">Actions</th>
      </tr>
    </thead>
    <tbody>
      {items.map(item => (
        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
          <td className="hidden sm:table-cell py-3 px-2 sm:px-4">{item.id}</td>
          <td className="py-3 px-2 sm:px-4 font-medium">{item.name}</td>
          <td className="hidden md:table-cell py-3 px-4">{item.email}</td>
          <td className="hidden lg:table-cell py-3 px-4">{item.phone}</td>
          <td className="py-3 px-2 sm:px-4">
            <div className="flex items-center gap-1 sm:gap-3">
              <button className="text-primary-blue hover:text-primary-blue/80 p-1 rounded hover:bg-blue-50" title="Edit">
                <Edit size={14} className="sm:size-4" />
                <span className="hidden sm:inline text-xs sm:text-sm">Edit</span>
              </button>
              <button className="text-red-500 hover:text-red-600 p-1 rounded hover:bg-red-50" title="Delete">
                <Trash2 size={14} className="sm:size-4" />
                <span className="hidden sm:inline text-xs sm:text-sm">Delete</span>
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### 5. Responsive Grid Layout
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
  {items.map(item => (
    <div key={item.id} className="bg-card-white rounded-custom shadow-custom p-3 sm:p-4 lg:p-6">
      {/* Card content */}
    </div>
  ))}
</div>
```

### 6. Responsive Card
```jsx
<div className="bg-card-white rounded-custom shadow-custom p-3 sm:p-4 lg:p-6">
  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-text-dark mb-2">Title</h3>
  <p className="text-xs sm:text-sm text-text-muted">Content</p>
</div>
```

### 7. Responsive Form
```jsx
<form className="space-y-3 sm:space-y-4">
  <div>
    <label className="block text-xs sm:text-sm font-medium text-text-dark mb-2">Label</label>
    <input type="text" className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-200 rounded-lg" />
  </div>
  <div className="flex flex-col sm:flex-row items-center gap-3">
    <button type="submit" className="w-full sm:flex-1 px-4 py-2 text-sm sm:text-base bg-primary-blue text-white rounded-lg">
      Submit
    </button>
    <button type="button" className="w-full sm:flex-1 px-4 py-2 text-sm sm:text-base border border-gray-200 rounded-lg">
      Cancel
    </button>
  </div>
</form>
```

### 8. Responsive Hero Section
```jsx
<div className="flex flex-col gap-3 sm:gap-4 lg:gap-6 py-6 sm:py-8 lg:py-12 px-3 sm:px-4 lg:px-6">
  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-dark">Main Title</h1>
  <p className="text-base sm:text-lg text-text-muted max-w-2xl">Description text</p>
  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
    <button className="px-4 py-2 sm:px-6 bg-primary-blue text-white rounded-lg">Primary</button>
    <button className="px-4 py-2 sm:px-6 border border-gray-200 rounded-lg">Secondary</button>
  </div>
</div>
```

### 9. Responsive Navbar Item
```jsx
<NavLink to="/path" className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-100">
  <Icon size={18} className="flex-shrink-0" />
  <span className="hidden sm:inline text-sm sm:text-base">Label</span>
</NavLink>
```

### 10. Responsive Button Group
```jsx
<div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
  <button className="w-full sm:flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-primary-blue text-white rounded-lg">
    Primary
  </button>
  <button className="w-full sm:flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-200 rounded-lg">
    Secondary
  </button>
</div>
```

### 11. Responsive Stats Card
```jsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
  {stats.map(stat => (
    <div key={stat.id} className="bg-card-white rounded-custom shadow-custom p-2 sm:p-4 lg:p-6 text-center">
      <p className="text-xs sm:text-sm text-text-muted mb-1">Label</p>
      <p className="text-lg sm:text-2xl lg:text-3xl font-semibold text-text-dark">{stat.value}</p>
    </div>
  ))}
</div>
```

### 12. Responsive List
```jsx
<div className="space-y-2 sm:space-y-3">
  {items.map(item => (
    <div key={item.id} className="p-2 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
      <h3 className="text-sm sm:text-base font-semibold text-text-dark">{item.title}</h3>
      <p className="text-xs sm:text-sm text-text-muted mt-1">{item.description}</p>
    </div>
  ))}
</div>
```

## Spacing Reference

### Margin/Padding
```
p-2 = 8px
p-3 = 12px    ← Mobile default
p-4 = 16px    ← Tablet default  
p-6 = 24px    ← Desktop default

Pattern: p-3 sm:p-4 lg:p-6
```

### Gap (Flex/Grid)
```
gap-2 = 8px
gap-3 = 12px   ← Mobile default
gap-4 = 16px   ← Tablet default
gap-6 = 24px   ← Desktop default

Pattern: gap-3 sm:gap-4 lg:gap-6
```

### Space Between (Vertical)
```
space-y-3 = 12px gaps
space-y-4 = 16px gaps
space-y-6 = 24px gaps

Pattern: space-y-3 sm:space-y-4 lg:space-y-6
```

## Text Size Reference

### Headers
```
text-xl = 20px    ← Mobile h1
text-2xl = 24px   ← Tablet h1
text-3xl = 30px   ← Desktop h1

Pattern: text-xl sm:text-2xl lg:text-3xl
```

### Body
```
text-xs = 12px   ← Mobile small
text-sm = 14px   ← Mobile default
text-base = 16px ← Tablet/Desktop
text-lg = 18px   ← Desktop large

Pattern: text-sm sm:text-base lg:text-lg
```

## Icon Size Reference

```
Mobile base: size-4 or size-5 (16-20px)
Tablet: size-5 or size-6 (20-24px)
Desktop: size-6 or size-7 (24-28px)

Pattern: <Icon size={16} className="sm:size-5" />
```

## Visibility Reference

```jsx
// Show only on mobile
visible sm:hidden

// Hide on mobile, show on tablet+
hidden sm:inline
hidden sm:table-cell
hidden sm:block

// Show only on desktop
hidden lg:block

// Progressive visibility
hidden sm:hidden md:block  // Show only on md+
```

## Column Hide Pattern for Tables

```jsx
// Essential columns always visible
<th>Name</th>

// Hide on small mobile (sm+)
<th className="hidden sm:table-cell">ID</th>

// Hide until tablet (md+)
<th className="hidden md:table-cell">Email</th>

// Hide until desktop (lg+)
<th className="hidden lg:table-cell">Phone</th>

// Hide until large desktop (xl+)
<th className="hidden xl:table-cell">Extra Info</th>
```

## Common Combinations

### Mobile-First Button
```jsx
className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg"
```

### Mobile-First Container
```jsx
className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6"
```

### Mobile-First Flex
```jsx
className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4"
```

### Mobile-First Grid
```jsx
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6"
```

### Mobile-First Text
```jsx
className="text-sm sm:text-base lg:text-lg text-text-dark"
```

---

## Tips

1. **Always start with mobile**: The base class (no breakpoint) is for mobile
2. **Add sm: for tablets**: Next breakpoint is for small tablets/landscape
3. **Add md/lg for desktop**: Larger breakpoints for increasingly larger screens
4. **Test on real devices**: Use Chrome DevTools device emulation
5. **Keep it consistent**: Use the same pattern across all pages
6. **Touch targets**: Buttons should be at least 44x44px on mobile
7. **Icon sizing**: Adjust icon sizes per breakpoint for better visual balance
8. **Hide responsibly**: Only hide content that's less important on mobile

---

Generated: 2024
For use with Tailwind CSS 3.x and React 18+
