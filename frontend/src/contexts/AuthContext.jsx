import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../services/api'
import { DEFAULT_ROLE_PERMISSIONS, ROLES } from '../config/permissions'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [permissions, setPermissions] = useState([])

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        
        // Load permissions based on role
        const rolePermissions = DEFAULT_ROLE_PERMISSIONS[userData.role] || []
        setPermissions(rolePermissions)
      } catch (e) {
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useCallback((permission) => {
    if (!user) return false
    if (user.role === ROLES.ADMIN) return true // Admin has all permissions
    return permissions.includes(permission)
  }, [user, permissions])

  /**
   * Check if user has any of the provided permissions
   */
  const hasAnyPermission = useCallback((permissionList) => {
    return permissionList.some(permission => hasPermission(permission))
  }, [hasPermission])

  /**
   * Check if user has all of the provided permissions
   */
  const hasAllPermissions = useCallback((permissionList) => {
    return permissionList.every(permission => hasPermission(permission))
  }, [hasPermission])

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
      
      // Load permissions based on role
      const rolePermissions = DEFAULT_ROLE_PERMISSIONS[userData.role] || []
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
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
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
