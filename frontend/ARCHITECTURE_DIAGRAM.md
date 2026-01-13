```
ADMIN UI - ROLE MANAGEMENT SYSTEM
Architecture & Component Relationships

┌─────────────────────────────────────────────────────────────────┐
│                        App.jsx                                   │
│         (Main application router and context providers)         │
└─────────────────┬───────────────────┬──────────────────────────┘
                  │                   │
         ┌────────▼────────┐  ┌──────▼─────────────┐
         │   AdminPanel    │  │  RoleManagement   │
         │    (/admin)     │  │    (/roles)       │
         └────┬────┬────┬──┘  └──────────┬────────┘
              │    │    │              │
              │    │    └──────┬───────┘
              │    │           │
    ┌─────────▼────▼─────┬─────▼──────────────┐
    │  Tabbed Interface  │   Grid Display    │
    └────┬────┬────┬─────┴─────┬──────────────┘
         │    │    │           │
    ┌────▼──┐ │    │      ┌────▼──────────────┐
    │ Roles │ │    │      │  Role Cards      │
    │ Tab   │ │    │      └────┬──────────────┘
    └───────┘ │    │           │
              │    │      ┌────▼──────────────┐
         ┌────▼──┐ │      │  Modal Dialogs   │
         │Users  │ │      ├────┬─────────────┤
         │Assign │ │      │View│  Create/Edit│
         │Tab    │ │      └────▴─────────────┘
         └───────┘ │
              ┌────▼──────────────┐
              │Permissions Tab    │
              └───────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                   COMPONENT HIERARCHY                             │
└──────────────────────────────────────────────────────────────────┘

AdminPanel (Container)
├── TabNavigation (6 tabs)
│
└── Content Area (Tab-based)
    │
    ├── RoleManagement Page (when /roles tab active)
    │   │
    │   ├── SearchBar
    │   │   └── Input + Search Icon
    │   │
    │   └── RoleGrid
    │       └── RoleCard[] (repeating)
    │           ├── Role Header (name, icon)
    │           ├── Permissions Preview
    │           └── Action Buttons
    │               ├── View → ViewDetailsModal
    │               │           └── RoleDetails
    │               ├── Edit → RoleFormModal
    │               │           └── RoleForm
    │               └── Delete
    │
    ├── UserRoleAssignment (when /assignment tab active)
    │   │
    │   ├── SearchBar
    │   │   └── User Search
    │   │
    │   ├── UsersTable
    │   │   ├── TableHeader
    │   │   └── TableRow[]
    │   │       ├── User Info
    │   │       ├── User Type Badge
    │   │       ├── Role Selector (inline editable)
    │   │       └── Action Buttons
    │   │
    │   └── StatsCards
    │       ├── Total Users Card
    │       ├── Available Roles Card
    │       └── Filtered Results Card
    │
    └── PermissionsPanel (when /permissions tab active)
        │
        └── PermissionCategories[]
            └── PermissionCategory (expandable)
                ├── Category Header
                │   ├── Checkbox (select all in category)
                │   └── Toggle Icon
                │
                └── PermissionsList (when expanded)
                    └── PermissionItem[]
                        ├── Checkbox
                        └── Permission Name

┌──────────────────────────────────────────────────────────────────┐
│                   COMPONENT DATA FLOW                             │
└──────────────────────────────────────────────────────────────────┘

1. ROLE MANAGEMENT FLOW
   ┌──────────────────┐
   │ RoleManagement   │
   │ (state: roles)   │
   └────────┬─────────┘
            │
            ├─ loadRoles() ──────────────────────┐
            │                                    │
            │                       ┌────────────▼──────┐
            │                       │   rolesApi.list() │
            │                       │  (or mock data)   │
            │                       └────────────┬──────┘
            │                                    │
            │                       ┌────────────▼──────┐
            │                       │  setRoles(data)  │
            │                       └────────────┬──────┘
            │                                    │
            │                       ┌────────────▼──────┐
            │  ◄───────────────────│  Render RoleGrid │
            │                       └──────────────────┘
            │
            ├─ handleCreateRole()
            │  └─ rolesApi.create(data)
            │     └─ success toast → loadRoles()
            │
            ├─ handleEditClick()
            │  └─ setSelectedRole() → openModal
            │
            ├─ handleUpdateRole()
            │  └─ rolesApi.update(roleId, data)
            │     └─ success toast → loadRoles()
            │
            └─ handleDeleteRole()
               └─ rolesApi.delete(roleId)
                  └─ success toast → loadRoles()

2. USER ASSIGNMENT FLOW
   ┌──────────────────────┐
   │ UserRoleAssignment   │
   │ (state: users,roles) │
   └────────┬─────────────┘
            │
            ├─ loadData()
            │  ├─ rolesApi.list() → setRoles()
            │  └─ [students, teachers, accounts].list()
            │     └─ setUsers() + initializeSelectedRoles()
            │
            └─ handleAssignRole(userId)
               └─ rolesApi.assignToUser(userId, roleId)
                  └─ success toast → loadData()

3. PERMISSIONS FLOW
   ┌──────────────────────┐
   │ PermissionsPanel     │
   │ (props: permissions) │
   └────────┬─────────────┘
            │
            ├─ handlePermissionToggle(permId)
            │  └─ onPermissionsChange([...])
            │
            ├─ handleCategoryToggle(category)
            │  └─ onPermissionsChange([...])
            │
            └─ handleSelectAll()
               └─ onPermissionsChange([...])

┌──────────────────────────────────────────────────────────────────┐
│                   API SERVICE METHODS                             │
└──────────────────────────────────────────────────────────────────┘

rolesApi Service
│
├── list()                    ➜ GET /api/admin/roles
│   └── Returns: { roles: [...] }
│
├── get(roleId)              ➜ GET /api/admin/roles/:id
│   └── Returns: { role_id, name, description, permissions, ... }
│
├── create(data)             ➜ POST /api/admin/roles
│   ├── Input: { name, description, permissions }
│   └── Returns: created role object
│
├── update(roleId, data)     ➜ PUT /api/admin/roles/:id
│   ├── Input: { name, description, permissions }
│   └── Returns: updated role object
│
├── delete(roleId)           ➜ DELETE /api/admin/roles/:id
│   └── Returns: success message
│
├── getPermissions(roleId)   ➜ GET /api/admin/roles/:id/permissions
│   └── Returns: { permissions: [...] }
│
├── updatePermissions(roleId, permissions)
│   │                        ➜ PUT /api/admin/roles/:id/permissions
│   ├── Input: { permissions: [...] }
│   └── Returns: updated permissions
│
└── assignToUser(userId, roleId)
                             ➜ PUT /api/admin/users/:userId/role
    ├── Input: { role_id }
    └── Returns: assignment confirmation

┌──────────────────────────────────────────────────────────────────┐
│                   MODALS & DIALOGS                                │
└──────────────────────────────────────────────────────────────────┘

1. Create/Edit Role Modal
   ├── Opens when: "Create Role" or "Edit" clicked
   ├── Contains: RoleForm component
   ├── Form Fields:
   │  ├── Role Name (required)
   │  ├── Description (optional)
   │  └── Permissions Selector
   │      ├── Categorized checkboxes
   │      ├── Select All button per category
   │      └── Count display
   ├── Actions:
   │  ├── Cancel
   │  └── Create/Update (Submit)
   └── Closes: On success or cancel

2. View Role Details Modal
   ├── Opens when: "View" clicked
   ├── Displays:
   │  ├── Role Name (read-only)
   │  ├── Description (read-only)
   │  ├── All Permissions (as tags)
   │  └── Creation Date
   ├── Actions:
   │  └── Edit Role (opens edit modal)
   └── Closes: On close button

3. Delete Confirmation
   ├── Triggered: On delete action
   ├── Message: "Are you sure?" confirmation
   ├── Actions:
   │  ├── Confirm → execute delete
   │  └── Cancel → close
   └── Closes: On either action

┌──────────────────────────────────────────────────────────────────┐
│                   STATE MANAGEMENT                                │
└──────────────────────────────────────────────────────────────────┘

RoleManagement Component State:
├── roles: Role[] - List of all roles
├── loading: boolean - Loading state
├── searchQuery: string - Search input
├── isModalOpen: boolean - Modal visibility
├── selectedRole: Role | null - Editing role
├── isFormLoading: boolean - Form submission state
├── modalMode: 'create' | 'edit' - Modal type
└── viewDetailsRole: Role | null - Details modal role

UserRoleAssignment Component State:
├── users: User[] - List of all users
├── roles: Role[] - List of roles
├── loading: boolean - Loading state
├── searchQuery: string - Search input
├── editingUserId: number | null - Currently editing user
└── selectedRoles: { [userId]: roleId } - Role assignments

PermissionsPanel Component State:
├── permissions: string[] - Selected permissions (from props)
└── expandedCategories: { [category]: boolean } - Expanded state

┌──────────────────────────────────────────────────────────────────┐
│                   ERROR HANDLING & FALLBACKS                      │
└──────────────────────────────────────────────────────────────────┘

Error Flow:
API Call
├── Success ✓
│   ├── Update state
│   ├── Show success toast
│   └── Refresh data
│
└── Error ✗
    ├── Check if Mock Data Available
    │   ├── Yes: Use mock data
    │   │   └── Show warning in console
    │   │
    │   └── No: Show error toast
    │       ├── Log error to console
    │       └── Optional: Retry button
    │
    └── Session Expiration (401)
        └── Redirect to /login

┌──────────────────────────────────────────────────────────────────┐
│                   KEY FILES AT A GLANCE                           │
└──────────────────────────────────────────────────────────────────┘

File                           Lines  Purpose
─────────────────────────────────────────────────────────────────
src/pages/AdminPanel.jsx       ~100   Main admin dashboard
src/pages/RoleManagement.jsx   ~450   Role management page
src/components/RoleForm.jsx    ~200   Role form component
src/components/PermissionsPanel.jsx ~300  Permissions UI
src/components/UserRoleAssignment.jsx ~350  User assignment
src/services/rolesApi.js       ~100   API service layer
src/App.jsx                    ~237   Router with new routes
src/components/Sidebar.jsx     ~150   Updated with admin menu

Total New Code: ~1,900 lines
```

## Integration Summary

The role management system is fully integrated into the Edusync frontend:

1. **Routes**: Added `/admin` and updated `/roles`
2. **Navigation**: "Admin Panel" menu item in sidebar
3. **Context**: Uses existing AuthContext and ToastContext
4. **API**: New rolesApi service with fallback mock data
5. **Styling**: Uses existing Tailwind configuration
6. **Access Control**: Protected by ProtectedRoute (admin only)

All components follow React best practices and the existing codebase patterns.
