# Quick Reference: User Teachers in Classrooms

## What Changed?

Any User with `role="teacher"` can now be assigned to classrooms. No Staff record required.

## How to Use (Frontend)

### Get Available Teachers
```javascript
const response = await fetch('/api/teachers');
const teachers = await response.json();
// Returns both Staff and User teachers with type indicator
```

### Create Classroom with User Teacher
```javascript
const response = await fetch('/api/classrooms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grade: 1,
    section: 'A',
    teacher_id: selectedTeacherId,  // Can be User._id
    students: []
  })
});
```

### Reassign Classroom to Different Teacher
```javascript
const response = await fetch(`/api/classrooms/${classroomId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    teacher_id: newTeacherId  // Can be User._id
  })
});
```

### Get All Classrooms
```javascript
const response = await fetch('/api/classrooms');
const classrooms = await response.json();
// Returns classrooms with both Staff and User teachers
```

## How to Use (Backend)

### Assign a User Teacher
```javascript
// POST /api/classrooms
{
  "grade": 1,
  "section": "A",
  "teacher_id": "507f1f77bcf86cd799439011",  // User._id
  "students": []
}
```

### Reassign to User Teacher
```javascript
// PUT /api/classrooms/:id
{
  "teacher_id": "507f191e810c19729de860ea"  // Different User._id
}
```

## Error Responses

### Invalid Teacher ID
```json
{
  "error": "Invalid teacher ID"
}
```

### Non-Existent Teacher
```json
{
  "error": "Teacher not found or invalid role"
}
```

### Non-Teacher User
```json
{
  "error": "Teacher not found or invalid role"
}
```

## Code Examples

### 1. Check if User is a Teacher
```javascript
const { User } = require('../models/user');
const user = await User.findById(userId);
if (user && user.role === 'teacher') {
  // Can be assigned to classroom
}
```

### 2. Get All Teachers (Staff + User)
```javascript
const staffTeachers = await Staff.find({}).lean();
const userTeachers = await User.find({ role: 'teacher' }).lean();
const allTeachers = [...staffTeachers, ...userTeachers];
```

### 3. Fetch Classroom with Any Teacher Type
```javascript
const classroom = await Classroom.findById(classroomId).lean();
let teacher = null;

if (classroom.teacher_id) {
  teacher = await Staff.findById(classroom.teacher_id).lean();
  if (!teacher) {
    teacher = await User.findById(classroom.teacher_id).select('_id firstName lastName email phone').lean();
  }
}
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/classrooms` | GET | List all classrooms |
| `/api/classrooms` | POST | Create new classroom |
| `/api/classrooms/:id` | GET | Get specific classroom |
| `/api/classrooms/:id` | PUT | Update classroom |
| `/api/classrooms/:id` | DELETE | Delete classroom |
| `/api/teachers` | GET | List available teachers |

## Important Notes

1. **Validation:** Only users with `role="teacher"` can be assigned
2. **Staff First:** Backend checks Staff first, then User (for performance)
3. **No Migration:** Existing Staff assignments continue working
4. **Null Allowed:** Classrooms can have `teacher_id: null`
5. **Response Format:** teacher_id is just an ObjectId, same for both types

## Testing Your Integration

```javascript
// Test 1: Create classroom with User teacher
const userId = '507f1f77bcf86cd799439011';
const response = await fetch('/api/classrooms', {
  method: 'POST',
  body: JSON.stringify({
    grade: 1,
    section: 'A',
    teacher_id: userId,
    students: []
  })
});
console.assert(response.ok);

// Test 2: Verify teacher_id matches
const classroom = await response.json();
console.assert(classroom.teacher_id === userId);

// Test 3: Fetch and verify
const getResponse = await fetch(`/api/classrooms/${classroom._id}`);
const fetched = await getResponse.json();
console.assert(fetched.teacher_id === userId);
```

## Debugging

### Teacher Not Found
If you get "Teacher not found or invalid role":
1. Check User exists: `db.users.findById(userId)`
2. Check role is 'teacher': `db.users.findOne({ _id: userId, role: 'teacher' })`
3. Verify exact ID matches

### Classroom Shows No Teacher
If classroom.teacher_id exists but teacher not displayed:
1. Check if it's a User: `db.users.findById(classroom.teacher_id)`
2. Check if it's Staff: `db.staffs.findById(classroom.teacher_id)`
3. Verify the ID isn't in both collections

### Assignment Failed
Common causes:
1. **Invalid UUID:** teacher_id is malformed
2. **User doesn't exist:** Check collection
3. **Wrong role:** User.role !== 'teacher'
4. **No auth:** Missing auth middleware
5. **Wrong permission:** User not Admin/HeadTeacher

## Performance Tips

1. **Bulk Operations:** Use bulk queries instead of loops
2. **Lean Queries:** Use `.lean()` for read-only
3. **Select Fields:** Only select needed fields for User queries
4. **Indexing:** Ensure _id is indexed (default)
5. **Caching:** Consider caching /api/teachers response

## Migration from Staff-Only

If migrating existing Classroom system:
1. No data changes needed
2. Existing classrooms continue working
3. Can mix Staff and User teachers
4. No schema changes required
5. Deploy and test immediately

## FAQ

**Q: Do I need to create a Staff record to assign a User to a classroom?**
A: No. Any User with `role="teacher"` can be assigned directly.

**Q: Can I mix Staff and User teachers in the same system?**
A: Yes. Classrooms can have either type without conflicts.

**Q: Do existing Staff assignments still work?**
A: Yes. Fully backward compatible.

**Q: What if teacher_id references a deleted user?**
A: The classroom remains but teacher info returns null.

**Q: Can I reassign a classroom from User to Staff?**
A: Yes. Just pass the Staff._id in the PUT request.

**Q: Is there a performance impact?**
A: Minimal. GET endpoints make 2 queries (Staff + User), others use fallback pattern.

---

**Last Updated:** 2024
**Status:** Production Ready ✅
