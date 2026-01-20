# Design System Quick Reference - Developer Guide

## 🎯 For New Pages: Copy This Template

```jsx
import { useState, useEffect } from 'react'
import { BookOpen, Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { yourApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'

function YourPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      setLoading(true)
      const data = await yourApi.list()
      setItems(data)
    } catch (err) {
      showError(err.message || 'Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  return (
    // ✅ MAIN CONTAINER - Apply everywhere!
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
      
      // ✅ HEADER SECTION
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          {/* ✅ HEADING - Standard size scale */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-dark flex items-center gap-2">
            <BookOpen size={24} className="flex-shrink-0" />
            Your Page Title
          </h1>
          {/* ✅ DESCRIPTION - Smaller text */}
          <p className="text-xs sm:text-sm text-text-muted mt-1">Page description here</p>
        </div>
        
        {/* ✅ ACTION BUTTON - Responsive width */}
        <button
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-blue text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors font-medium text-xs sm:text-sm"
        >
          <Plus size={18} />
          Add Item
        </button>
      </div>

      {/* ✅ SEARCH BAR - Responsive card */}
      <div className="bg-card-white rounded-custom shadow-custom p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
        </div>
      </div>

      {/* ✅ RESPONSIVE GRID - Choose your columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-card-white rounded-custom shadow-custom p-3 sm:p-4 lg:p-6">
            <h3 className="font-semibold text-text-dark text-sm sm:text-base">{item.name}</h3>
            <p className="text-xs sm:text-sm text-text-muted mt-2">{item.description}</p>
            
            {/* ✅ ACTION BUTTONS - Responsive layout */}
            <div className="flex gap-2 mt-4">
              <button className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors">
                Edit
              </button>
              <button className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default YourPage
```

---

## 🎨 Color System

```javascript
// Tailwind Colors (use these class names)
text-text-dark        // #1F2937 - Main text
text-text-muted       // #6B7280 - Secondary text
bg-primary-blue       // #00BFFF - Primary actions
bg-card-white         // #FFFFFF - Cards & containers
bg-[#1a1a2e]         // Navy - Footer/special sections
bg-background-light   // #F5F5F5 - Page background
```

---

## 📐 Responsive Breakpoints

| Breakpoint | Width | Use Case | Class |
|-----------|-------|----------|-------|
| Base | 0-639px | Mobile | (no prefix) |
| sm | 640px+ | Tablet/Landscape | sm: |
| md | 768px+ | Small Desktop | md: |
| lg | 1024px+ | Desktop | lg: |
| xl | 1280px+ | Large Desktop | xl: |

**Rule:** Always start with mobile, then add sm:, md:, lg:

---

## 📏 Spacing System

### Padding (p-*)
```
Mobile:  p-3  (12px)
Tablet:  sm:p-4  (16px)
Desktop: lg:p-6  (24px)
```

### Vertical Spacing (space-y-*)
```
Mobile:  space-y-3
Tablet:  sm:space-y-4
Desktop: lg:space-y-6
```

### Gaps (gap-*)
```
Mobile:  gap-3
Tablet:  sm:gap-4
Desktop: lg:gap-6
```

---

## 🔤 Typography Sizes

### Headings
| Level | Mobile | Tablet | Desktop |
|-------|--------|--------|---------|
| H1 (Page Title) | text-xl | sm:text-2xl | lg:text-3xl |
| H2 (Section) | text-base | sm:text-lg | lg:text-xl |
| H3 (Subsection) | text-sm | sm:text-base | (same) |

### Body Text
| Type | Size |
|------|------|
| Standard body | text-xs sm:text-sm |
| Small/muted | text-xs |
| Links/emphasis | text-sm |

---

## 📊 Grid Layouts

### 3-Column (Most Common)
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
```
**Mobile:** 1 column | **Tablet:** 2 columns | **Desktop:** 3 columns

### 4-Column (Dashboard Cards)
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
```
**Mobile:** 1 column | **Tablet:** 2 columns | **Desktop:** 4 columns

### 5-Column (Schedule)
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
```
**Mobile:** 1 column | **Tablet:** 2 columns | **Desktop:** 5 columns

### 2-Column (Forms)
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
```
**Mobile:** 1 column | **Tablet+:** 2 columns

---

## 🔘 Button Patterns

### Primary Button
```jsx
<button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-blue text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors font-medium text-xs sm:text-sm">
  <Plus size={18} />
  Add Item
</button>
```

### Secondary Button
```jsx
<button className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50">
  Cancel
</button>
```

### Icon Button
```jsx
<button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
  <Edit2 size={18} />
</button>
```

---

## 📝 Form Elements

### Text Input
```jsx
<input
  type="text"
  placeholder="Search..."
  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
/>
```

### Select Dropdown
```jsx
<select className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue">
  <option>Select...</option>
</select>
```

### Form Group
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
  <div>
    <label className="block text-xs sm:text-sm font-medium text-text-dark mb-1">Label</label>
    <input type="text" className="w-full..." />
  </div>
</div>
```

---

## 🎴 Card Pattern

```jsx
<div className="bg-card-white rounded-custom shadow-custom p-3 sm:p-4 lg:p-6">
  <h3 className="font-semibold text-sm sm:text-base text-text-dark mb-2">Card Title</h3>
  <p className="text-xs sm:text-sm text-text-muted">Card content</p>
</div>
```

---

## 🚫 What NOT to Do

❌ **Don't use fixed sizes:**
```jsx
// WRONG
<div className="p-6">  // Fixed padding
<h1 className="text-2xl">  // No mobile size
<div className="grid grid-cols-3">  // Breaks on mobile!
```

✅ **Do use responsive sizes:**
```jsx
// CORRECT
<div className="p-3 sm:p-4 lg:p-6">  // Responsive
<h1 className="text-xl sm:text-2xl lg:text-3xl">  // Scales up
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">  // Adapts
```

---

## 🔧 Common Fixes

### Issue: "Heading too small on mobile"
**Fix:** Add mobile size
```jsx
// WRONG
<h1 className="text-3xl">

// CORRECT
<h1 className="text-xl sm:text-2xl lg:text-3xl">
```

### Issue: "Button overflowing on mobile"
**Fix:** Make it full width
```jsx
// WRONG
<button className="px-4 py-2">

// CORRECT
<button className="w-full sm:w-auto px-3 sm:px-4 py-2">
```

### Issue: "Grid breaking on mobile"
**Fix:** Use responsive grid-cols
```jsx
// WRONG
<div className="grid grid-cols-3">

// CORRECT
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
```

### Issue: "Cards too cramped on mobile"
**Fix:** Responsive padding
```jsx
// WRONG
<div className="p-6">

// CORRECT
<div className="p-3 sm:p-4 lg:p-6">
```

---

## ✨ Icon Sizes

| Usage | Size | Class |
|-------|------|-------|
| Header/Large | 24px | size-24 or size-6 |
| Standard | 20px | size-5 |
| Compact | 18px | size-[18px] |
| Small/Inline | 16px | size-4 |

**Tip:** Use `size-18` or `size-[18px]` for mobile-friendly icons

---

## 🎯 Quick Checklist for New Pages

- [ ] Container has `space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6`
- [ ] Heading is `text-xl sm:text-2xl lg:text-3xl`
- [ ] Buttons are `w-full sm:w-auto`
- [ ] Grids use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-*`
- [ ] Text sizes: `text-xs sm:text-sm`
- [ ] Colors from design system (not hardcoded hex)
- [ ] Forms have responsive label+input pattern
- [ ] Search bars use `pl-9` for icon padding
- [ ] All icon sizes are 18px or responsive
- [ ] Gaps/spacing follow `gap-3 sm:gap-4 lg:gap-6`

---

## 📚 Full Documentation

For detailed information, see:
- `/DESIGN_SYSTEM_STANDARDIZATION.md` - Complete system
- `/STANDARDIZATION_COMPLETE_REPORT.md` - Full details
- `/STANDARDIZATION_COMPLIANCE_VERIFICATION.md` - Verification

---

**Last Updated:** 2026-01-20  
**Design System Version:** 1.0  
**Status:** ✅ Production Ready
