import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Authorization matrix from API contract
const authorizationMatrix = {
  admin: ['*'],
  teacher: ['view:students', 'manage:attendance', 'manage:results', 'view:timetable'],
  student: ['view:results', 'view:attendance', 'view:timetable', 'create:issues'],
  accounts: ['manage:fees', 'manage:payments', 'manage:expenses', 'view:students']
}

function ProtectedRoute({ children, requiredRole, requiredPermission }) {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check role-based access (supports both single string and array of roles)
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!allowedRoles.includes(user?.role)) {
      return <Navigate to="/" replace />
    }
  }

  // Check permission-based access
  if (requiredPermission && user?.role) {
    const userPermissions = authorizationMatrix[user.role] || []
    const hasPermission = userPermissions.includes('*') || userPermissions.includes(requiredPermission)
    if (!hasPermission) {
      return <Navigate to="/" replace />
    }
  }

  return children
}

export default ProtectedRoute
