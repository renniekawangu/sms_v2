# Classroom Assignment - Testing Guide

## What Was Changed

Classroom endpoints now accept any User with `role="teacher"` for assignment, not just Staff records. This makes the system more flexible by allowing User entities to be assigned to classrooms without requiring a separate Staff record.

## Updated Endpoints

### 1. GET /api/classrooms
- **Returns:** List of all classrooms with both Staff and User teachers
- **Change:** Now queries both Staff and User (role='teacher') for teacher lookup

### 2. GET /api/classrooms/:id  
- **Returns:** Specific classroom details
- **Change:** Correctly resolves teacher info from both Staff and User records

### 3. POST /api/classrooms
- **Input:** `{ grade, section, teacher_id, students }`
- **Change:** Accepts teacher_id that references either Staff or User (role='teacher')
- **Validation:** Returns error if user doesn't have role='teacher'

### 4. PUT /api/classrooms/:id
- **Input:** `{ grade, section, teacher_id, students }`
- **Change:** Can reassign to any User with role='teacher'
- **Validation:** Same as POST

## Test Scenarios

### Scenario 1: Assign classroom to User teacher
```
POST /api/classrooms
{
  "grade": 1,
  "section": "A",
  "teacher_id": "<USER_ID_WITH_ROLE_TEACHER>",
  "students": []
}

Expected: 201 Created with classroom data
```

### Scenario 2: Assign classroom to Staff teacher (existing behavior)
```
POST /api/classrooms
{
  "grade": 1,
  "section": "B",
  "teacher_id": "<STAFF_ID>",
  "students": []
}

Expected: 201 Created with classroom data (backward compatible)
```

### Scenario 3: Try to assign classroom to User without teacher role
```
POST /api/classrooms
{
  "grade": 1,
  "section": "C",
  "teacher_id": "<USER_ID_WITHOUT_TEACHER_ROLE>",
  "students": []
}

Expected: 400 Bad Request - "Teacher not found or invalid role"
```

### Scenario 4: Reassign classroom from Staff to User teacher
```
PUT /api/classrooms/<CLASSROOM_ID>
{
  "teacher_id": "<USER_ID_WITH_ROLE_TEACHER>"
}

Expected: 200 OK with updated classroom
```

### Scenario 5: Fetch classrooms list with mixed teachers
```
GET /api/classrooms

Expected: 200 OK
Response includes:
- Classrooms with Staff teachers (Staff._id as teacher_id)
- Classrooms with User teachers (User._id as teacher_id)
```

### Scenario 6: Get specific classroom with User teacher
```
GET /api/classrooms/<CLASSROOM_ID_WITH_USER_TEACHER>

Expected: 200 OK
Returns classroom with teacher_id correctly set
```

### Scenario 7: Invalid teacher ID format
```
POST /api/classrooms
{
  "grade": 1,
  "section": "D",
  "teacher_id": "not-a-valid-id",
  "students": []
}

Expected: 400 Bad Request - "Invalid teacher ID"
```

### Scenario 8: Null/empty teacher assignment
```
POST /api/classrooms
{
  "grade": 1,
  "section": "E",
  "teacher_id": null,
  "students": []
}

Expected: 201 Created with classroom.teacher_id = null
```

## Related Feature: /api/teachers Endpoint

This endpoint returns available teachers for assignment:
```
GET /api/teachers

Response:
[
  {
    "type": "staff",
    "_id": "<STAFF_ID>",
    "name": "John Doe",
    "email": "john@school.com",
    "phone": "0712345678"
  },
  {
    "type": "user",
    "_id": "<USER_ID>",
    "name": "Jane Smith",
    "email": "jane@school.com",
    "phone": "0798765432"
  }
]
```

**Frontend should treat both types identically for assignment.**

## Backward Compatibility Verification

✓ Existing Staff-assigned classrooms should continue working
✓ Fetching old classrooms should return correct teacher info
✓ Reassigning Staff classroom to different Staff should work
✓ Can mix Staff and User teachers in same system

## Known Limitations & Behavior

1. **Teacher model reference in Classroom schema:** Currently refs Staff only, but application logic accepts either type
2. **Teacher lookup order:** Staff checked first, then User
3. **Null teacher:** Classrooms can have teacher_id = null
4. **User without Staff record:** Can be assigned directly without creating Staff record first

## Performance Considerations

- GET /classrooms now makes 2 queries (Staff + User) - consider indexing if many teachers
- GET /classrooms/:id makes 1-2 queries (Staff first, User fallback)
- POST/PUT /classrooms makes 1-2 queries for validation

## Frontend Integration Points

1. **Teacher selector:** Use `/api/teachers` endpoint - returns both types
2. **Classroom display:** teacher_id is just an ObjectId, can be either type
3. **Classroom form:** Pass selected teacher_id directly, API handles validation
4. **Error handling:** Handle 400 errors for invalid/non-teacher users

## Rollback Plan

If issues arise:
1. All changes are in api.js endpoints only
2. Classroom model schema unchanged
3. Can revert to Staff-only by reverting api.js changes
4. Existing data remains intact

## Success Criteria

- ✓ Can create classrooms with User teachers
- ✓ Can reassign classrooms to User teachers  
- ✓ GET endpoints return correct info for both types
- ✓ Invalid users rejected with proper error
- ✓ Backward compatible with Staff assignments
- ✓ Frontend successfully handles both types
- ✓ No database migration needed
