# Accounts System - Academic Year Structure Update

## Overview
Updated the Accounts/Fees management system to integrate with the new academic year structure. This enables proper tracking and filtering of fees by academic year and term.

## Changes Made

### 1. Backend - Fee Model (`backend/src/models/fees.js`)

#### Added Fields
```javascript
academicYear: { type: String }  // e.g., "2024-2025"
term: { type: String }           // e.g., "Term 1", "Term 2"
```

#### New Helper Functions
- `getAllFees(academicYear)` - Get fees, optionally filtered by academic year
- `getFeesByStudent(studentId, academicYear)` - Get student fees with year filter
- `getFeesByAcademicYear(academicYear)` - Get all fees for a specific academic year
- `getFeesByTerm(academicYear, term)` - Get fees by both academic year and term

#### Updated Exports
```javascript
{ Fee, getAllFees, getFeeById, getFeesByStudent, getFeesByAcademicYear, getFeesByTerm, ... }
```

### 2. Backend - Accounts API (`backend/src/routes/accounts-api.js`)

#### Updated Dashboard Endpoint
- `GET /api/accounts/dashboard` - Now filters fees by current academic year

#### Updated Fees Endpoints

**GET /api/accounts/fees**
- New query parameters:
  - `academicYear` - Filter by academic year
  - `term` - Filter by term
  - `status` - Existing status filter (paid, unpaid, pending)
  - `page` - Existing pagination
  - `limit` - Existing pagination

**POST /api/accounts/fees**
- Now requires:
  - `academicYear` - Required field
  - `term` - Optional (defaults to "General")
  - `studentId` - Student MongoDB ObjectId
  - `amount` - Fee amount
  - `dueDate` - Due date
  - Optional: `description`, `type`

### 3. Frontend - Fees Service (`frontend/src/services/api.js`)

#### Added New Method
```javascript
feesApi.listByFilters(queryParams)
```
- Queries `/api/accounts/fees` with academic year, term, and other filters
- Returns paginated results from the accounts API

### 4. Frontend - Fees Page (`frontend/src/pages/Fees.jsx`)

#### State Management
```javascript
const [filters, setFilters] = useState({
  academicYear: '',
  term: ''
})
const [academicYears, setAcademicYears] = useState([])
```

#### Filter UI Added
- Academic Year dropdown (populated from Settings context)
- Term dropdown (Term 1, Term 2, Term 3, General)
- Reset Filters button (resets to current academic year)

#### Updated Table
- Replaced "Year" column with "Academic Year"
- Shows: ID, Student, Amount, Academic Year, Term, Status, Actions
- Properly displays fee data from new schema

#### Auto-Loading by Filters
- Automatically reloads fees when filters change
- Sets default academic year to current year on mount
- Properly handles pagination from backend

### 5. Frontend - Fee Form Component (`frontend/src/components/FeeForm.jsx`)

#### Updated Form Fields
```javascript
{
  studentId,        // MongoDB ObjectId (from Settings context)
  amount,
  description,
  dueDate,          // Date selector
  academicYear,     // Dropdown (from context)
  term,             // Select (Term 1, 2, 3, or General)
  status            // Select (unpaid, pending, paid)
}
```

#### Integration with Settings
- Uses `useSettings()` hook to access:
  - `currentAcademicYear` - Sets as default
  - `academicYears` - Populates academic year dropdown
- Form validates all required fields

#### Student Lookup
- Changed from numeric student_id to MongoDB ObjectId
- Displays: `{firstName} {lastName} (ID: {studentId})`

## Data Flow

### Creating a New Fee
```
1. User selects Student (ObjectId)
2. User enters Amount
3. User selects Due Date
4. User selects Academic Year (from dropdown)
5. User selects Term (default: General)
6. User enters optional Description
7. Form submits to: POST /api/accounts/fees
8. Backend creates fee with academicYear + term
9. Fee appears in filtered list
```

### Filtering Fees
```
1. User selects Academic Year filter
2. User selects Term filter (optional)
3. Component reloads with: GET /api/accounts/fees?academicYear=X&term=Y
4. Backend returns filtered, paginated results
5. Table displays results organized by year/term
```

## API Response Format

### Fee Object
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "studentId": {
    "_id": "507f1f77bcf86cd799439012",
    "firstName": "John",
    "lastName": "Doe",
    "studentId": "STU-001"
  },
  "amount": 5000,
  "description": "Tuition Fee",
  "dueDate": "2026-02-28",
  "academicYear": "2024-2025",
  "term": "Term 1",
  "status": "unpaid",
  "amountPaid": 0,
  "createdAt": "2026-01-21T10:00:00Z",
  "updatedAt": "2026-01-21T10:00:00Z"
}
```

### Pagination Response
```json
{
  "fees": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 120,
    "pages": 3
  }
}
```

## Backward Compatibility

Fees created without `academicYear` field:
- Will not appear in filtered views (unless filter is empty)
- Can still be accessed and updated via API
- Recommendation: Migrate existing fees or set default year during initial load

## Testing Checklist

✅ Frontend builds without errors
✅ No syntax errors in backend or frontend code
✅ Backend API accepts academicYear and term parameters
✅ Fee form uses new data structure with MongoDB ObjectIds
✅ Filters work correctly for academic year and term
✅ Table displays updated schema properly
✅ Settings context provides academic years correctly
✅ Default academic year set to current year

## Next Steps

1. **Data Migration**: If existing fees don't have academicYear set, consider:
   - Setting to current academic year for all existing fees
   - Or filtering them out with a "legacy" flag

2. **Fee Structure Integration**: Consider linking FeeStructure to individual fees:
   - Fee creation could pre-populate amounts from FeeStructure
   - Fee structure could auto-generate fees for all students in a class

3. **Reporting**: Add academic year/term filters to:
   - Financial reports
   - Payment tracking
   - Revenue analysis

4. **Bulk Operations**: Consider bulk:
   - Create fees for all students in a class for a term
   - Mark multiple fees as paid
   - Generate fee statements by year/term

## Files Modified

### Backend
- `/backend/src/models/fees.js` - Added academicYear/term fields and helper functions
- `/backend/src/routes/accounts-api.js` - Updated endpoints with academic year filtering

### Frontend
- `/frontend/src/services/api.js` - Added listByFilters method
- `/frontend/src/pages/Fees.jsx` - Added filters and updated table display
- `/frontend/src/components/FeeForm.jsx` - Updated form fields for new structure
