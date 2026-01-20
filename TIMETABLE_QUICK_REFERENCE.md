# Timetable System - Quick Reference

## 🚀 Quick Start

### 1. Seed Data (First Time Only)
```bash
cd backend
node scripts/seed-timetable-data.js
```

### 2. Test API
```bash
node scripts/test-timetable-api.js
```

### 3. Start System
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Access
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Timetable Page: http://localhost:5173/timetables

---

## 📚 API Endpoints

### Schedules
```
GET    /api/timetable/schedules
GET    /api/timetable/schedules/:id
GET    /api/timetable/schedules/classroom/:id
GET    /api/timetable/schedules/instructor/:id
POST   /api/timetable/schedules
PUT    /api/timetable/schedules/:id
DELETE /api/timetable/schedules/:id
```

### Instructors
```
GET    /api/timetable/instructors
GET    /api/timetable/instructors/:id
GET    /api/timetable/instructors/staff/:id
POST   /api/timetable/instructors
PUT    /api/timetable/instructors/:id
DELETE /api/timetable/instructors/:id
```

### Courses
```
GET    /api/timetable/courses
GET    /api/timetable/courses/:id
GET    /api/timetable/courses/classroom/:id
POST   /api/timetable/courses
PUT    /api/timetable/courses/:id
DELETE /api/timetable/courses/:id
```

---

## 💻 Frontend API Usage

```javascript
// Import
import { timetableApi } from '../services/api';

// Get schedules
const schedules = await timetableApi.schedules.list();
const schedule = await timetableApi.schedules.get(id);
const classSchedule = await timetableApi.schedules.getByClassroom(classroomId);

// Create schedule
const newSchedule = await timetableApi.schedules.create({
  classroomId: "...",
  timetable: [...],
  academicYear: "2024",
  term: "Term 1"
});

// Update schedule
await timetableApi.schedules.update(id, data);

// Delete schedule
await timetableApi.schedules.delete(id);

// Instructors
const instructors = await timetableApi.instructors.list();
const instructor = await timetableApi.instructors.get(id);

// Courses
const courses = await timetableApi.courses.list();
const course = await timetableApi.courses.get(id);
```

---

## 🗂️ Data Structure

### Schedule
```javascript
{
  _id: ObjectId,
  classroomId: ObjectId,
  timetable: [
    {
      day: "Monday",        // Monday-Sunday
      periods: [
        {
          period: 1,         // Period number
          subject: "Math",   // Subject name
          instructorId: ObjectId,
          time: "09:00-10:00"  // Time slot
        }
      ]
    }
  ],
  academicYear: "2024",
  term: "Term 1",
  isActive: true,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Instructor
```javascript
{
  _id: ObjectId,
  staffId: ObjectId,
  subjects: ["Mathematics", "Science"],
  maxHoursPerWeek: 40,
  availability: [
    {
      day: "Monday",
      periods: [1, 2, 3, 4, 5]
    }
  ],
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Course
```javascript
{
  _id: ObjectId,
  classroomId: ObjectId,
  subjects: [
    {
      id: ObjectId,
      name: "Mathematics",
      code: "MATH101",
      hoursPerWeek: 3
    }
  ],
  academicYear: "2024",
  term: "Term 1",
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🛠️ Common Tasks

### Create a Complete Timetable

```javascript
// 1. Ensure classroom exists
const classroom = await classroomsApi.get(classroomId);

// 2. Create or get instructors
const instructors = await timetableApi.instructors.list();

// 3. Create or get course
const course = await timetableApi.courses.getByClassroom(classroomId);

// 4. Create schedule
const schedule = await timetableApi.schedules.create({
  classroomId: classroom._id,
  timetable: [
    {
      day: "Monday",
      periods: [
        {
          period: 1,
          subject: "Mathematics",
          instructorId: instructors[0]._id,
          time: "09:00-10:00"
        }
      ]
    }
  ],
  academicYear: "2024",
  term: "Term 1"
});
```

### Get Instructor's Full Schedule

```javascript
const instructorSchedule = await timetableApi.schedules.getByInstructor(
  instructorId,
  { academicYear: "2024", term: "Term 1" }
);

// Returns array of schedules with only instructor's periods
```

### Export Schedule

```javascript
const schedule = await timetableApi.schedules.get(id);
const dataStr = JSON.stringify(schedule, null, 2);
const blob = new Blob([dataStr], { type: 'application/json' });
const url = URL.createObjectURL(blob);
// Download or save
```

---

## 🔍 Filtering & Querying

### Filter Schedules
```javascript
// By classroom
timetableApi.schedules.list({ classroomId: "..." });

// By academic year and term
timetableApi.schedules.list({ 
  academicYear: "2024", 
  term: "Term 1" 
});

// Active schedules only
timetableApi.schedules.list({ isActive: true });

// Combined filters
timetableApi.schedules.list({ 
  classroomId: "...",
  academicYear: "2024",
  term: "Term 1",
  isActive: true
});
```

---

## 📂 File Locations

### Backend
```
/backend/src/models/classroom.js              - Enhanced classroom model
/backend/src/models/timetable-container.js    - Timetable models
/backend/src/routes/timetable-api.js          - API routes
/backend/scripts/seed-timetable-data.js       - Data seeder
/backend/scripts/test-timetable-api.js        - Test script
```

### Frontend
```
/frontend/src/services/api.js                 - API service (updated)
/frontend/src/components/TimetableScheduleView.jsx
/frontend/src/pages/TimetableManagement.jsx
```

### Documentation
```
/TIMETABLE_SYSTEM_GUIDE.md                    - Complete guide
/TIMETABLE_IMPLEMENTATION_SUMMARY.md          - Implementation summary
/TIMETABLE_QUICK_REFERENCE.md                 - This file
```

---

## 🐛 Troubleshooting

### Issue: Seeder fails
```bash
# Check MongoDB connection
echo $MONGODB_URI

# Try connecting manually
mongosh "$MONGODB_URI"

# Re-run seeder
node scripts/seed-timetable-data.js
```

### Issue: API calls fail
```bash
# Check backend is running
curl http://localhost:3000/api/timetable/schedules

# Check authentication
# Make sure you're logged in
```

### Issue: No data displayed
```bash
# Verify data is seeded
node scripts/test-timetable-api.js

# Check browser console for errors
# Open DevTools -> Console
```

---

## ✅ Verification Checklist

- [ ] MongoDB is running
- [ ] Backend is running (port 3000)
- [ ] Frontend is running (port 5173)
- [ ] Data is seeded
- [ ] Can access /timetables page
- [ ] Can view schedules
- [ ] Can filter schedules
- [ ] API tests pass

---

## 📝 Example Workflow

1. **Initial Setup**
   ```bash
   node scripts/seed-timetable-data.js
   npm start (backend)
   npm run dev (frontend)
   ```

2. **View Schedules**
   - Navigate to /timetables
   - Select "Schedules" tab
   - See Grade 1A, 2A, 3A schedules

3. **Filter**
   - Select classroom from dropdown
   - Set academic year
   - Choose term
   - Click "Apply Filters"

4. **Manage Instructors**
   - Click "Instructors" tab
   - View instructor assignments
   - See subjects they teach

5. **Manage Courses**
   - Click "Courses" tab
   - View classroom-subject mappings

---

## 🎯 Key Features

✅ Responsive design (mobile + desktop)
✅ Full CRUD operations
✅ Filtering and search
✅ Export functionality
✅ Conflict detection
✅ Audit trails
✅ Role-based access

---

## 📞 Quick Help

**Data Issues:** Check MongoDB, re-run seeder
**API Issues:** Check backend logs, verify authentication
**UI Issues:** Check browser console, verify frontend is running
**Missing Data:** Run seeder script

---

## 🔗 Related Docs

- Full Guide: [TIMETABLE_SYSTEM_GUIDE.md](TIMETABLE_SYSTEM_GUIDE.md)
- Summary: [TIMETABLE_IMPLEMENTATION_SUMMARY.md](TIMETABLE_IMPLEMENTATION_SUMMARY.md)
- Prototype: [timetable.js](/home/rennie/prototypes/timetable.js)

---

**Last Updated:** January 20, 2026
**Status:** ✅ Production Ready
