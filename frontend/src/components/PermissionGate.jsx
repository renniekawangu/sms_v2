import { AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

/**
 * Component to conditionally render content based on permissions
 * @param {string|string[]} permission - Single permission or array of permissions
 * @param {boolean} requireAll - If true, requires all permissions; if false, requires any
 * @param {React.ReactNode} children - Content to render if permission granted
 * @param {React.ReactNode} fallback - Content to render if permission denied (optional)
 */
export function PermissionGate({
  permission,
  requireAll = false,
  children,
  fallback = null
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth()

  let hasAccess = false

  if (Array.isArray(permission)) {
    hasAccess = requireAll 
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission)
  } else {
    hasAccess = hasPermission(permission)
  }

  if (hasAccess) {
    return children
  }

  return fallback || (
    <div className="flex items-center justify-center p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center space-x-2 text-red-600">
        <AlertCircle size={20} />
        <span>You don't have permission to access this content</span>
      </div>
    </div>
  )
}

/**
 * Hook to check permissions
 */
export function usePermission() {
  return useAuth()
}
