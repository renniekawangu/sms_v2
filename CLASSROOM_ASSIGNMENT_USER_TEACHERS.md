# Classroom Assignment - User Teachers Support

## Summary
Completed implementation to allow any User with `role="teacher"` to be assigned to classrooms, not just Staff records.

## Changes Made

### 1. **GET /api/classrooms** (List all classrooms)
**File:** `backend/src/routes/api.js` (Lines 324-357)

**Change:** Updated to fetch both Staff and User teachers
- Previously: Only queried Staff records
- Now: Queries both `Staff.find()` and `User.find({ role: 'teacher' })`
- Combined both results into a single teacherMap for efficient lookup

**Impact:**
- Returns complete classroom information including User-assigned teachers
- Properly displays teacher info for both Staff and User teachers

### 2. **GET /api/classrooms/:id** (Get specific classroom)
**File:** `backend/src/routes/api.js` (Lines 361-369)

**Change:** Updated teacher lookup to handle both types
- Previously: Looked up undefined `Teacher` model
- Now: Checks Staff first, then falls back to User with role="teacher"
- Gracefully returns null if teacher not found

**Impact:**
- Correctly retrieves and displays both Staff and User teacher information
- Prevents 500 errors from undefined model reference

### 3. **POST /api/classrooms** (Create new classroom)
**File:** `backend/src/routes/api.js` (Lines 390-437)

**Change:** Updated classroom creation to accept both teacher types
- Previously: Only accepted Staff._id
- Now: Validates both Staff and User (with role="teacher")
- Returns error if teacher not found or User doesn't have role="teacher"
- Fetches teacher info from both sources when returning response

**Impact:**
- Admins can create classrooms assigned to any User with role="teacher"
- Consistent validation on both Staff and User teachers

### 4. **PUT /api/classrooms/:id** (Update classroom)
**File:** `backend/src/routes/api.js` (Lines 425-515)

**Change:** Updated classroom assignment logic to handle both types
- Previously: Only checked and accepted Staff._id
- Now: Validates both Staff and User with role="teacher"
- Returns proper error messages if teacher not found or role invalid
- Fetches teacher from both sources when returning response

**Impact:**
- Can reassign classrooms to any User with role="teacher"
- Consistent error handling and validation
- Proper teacher info display for both types

## Implementation Pattern Used

All classroom endpoints now follow this pattern:

```javascript
// Teacher ID received from client
if (teacher_id) {
  // Check if it's a Staff record
  const staff = await Staff.findById(teacher_id);
  if (staff) {
    finalTeacherId = staff._id;
  } else {
    // Check if it's a User with role=teacher
    const user = await User.findById(teacher_id).select('role _id').lean();
    if (user && user.role === 'teacher') {
      finalTeacherId = user._id;
    } else {
      return error('Teacher not found or invalid role');
    }
  }
}
```

## Validation & Error Handling

1. **Invalid Teacher ID Format:** Returns 400 error "Invalid teacher ID"
2. **Teacher Not Found:** Returns 400 error "Teacher not found or invalid role"
3. **User Without Teacher Role:** Returns 400 error "Teacher not found or invalid role" (doesn't distinguish to prevent user enumeration)
4. **Null Assignment:** Allowed - classroom can have no assigned teacher

## Frontend Considerations

The `/api/teachers` endpoint returns both types with indicators:
```javascript
{
  type: 'staff', // or 'user'
  _id: '...',
  name: '...',
  email: '...',
  phone: '...'
}
```

Frontend should treat both equally for assignment purposes.

## Testing Recommendations

1. **Create classroom with Staff teacher:** Should work ✓
2. **Create classroom with User (role=teacher):** Should work ✓
3. **Update classroom to User teacher:** Should work ✓
4. **Fetch classrooms with User teachers:** Should return correct info ✓
5. **Reassign to different User teacher:** Should work ✓
6. **Try assigning non-teacher User:** Should return error ✓
7. **Try assigning with invalid ID:** Should return error ✓

## Database Impact

**No schema changes required:**
- Classroom.teacher_id field already accepts any ObjectId
- Can reference either Staff._id or User._id
- Validation happens at application layer

## Backward Compatibility

✓ **Fully backward compatible:**
- Existing Staff-assigned classrooms continue to work
- Can mix Staff and User teachers in the same system
- No migration required

## Status

✅ Backend implementation complete
✅ Syntax validated
✅ Frontend built successfully (603.32 kB, gzip 128.64 kB)
⏳ Ready for testing

## Files Modified

- `backend/src/routes/api.js` - Classroom endpoints updated (4 endpoints)

## Related Features

- Teacher dashboard displays classrooms correctly for User teachers
- Teacher API (`teacher-api.js`) already supports User teacher lookup
- User model already has `teacherId` field for Staff references (optional)
