# Admin UI - Role Management System

## Overview

The Admin UI provides a comprehensive role management system for the Edusync school management platform. It allows administrators to:

- Create, update, and delete custom roles
- Assign permissions to roles with granular control
- Manage user-to-role assignments
- View and manage permissions across the system

## Features

### 1. **Role Management Page** (`/roles`)
   - **View All Roles**: Display all available roles in a card-based grid layout
   - **Search Roles**: Filter roles by name or description
   - **Create Roles**: Add new roles with custom permissions
   - **Edit Roles**: Modify existing roles and their permissions
   - **Delete Roles**: Remove roles from the system
   - **View Details**: See complete role information and permission list

### 2. **Admin Panel** (`/admin`)
   - Tabbed interface with three main sections:
     - **Role Management Tab**: Main role CRUD operations
     - **User Assignment Tab**: Assign roles to users
     - **Permissions Tab**: View all available permissions organized by category

### 3. **User Role Assignment Component**
   - Assign existing roles to users
   - Search users by name or email
   - Support for multiple user types (students, teachers, accounts)
   - Real-time role assignment with visual feedback

### 4. **Permissions Management**
   - 11 permission categories:
     - Dashboard
     - Users
     - Students
     - Teachers
     - Classrooms
     - Attendance
     - Fees
     - Payments
     - Expenses
     - Reports
     - Settings
   - Expandable/collapsible category structure
   - Select all/deselect all functionality
   - Visual permission count display

## File Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── RoleManagement.jsx      # Main role management page
│   │   └── AdminPanel.jsx           # Admin dashboard with tabs
│   ├── components/
│   │   ├── RoleForm.jsx            # Role creation/editing form
│   │   ├── PermissionsPanel.jsx    # Permissions selector component
│   │   └── UserRoleAssignment.jsx  # User-to-role assignment UI
│   └── services/
│       └── rolesApi.js             # Role management API service
```

## Available Permissions

### By Category:

**Dashboard**
- view_dashboard

**Users**
- view_users
- create_user
- edit_user
- delete_user

**Students**
- view_students
- create_student
- edit_student
- delete_student

**Teachers**
- view_teachers
- create_teacher
- edit_teacher
- delete_teacher

**Classrooms**
- view_classrooms
- create_classroom
- edit_classroom
- delete_classroom

**Attendance**
- view_attendance
- create_attendance

**Fees**
- view_fees
- manage_fees

**Payments**
- view_payments
- create_payment

**Expenses**
- view_expenses
- manage_expenses

**Reports**
- view_reports

**Settings**
- view_settings
- manage_settings

## Component Details

### RoleForm Component

**Props:**
- `role`: Current role object (null for create mode)
- `onSubmit`: Callback function with form data
- `onCancel`: Callback for cancel action
- `isLoading`: Boolean for loading state

**Features:**
- Role name input
- Description textarea
- Permission selection with category grouping
- Select all/deselect all buttons
- Form validation

### PermissionsPanel Component

**Props:**
- `permissions`: Array of selected permission IDs
- `onPermissionsChange`: Callback with updated permissions

**Features:**
- Category-based permission organization
- Expandable/collapsible categories
- Single and bulk permission selection
- Permission count display

### UserRoleAssignment Component

**Features:**
- User list with search
- Role dropdown for assignment
- Edit/Save/Cancel actions
- User type badges
- Statistics display

## API Integration

The `rolesApi` service provides the following methods:

```javascript
rolesApi.list()              // Get all roles
rolesApi.get(roleId)         // Get single role
rolesApi.create(data)        // Create new role
rolesApi.update(roleId, data) // Update role
rolesApi.delete(roleId)      // Delete role
rolesApi.getPermissions(roleId) // Get role permissions
rolesApi.updatePermissions(roleId, permissions) // Update permissions
rolesApi.assignToUser(userId, roleId) // Assign role to user
```

## Backend Requirements

The following backend endpoints are expected:

- `GET /api/admin/roles` - List all roles
- `GET /api/admin/roles/:id` - Get single role
- `POST /api/admin/roles` - Create role
- `PUT /api/admin/roles/:id` - Update role
- `DELETE /api/admin/roles/:id` - Delete role
- `GET /api/admin/roles/:id/permissions` - Get role permissions
- `PUT /api/admin/roles/:id/permissions` - Update role permissions
- `PUT /api/admin/users/:userId/role` - Assign role to user

## Usage Examples

### Creating a New Role

1. Navigate to `/admin` or `/roles`
2. Click "Create Role" button
3. Enter role name and description
4. Select permissions from categories
5. Click "Create Role"

### Assigning a Role to User

1. Navigate to `/admin` and select "User Assignment" tab
2. Find user in the list or search for them
3. Click "Assign" next to the user
4. Select desired role from dropdown
5. Click "Save"

### Managing Permissions

1. Navigate to `/admin` and select "Permissions" tab
2. View all available permissions organized by category
3. Expand/collapse categories to view specific permissions
4. Use "Select All" to enable all permissions at once

## Styling

All components use Tailwind CSS with custom design tokens:
- Primary blue: `primary-blue`
- Text colors: `text-dark`, `text-muted`
- Card background: `card-white`
- Background: `background-light`

## States and Edge Cases

### Loading States
- Skeleton loader during data fetching
- Disabled buttons during submission

### Empty States
- Default mock data displayed if API unavailable
- "No roles found" message when search returns no results
- "No users found" message in user assignment

### Error Handling
- Toast notifications for all errors
- Graceful fallbacks to mock data
- Session expiration redirects to login

## Future Enhancements

- [ ] Role templates (predefined role sets)
- [ ] Bulk user role assignment
- [ ] Role hierarchy/inheritance
- [ ] Permission audit logs
- [ ] Role analytics and usage statistics
- [ ] Integration with external identity providers
- [ ] Advanced filtering and sorting options
- [ ] Export role configurations
