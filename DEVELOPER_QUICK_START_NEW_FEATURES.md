# New Features Quick Start Guide

## 📋 Table of Contents
1. Validation System
2. Caching System
3. Frontend Performance Enhancements
4. Error Handling
5. Example Usage

---

## 1️⃣ Validation System

### Overview
Centralized input validation to prevent invalid data and security issues.

### Available Validators

```javascript
const {
  validateRequiredFields,
  validateEmail,
  validateDate,
  validateNumericRange,
  validateEnum,
  sanitizeString,
  validateObjectId
} = require('../utils/validation');
```

### Usage Examples

#### Check Required Fields
```javascript
const errors = validateRequiredFields({
  studentId: req.body.studentId,
  amount: req.body.amount,
  dueDate: req.body.dueDate
});

if (errors.length > 0) {
  return res.status(400).json({ 
    error: `Missing fields: ${errors.join(', ')}`
  });
}
```

#### Validate ObjectId
```javascript
if (!validateObjectId(req.body.studentId)) {
  return res.status(400).json({ 
    error: 'Invalid studentId format' 
  });
}
```

#### Validate Enum Values
```javascript
if (!validateEnum(req.body.term, ['General', 'First', 'Second', 'Third'])) {
  return res.status(400).json({ 
    error: 'Invalid term. Must be General, First, Second, or Third' 
  });
}
```

#### Validate and Sanitize
```javascript
const description = sanitizeString(req.body.description);
const isValid = validateNumericRange(amount, 0, 1000000);
```

---

## 2️⃣ Caching System

### Overview
In-memory cache manager for storing expensive query results.

### Basic Usage

```javascript
const cacheManager = require('../utils/cache');

// Store data in cache (5 minutes TTL)
cacheManager.set('dashboard-stats', data, 5 * 60 * 1000);

// Retrieve from cache
const cachedData = cacheManager.get('dashboard-stats');

// Check if key exists
if (cacheManager.has('dashboard-stats')) {
  return cacheManager.get('dashboard-stats');
}

// Delete specific entry
cacheManager.delete('dashboard-stats');

// Clear all cache
cacheManager.clear();

// Get cache stats
const stats = cacheManager.getStats();
console.log(`Cache size: ${stats.size}`, `Keys: ${stats.keys}`);
```

### In API Endpoints

```javascript
router.get('/dashboard', requireAuth, asyncHandler(async (req, res) => {
  const cacheKey = 'dashboard-stats';
  
  // Check cache first
  const cached = cacheManager.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  // Compute data (expensive operation)
  const data = await expensiveQuery();

  // Store in cache for 5 minutes
  cacheManager.set(cacheKey, data, 5 * 60 * 1000);

  res.json(data);
}));
```

### Cache Invalidation

```javascript
// When creating/updating data, invalidate related caches
router.post('/fees', requireAuth, asyncHandler(async (req, res) => {
  // ... create fee ...
  
  // Invalidate dashboard cache
  cacheManager.delete('dashboard-stats');
  cacheManager.delete(`parent-dashboard-${parentId}`);
  
  res.status(201).json(fee);
}));
```

### TTL Reference
- Short cache (1-2 min): User-specific data
- Medium cache (5-10 min): Dashboard summaries
- Long cache (30+ min): Static reference data

---

## 3️⃣ Frontend Performance

### Debouncing Filter Changes

```javascript
import { debounce } from '../utils/helpers';
import { useCallback } from 'react';

function MyComponent() {
  const debouncedUpdate = useCallback(
    debounce((value) => {
      // This runs at most once per 500ms
      performSearch(value);
    }, 500),
    []
  );

  return (
    <input 
      onChange={(e) => debouncedUpdate(e.target.value)}
    />
  );
}
```

### Loading Skeletons

```javascript
import { TableSkeleton, CardSkeleton } from '../components/LoadingSkeleton';

function Dashboard() {
  if (loading) {
    return (
      <div>
        <CardSkeleton />
        <TableSkeleton rows={5} />
      </div>
    );
  }

  return <RealContent />;
}
```

### Retry with Exponential Backoff

```javascript
import { retryWithBackoff } from '../utils/helpers';

async function fetchDataWithRetry() {
  const data = await retryWithBackoff(
    () => feesApi.list(),
    3,           // max retries
    1000,        // initial delay (1 second)
    2            // backoff multiplier
  );
  return data;
}
// Delays: 1s, 2s, 4s between retries
```

### Error Boundary

```javascript
import ErrorBoundary from '../components/ErrorBoundary';

export default function Page() {
  return (
    <ErrorBoundary>
      <PageContent />
    </ErrorBoundary>
  );
}
```

---

## 4️⃣ Error Handling

### Backend Error Patterns

```javascript
// Validation error
if (!isValid) {
  return res.status(400).json({ 
    error: 'Validation failed', 
    details: validationErrors 
  });
}

// Not found
if (!resource) {
  return res.status(404).json({ 
    error: 'Resource not found' 
  });
}

// Server error (asyncHandler catches automatically)
throw new Error('Database connection failed');
```

### Frontend Error Patterns

```javascript
try {
  const data = await feesApi.create(formData);
  success('Fee created successfully');
} catch (error) {
  showError(error.message || 'Failed to create fee');
}
```

### Error Boundary Display

Wrap components that might error:
```javascript
<ErrorBoundary>
  <RiskyComponent />
</ErrorBoundary>
```

When error occurs:
- Shows error message
- Provides "Try Again" button
- Doesn't crash entire page

---

## 5️⃣ Complete Example: Fee Creation

### Backend Implementation

```javascript
const { validateRequiredFields, validateObjectId, validateEnum, sanitizeString } = require('../utils/validation');
const cacheManager = require('../utils/cache');

router.post('/fees', requireAuth, requireRole(ROLES.ACCOUNTS), asyncHandler(async (req, res) => {
  const { studentId, amount, description, dueDate, academicYear, term } = req.body;

  // Validate required fields
  const missingFields = validateRequiredFields({ studentId, amount, dueDate, academicYear });
  if (missingFields.length > 0) {
    return res.status(400).json({ 
      error: `Missing: ${missingFields.join(', ')}` 
    });
  }

  // Validate studentId format
  if (!validateObjectId(studentId)) {
    return res.status(400).json({ 
      error: 'Invalid studentId format' 
    });
  }

  // Validate amount
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ 
      error: 'Amount must be a positive number' 
    });
  }

  // Validate term
  if (term && !validateEnum(term, ['General', 'First', 'Second', 'Third'])) {
    return res.status(400).json({ 
      error: 'Invalid term' 
    });
  }

  // Create fee with sanitized data
  const fee = new Fee({
    studentId,
    amount,
    description: sanitizeString(description),
    dueDate: new Date(dueDate),
    academicYear,
    term: term || 'General',
    status: 'unpaid',
    createdBy: req.user.id
  });

  await fee.save();

  // Invalidate cache
  cacheManager.delete('dashboard-stats');

  res.status(201).json({ message: 'Fee created', fee });
}));
```

### Frontend Implementation

```javascript
import { useState, useCallback } from 'react';
import { debounce } from '../utils/helpers';
import ErrorBoundary from '../components/ErrorBoundary';
import { TableSkeleton } from '../components/LoadingSkeleton';

function FeesPage() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ academicYear: '', term: '' });

  // Debounce filter changes
  const debouncedFilterUpdate = useCallback(
    debounce((newFilters) => {
      setFilters(newFilters);
    }, 500),
    []
  );

  const handleFilterChange = useCallback((key, value) => {
    debouncedFilterUpdate({ ...filters, [key]: value });
  }, [filters, debouncedFilterUpdate]);

  if (loading) {
    return <TableSkeleton rows={5} />;
  }

  return (
    <ErrorBoundary>
      <div>
        <select onChange={(e) => handleFilterChange('academicYear', e.target.value)}>
          {/* options */}
        </select>

        <select onChange={(e) => handleFilterChange('term', e.target.value)}>
          {/* options */}
        </select>

        {/* Table with fees */}
      </div>
    </ErrorBoundary>
  );
}
```

---

## 📚 Integration Checklist

When adding new features:

- [ ] Use validation utilities for input validation
- [ ] Add error handling with try-catch
- [ ] Implement caching for expensive queries
- [ ] Invalidate cache on data mutations
- [ ] Use ErrorBoundary for risky components
- [ ] Add loading skeletons for better UX
- [ ] Debounce filter/search inputs
- [ ] Test with invalid data
- [ ] Verify cache behavior

---

## 🐛 Troubleshooting

### Cache Not Working
```javascript
// Check cache stats
const stats = cacheManager.getStats();
console.log(stats);

// Clear cache
cacheManager.clear();

// Restart server
```

### Validation Not Triggering
```javascript
// Ensure validation function is imported
const { validateRequired } = require('../utils/validation');

// Check field names match exactly
const errors = validateRequiredFields(data);
console.log('Missing fields:', errors);
```

### Debounce Not Working
```javascript
// Ensure useCallback dependency array is empty
const debounced = useCallback(
  debounce(fn, 500),
  []  // IMPORTANT: Empty dependencies
);
```

### Error Boundary Not Catching
```javascript
// Error boundary must wrap the risky component
<ErrorBoundary>
  <RiskyComponent />  {/* Error caught */}
</ErrorBoundary>

<RiskyComponent />  {/* Error NOT caught */}
```

---

## 📖 Documentation Files

- `UPGRADE_REPORT_PHASE_4.md` - Complete upgrade details
- `SESSION_SUMMARY_COMPLETE.md` - Session overview
- Backend: `/backend/src/utils/validation.js`
- Backend: `/backend/src/utils/cache.js`
- Frontend: `/frontend/src/utils/helpers.js`
- Frontend: `/frontend/src/components/LoadingSkeleton.jsx`
