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
    <header className="bg-card-white shadow-sm border-b border-gray-100 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-left gap-2 lg:hidden ml-2">
          <img src="/logo.png" alt="Esync Logo" className="w-30 h-20 object-contain ml-4" />
        </div>
        
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue focus:border-2"
            />
          </div>
        </div>
        
        {/* Hamburger menu button for mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} className="text-text-dark" />
        </button>
      </div>
    </header>
  )
}

export default Header
