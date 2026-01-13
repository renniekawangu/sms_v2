# School Management System - Backend API

A modern Express.js backend API for a School Management System, designed exclusively for React frontend consumption.

## 📁 Directory Structure

```
backend/
├── src/                          # Source code
│   ├── config/                   # Configuration files
│   │   ├── constants.js          # App constants and settings
│   │   └── database.js           # Database configuration
│   │
│   ├── middleware/               # Express middleware
│   │   ├── auth.js               # Session-based authentication
│   │   ├── errorHandler.js       # Global error handling
│   │   ├── rateLimiter.js        # API rate limiting
│   │   ├── security.js           # Security headers & input sanitization
│   │   └── validate.js           # Data validation
│   │
│   ├── models/                   # MongoDB Mongoose models (18 models)
│   │   ├── user.js               # User account model
│   │   ├── student.js            # Student model
│   │   ├── teacher.js            # Teacher model
│   │   ├── staff.js              # Staff model
│   │   ├── classroom.js          # Classroom model
│   │   ├── attendance.js         # Attendance records
│   │   ├── grades.js             # Student grades
│   │   ├── subjects.js           # School subjects
│   │   ├── fees.js               # Fee management
│   │   ├── payment.js            # Payment records
│   │   ├── expense.js            # Expense tracking
│   │   ├── role.js               # Role definitions
│   │   ├── audit-log.js          # Audit logs
│   │   └── [more models...]
│   │
│   ├── routes/                   # API route handlers (10 API routes)
│   │   ├── auth-api.js           # Authentication endpoints
│   │   ├── api.js                # General endpoints
│   │   ├── admin-api.js          # Admin endpoints
│   │   ├── teacher-api.js        # Teacher endpoints
│   │   ├── student-api.js        # Student endpoints
│   │   ├── accounts-api.js       # Accounts endpoints
│   │   ├── head-teacher-api.js   # Head teacher endpoints
│   │   ├── parents-api.js        # Parents endpoints
│   │   ├── settings-api.js       # Settings endpoints
│   │   └── school-settings.js    # School settings
│   │
│   ├── utils/                    # Utility functions
│   │   ├── logger.js             # Winston logger
│   │   ├── formatters.js         # Data formatting utilities
│   │   ├── auditLogger.js        # Audit logging
│   │   ├── emailNotifier.js      # Email notifications
│   │   ├── exportHelper.js       # Data export utilities
│   │   └── searchHelper.js       # Search functionality
│   │
│   ├── services/                 # Business logic (expandable)
│   │   └── [service files...]
│   │
│   ├── server.js                 # Express server entry point
│   └── health-monitor.js         # Health check monitoring
│
├── scripts/                      # Database & utility scripts
│   ├── seed-test-data.js
│   ├── add-indexes.js
│   ├── migrate-attendance-shape.js
│   └── [migration scripts...]
│
├── tests/                        # Test files
│   ├── setup.js
│   └── utils/
│       └── formatters.test.js
│
├── logs/                         # Application logs
│   ├── combined.log
│   ├── error.log
│   ├── exceptions.log
│   └── rejections.log
│
├── uploads/                      # User uploaded files
│
├── .env                          # Environment variables (not in git)
├── package.json                  # Dependencies and scripts
├── package-lock.json             # Lock file
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- MongoDB
- npm or yarn

### Installation

```bash
cd backend
npm install
```

### Environment Setup

Create a `.env` file in the backend root:

```env
MONGODB_URI=mongodb://localhost:27017/sms
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Running the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start

# Tests
npm test
```

The server will start on `http://localhost:5000`

## 🔑 API Endpoints

All endpoints are prefixed with `/api/`

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - Register new user

### Students
- `GET /api/student` - Get all students
- `POST /api/student` - Create student
- `GET /api/student/:id` - Get student details
- `PUT /api/student/:id` - Update student

### Teachers
- `GET /api/teacher` - Get all teachers
- `POST /api/teacher` - Create teacher
- `GET /api/teacher/:id` - Get teacher details

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user

### Accounts
- `GET /api/accounts` - Accounts management
- `POST /api/accounts/fees` - Manage fees
- `POST /api/accounts/payments` - Record payments

### Settings
- `GET /api/settings` - Get school settings
- `PUT /api/settings` - Update settings

### Health Check
- `GET /health` - Server health status

## 🔐 Authentication

Uses JWT (JSON Web Tokens) for API authentication:
- Token expires in 7 days
- Include token in Authorization header: `Bearer <token>`
- Supports role-based access control (RBAC)

### Roles
- `admin` - Full system access
- `teacher` - Teaching staff access
- `student` - Student portal access
- `head-teacher` - Department management access
- `accounts` - Financial management access

## 📊 Database Models

The system includes 18 MongoDB models:
- **User Management**: user, student, teacher, staff, parent, head-teacher
- **Academic**: classroom, subjects, grades, attendance
- **Financial**: fees, payment, expense, accounts
- **Administrative**: role, school-settings, audit-log, counter, staff-attendance

## 🛡️ Security Features

- CORS protection with origin validation
- Rate limiting on auth endpoints
- Input sanitization and validation
- Security headers (Helmet-compatible)
- Audit logging for all sensitive operations
- Password hashing with bcryptjs
- JWT token validation

## 📝 Logging

Logs are stored in `/logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled rejections

Configure logging in [src/utils/logger.js](src/utils/logger.js)

## 📦 Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **cors** - Cross-origin requests
- **compression** - Gzip compression
- **winston** - Logging
- **nodemailer** - Email sending
- **exceljs** - Excel export
- **multer** - File uploads

## 🧪 Testing

```bash
npm test
```

## 📱 Frontend Integration

This backend is designed to work with the React frontend at `/frontend`

### CORS Configuration
- Allowed origins configured in [src/server.js](src/server.js)
- Default: `http://localhost:5173` (Vite dev server)

### API Response Format
All responses are JSON with consistent error handling:

```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

Error responses:
```json
{
  "error": "Error message",
  "status": 400
}
```

## 🔄 Database Migration Scripts

Located in `/scripts/`:
- `seed-test-data.js` - Seed test data
- `add-indexes.js` - Create database indexes
- `migrate-attendance-shape.js` - Migrate attendance data

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`

### Port Already in Use
- Change `PORT` in `.env`
- Or kill process: `lsof -ti:5000 | xargs kill -9`

### CORS Issues
- Add frontend URL to `allowedOrigins` in [src/server.js](src/server.js)

## 📄 License

ISC

## 👨‍💻 Development

For local development:
1. Start MongoDB
2. Run `npm run dev`
3. Backend will auto-reload on file changes
4. Logs are available in `/logs/`

---

**Backend Status**: ✅ Production Ready | React Compatible
