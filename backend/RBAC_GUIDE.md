# Role-Based Access Control (RBAC) Documentation

## Overview

The School Management System implements a comprehensive Role-Based Access Control system with 5 distinct roles, each with specific permissions and responsibilities.

## System Roles

### 1. Administrator (admin)
**Level:** 1 (Highest)  
**Description:** Full system access with ability to manage all aspects of the system

#### Responsibilities:
- User account management (create, update, delete)
- Role and permission management
- System configuration and settings
- Audit log access and monitoring
- Data import/export functionality
- Access to all features in the system

#### Permissions:
- `manage_users` - Create, update, delete user accounts
- `manage_roles` - Manage system roles and permissions
- `view_audit_logs` - Access all audit logs
- `configure_system` - Modify system settings
- `manage_staff_users` - Manage staff-related user accounts
- `manage_school_settings` - Configure school information
- `manage_all_data` - Perform any operation on all data

**Access Level:** Full system access  
**Dashboard:** Admin dashboard with full system overview  
**Key Pages:** Users, Roles, Audit Logs, Settings, Analytics

---

### 2. Head Teacher (head-teacher)
**Level:** 2 (Management)  
**Description:** Manages school operations, staff, and students

#### Responsibilities:
- Staff management (create, update, view staff records)
- Student management and enrollment
- Subject and curriculum management
- Attendance tracking (staff and students)
- Academic analytics and reporting
- Data import for bulk operations
- School analytics and performance reports

#### Permissions:
- `manage_staff` - Manage staff records
- `mark_staff_attendance` - Record staff attendance
- `view_staff_attendance` - View attendance records
- `manage_students` - Manage student records
- `manage_subjects` - Manage subjects and curriculum
- `import_data` - Import bulk data
- `view_analytics` - General analytics
- `view_grade_analytics` - Grade-related analytics
- `view_attendance_analytics` - Attendance analytics
- `view_classroom_reports` - Classroom performance reports
- `manage_all_data` - Full data access

**Access Level:** School-wide operations  
**Dashboard:** Head Teacher dashboard with school overview  
**Key Pages:** Staff, Students, Subjects, Attendance, Analytics, Reports

---

### 3. Accounts Officer (accounts)
**Level:** 3 (Specialist)  
**Description:** Manages financial operations and fee collection

#### Responsibilities:
- Fee structure management
- Payment recording and tracking
- Expense management
- Financial reporting
- Student fee status tracking
- Payment reconciliation
- Financial analytics

#### Permissions:
- `manage_fees` - Create and manage fee structures
- `manage_payments` - Record and track payments
- `manage_expenses` - Record and manage expenses
- `generate_financial_reports` - Create financial reports
- `view_financial_analytics` - View financial analytics

**Access Level:** Financial operations  
**Dashboard:** Accounts dashboard with financial overview  
**Key Pages:** Fees, Payments, Expenses, Reports, Analytics

---

### 4. Teacher (teacher)
**Level:** 4 (Educator)  
**Description:** Manages class activities, grades, and attendance

#### Responsibilities:
- Mark student attendance for assigned classes
- Manage and record grades
- View assigned students and classes
- Track class-level attendance
- View subject information
- Generate class reports

#### Permissions:
- `mark_attendance` - Record student attendance
- `manage_grades` - Enter and modify student grades
- `view_class_students` - View students in assigned classes
- `view_subjects` - View subject information
- `view_class_attendance` - View class attendance records

**Access Level:** Class-level operations  
**Dashboard:** Teacher dashboard with class overview  
**Key Pages:** My Classes, Attendance, Grades, Students

---

### 5. Student (student)
**Level:** 5 (Lowest)  
**Description:** Access to own academic records and information

#### Responsibilities:
- View own grades and academic performance
- Check own attendance records
- View enrolled subjects
- Download grade cards
- View fee/payment status

#### Permissions:
- `view_own_grades` - View personal grades
- `view_own_attendance` - View personal attendance
- `view_own_subjects` - View enrolled subjects
- `download_grade_card` - Download grade reports
- `view_own_fees` - View fee status and payments

**Access Level:** Personal academic records only  
**Dashboard:** Student dashboard with personal overview  
**Key Pages:** My Grades, My Attendance, My Subjects, My Fees

---

## Permission Categories

### Academic Permissions
```
mark_attendance         - Record student/staff attendance
manage_grades          - Enter and modify grades
view_class_students    - Access class student lists
view_subjects          - View subject information
view_class_attendance  - View class attendance records
```

### Management Permissions
```
manage_staff           - Create/update staff records
manage_students        - Create/update student records
manage_subjects        - Create/update subjects
manage_fees            - Create/update fee structures
manage_payments        - Record payments
manage_expenses        - Track expenses
```

### Reporting Permissions
```
view_analytics         - General system analytics
view_grade_analytics   - Grade-specific analytics
view_attendance_analytics - Attendance analytics
view_classroom_reports - Class performance reports
generate_financial_reports - Financial reports
view_financial_analytics - Financial analytics
```

### System Permissions
```
manage_users           - User account management
manage_roles           - Role and permission management
view_audit_logs        - Access audit trail
configure_system       - System configuration
manage_school_settings - School information settings
manage_all_data        - Full data access
```

---

## Role Permission Matrix

| Permission | Admin | Head-Teacher | Accounts | Teacher | Student |
|-----------|-------|--------------|----------|---------|---------|
| mark_attendance | ✓ | ✓ | ✗ | ✓ | ✗ |
| manage_grades | ✓ | ✓ | ✗ | ✓ | ✗ |
| view_class_students | ✓ | ✓ | ✗ | ✓ | ✗ |
| manage_students | ✓ | ✓ | ✗ | ✗ | ✗ |
| manage_staff | ✓ | ✓ | ✗ | ✗ | ✗ |
| manage_fees | ✓ | ✓ | ✓ | ✗ | ✗ |
| manage_payments | ✓ | ✓ | ✓ | ✗ | ✗ |
| manage_users | ✓ | ✗ | ✗ | ✗ | ✗ |
| manage_roles | ✓ | ✗ | ✗ | ✗ | ✗ |
| view_audit_logs | ✓ | ✗ | ✗ | ✗ | ✗ |
| view_own_grades | ✓ | ✓ | ✗ | ✗ | ✓ |
| view_own_fees | ✓ | ✓ | ✓ | ✗ | ✓ |
| configure_system | ✓ | ✗ | ✗ | ✗ | ✗ |

---

## API Middleware Usage

### Protecting Routes

#### 1. Require Authentication Only
```javascript
router.get('/api/students', requireAuth, handler);
```

#### 2. Require Specific Role(s)
```javascript
router.post('/api/students', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), handler);
```

#### 3. Require Specific Permission(s)
```javascript
router.put('/api/grades/:id', requireAuth, requirePermission(PERMISSIONS.MANAGE_GRADES), handler);
```

#### 4. Require Endpoint Access (Uses ENDPOINT_ACCESS config)
```javascript
router.get('/api/admin/users', requireAuth, requireEndpointAccess, handler);
```

### Using Helper Functions

```javascript
const { userHasRole, userHasPermission } = require('../middleware/rbac');

router.get('/api/data', requireAuth, (req, res) => {
  // Check within route handler
  if (userHasRole(req, ROLES.ADMIN, ROLES.HEAD_TEACHER)) {
    // Do admin-level operation
  }
  
  if (userHasPermission(req, PERMISSIONS.MANAGE_FEES)) {
    // Do finance operation
  }
});
```

---

## Access Control Examples

### Example 1: Student Dashboard
```javascript
// Only students and admins can access
router.get('/api/student/dashboard', 
  requireAuth, 
  requireRole(ROLES.STUDENT, ROLES.ADMIN),
  studentDashboardHandler
);
```

### Example 2: Mark Attendance (Teachers & Admins)
```javascript
// Only teachers can mark attendance
router.post('/api/attendance/mark',
  requireAuth,
  requirePermission(PERMISSIONS.MARK_ATTENDANCE),
  markAttendanceHandler
);
```

### Example 3: View Reports (Head-Teacher Level)
```javascript
// Head-teachers and admins can view analytics
router.get('/api/analytics/grades',
  requireAuth,
  requireRole(ROLES.HEAD_TEACHER, ROLES.ADMIN),
  gradeAnalyticsHandler
);
```

### Example 4: Financial Operations (Accounts)
```javascript
// Only accounts officers can manage fees
router.post('/api/accounts/fees',
  requireAuth,
  requirePermission(PERMISSIONS.MANAGE_FEES),
  manageFeeHandler
);
```

---

## Token & Session Management

### JWT Token Format
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "teacher",
  "iat": 1234567890,
  "exp": 1234654290
}
```

### Token Expiration
- Default: 7 days
- Configurable via `JWT_EXPIRE` environment variable

### Role-Based Token Verification
1. Token is extracted from `Authorization: Bearer <token>` header
2. Token is verified using JWT_SECRET
3. User role is extracted and attached to `req.user`
4. Middleware checks role/permissions against token

---

## Best Practices

### 1. Always Use Authentication
```javascript
// ✓ Good - Always require authentication
router.get('/api/data', requireAuth, handler);

// ✗ Avoid - Public endpoints without validation
router.get('/api/data', handler);
```

### 2. Use Least Privilege
```javascript
// ✓ Good - Specific roles only
requireRole(ROLES.TEACHER, ROLES.HEAD_TEACHER)

// ✗ Avoid - Too permissive
requireRole(ROLES.ADMIN) // when not needed
```

### 3. Use Permissions Not Roles
```javascript
// ✓ Good - Permission-based (more flexible)
requirePermission(PERMISSIONS.MANAGE_GRADES)

// ✗ Avoid - Role-based (less flexible)
requireRole(ROLES.TEACHER)
```

### 4. Check Ownership Where Needed
```javascript
// ✓ Good - Students can only view their own data
if (req.user.role === ROLES.STUDENT && req.params.studentId !== req.user.studentId) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

### 5. Audit Sensitive Operations
```javascript
// Log when admin manages users or changes roles
auditLog.record({
  user: req.user.id,
  action: 'manage_users',
  targetUser: userId,
  timestamp: new Date()
});
```

---

## Related Files

- **RBAC Configuration:** `src/config/rbac.js`
- **RBAC Middleware:** `src/middleware/rbac.js`
- **Role Service:** `src/services/roleService.js`
- **Role Model:** `src/models/role.js`
- **User Model:** `src/models/user.js`

---

## Implementing New Roles

To add a new role:

1. Add to `ROLES` in `src/config/rbac.js`
2. Define permissions in `ROLE_PERMISSIONS`
3. Update `ENDPOINT_ACCESS` mapping
4. Create role-specific routes in `src/routes/`
5. Use middleware: `requireRole(ROLES.NEW_ROLE)`

---

## Troubleshooting

### "Forbidden: Insufficient permissions"
- Check user's role and required permissions
- Verify token is valid and not expired
- Check ROLE_PERMISSIONS configuration

### User can't access endpoint
- Verify user role in database
- Check requireRole/requirePermission middleware
- Review ENDPOINT_ACCESS mapping
- Ensure token is included in Authorization header

### Admin can't access endpoint
- Admin should have access to all endpoints
- Check if specific role is required (not permission)
- Verify admin role is set correctly in database

---

Last Updated: January 13, 2026
