# Frontend API Integration Guide

## Overview
The frontend has been successfully integrated with all backend API endpoints. The integration includes core resource APIs, role-based dashboards, and system settings management.

## API Service Structure

The frontend API service is organized into the following modules:

### Core Resource APIs

#### 1. **Authentication API** (`authApi`)
- `login(email, password)` - User login
- `logout()` - User logout

#### 2. **Students API** (`studentsApi`)
- `list()` - Get all students
- `get(student_id)` - Get student details
- `create(data)` - Create new student
- `update(student_id, data)` - Update student
- `delete(student_id)` - Delete student

#### 3. **Teachers API** (`teachersApi`)
- `list()` - Get all teachers
- `get(teacher_id)` - Get teacher details
- `create(data)` - Create new teacher
- `update(teacher_id, data)` - Update teacher
- `delete(teacher_id)` - Delete teacher

#### 4. **Classrooms API** (`classroomsApi`)
- `list()` - Get all classrooms
- `get(id)` - Get classroom details
- `create(data)` - Create new classroom
- `update(classroom_id, data)` - Update classroom
- `delete(classroom_id)` - Delete classroom

#### 5. **Subjects API** (`subjectsApi`)
- `list()` - Get all subjects
- `get(subject_id)` - Get subject details
- `create(data)` - Create new subject
- `update(subject_id, data)` - Update subject
- `delete(subject_id)` - Delete subject

#### 6. **Attendance API** (`attendanceApi`)
- `list()` - Get all attendance records
- `getByUser(user_id)` - Get user attendance
- `mark(data)` - Mark attendance
- `update(attendance_id, data)` - Update attendance
- `delete(attendance_id)` - Delete attendance

#### 7. **Exams API** (`examsApi`)
- `list()` - Get all exams
- `get(exam_id)` - Get exam details
- `create(data)` - Create new exam
- `update(exam_id, data)` - Update exam
- `delete(exam_id)` - Delete exam

#### 8. **Results/Grades API** (`resultsApi`)
- `list()` - Get all results
- `getByStudent(student_id)` - Get student results
- `create(data)` - Create new result
- `update(result_id, data)` - Update result
- `delete(result_id)` - Delete result

#### 9. **Fees API** (`feesApi`)
- `list()` - Get all fees
- `get(fee_id)` - Get fee details
- `create(data)` - Create new fee
- `update(fee_id, data)` - Update fee
- `delete(fee_id)` - Delete fee

#### 10. **Payments API** (`paymentsApi`)
- `list()` - Get all payments
- `create(data)` - Create new payment

#### 11. **Expenses API** (`expensesApi`)
- `list()` - Get all expenses
- `get(expense_id)` - Get expense details
- `create(data)` - Create new expense
- `update(expense_id, data)` - Update expense
- `delete(expense_id)` - Delete expense

#### 12. **Timetable API** (`timetableApi`)
- `list()` - Get all timetables
- `getByClassroom(classroom_id)` - Get classroom timetable
- `create(data)` - Create new timetable
- `update(timetable_id, data)` - Update timetable
- `delete(timetable_id)` - Delete timetable

#### 13. **Issues API** (`issuesApi`)
- `list()` - Get all issues
- `get(issue_id)` - Get issue details
- `create(data)` - Create new issue
- `update(issue_id, data)` - Update issue
- `resolve(issue_id)` - Resolve issue
- `delete(issue_id)` - Delete issue

#### 14. **Accounts API** (`accountsApi`)
- `list()` - Get all accounts
- `create(data)` - Create new account

### System Settings API (`settingsApi`)

#### School Settings
- `getSchoolSettings()` - Get school settings
- `updateSchoolSettings(data)` - Update school settings

#### Academic Years
- `getAllAcademicYears()` - Get all academic years
- `createAcademicYear(data)` - Create academic year
- `updateAcademicYear(year_id, data)` - Update academic year
- `setCurrentAcademicYear(year_id)` - Set current academic year
- `deleteAcademicYear(year_id)` - Delete academic year

#### Fee Structures
- `getAllFeeStructures()` - Get all fee structures
- `createFeeStructure(data)` - Create fee structure
- `updateFeeStructure(fee_id, data)` - Update fee structure
- `deleteFeeStructure(fee_id)` - Delete fee structure

#### Holidays
- `getAllHolidays()` - Get all holidays
- `createHoliday(data)` - Create holiday
- `deleteHoliday(holiday_id)` - Delete holiday

### Role-Based Dashboard APIs

#### Admin API (`adminApi`)
- `getDashboard()` - Get admin dashboard with statistics
- `getUserManagement()` - Get user management data
- `getReports()` - Get system reports
- `getAuditLogs()` - Get audit logs

#### Teacher API (`teacherApi`)
- `getDashboard()` - Get teacher dashboard
- `getMyClasses()` - Get teacher's classes
- `getMyStudents()` - Get teacher's students
- `getMySubjects()` - Get teacher's subjects
- `getAttendanceRecords()` - Get attendance records
- `markAttendance(data)` - Mark student attendance
- `getGrades()` - Get grades
- `submitGrades(data)` - Submit student grades
- `getPerformanceStats()` - Get performance statistics

#### Student API (`studentApi`)
- `getDashboard()` - Get student dashboard
- `getMyProfile()` - Get student profile
- `updateProfile(data)` - Update student profile
- `getMyGrades()` - Get student grades
- `getMyAttendance()` - Get student attendance
- `getMyFees()` - Get student fees
- `getMySubjects()` - Get student subjects
- `getExamSchedule()` - Get exam schedule
- `getTimeTable()` - Get timetable

#### Head Teacher API (`headTeacherApi`)
- `getDashboard()` - Get head teacher dashboard
- `getStudents()` - Get all students
- `getSubjects()` - Get all subjects
- `getStaffList()` - Get staff list
- `getAttendanceAnalytics()` - Get attendance analytics
- `getPerformanceMetrics()` - Get performance metrics

#### Parents API (`parentsApi`)
- `getDashboard()` - Get parent dashboard
- `getMyChildren()` - Get parent's children
- `getChildProgress(student_id)` - Get child progress
- `getChildGrades(student_id)` - Get child grades
- `getChildAttendance(student_id)` - Get child attendance
- `getChildFees(student_id)` - Get child fees
- `createPayment(data)` - Create payment
- `getPaymentHistory()` - Get payment history

## Configuration

### Environment Variables
- `VITE_API_URL` - Base API URL (default: `http://localhost:5000/api`)

Location: `.env` file in the frontend directory

### API Base URL
The API calls use the base URL configured in the `.env` file and fall back to `http://localhost:5000/api`.

## Authentication

All API calls include automatic JWT token handling:
- Token is retrieved from localStorage
- Token is passed in the `Authorization` header as a Bearer token
- Expired tokens trigger automatic logout and redirect to login page

## Error Handling

The API service includes comprehensive error handling:
- Network errors are caught and returned with descriptive messages
- HTTP error responses (non-200 status codes) are parsed and thrown as errors
- Authentication errors (401) trigger logout for non-login endpoints
- All errors are propagated to the calling component for proper handling

## Usage Examples

### Using Core APIs
```javascript
import { studentsApi, teachersApi } from '../services/api'

// Get all students
const students = await studentsApi.list()

// Create a new student
const newStudent = await studentsApi.create({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '1234567890',
  dob: '2010-01-15',
  address: '123 Main St'
})

// Update student
await studentsApi.update(student_id, {
  name: 'Jane Doe',
  phone: '9876543210'
})
```

### Using Role-Based APIs
```javascript
import { teacherApi, studentApi, adminApi } from '../services/api'

// Teacher gets their dashboard
const teacherDashboard = await teacherApi.getDashboard()

// Student gets their grades
const grades = await studentApi.getMyGrades()

// Admin gets dashboard statistics
const adminDashboard = await adminApi.getDashboard()
```

### Using Settings APIs
```javascript
import { settingsApi } from '../services/api'

// Get current school settings
const settings = await settingsApi.getSchoolSettings()

// Get all academic years
const years = await settingsApi.getAllAcademicYears()

// Create a new academic year
const newYear = await settingsApi.createAcademicYear({
  year: '2024-2025',
  startDate: '2024-08-01',
  endDate: '2025-06-30',
  isCurrent: true
})
```

## Data Formats

### Student Data
```javascript
{
  student_id: number,
  name: string,
  email: string,
  phone: string,
  dob: ISO date string,
  date_of_join: ISO date string,
  address: string
}
```

### Teacher Data
```javascript
{
  teacher_id: number,
  name: string,
  email: string,
  phone: string,
  dob: ISO date string,
  date_of_join: ISO date string,
  address: string
}
```

### Classroom Data
```javascript
{
  classroom_id: number,
  grade: string,
  section: string,
  teacher_id: number,
  students: [student_id, ...]
}
```

## Integration Checklist

- [x] Core resource APIs integrated
- [x] Role-based dashboard APIs integrated
- [x] Settings and configuration APIs integrated
- [x] Authentication API integrated
- [x] Token management configured
- [x] Error handling implemented
- [x] Environment configuration completed
- [x] Frontend service fully updated with all backend endpoints

## Next Steps

1. Update frontend components to use the new role-based APIs where applicable
2. Implement dashboard components for each role using their respective APIs
3. Add form validation for API requests
4. Implement loading and error states in components
5. Test all API endpoints with the running backend

## Backend Routes Reference

The integration is based on the following backend routes:

- `/api/auth/` - Authentication
- `/api/students` - Student CRUD
- `/api/teachers` - Teacher CRUD
- `/api/classrooms` - Classroom CRUD
- `/api/subjects` - Subject CRUD
- `/api/attendance` - Attendance management
- `/api/exams` - Exam CRUD
- `/api/results` - Grade/Result management
- `/api/fees` - Fee management
- `/api/payments` - Payment processing
- `/api/expenses` - Expense tracking
- `/api/timetable` - Timetable management
- `/api/issues` - Issue tracking
- `/api/settings/` - School settings
- `/api/settings/academic-years` - Academic year management
- `/api/settings/fee-structures` - Fee structure management
- `/api/settings/holidays` - Holiday management
- `/api/admin/` - Admin dashboard and operations
- `/api/teacher/` - Teacher-specific operations
- `/api/student/` - Student-specific operations
- `/api/head-teacher/` - Head teacher operations
- `/api/parents/` - Parent operations
