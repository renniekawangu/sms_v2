# SMS Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints (except `/auth/login` and `/auth/logout`) require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST `/auth/login`
Login and get JWT token
```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGc...",
  "user_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "student",
  "name": "John Doe"
}
```

### POST `/auth/logout`
Logout (cleanup on client side)

### GET `/auth/me`
Get current user info from token

---

## Admin Routes (`/api/admin`)

### GET `/dashboard`
Get admin dashboard statistics
- Returns: Total students, staff, users, attendance stats, fee stats, recent activities

### GET `/search?q=searchterm`
Global search across students, staff, users

### GET `/users?page=1&limit=50&role=admin`
List all users with pagination

### POST `/users`
Create new user
```json
{
  "email": "newuser@example.com",
  "password": "securepass",
  "role": "teacher"
}
```

### GET `/users/:id`
Get single user

### PUT `/users/:id`
Update user

### DELETE `/users/:id`
Delete user

### GET `/students-list?page=1&limit=50&search=name&classLevel=Primary1`
List students

### POST `/students/bulk-delete`
Delete multiple students
```json
{
  "ids": ["id1", "id2", "id3"]
}
```

### GET `/staff-list?page=1&limit=50&search=name`
List staff members

### POST `/staff/bulk-delete`
Delete multiple staff members

### GET `/audit-logs?page=1&limit=50`
Get audit logs

---

## Student Routes (`/api/student`)

### GET `/dashboard`
Get student dashboard with grades, attendance, fees, subjects

### GET `/grades?subject=Math&page=1&limit=50`
Get student's grades

### GET `/attendance?page=1&limit=50`
Get student's attendance records

### GET `/fees?status=unpaid&page=1&limit=50`
Get student's fees

---

## Teacher Routes (`/api/teacher`)

### GET `/dashboard`
Get teacher dashboard with students, subjects, recent grades, performance stats

### GET `/grades?studentId=id&subject=Math&page=1&limit=50`
Get grades for students

### POST `/grades`
Create new grade
```json
{
  "studentId": "507f1f77bcf86cd799439011",
  "subject": "Math",
  "grade": 85,
  "term": "Term 1"
}
```

### PUT `/grades/:id`
Update grade

### DELETE `/grades/:id`
Delete grade

### POST `/attendance/mark`
Mark attendance
```json
{
  "date": "2026-01-13",
  "records": [
    {
      "studentId": "id1",
      "status": "present"
    },
    {
      "studentId": "id2",
      "status": "absent"
    }
  ]
}
```

### GET `/attendance?studentId=id&page=1&limit=50`
Get attendance records

---

## Head Teacher Routes (`/api/head-teacher`)

### GET `/dashboard?classLevel=Primary1`
Get head teacher dashboard with subjects, teachers, students, performance stats

### GET `/students?classLevel=Primary1&page=1&limit=50`
List students (optionally filtered by class level)

### GET `/subjects?classLevel=Primary1&page=1&limit=50`
List subjects

### POST `/subjects`
Create new subject
```json
{
  "name": "Mathematics",
  "code": "MATH101",
  "classLevel": "Primary 1",
  "teacherId": "507f1f77bcf86cd799439011"
}
```

### GET `/subjects/:id`
Get single subject

### PUT `/subjects/:id`
Update subject

### DELETE `/subjects/:id`
Delete subject

### POST `/subjects/:id/allocate`
Allocate teacher to subject
```json
{
  "teacherId": "507f1f77bcf86cd799439011"
}
```

### POST `/subjects/:id/add-student`
Add student to subject
```json
{
  "studentId": "507f1f77bcf86cd799439011"
}
```

### POST `/subjects/:id/remove-student`
Remove student from subject

---

## Accounts Routes (`/api/accounts`)

### GET `/dashboard`
Get accounts dashboard with fee stats, payment stats, expense info

### GET `/fees?status=unpaid&page=1&limit=50`
List fees

### POST `/fees`
Create new fee
```json
{
  "studentId": "507f1f77bcf86cd799439011",
  "amount": 5000,
  "description": "Tuition Fee",
  "dueDate": "2026-02-28",
  "type": "tuition"
}
```

### PUT `/fees/:id`
Update fee

### DELETE `/fees/:id`
Delete fee

### GET `/payments?page=1&limit=50`
List payments

### POST `/payments`
Record payment
```json
{
  "feeId": "507f1f77bcf86cd799439011",
  "amount": 5000,
  "method": "cash",
  "paymentDate": "2026-01-13"
}
```

### GET `/expenses?category=utilities&page=1&limit=50`
List expenses

### POST `/expenses`
Create expense
```json
{
  "category": "supplies",
  "description": "Office supplies",
  "amount": 2000,
  "date": "2026-01-13",
  "status": "recorded"
}
```

### PUT `/expenses/:id`
Update expense

### DELETE `/expenses/:id`
Delete expense

---

## Settings Routes (`/api/settings`)

### GET `/`
Get school settings

### POST `/`
Update school settings
```json
{
  "name": "School Name",
  "address": "123 Street",
  "phone": "+1234567890",
  "email": "admin@school.com"
}
```

### GET `/academic-years`
Get all academic years

### POST `/academic-years`
Create academic year
```json
{
  "year": "2025-2026",
  "startDate": "2025-09-01",
  "endDate": "2026-08-31",
  "isCurrent": true
}
```

### PUT `/academic-years/:id`
Update academic year

### POST `/academic-years/:id/set-current`
Set academic year as current

### DELETE `/academic-years/:id`
Delete academic year

### GET `/fee-structures`
Get all fee structures

### POST `/fee-structures`
Create fee structure
```json
{
  "academicYear": "id",
  "classLevel": "Primary 1",
  "items": [
    {
      "description": "Tuition",
      "amount": 50000
    }
  ]
}
```

### PUT `/fee-structures/:id`
Update fee structure

### DELETE `/fee-structures/:id`
Delete fee structure

### GET `/holidays`
Get all holidays

### POST `/holidays`
Create holiday
```json
{
  "name": "Christmas",
  "startDate": "2025-12-20",
  "endDate": "2026-01-05",
  "type": "holiday"
}
```

### DELETE `/holidays/:id`
Delete holiday

---

## Parents Routes (`/api/parents`)

### GET `/?page=1&limit=50&search=name&relationship=Mother`
List parents

### GET `/:id`
Get single parent

### POST `/`
Create parent
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "relationship": "Father",
  "address": "123 Street",
  "occupation": "Engineer"
}
```

### PUT `/:id`
Update parent

### DELETE `/:id`
Delete parent

### POST `/:parentId/link/:studentId`
Link parent to student

### POST `/:parentId/unlink/:studentId`
Unlink parent from student

### GET `/:id/students`
Get parent's students

---

## Main API Routes (`/api`)

### GET `/students`
Get all students

### GET `/students/:id`
Get student by ID

### POST `/students`
Create student

### PUT `/students/:id`
Update student

### DELETE `/students/:id`
Delete student

### GET `/teachers`
Get all teachers

### GET `/teachers/:id`
Get teacher by ID

### POST `/teachers`
Create teacher

### PUT `/teachers/:id`
Update teacher

### DELETE `/teachers/:id`
Delete teacher

### GET `/classrooms`
Get all classrooms

### GET `/classrooms/:id`
Get classroom by ID

### POST `/classrooms`
Create classroom

### PUT `/classrooms/:id`
Update classroom

### DELETE `/classrooms/:id`
Delete classroom

### GET `/subjects`
Get all subjects

### GET `/subjects/:id`
Get subject by ID

### POST `/subjects`
Create subject

### PUT `/subjects/:id`
Update subject

### DELETE `/subjects/:id`
Delete subject

### GET `/attendance`
Get all attendance records

### GET `/attendance/:user_id`
Get attendance by user

### POST `/attendance`
Create attendance record

### PUT `/attendance/record/:id`
Update attendance

### DELETE `/attendance/record/:id`
Delete attendance

### GET `/fees`
Get all fees

### GET `/fees/:id`
Get fee by ID

### POST `/fees`
Create fee

### PUT `/fees/:id`
Update fee

### DELETE `/fees/:id`
Delete fee

### GET `/payments`
Get all payments

### POST `/payments`
Create payment

### GET `/expenses`
Get all expenses

### GET `/expenses/:id`
Get expense by ID

### POST `/expenses`
Create expense

### PUT `/expenses/:id`
Update expense

### DELETE `/expenses/:id`
Delete expense

### GET `/results`
Get all grades

### GET `/results/student/:student_id`
Get student's grades

### POST `/results`
Create grade

### PUT `/results/:id`
Update grade

### DELETE `/results/:id`
Delete grade

---

## Error Responses

All error responses follow this format:
```json
{
  "error": "Error message",
  "status": 400
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error

