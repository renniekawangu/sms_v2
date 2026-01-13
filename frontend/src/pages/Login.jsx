import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Mail, Lock, GraduationCap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { success, error: showError } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(email, password)
      
      if (result.success) {
        success('Login successful!')
        navigate('/')
      } else {
        const errorMsg = result.error || 'Login failed'
        setError(errorMsg)
        showError(errorMsg)
      }
    } catch (err) {
      const errorMsg = err.message || 'Login failed'
      setError(errorMsg)
      showError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/logo.png" alt="Esync Logo" className="w-24 h-24 object-contain" />
          </div>
          <h1 className="text-3xl font-semibold text-text-dark mb-2">Edusync</h1>
          <p className="text-text-muted">School Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-card-white rounded-custom shadow-custom p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-text-dark mb-2">Welcome Back</h2>
            <p className="text-text-muted">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-dark mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@school.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-dark mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-blue border-gray-300 rounded focus:ring-primary-blue"
                />
                <span className="ml-2 text-sm text-text-muted">Remember me</span>
              </label>
              <a href="#" className="text-sm text-primary-blue hover:text-primary-blue/80">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-blue text-white py-3 rounded-lg font-medium hover:bg-primary-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-3">
            <p className="text-xs text-text-muted mb-3 font-medium">Demo Credentials:</p>
            
            <div>
              <p className="text-xs font-semibold text-text-dark mb-1">Admin:</p>
              <p className="text-xs text-text-muted">admin@school.com / admin123</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-text-dark mb-1">Teacher:</p>
              <p className="text-xs text-text-muted">emily.chen@school.com / teacher123</p>
              <p className="text-xs text-text-muted">robert.taylor@school.com / teacher123</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-text-dark mb-1">Student:</p>
              <p className="text-xs text-text-muted">student@school.com / student123</p>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-text-dark mb-1">Accounts:</p>
              <p className="text-xs text-text-muted">accountant@school.com / accounts123</p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-text-muted mt-6">
          © 2025 Edusync. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default Login
