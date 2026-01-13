# Frontend-Backend Integration Overview

## 📊 Integration Architecture

```
Frontend React App
    ↓
API Service Layer (frontend/src/services/api.js)
    ↓
HTTP Requests with JWT Authentication
    ↓
Backend Express Server (port 5000)
    ↓
MongoDB Database
```

## 🏗️ API Modules Structure

### Core APIs (14 modules)
```
api.js
├── authApi ..................... Authentication (login, logout)
├── studentsApi ................. Student CRUD operations
├── teachersApi ................. Teacher CRUD operations
├── classroomsApi ............... Classroom management
├── subjectsApi ................. Subject management
├── attendanceApi ............... Attendance tracking
├── examsApi .................... Exam management
├── resultsApi .................. Grade/Result management
├── feesApi ..................... Fee management
├── paymentsApi ................. Payment processing
├── expensesApi ................. Expense tracking
├── timetableApi ................ Timetable management
├── issuesApi ................... Issue tracking
└── accountsApi ................. Account management

### System Configuration
settingsApi
├── School Settings Management
├── Academic Years Configuration
├── Fee Structures Setup
└── Holiday Management

### Role-Based APIs (5 modules)
adminApi ........................ Admin dashboard & system management
teacherApi ...................... Teacher dashboard & class management
studentApi ...................... Student dashboard & personal data
headTeacherApi .................. Head teacher analytics & reporting
parentsApi ...................... Parent dashboard & child monitoring
```

## 🔄 Data Flow Example: Creating a Student

```
1. Component (StudentForm.jsx)
   ↓
2. studentsApi.create({name, email, ...})
   ↓
3. apiCall() Helper Function
   - Gets JWT token from localStorage
   - Adds Authorization header
   - Makes POST request to /api/students
   ↓
4. HTTP Request to Backend
   POST http://localhost:5000/api/students
   Headers: {Authorization: "Bearer <token>", Content-Type: "application/json"}
   Body: {name, email, ...}
   ↓
5. Backend Processing
   - Validates JWT token
   - Checks user authorization
   - Processes data
   - Saves to MongoDB
   ↓
6. Response
   {student_id, name, email, ...}
   ↓
7. Component Updates UI
   Display success or error message
```

## 📚 Complete API Endpoint Mapping

### Students Endpoints
```
GET    /api/students              → studentsApi.list()
GET    /api/students/:id          → studentsApi.get(id)
POST   /api/students              → studentsApi.create(data)
PUT    /api/students/:id          → studentsApi.update(id, data)
DELETE /api/students/:id          → studentsApi.delete(id)
```

### Teachers Endpoints
```
GET    /api/teachers              → teachersApi.list()
GET    /api/teachers/:id          → teachersApi.get(id)
POST   /api/teachers              → teachersApi.create(data)
PUT    /api/teachers/:id          → teachersApi.update(id, data)
DELETE /api/teachers/:id          → teachersApi.delete(id)
```

### Classrooms Endpoints
```
GET    /api/classrooms            → classroomsApi.list()
GET    /api/classrooms/:id        → classroomsApi.get(id)
POST   /api/classrooms            → classroomsApi.create(data)
PUT    /api/classrooms/:id        → classroomsApi.update(id, data)
DELETE /api/classrooms/:id        → classroomsApi.delete(id)
```

### Settings Endpoints
```
GET    /api/settings              → settingsApi.getSchoolSettings()
POST   /api/settings              → settingsApi.updateSchoolSettings(data)

Academic Years:
GET    /api/settings/academic-years           → getAllAcademicYears()
POST   /api/settings/academic-years           → createAcademicYear(data)
PUT    /api/settings/academic-years/:id       → updateAcademicYear(id, data)
POST   /api/settings/academic-years/:id/set   → setCurrentAcademicYear(id)
DELETE /api/settings/academic-years/:id       → deleteAcademicYear(id)

Fee Structures:
GET    /api/settings/fee-structures           → getAllFeeStructures()
POST   /api/settings/fee-structures           → createFeeStructure(data)
PUT    /api/settings/fee-structures/:id       → updateFeeStructure(id, data)
DELETE /api/settings/fee-structures/:id       → deleteFeeStructure(id)

Holidays:
GET    /api/settings/holidays                 → getAllHolidays()
POST   /api/settings/holidays                 → createHoliday(data)
DELETE /api/settings/holidays/:id             → deleteHoliday(id)
```

### Role-Based Dashboards
```
Admin:
GET    /api/admin/dashboard       → adminApi.getDashboard()

Teacher:
GET    /api/teacher/dashboard     → teacherApi.getDashboard()
GET    /api/teacher/classes       → teacherApi.getMyClasses()
GET    /api/teacher/students      → teacherApi.getMyStudents()
GET    /api/teacher/subjects      → teacherApi.getMySubjects()
GET    /api/teacher/attendance    → teacherApi.getAttendanceRecords()
POST   /api/teacher/attendance    → teacherApi.markAttendance(data)

Student:
GET    /api/student/dashboard     → studentApi.getDashboard()
GET    /api/student/profile       → studentApi.getMyProfile()
GET    /api/student/grades        → studentApi.getMyGrades()
GET    /api/student/attendance    → studentApi.getMyAttendance()
GET    /api/student/fees          → studentApi.getMyFees()

Head Teacher:
GET    /api/head-teacher/dashboard → headTeacherApi.getDashboard()

Parents:
GET    /api/parents/dashboard     → parentsApi.getDashboard()
GET    /api/parents/children      → parentsApi.getMyChildren()
```

## 🔐 Authentication Flow

```
1. User submits login form
   Email: admin@school.com
   Password: ••••••••
   ↓
2. authApi.login(email, password)
   ↓
3. Backend returns:
   {
     token: "eyJhbGciOiJIUzI1NiIs...",
     user_id: "507f1f77bcf86cd799439011",
     email: "admin@school.com",
     role: "admin",
     name: "Admin User"
   }
   ↓
4. Frontend stores in localStorage:
   {
     user_id: "507f1f77bcf86cd799439011",
     email: "admin@school.com",
     role: "admin",
     name: "Admin User",
     token: "eyJhbGciOiJIUzI1NiIs..."
   }
   ↓
5. All subsequent API calls include:
   Headers: {
     Authorization: "Bearer eyJhbGciOiJIUzI1NiIs..."
   }
   ↓
6. On logout:
   - Token removed from localStorage
   - User redirected to login page
   - All protected routes become inaccessible
```

## 🛠️ Development Workflow

### Setting Up Development Environment

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Verify Integration**
   - Open http://localhost:5173 (frontend)
   - Login with test credentials
   - API calls will automatically work

### Testing an Endpoint

```javascript
// In browser console after login
await (await import('./services/api.js')).studentsApi.list()
```

## 📝 Common Implementation Patterns

### Pattern 1: List with Loading State
```javascript
const [data, setData] = useState([])
const [loading, setLoading] = useState(false)

useEffect(() => {
  loadData()
}, [])

const loadData = async () => {
  setLoading(true)
  try {
    const result = await studentsApi.list()
    setData(result)
  } catch (error) {
    console.error(error)
  } finally {
    setLoading(false)
  }
}
```

### Pattern 2: Create with Form
```javascript
const handleCreate = async (formData) => {
  try {
    await studentsApi.create(formData)
    await loadData() // Refresh list
    showSuccess('Student created successfully')
  } catch (error) {
    showError(error.message)
  }
}
```

### Pattern 3: Update with Optimistic UI
```javascript
const handleUpdate = async (id, newData) => {
  const oldData = data.find(d => d.id === id)
  setData(data.map(d => d.id === id ? newData : d)) // Optimistic update
  
  try {
    await studentsApi.update(id, newData)
    showSuccess('Updated successfully')
  } catch (error) {
    setData(prev => prev.map(d => d.id === id ? oldData : d)) // Rollback
    showError(error.message)
  }
}
```

## ✅ Integration Checklist

- [x] **API Modules**: All 20 API modules created and exported
- [x] **Authentication**: JWT token management integrated
- [x] **Core APIs**: CRUD operations for all resources
- [x] **Settings API**: School configuration endpoints
- [x] **Role-Based APIs**: Admin, Teacher, Student, Head Teacher, Parents
- [x] **Error Handling**: Automatic error propagation
- [x] **Token Management**: Automatic token inclusion and expiration
- [x] **Environment Config**: API URL configuration
- [x] **CORS**: Backend configured for frontend access
- [x] **Syntax Validation**: All code validated

## 🚀 Deployment Considerations

### Environment Variables
- **Development**: VITE_API_URL = http://localhost:5000/api
- **Production**: VITE_API_URL = https://api.yourdomain.com/api

### Backend Configuration
- Enable CORS for production domain
- Set JWT_SECRET to secure value
- Configure HTTPS for API calls
- Set appropriate rate limiting

### Performance Optimization
- Implement request caching
- Use React Query or similar for state management
- Implement pagination for large datasets
- Add request debouncing for search endpoints

---

## 📞 Support & Documentation

For detailed API documentation, see:
- [FRONTEND_API_INTEGRATION.md](./FRONTEND_API_INTEGRATION.md)
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- Backend source: `/backend/routes/*.js`

---

**Last Updated**: January 13, 2026
**Status**: ✅ Complete and Production Ready
