# Backend & Frontend Integration Guide

## Setup

### Backend Setup

1. **Install Dependencies** (if not already installed)
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**
   - The `.env` file has been created with the following key variables:
     - `PORT=5000` - Backend server port
     - `MONGODB_URI` - MongoDB connection string
     - `JWT_SECRET` - Secret for JWT token generation
     - `FRONTEND_URL=http://localhost:5173` - Frontend URL for CORS

3. **CORS Configuration**
   - CORS middleware has been added to `server.js`
   - Allows requests from `http://localhost:5173` (frontend dev server)
   - Supports credentials for session management

### Frontend Setup

1. **Install Dependencies** (if not already installed)
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Configuration**
   - The `.env` file has been updated with:
     - `VITE_API_URL=http://localhost:5000/api` - Backend API base URL

3. **Vite Configuration**
   - Updated `vite.config.js` with proxy settings for development
   - During development, `/api` requests are proxied to `http://localhost:5000`

## Running the Application

### Terminal 1 - Start Backend Server
```bash
cd backend
npm start
```
- Backend will run on `http://localhost:5000`

### Terminal 2 - Start Frontend Dev Server
```bash
cd frontend
npm run dev
```
- Frontend will run on `http://localhost:5173`

## API Integration

### Authentication Flow
1. **Frontend calls** `/api/auth/login` with email and password
2. **Backend returns** JWT token, user ID, role, and name
3. **Frontend stores** token in localStorage
4. **Subsequent requests** include token in `Authorization: Bearer <token>` header

### API Endpoints

#### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user info

#### Students
- `GET /api/students` - List all students
- `GET /api/students/:id` - Get student details
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

#### Teachers
- `GET /api/teachers` - List all teachers
- `GET /api/teachers/:id` - Get teacher details
- `POST /api/teachers` - Create new teacher
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher

#### Classrooms
- `GET /api/classrooms` - List all classrooms
- `GET /api/classrooms/:id` - Get classroom details
- `POST /api/classrooms` - Create new classroom
- `PUT /api/classrooms/:id` - Update classroom
- `DELETE /api/classrooms/:id` - Delete classroom

#### Subjects
- `GET /api/subjects` - List all subjects
- `GET /api/subjects/:id` - Get subject details
- `POST /api/subjects` - Create new subject
- `PUT /api/subjects/:id` - Update subject
- `DELETE /api/subjects/:id` - Delete subject

#### Attendance
- `GET /api/attendance` - List all attendance records
- `GET /api/attendance/:user_id` - Get user attendance
- `POST /api/attendance` - Mark attendance
- `PUT /api/attendance/record/:id` - Update attendance record
- `DELETE /api/attendance/record/:id` - Delete attendance record

#### Exams
- `GET /api/exams` - List all exams
- `GET /api/exams/:id` - Get exam details
- `POST /api/exams` - Create new exam
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam

#### Results/Grades
- `GET /api/results` - List all results
- `GET /api/results/student/:student_id` - Get student results
- `POST /api/results` - Create new result
- `PUT /api/results/:id` - Update result
- `DELETE /api/results/:id` - Delete result

#### Fees
- `GET /api/fees` - List all fees
- `GET /api/fees/:id` - Get fee details
- `POST /api/fees` - Create new fee
- `PUT /api/fees/:id` - Update fee
- `DELETE /api/fees/:id` - Delete fee

#### Payments
- `GET /api/payments` - List all payments
- `POST /api/payments` - Create new payment

#### Expenses
- `GET /api/expenses` - List all expenses
- `GET /api/expenses/:id` - Get expense details
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

## Key Files Modified

### Backend
- **server.js** - Added CORS middleware and API route registration
- **.env** - Created with database and session configuration
- **routes/auth-api.js** - New JWT-based authentication endpoints for frontend
- **routes/api.js** - New REST API endpoints for all resources

### Frontend
- **.env** - Added `VITE_API_URL` for API base URL
- **vite.config.js** - Added proxy configuration for development
- **src/services/api.js** - Already configured to use `VITE_API_URL`

## Troubleshooting

### CORS Errors
- Ensure backend is running on port 5000
- Check that `FRONTEND_URL` in `.env` matches your frontend URL
- Verify CORS middleware is loaded before routes

### 401 Unauthorized
- Token may be expired
- Token not being sent in Authorization header
- Check browser's localStorage for stored token

### API Routes Not Found
- Ensure backend `/api` routes are registered in server.js
- Check that model imports are correct in api.js
- Verify database connection is working

## Development Tips

1. **Hot Reload**
   - Frontend: Vite automatically reloads on file changes
   - Backend: Use `npm run dev` (if nodemon is configured) or restart manually

2. **Debugging**
   - Check browser DevTools Network tab for API requests
   - Check backend console for errors
   - Look at MongoDB for stored data

3. **Testing**
   - Use curl or Postman to test API endpoints directly
   - Ensure CORS headers are present in responses
   - Verify authentication token is valid

## Next Steps

1. Test login functionality with existing user credentials
2. Test CRUD operations for students, teachers, etc.
3. Configure error handling and validation
4. Set up production environment variables
5. Deploy to hosting platform
