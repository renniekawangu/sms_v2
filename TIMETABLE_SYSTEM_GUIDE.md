# Timetable System Implementation Guide

## Overview

This document describes the comprehensive timetable system implementation following the prototype structure from `timetable.js`. The system manages class schedules, instructors, and course assignments with a hierarchical structure.

## System Architecture

### Database Models

#### 1. **Classroom Model** (`/backend/src/models/classroom.js`)
Enhanced with new fields:
- `name` (String): Display name (e.g., "Grade 1A")
- `grade` (Number): Grade level
- `section` (String): Section identifier
- `capacity` (Number): Maximum student capacity (default: 30)
- `teacher_id` (ObjectId): Assigned class teacher
- `students` (Array): Student IDs enrolled
- `createdBy`, `updatedBy`: Audit fields
- **Virtuals**: `studentCount`, `availableSlots`

#### 2. **Timetable Container Model** (`/backend/src/models/timetable-container.js`)

##### TimetableSchedule
Main timetable structure for a classroom:
```javascript
{
  classroomId: ObjectId,
  timetable: [
    {
      day: String,  // Monday-Sunday
      periods: [
        {
          period: Number,
          subject: String,
          instructorId: ObjectId,
          time: String  // "09:00-10:00"
        }
      ]
    }
  ],
  academicYear: String,
  term: String,
  isActive: Boolean
}
```

**Methods:**
- `getDaySchedule(dayName)`: Get schedule for specific day
- `getInstructorSchedule(instructorId)`: Get all periods for an instructor
- `hasConflict(day, period, instructorId)`: Check scheduling conflicts

##### Instructor
Manages teacher assignments and availability:
```javascript
{
  staffId: ObjectId,
  subjects: [String],
  maxHoursPerWeek: Number,
  availability: [
    {
      day: String,
      periods: [Number]
    }
  ]
}
```

##### Course
Links classrooms to subjects:
```javascript
{
  classroomId: ObjectId,
  subjects: [
    {
      id: ObjectId,
      name: String,
      code: String,
      hoursPerWeek: Number
    }
  ],
  academicYear: String,
  term: String
}
```

### API Endpoints

#### Timetable Schedules
```
GET    /api/timetable/schedules                 - List all schedules
GET    /api/timetable/schedules/:id             - Get specific schedule
GET    /api/timetable/schedules/classroom/:id   - Get classroom schedule
GET    /api/timetable/schedules/instructor/:id  - Get instructor schedule
POST   /api/timetable/schedules                 - Create schedule
PUT    /api/timetable/schedules/:id             - Update schedule
DELETE /api/timetable/schedules/:id             - Delete schedule
```

**Query Parameters:**
- `academicYear`: Filter by academic year
- `term`: Filter by term
- `classroomId`: Filter by classroom
- `isActive`: Filter active/inactive schedules

#### Instructors
```
GET    /api/timetable/instructors               - List all instructors
GET    /api/timetable/instructors/:id           - Get specific instructor
GET    /api/timetable/instructors/staff/:id     - Get instructor by staff ID
POST   /api/timetable/instructors               - Create instructor
PUT    /api/timetable/instructors/:id           - Update instructor
DELETE /api/timetable/instructors/:id           - Delete instructor
```

#### Courses
```
GET    /api/timetable/courses                   - List all courses
GET    /api/timetable/courses/:id               - Get specific course
GET    /api/timetable/courses/classroom/:id     - Get courses for classroom
POST   /api/timetable/courses                   - Create course
PUT    /api/timetable/courses/:id               - Update course
DELETE /api/timetable/courses/:id               - Delete course
```

### Frontend Components

#### 1. **TimetableScheduleView** (`/frontend/src/components/TimetableScheduleView.jsx`)

Displays weekly timetable in a structured format.

**Features:**
- Responsive design (mobile day selector, desktop full week grid)
- Period-based organization
- Teacher assignments display
- Time slot visualization
- Edit capability

**Props:**
```javascript
{
  schedule: {
    classroomId: Object,
    timetable: Array,
    academicYear: String,
    term: String
  },
  onEdit: Function,
  editable: Boolean
}
```

#### 2. **TimetableManagement** (`/frontend/src/pages/TimetableManagement.jsx`)

Main management interface with tabs:
- **Schedules**: View and manage timetable schedules
- **Instructors**: Manage teacher assignments
- **Courses**: Manage course-subject mappings

**Features:**
- Multi-tab interface
- Filtering by classroom, year, term
- Create/Edit/Delete operations
- Export schedules to JSON
- Responsive grid layout

### Frontend API Service

Updated `/frontend/src/services/api.js` with comprehensive timetable API:

```javascript
export const timetableApi = {
  schedules: {
    list(params),
    get(id),
    getByClassroom(classroom_id, params),
    getByInstructor(instructor_id, params),
    create(data),
    update(id, data),
    delete(id)
  },
  instructors: {
    list(),
    get(id),
    getByStaff(staff_id),
    create(data),
    update(id, data),
    delete(id)
  },
  courses: {
    list(params),
    get(id),
    getByClassroom(classroom_id, params),
    create(data),
    update(id, data),
    delete(id)
  }
}
```

## Data Structure Mapping

### Prototype to Implementation

**Prototype classrooms:**
```javascript
{ id: 1, name: "Grade 1A", capacity: 30 }
```

**Implementation:**
```javascript
{
  _id: ObjectId,
  name: "Grade 1A",
  grade: 1,
  section: "A",
  capacity: 30,
  teacher_id: ObjectId,
  students: [ObjectId],
  timestamps: true
}
```

**Prototype schedule:**
```javascript
{
  classroomId: 1,
  timetable: [
    {
      day: "Monday",
      periods: [
        {
          period: 1,
          subject: "Mathematics",
          instructorId: 1,
          time: "09:00-10:00"
        }
      ]
    }
  ]
}
```

**Implementation:**
```javascript
{
  _id: ObjectId,
  classroomId: ObjectId,
  timetable: [
    {
      day: "Monday",
      periods: [
        {
          period: 1,
          subject: "Mathematics",
          instructorId: ObjectId,
          time: "09:00-10:00"
        }
      ]
    }
  ],
  academicYear: "2024",
  term: "Term 1",
  isActive: true,
  createdBy: ObjectId,
  timestamps: true
}
```

## Setup and Usage

### 1. Install Dependencies

Backend dependencies are already included in `package.json`.

### 2. Seed Sample Data

Run the seeder script to populate sample timetable data:

```bash
cd backend
node scripts/seed-timetable-data.js
```

This creates:
- 7 classrooms (Grade 1A - 7A)
- 5 instructors with subject assignments
- Subjects for each grade level
- Course mappings for each classroom
- Sample timetable schedules for 3 classrooms

### 3. Start the Backend

```bash
cd backend
npm start
```

Backend runs on `http://localhost:3000`

### 4. Start the Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`

### 5. Access Timetable Management

Navigate to:
- `/timetables` - Timetable management page
- `/schedule` - View schedules

## Usage Examples

### Create a Timetable Schedule

```javascript
const schedule = {
  classroomId: "classroom_id_here",
  timetable: [
    {
      day: "Monday",
      periods: [
        {
          period: 1,
          subject: "Mathematics",
          instructorId: "instructor_id_here",
          time: "09:00-10:00"
        },
        {
          period: 2,
          subject: "English",
          instructorId: "instructor_id_here",
          time: "10:15-11:15"
        }
      ]
    }
  ],
  academicYear: "2024",
  term: "Term 1"
};

const result = await timetableApi.schedules.create(schedule);
```

### Create an Instructor

```javascript
const instructor = {
  staffId: "staff_id_here",
  subjects: ["Mathematics", "Science"],
  maxHoursPerWeek: 40,
  availability: [
    {
      day: "Monday",
      periods: [1, 2, 3, 4, 5]
    }
  ]
};

const result = await timetableApi.instructors.create(instructor);
```

### Create a Course

```javascript
const course = {
  classroomId: "classroom_id_here",
  subjects: [
    {
      id: "subject_id_here",
      name: "Mathematics",
      code: "MATH101",
      hoursPerWeek: 3
    },
    {
      id: "subject_id_here",
      name: "English",
      code: "ENG101",
      hoursPerWeek: 3
    }
  ],
  academicYear: "2024",
  term: "Term 1"
};

const result = await timetableApi.courses.create(course);
```

### Query Schedules

```javascript
// Get all schedules for a classroom
const schedule = await timetableApi.schedules.getByClassroom(
  classroom_id,
  { academicYear: "2024", term: "Term 1" }
);

// Get instructor's schedule
const instructorSchedule = await timetableApi.schedules.getByInstructor(
  instructor_id,
  { academicYear: "2024", term: "Term 1" }
);

// List all schedules with filters
const schedules = await timetableApi.schedules.list({
  academicYear: "2024",
  term: "Term 1",
  isActive: true
});
```

## Features Implemented

✅ **Backend:**
- Enhanced classroom model with capacity and virtuals
- Comprehensive timetable schedule model
- Instructor management with subject assignments
- Course-subject mapping system
- Full CRUD API endpoints with filtering
- Conflict detection methods
- Proper indexing for performance
- Audit trails (createdBy, updatedBy)

✅ **Frontend:**
- Responsive timetable display component
- Mobile-first design with day selector
- Desktop full-week grid view
- Comprehensive management interface
- Multi-tab organization (Schedules/Instructors/Courses)
- Filtering and search capabilities
- Export functionality
- Create/Edit/Delete operations

✅ **Data Structure:**
- Follows prototype structure exactly
- Compatible with existing subject/staff models
- Hierarchical organization (Classrooms → Courses → Schedules)
- Flexible period-based scheduling
- Support for multiple academic years/terms

## API Testing

Test the endpoints using curl or Postman:

```bash
# Get all schedules
curl -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  http://localhost:3000/api/timetable/schedules

# Get classroom schedule
curl -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  http://localhost:3000/api/timetable/schedules/classroom/CLASSROOM_ID

# Create schedule
curl -X POST \
  -H "Cookie: connect.sid=YOUR_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{"classroomId":"...","timetable":[...]}' \
  http://localhost:3000/api/timetable/schedules
```

## Next Steps

1. **Add Timetable Form Components**: Create forms for easy schedule creation/editing
2. **Implement Conflict Detection UI**: Visual warnings for scheduling conflicts
3. **Add Auto-scheduling**: Algorithm to automatically generate optimal timetables
4. **Implement Period Templates**: Reusable period time configurations
5. **Add Print/PDF Export**: Generate printable timetables
6. **Implement Notifications**: Alert teachers of schedule changes
7. **Add Statistics**: Dashboard showing instructor workload, classroom utilization
8. **Mobile App**: Native mobile app for easy schedule viewing

## Troubleshooting

### Issue: Cannot connect to MongoDB
**Solution:** Check your `.env` file has correct `MONGODB_URI`

### Issue: Seeder fails
**Solution:** Ensure MongoDB is running and accessible

### Issue: Frontend API calls fail
**Solution:** Verify backend is running on port 3000 and you're authenticated

### Issue: Schedules not displaying
**Solution:** Check browser console for errors, verify data is seeded

## Support

For issues or questions:
1. Check this documentation
2. Review error logs in browser console
3. Check backend logs
4. Verify data structure matches examples

## Conclusion

The timetable system is now fully integrated into your school management system, following the exact structure from your prototype. All components work together seamlessly with proper mobile responsiveness, data validation, and user-friendly interfaces.
