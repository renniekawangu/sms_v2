# Role Management System - Quick Setup Guide

## What's New

A complete admin UI for role management has been integrated into the Edusync frontend. This includes:

1. **Role Management Page** - Create, edit, delete, and view roles
2. **Admin Panel** - Centralized admin dashboard with tabs for roles, user assignment, and permissions
3. **User Role Assignment** - Assign roles to users
4. **Permissions Panel** - Organize and manage permissions by category
5. **Role Form Component** - Reusable form for role creation/editing

## Files Created/Modified

### New Files

```
frontend/src/
├── services/
│   └── rolesApi.js              # Role management API service
├── components/
│   ├── RoleForm.jsx            # Role form component
│   ├── PermissionsPanel.jsx    # Permissions selector
│   └── UserRoleAssignment.jsx  # User assignment component
├── pages/
│   ├── RoleManagement.jsx      # Main role management page
│   └── AdminPanel.jsx           # Admin panel dashboard
└── ROLE_MANAGEMENT_README.md   # Full documentation
```

### Modified Files

```
frontend/src/
├── App.jsx                      # Added /admin and updated /roles routes
└── components/Sidebar.jsx       # Added Admin Panel menu item
```

## How to Access

### As an Admin User:

1. **Role Management Page**
   - URL: `/roles`
   - Via Sidebar: Click "Users & Roles"
   
2. **Admin Panel (Recommended)**
   - URL: `/admin`
   - Via Sidebar: Click "Admin Panel"
   - Features:
     - Role Management tab
     - User Assignment tab
     - Permissions tab

## Integration with Backend

The system includes fallback mock data for testing. To integrate with your backend:

1. Ensure your backend provides these endpoints:
   ```
   GET    /api/admin/roles
   GET    /api/admin/roles/:id
   POST   /api/admin/roles
   PUT    /api/admin/roles/:id
   DELETE /api/admin/roles/:id
   GET    /api/admin/roles/:id/permissions
   PUT    /api/admin/roles/:id/permissions
   PUT    /api/admin/users/:userId/role
   ```

2. The API service will automatically use mock data if endpoints are unavailable

## Available Permissions

The system includes 28 permissions organized in 11 categories:

- Dashboard (1)
- Users (4)
- Students (4)
- Teachers (4)
- Classrooms (4)
- Attendance (2)
- Fees (2)
- Payments (2)
- Expenses (2)
- Reports (1)
- Settings (2)

### Adding New Permissions

Edit the `AVAILABLE_PERMISSIONS` array in `RoleForm.jsx` to add new permissions.

## Key Features

### 1. Role Management
- Create roles with custom permissions
- Edit existing roles
- Delete roles with confirmation
- View full role details

### 2. Permissions Management
- Categorized permission browser
- Expandable/collapsible categories
- Bulk select/deselect per category
- Overall permission count

### 3. User Assignment
- Assign roles to existing users
- Search users by name or email
- Support for multiple user types
- Real-time assignment feedback

### 4. Smart UI
- Responsive card-based layout
- Tab navigation in Admin Panel
- Search and filter functionality
- Loading states and error handling
- Toast notifications for all actions

## Default Mock Roles

When backend is unavailable, these roles are loaded:

### Admin
- Full system access
- Can manage users, roles, and settings

### Teacher
- Can view students and manage attendance
- Can view classroom and timetable

### Accountant
- Can manage fees and payments
- Can view and create payments

## Testing

To test without a backend:

1. Navigate to `/admin`
2. Create a new role:
   - Click "Create Role"
   - Fill in name and description
   - Select permissions
   - Click "Create Role"
3. View role in the grid (refresh page to see mock data)
4. Try editing and deleting roles

## Customization

### Change Mock Data Location

Edit `RoleManagement.jsx`:
```javascript
// Replace mock roles data
setRoles([
  // Your custom mock roles
])
```

### Modify Permission Categories

Edit `PERMISSION_CATEGORIES` in `PermissionsPanel.jsx`:
```javascript
const PERMISSION_CATEGORIES = {
  // Add or remove categories
  'Your Category': ['permission_id_1', 'permission_id_2'],
}
```

### Customize Styling

All components use Tailwind CSS. Modify class names in components to match your brand.

## Troubleshooting

### Components Not Showing
- Ensure you're logged in as an admin user
- Check browser console for errors
- Verify all imports are correct

### API Calls Failing
- Check backend server is running on `http://localhost:5000`
- Verify endpoints are implemented
- Check for CORS issues in browser console

### Mock Data Not Appearing
- Ensure backend endpoint is returning an error
- Check network tab to see API response
- Mock data is intentionally fallback

## Next Steps

1. Implement backend endpoints for role management
2. Integrate with your authentication system
3. Add role-based UI element visibility
4. Set up permission caching for performance
5. Add audit logging for role changes
6. Create role templates for common roles

## Support

For issues or questions, check:
1. [Role Management README](./ROLE_MANAGEMENT_README.md)
2. Component JSDoc comments
3. API service documentation in `rolesApi.js`
