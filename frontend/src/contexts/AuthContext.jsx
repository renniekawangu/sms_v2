import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi, AUTH_LOGOUT_EVENT } from '../services/api'
import { ROLE_PERMISSIONS, ROLES, canAccessRoute, requiresSelfAccessOnly } from '../config/rbac'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [permissions, setPermissions] = useState([])

  useEffect(() => {
    let isMounted = true

    const syncUserState = (userData) => {
      if (!isMounted) return
      setUser(userData)
      setPermissions(userData ? (ROLE_PERMISSIONS[userData.role] || []) : [])
    }

    const clearAuthState = () => {
      localStorage.removeItem('user')
      syncUserState(null)
      setLoading(false)
    }

    const restoreSession = async () => {
      const savedUser = localStorage.getItem('user')
      if (!savedUser) {
        setLoading(false)
        return
      }

      try {
        const storedUser = JSON.parse(savedUser)
        const currentUser = await authApi.me()

        const userData = {
          ...storedUser,
          ...currentUser,
          token: storedUser.token,
          email: currentUser.email || storedUser.email,
          name: currentUser.name || storedUser.name || 'User'
        }

        localStorage.setItem('user', JSON.stringify(userData))
        syncUserState(userData)
      } catch (e) {
        clearAuthState()
        return
      }

      setLoading(false)
    }

    const handleUnauthorized = () => {
      clearAuthState()
    }

    window.addEventListener(AUTH_LOGOUT_EVENT, handleUnauthorized)
    restoreSession()

    return () => {
      isMounted = false
      window.removeEventListener(AUTH_LOGOUT_EVENT, handleUnauthorized)
    }
  }, [])

  /**
   * Check if user has a specific permission
   */
  const hasPermissionCheck = useCallback((permission) => {
    if (!user) return false
    if (user.role === ROLES.ADMIN) return true // Admin has all permissions
    return permissions.includes(permission)
  }, [user, permissions])

  /**
   * Check if user has any of the provided permissions
   */
  const hasAnyPermission = useCallback((permissionList) => {
    return permissionList.some(permission => hasPermissionCheck(permission))
  }, [hasPermissionCheck])

  /**
   * Check if user has all of the provided permissions
   */
  const hasAllPermissions = useCallback((permissionList) => {
    return permissionList.every(permission => hasPermissionCheck(permission))
  }, [hasPermissionCheck])

  /**
   * Check if user can access a route
   */
  const canAccess = useCallback((route) => {
    if (!user) return false
    return canAccessRoute(user.role, route)
  }, [user])

  /**
   * Check if a permission requires self-access only
   */
  const isSelfAccessOnly = useCallback((permission) => {
    return requiresSelfAccessOnly(permission)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await authApi.login(email, password)
      
      // Create user object based on role
      const userData = {
        user_id: response.user_id,
        email,
        role: response.role,
        token: response.token,
        name: response.name || 'User'
      }

      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Load permissions based on role using RBAC config
      const rolePermissions = ROLE_PERMISSIONS[userData.role] || []
      setPermissions(rolePermissions)
      
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message || 'Invalid email or password' }
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setPermissions([])
      localStorage.removeItem('user')
    }
  }

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
    permissions,
    hasPermission: hasPermissionCheck,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    isSelfAccessOnly
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
