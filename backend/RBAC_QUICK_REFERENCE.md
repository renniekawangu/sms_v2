# RBAC Quick Reference

## Importing in Routes

```javascript
// Middleware
const { requireAuth, requireRole, requirePermission, userHasRole, userHasPermission } = require('../middleware/rbac');

// Config & Service
const { ROLES, PERMISSIONS } = require('../config/rbac');
const roleService = require('../services/roleService');
```

## Route Protection Patterns

### Pattern 1: Authentication Only
```javascript
router.get('/api/data', requireAuth, handler);
```

### Pattern 2: Specific Role(s)
```javascript
router.post('/api/admin/users', 
  requireAuth, 
  requireRole(ROLES.ADMIN), 
  handler
);
```

### Pattern 3: Multiple Roles (OR)
```javascript
router.get('/api/reports', 
  requireAuth, 
  requireRole(ROLES.HEAD_TEACHER, ROLES.ADMIN), 
  handler
);
```

### Pattern 4: Permission-Based
```javascript
router.put('/api/grades/:id',
  requireAuth,
  requirePermission(PERMISSIONS.MANAGE_GRADES),
  handler
);
```

### Pattern 5: Multiple Permissions (OR)
```javascript
router.post('/api/financial/report',
  requireAuth,
  requirePermission(PERMISSIONS.GENERATE_FINANCIAL_REPORTS, PERMISSIONS.VIEW_FINANCIAL_ANALYTICS),
  handler
);
```

## In Route Handlers

### Check Role
```javascript
if (userHasRole(req, ROLES.ADMIN)) {
  // Admin operation
}

if (userHasRole(req, ROLES.TEACHER, ROLES.HEAD_TEACHER)) {
  // Teacher or Head-Teacher operation
}
```

### Check Permission
```javascript
if (userHasPermission(req, PERMISSIONS.MARK_ATTENDANCE)) {
  // Can mark attendance
}

if (userHasPermission(req, PERMISSIONS.MANAGE_FEES, PERMISSIONS.MANAGE_PAYMENTS)) {
  // Can manage fees or payments
}
```

### Check Data Ownership (Students)
```javascript
if (req.user.role === ROLES.STUDENT && req.params.studentId !== req.user.studentId) {
  return res.status(403).json({ error: 'Cannot access other student data' });
}
```

### Conditional Logic
```javascript
let query = {};

if (userHasRole(req, ROLES.STUDENT)) {
  // Filter to only own records
  query.studentId = req.user.studentId;
} else if (userHasRole(req, ROLES.TEACHER)) {
  // Filter to assigned classes
  query.classroomId = req.user.classroomId;
} else if (userHasRole(req, ROLES.ADMIN, ROLES.HEAD_TEACHER)) {
  // No filter - see all
}

const results = await Model.find(query);
```

## Role Hierarchy

```
Level 1: Admin (全权限)
         └─ Can do anything

Level 2: Head-Teacher (11权限)
         └─ School operations, analytics, staff/student management

Level 3: Accounts (5权限)
         └─ Financial operations

Level 4: Teacher (5权限)
         └─ Class operations, attendance, grades

Level 5: Student (5权限)
         └─ Own academic records only
```

## Common Permissions

### Academic
```javascript
PERMISSIONS.MARK_ATTENDANCE         // Mark student/staff attendance
PERMISSIONS.MANAGE_GRADES           // Enter/modify grades
PERMISSIONS.VIEW_CLASS_STUDENTS     // View class students
PERMISSIONS.VIEW_CLASS_ATTENDANCE   // View class attendance
PERMISSIONS.VIEW_SUBJECTS           // View subject info
```

### Management
```javascript
PERMISSIONS.MANAGE_STAFF            // Manage staff records
PERMISSIONS.MANAGE_STUDENTS         // Manage student records
PERMISSIONS.MANAGE_SUBJECTS         // Manage subjects
PERMISSIONS.MANAGE_FEES             // Manage fee structures
PERMISSIONS.MANAGE_PAYMENTS         // Record payments
PERMISSIONS.MANAGE_EXPENSES         // Track expenses
```

### Financial
```javascript
PERMISSIONS.GENERATE_FINANCIAL_REPORTS  // Create financial reports
PERMISSIONS.VIEW_FINANCIAL_ANALYTICS    // View financial analytics
```

### System (Admin Only)
```javascript
PERMISSIONS.MANAGE_USERS            // User account management
PERMISSIONS.MANAGE_ROLES            // Role/permission management
PERMISSIONS.VIEW_AUDIT_LOGS         // Access audit trail
PERMISSIONS.CONFIGURE_SYSTEM        // System configuration
PERMISSIONS.MANAGE_SCHOOL_SETTINGS  // School settings
```

### Analytics
```javascript
PERMISSIONS.VIEW_ANALYTICS                  // General analytics
PERMISSIONS.VIEW_GRADE_ANALYTICS            // Grade analytics
PERMISSIONS.VIEW_ATTENDANCE_ANALYTICS       // Attendance analytics
PERMISSIONS.VIEW_CLASSROOM_REPORTS          // Class reports
```

## Role Permissions Mapping

| Role | Permissions |
|------|-------------|
| Admin | 20 (all) |
| Head-Teacher | 11 |
| Accounts | 5 (financial) |
| Teacher | 5 (academic) |
| Student | 5 (personal) |

## API Response Examples

### Get User's Role
```javascript
GET /api/roles/my/info
Authorization: Bearer {token}

{
  "user": { "id", "email", "role" },
  "roleDetails": { "permissions", "features" }
}
```

### Check Permission
```javascript
POST /api/roles/check-permission
{
  "role": "teacher",
  "permissions": ["mark_attendance", "manage_grades"]
}

{
  "role": "teacher",
  "permissions": {
    "mark_attendance": true,
    "manage_grades": true
  }
}
```

### Get Role Hierarchy
```javascript
GET /api/roles/hierarchy

{
  "data": [
    { "level": 1, "role": "admin", "permissions": 20 },
    { "level": 2, "role": "head-teacher", "permissions": 11 },
    ...
  ]
}
```

## Service Functions

```javascript
// Get role details
await roleService.getRoleWithDetails('teacher')

// Check permission
await roleService.canPerformAction('teacher', 'mark_attendance')

// Get role features
roleService.getRoleFeatures('head-teacher')

// Get users with role
await roleService.getUsersByRole('student')

// Get role statistics
await roleService.getRoleStatistics()

// Get role hierarchy
roleService.getRoleHierarchy()
```

## Troubleshooting

### "Unauthorized: Missing token"
- Missing Authorization header
- Include: `Authorization: Bearer <token>`

### "Forbidden: Insufficient permissions"
- User doesn't have required role/permission
- Check ROLE_PERMISSIONS in rbac.js
- Verify user role in database

### Admin can't access endpoint
- Check requireRole middleware
- Admin should inherit all roles
- Verify admin role is set in database

### Specific error responses
```javascript
// 401 - Missing/invalid token
{ "error": "Unauthorized: Missing token" }

// 403 - Insufficient permissions
{ 
  "error": "Forbidden: Insufficient permissions",
  "requiredRoles": ["admin"],
  "userRole": "teacher"
}
```

## File Locations

- **Config**: `src/config/rbac.js`
- **Middleware**: `src/middleware/rbac.js`
- **Service**: `src/services/roleService.js`
- **Routes**: `src/routes/roles-api.js`
- **Docs**: `RBAC_GUIDE.md` & `RBAC_IMPLEMENTATION.md`

## Example Route

```javascript
const express = require('express');
const { requireAuth, requireRole, requirePermission, userHasRole } = require('../middleware/rbac');
const { ROLES, PERMISSIONS } = require('../config/rbac');

const router = express.Router();

// Get students (teachers and above)
router.get('/students',
  requireAuth,
  requireRole(ROLES.TEACHER, ROLES.HEAD_TEACHER, ROLES.ADMIN),
  async (req, res) => {
    // Teachers see their class, Head-Teachers see all
    let query = {};
    if (userHasRole(req, ROLES.TEACHER)) {
      query.classroomId = req.user.classroomId;
    }
    const students = await Student.find(query);
    res.json({ data: students });
  }
);

// Mark attendance (requires permission)
router.post('/attendance',
  requireAuth,
  requirePermission(PERMISSIONS.MARK_ATTENDANCE),
  async (req, res) => {
    // User has mark_attendance permission
    const attendance = await Attendance.create(req.body);
    res.json({ data: attendance });
  }
);

module.exports = router;
```

---

Last Updated: January 13, 2026
