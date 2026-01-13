# Role-Based Access Control (RBAC) Implementation Summary

## Overview
Comprehensive role-based access control system with 5 distinct roles, permission-based middleware, and centralized role management.

---

## Components Created

### 1. **RBAC Configuration** (`src/config/rbac.js`)
- Centralized definition of all roles and permissions
- Role-Permission matrix mapping
- Endpoint access control configuration
- Helper functions for permission checking

**Roles:**
- `admin` - Full system access (20 permissions)
- `head-teacher` - School management (11 permissions)  
- `accounts` - Financial operations (5 permissions)
- `teacher` - Class management (5 permissions)
- `student` - Personal records (5 permissions)

**Key Exports:**
```javascript
- ROLES // Role constants
- PERMISSIONS // Permission constants
- ROLE_PERMISSIONS // Role-permission matrix
- ENDPOINT_ACCESS // Route access control
- hasPermission(role, permission) // Check single permission
- canAccessEndpoint(role, endpoint) // Check endpoint access
- getRolePermissions(role) // Get all role permissions
```

---

### 2. **RBAC Middleware** (`src/middleware/rbac.js`)
Reusable middleware for protecting routes with flexible role/permission checking.

**Available Middleware:**
```javascript
requireAuth // Require valid JWT token
requireRole(...roles) // Require specific role(s)
requirePermission(...permissions) // Require specific permission(s)
requireEndpointAccess // Use ENDPOINT_ACCESS configuration
```

**Helper Functions:**
```javascript
verifyToken(token) // Verify JWT token
extractToken(req) // Extract token from Authorization header
userHasRole(req, ...roles) // Check if user has role
userHasPermission(req, ...permissions) // Check if user has permission
```

**Usage Examples:**
```javascript
// Require admin role only
router.post('/api/users', requireAuth, requireRole(ROLES.ADMIN), handler);

// Require multiple roles
router.get('/api/staff', requireAuth, requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER), handler);

// Require specific permission
router.put('/api/grades/:id', requireAuth, requirePermission(PERMISSIONS.MANAGE_GRADES), handler);

// Check within handler
if (userHasRole(req, ROLES.ADMIN, ROLES.HEAD_TEACHER)) {
  // Admin or head-teacher operation
}
```

---

### 3. **Role Service** (`src/services/roleService.js`)
Business logic layer for role-related operations.

**Key Functions:**
```javascript
getAllSystemRoles() // Get all roles with permissions
getRoleWithDetails(roleName) // Get detailed role information
getRoleHierarchy() // Get role hierarchy for UI
getAllPermissions() // Get all system permissions
getPermissionsByCategory() // Group permissions by category
canPerformAction(role, action) // Check if role can perform action
getUsersByRole(role) // Get users with specific role
getRoleStatistics() // Get role distribution stats
getRoleFeatures(role) // Get role capabilities list
```

---

### 4. **Roles API** (`src/routes/roles-api.js`)
Endpoints for querying roles and permissions.

**Endpoints:**
```
GET /api/roles                      # All roles
GET /api/roles/:roleName            # Role details
GET /api/roles/:roleName/permissions # Role permissions
GET /api/roles/hierarchy            # Role hierarchy
GET /api/roles/permissions/all      # All permissions (Admin)
GET /api/roles/statistics           # Role statistics (Admin/Head-Teacher)
GET /api/roles/:roleName/users      # Users with role (Admin/Head-Teacher)
GET /api/roles/my/info              # Current user role info
POST /api/roles/check-permission    # Verify permission (Admin)
```

---

### 5. **Documentation** (`RBAC_GUIDE.md`)
Comprehensive guide covering:
- Role descriptions and responsibilities
- Permission matrix
- API middleware usage
- Best practices
- Access control examples
- Troubleshooting guide

---

## Role Hierarchy

```
Level 1: Admin (20 permissions)
         ├─ Full system access
         └─ Can assume any role's permissions

Level 2: Head-Teacher (11 permissions)
         ├─ School operations
         ├─ Staff & student management
         └─ Analytics & reports

Level 3: Accounts Officer (5 permissions)
         ├─ Fee management
         ├─ Payment recording
         └─ Financial reports

Level 4: Teacher (5 permissions)
         ├─ Attendance marking
         ├─ Grade management
         └─ Class reports

Level 5: Student (5 permissions)
         └─ View own academic records
```

---

## Permission Categories

| Category | Count | Roles | Purpose |
|----------|-------|-------|---------|
| Academic | 5 | Teacher, Head-Teacher | Attendance, grades, students |
| Management | 6 | Admin, Head-Teacher | Users, roles, staff, students |
| Reporting | 5 | Head-Teacher, Accounts, Teacher | Analytics and reports |
| Financial | 5 | Accounts, Head-Teacher | Fees, payments, expenses |
| System | 7 | Admin | Configuration, audit, settings |

---

## Implementation Guide

### Protecting a Route

**Step 1:** Import middleware
```javascript
const { requireAuth, requireRole, requirePermission } = require('../middleware/rbac');
const { ROLES, PERMISSIONS } = require('../config/rbac');
```

**Step 2:** Apply middleware to route
```javascript
// Option A: Require specific role
router.post('/users', 
  requireAuth, 
  requireRole(ROLES.ADMIN), 
  handler
);

// Option B: Require permission
router.put('/grades/:id',
  requireAuth,
  requirePermission(PERMISSIONS.MANAGE_GRADES),
  handler
);

// Option C: Multiple roles
router.get('/staff',
  requireAuth,
  requireRole(ROLES.ADMIN, ROLES.HEAD_TEACHER),
  handler
);
```

### Checking Permissions in Handler

```javascript
const { userHasRole, userHasPermission } = require('../middleware/rbac');

router.get('/data', requireAuth, (req, res) => {
  // Check role
  if (userHasRole(req, ROLES.ADMIN)) {
    // Admin operation
  }

  // Check permission
  if (userHasPermission(req, PERMISSIONS.MANAGE_FEES)) {
    // Finance operation
  }

  // Check data ownership
  if (req.user.role === ROLES.STUDENT && req.params.studentId !== req.user.studentId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
});
```

---

## Security Features

✓ **JWT Token Verification** - Validates token signature and expiration  
✓ **Role-Based Access** - Routes require specific roles  
✓ **Permission-Based Access** - Granular permission checking  
✓ **Admin Override** - Admin can access all endpoints  
✓ **Flexible Middleware** - Combine multiple access controls  
✓ **Data Ownership** - Can check resource ownership  
✓ **Audit Ready** - Can log all access attempts  
✓ **Extensible** - Easy to add new roles/permissions  

---

## API Response Examples

### Get All Roles
```bash
GET /api/roles
```
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "name": "admin",
      "displayName": "Administrator",
      "permissions": [20 items],
      "permissionCount": 20,
      "isSystem": true,
      "description": "Full system access with ability to..."
    },
    ...
  ]
}
```

### Get Role Details
```bash
GET /api/roles/teacher
```
```json
{
  "success": true,
  "data": {
    "name": "teacher",
    "displayName": "Teacher",
    "permissions": [
      { "code": "mark_attendance", "displayName": "Mark Attendance" },
      ...
    ],
    "permissionCount": 5,
    "userCount": 15,
    "isSystem": true
  }
}
```

### Get User's Role Info
```bash
GET /api/roles/my/info
Authorization: Bearer <token>
```
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "teacher@school.com",
    "role": "teacher"
  },
  "roleDetails": {
    "name": "teacher",
    "displayName": "Teacher",
    "permissions": [...],
    "features": [
      "Attendance Marking",
      "Grade Management",
      ...
    ]
  }
}
```

---

## Migrating Existing Routes

To update existing routes to use new RBAC system:

### Before
```javascript
const requireApiAuth = (role) => async (req, res, next) => {
  if (role && decoded.role !== role && decoded.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

router.get('/users', requireApiAuth('admin'), handler);
```

### After
```javascript
const { requireAuth, requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/rbac');

router.get('/users', 
  requireAuth, 
  requireRole(ROLES.ADMIN), 
  handler
);
```

---

## Testing the RBAC System

```bash
# Load RBAC configuration
node -e "const rbac = require('./src/config/rbac'); console.log(rbac.ROLES);"

# Load role service
node -e "const service = require('./src/services/roleService'); 
service.getAllSystemRoles().then(roles => console.log(roles));"

# Test middleware
npm start
# Then test endpoints with different authorization tokens
```

---

## Next Steps

1. **Update Existing Routes** - Migrate all routes to use new RBAC middleware
2. **Add Audit Logging** - Log all permission checks and access attempts
3. **Create Permission Seed** - Populate permissions in database if needed
4. **Add Frontend Integration** - Show/hide UI based on user permissions
5. **Add Permission Caching** - Cache role permissions for performance
6. **Create Admin UI** - Interface for managing roles and permissions

---

## Files Created/Modified

**New Files:**
- ✅ `src/config/rbac.js` - RBAC configuration
- ✅ `src/middleware/rbac.js` - RBAC middleware
- ✅ `src/services/roleService.js` - Role service
- ✅ `src/routes/roles-api.js` - Roles API endpoints
- ✅ `RBAC_GUIDE.md` - Documentation

**Modified Files:**
- ✅ `src/server.js` - Added roles API route

---

## Status

✅ **RBAC System**: Fully implemented and tested  
✅ **Middleware**: Ready for use in routes  
✅ **API**: Endpoints available for role queries  
✅ **Documentation**: Comprehensive guide provided  
⏳ **Route Migration**: Ready to migrate existing routes  
⏳ **Admin UI**: Can be created based on roles API  

---

Created: January 13, 2026  
Backend Agent
