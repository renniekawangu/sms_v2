import { Search, ShieldCheck, LogOut, Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../services/api'
import { ROLES } from '../config/rbac'
import { useDebounce } from '../utils/debounce'

function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()
  const isAdmin = user?.role === ROLES.ADMIN
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const debouncedQuery = useDebounce(searchQuery, 300)

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

  useEffect(() => {
    const runSearch = async () => {
      if (!isAdmin || !debouncedQuery.trim()) {
        setSearchResults([])
        setShowResults(false)
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      try {
        const response = await adminApi.search(debouncedQuery.trim())
        const results = [
          ...(response.students || []).map((student) => ({ ...student, type: 'student' })),
          ...(response.staff || []).map((staffMember) => ({ ...staffMember, type: staffMember.role || 'staff' })),
          ...(response.users || []).map((appUser) => ({ ...appUser, type: appUser.role || 'user' }))
        ]

        setSearchResults(results.slice(0, 10))
        setShowResults(true)
      } catch (err) {
        console.error('Search error:', err)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    runSearch()
  }, [debouncedQuery, isAdmin])

  const handleSearchChange = (query) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
    }
  }

  const handleViewUser = (result) => {
    navigate(`/search-results/${result._id}?type=${result.type}`)
    setSearchQuery('')
    setShowResults(false)
  }

  const greetingName = user?.name?.split(' ')[0] || 'Team'

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4 sm:pt-4 lg:px-6">
      <div className="surface-card surface-card-strong border border-white/70 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onMenuClick}
              className="md:hidden inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 p-2.5 text-slate-700 shadow-sm transition hover:bg-white"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f9d8a,#0a7d6d)] shadow-[0_12px_24px_rgba(15,157,138,0.24)]">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                <ShieldCheck size={14} className="text-primary-blue" />
                Unified School Workspace
              </div>
              <p className="mt-1 truncate font-display text-lg font-semibold text-slate-900 sm:text-xl">
                Welcome back, {greetingName}
              </p>
              <p className="truncate text-sm text-slate-500">
                Stay on top of students, reports, finance, and daily operations.
              </p>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-3">
            <div className="hidden md:block w-full max-w-xl">
              {isAdmin && (
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search students, staff, and users..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => searchQuery && setShowResults(true)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3 pl-11 pr-4 text-sm text-slate-700 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-primary-blue focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  />

                  {showResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_48px_rgba(15,23,42,0.14)] z-50">
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={() => handleViewUser(result)}
                          className="w-full border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-0 hover:bg-emerald-50/60"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-800">
                                {result.firstName ? `${result.firstName} ${result.lastName}` : result.name}
                              </p>
                              <p className="truncate text-xs text-slate-500">{result.email}</p>
                              {result.phone && <p className="truncate text-xs text-slate-400">{result.phone}</p>}
                            </div>
                            <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                              {result.type}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {showResults && searchQuery && searchResults.length === 0 && !isSearching && (
                    <div className="absolute top-full left-0 right-0 mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500 shadow-[0_28px_48px_rgba(15,23,42,0.14)] z-50">
                      No matching users found
                    </div>
                  )}

                  {isSearching && (
                    <div className="absolute top-full left-0 right-0 mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500 shadow-[0_28px_48px_rgba(15,23,42,0.14)] z-50">
                      Searching records...
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0f9d8a,#0a7d6d)] text-sm font-bold text-white">
                {greetingName.charAt(0).toUpperCase()}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</p>
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{user?.role || 'member'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-2xl border border-red-100 bg-white/80 p-2.5 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
