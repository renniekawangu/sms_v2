import { Search, Mic, LogOut, User, Menu } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'

function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      success('Logged out successfully')
      navigate('/login')
    } catch (error) {
      // Even if logout fails, clear local state
      navigate('/login')
    }
  }

  return (
    <header className="bg-card-white shadow-sm border-b border-gray-100 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          </div>
        </div>
        
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue focus:border-2"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Logout button - visible on mobile */}
          <button
            onClick={handleLogout}
            className="md:hidden p-2 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-600 transition-colors flex-shrink-0"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        
          {/* Hamburger menu button for mobile */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -mr-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu size={20} className="text-text-dark" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
