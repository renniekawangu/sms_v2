import { Search, Mic, LogOut, User, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'
import { studentsApi, teachersApi, adminApi } from '../services/api'

function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

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

  const handleSearch = async (query) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    try {
      const queryLower = query.toLowerCase()
      const results = []

      try {
        const students = await studentsApi.list()
        const studentArray = Array.isArray(students) ? students : students.data || []
        const studentMatches = studentArray.filter(s => 
          s.firstName?.toLowerCase().includes(queryLower) ||
          s.lastName?.toLowerCase().includes(queryLower) ||
          s.email?.toLowerCase().includes(queryLower) ||
          s.phone?.includes(query) ||
          s._id?.toString().includes(query)
        )
        results.push(...studentMatches.map(s => ({ ...s, type: 'student' })))
      } catch (err) {
        console.error('Error fetching students:', err)
      }

      try {
        const teachers = await teachersApi.list()
        const teacherArray = Array.isArray(teachers) ? teachers : teachers.data || []
        const teacherMatches = teacherArray.filter(t => 
          t.name?.toLowerCase().includes(queryLower) ||
          t.email?.toLowerCase().includes(queryLower) ||
          t.phone?.includes(query) ||
          t._id?.toString().includes(query)
        )
        results.push(...teacherMatches.map(t => ({ ...t, type: 'teacher' })))
      } catch (err) {
        console.error('Error fetching teachers:', err)
      }

      try {
        const staffResponse = await adminApi.listStaff()
        const staffArray = Array.isArray(staffResponse) ? staffResponse : staffResponse.data || []
        const staffMatches = staffArray.filter(s => 
          s.name?.toLowerCase().includes(queryLower) ||
          s.email?.toLowerCase().includes(queryLower) ||
          s.phone?.includes(query) ||
          s._id?.toString().includes(query)
        )
        results.push(...staffMatches.map(s => ({ ...s, type: s.role || 'staff' })))
      } catch (err) {
        console.error('Error fetching staff:', err)
      }

      setSearchResults(results.slice(0, 10))
      setShowResults(true)
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleViewUser = (result) => {
    navigate('/search-results', { state: { userId: result._id, userType: result.type, user: result } })
    setSearchQuery('')
    setShowResults(false)
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
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery && setShowResults(true)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue focus:border-2"
            />
            
            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleViewUser(result)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-800">
                          {result.firstName ? `${result.firstName} ${result.lastName}` : result.name}
                        </p>
                        <p className="text-xs text-gray-500">{result.email}</p>
                        {result.phone && <p className="text-xs text-gray-500">{result.phone}</p>}
                      </div>
                      <span className="ml-2 text-xs font-medium bg-primary-blue text-white px-2 py-1 rounded capitalize">
                        {result.type}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showResults && searchQuery && searchResults.length === 0 && !isSearching && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                <p className="text-center text-gray-500 text-sm">No users found</p>
              </div>
            )}

            {isSearching && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                <p className="text-center text-gray-500 text-sm">Searching...</p>
              </div>
            )}
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
