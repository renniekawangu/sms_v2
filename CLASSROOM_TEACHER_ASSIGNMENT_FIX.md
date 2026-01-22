# Fix: Classroom Teacher Assignment - User Teachers Now Visible

## Issue
When trying to assign a class, the form was only showing Staff teachers and not showing all eligible teachers that have `role="teacher"`.

## Root Cause
The Classrooms page was fetching teachers from `adminApi.listStaff({ role: 'teacher' })` which only returned Staff records, but the backend now supports assigning classrooms to any User with `role="teacher"`.

## Solution
Updated the Classrooms page to use `teachersApi.list()` instead, which returns both Staff and User teachers.

## Changes Made

### File: [frontend/src/pages/Classrooms.jsx](frontend/src/pages/Classrooms.jsx)

**Change 1: Updated import** (Line 3)
```javascript
// Before:
import { classroomsApi, adminApi, timetableApi } from '../services/api'

// After:
import { classroomsApi, adminApi, timetableApi, teachersApi } from '../services/api'
```

**Change 2: Updated loadData function** (Lines 30-65)
```javascript
// Before:
const [classroomsData, staffResp, studentsResp, coursesData] = await Promise.all([
  classroomsApi.list(),
  adminApi.listStaff({ role: 'teacher', limit: 1000 }),  // Only Staff
  adminApi.listStudents({ limit: 1000 }),
  timetableApi.courses.list()
])

const teacherList = (staffResp.staff || []).map(t => ({
  _id: t._id,
  name: [t.firstName, t.lastName].filter(Boolean).join(' ').trim() || 'Teacher'
}))

// After:
const [classroomsData, teachersData, studentsResp, coursesData] = await Promise.all([
  classroomsApi.list(),
  teachersApi.list(),  // Both Staff and User teachers
  adminApi.listStudents({ limit: 1000 }),
  timetableApi.courses.list()
])

const teacherList = (teachersData || []).map(t => ({
  _id: t._id,
  name: t.name || [t.firstName, t.lastName].filter(Boolean).join(' ').trim() || 'Teacher',
  type: t.type || 'staff'  // type indicator: 'staff' or 'user'
}))
```

## Result

✅ **Now users will see ALL eligible teachers:**
- Staff teachers (with role='teacher')
- User teachers (with role='teacher')

✅ **Classroom assignment form displays:**
- All Staff teachers
- All User entities with role='teacher'
- Properly filtered teacher names
- Teacher type indicator for debugging

✅ **Backend correctly handles:**
- Assignment to Staff teachers
- Assignment to User teachers
- Validation of role='teacher' on assignment

## Files Affected
- `frontend/src/pages/Classrooms.jsx` - Updated teacher loading

## Build Status
✅ Frontend build successful (603.31 kB, gzip 128.65 kB)

## Testing

When you now:
1. Open the Classrooms page
2. Click "Create Classroom" or "Edit Classroom"
3. Look at the Teacher dropdown

You should see:
- All Staff teachers
- All User entities with role="teacher"
- Properly formatted names
- Option to select any of them

## Related Components

The following components were already using the correct API:
- **Timetable.jsx** - Already uses `teachersApi.list()`
- **TimetableForm.jsx** - Already handles both teacher types
- **ClassroomForm.jsx** - Already works with both teacher types

## Verification

The fix ensures that the Classrooms page now correctly sources all eligible teachers from the backend's `/api/teachers` endpoint, which includes both:
- Staff records
- User entities with role="teacher"

This aligns with the backend changes that allow classroom assignment to any User with `role="teacher"`.
