import { Link, useLocation } from 'react-router-dom'
import { Grid, GraduationCap, User, Users, School, BookOpen, Calendar, FileText, Award, CheckCircle, DollarSign, CreditCard, TrendingDown, AlertCircle, Settings, UserCog, Lock, X, Search, LogOut, Mail, BarChart3 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { teacherApi } from '../services/api'
import { ROLES, ROUTE_ACCESS } from '../config/rbac'

/**
 * Role-based menu items definition
 * Only shows items that the user's role can access
 * Based on ROUTE_ACCESS from rbac.js config
 */
const allMenuItems = {
  dashboard: { label: 'Dashboard', icon: Grid, path: '/', roles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.HEAD_TEACHER, ROLES.STUDENT, ROLES.ACCOUNTS, ROLES.PARENT] },
  adminPanel: { label: 'Admin Panel', icon: Lock, path: '/admin', roles: [ROLES.ADMIN] },
  roles: { label: 'Users & Roles', icon: Users, path: '/roles', roles: [ROLES.ADMIN] },
  users: { label: 'Users', icon: UserCog, path: '/users', roles: [ROLES.ADMIN] },
  students: { label: 'Students', icon: GraduationCap, path: '/students', roles: [ROLES.ADMIN] },
  parents: { label: 'Parents', icon: Users, path: '/parents', roles: [ROLES.ADMIN] },
  teachers: { label: 'Teachers', icon: User, path: '/teachers', roles: [ROLES.ADMIN] },
  staffs: { label: 'Staffs', icon: UserCog, path: '/staffs', roles: [ROLES.ADMIN] },
  classrooms: { label: 'Classrooms', icon: School, path: '/classrooms', roles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.HEAD_TEACHER] },
  subjects: { label: 'Subjects', icon: BookOpen, path: '/subjects', roles: [ROLES.ADMIN, ROLES.HEAD_TEACHER] },
  timetable: { label: 'Timetable', icon: Calendar, path: '/timetable', roles: [ROLES.ADMIN, ROLES.HEAD_TEACHER, ROLES.STUDENT] },
  exams: { label: 'Exams', icon: FileText, path: '/exams', roles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.HEAD_TEACHER] },
  results: { label: 'Results', icon: Award, path: '/results', roles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.HEAD_TEACHER] },
  resultsApproval: { label: 'Results Approval', icon: CheckCircle, path: '/results-approval', roles: [ROLES.ADMIN, ROLES.HEAD_TEACHER] },
  attendance: { label: 'Attendance', icon: CheckCircle, path: '/attendance', roles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.HEAD_TEACHER] },
  fees: { label: 'Fees', icon: DollarSign, path: '/fees', roles: [ROLES.ADMIN, ROLES.ACCOUNTS, ROLES.HEAD_TEACHER] },
  payments: { label: 'Payments', icon: CreditCard, path: '/payments', roles: [ROLES.ADMIN, ROLES.ACCOUNTS, ROLES.HEAD_TEACHER] },
  financialReports: { label: 'Financial Reports', icon: BarChart3, path: '/financial-reports', roles: [ROLES.ADMIN, ROLES.ACCOUNTS, ROLES.HEAD_TEACHER] },
  expenses: { label: 'Expenses', icon: TrendingDown, path: '/expenses', roles: [ROLES.ADMIN, ROLES.ACCOUNTS] },
  issues: { label: 'Issues', icon: AlertCircle, path: '/issues', roles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT, ROLES.HEAD_TEACHER, ROLES.ACCOUNTS] },
  messages: { label: 'Messages', icon: Mail, path: '/messages', roles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT, ROLES.PARENT, ROLES.HEAD_TEACHER, ROLES.ACCOUNTS] },
  reports: { label: 'Reports', icon: BarChart3, path: '/reports', roles: [ROLES.ADMIN, ROLES.HEAD_TEACHER] },
  settings: { label: 'Settings', icon: Settings, path: '/settings', roles: [ROLES.ADMIN] },
  children: { label: 'My Children', icon: Users, path: '/children', roles: [ROLES.PARENT, ROLES.ADMIN] }
}

/**
 * Get menu items filtered by user role
 * Only returns items accessible to the user's role
 */
function getMenuItemsForRole(role) {
  return Object.values(allMenuItems).filter(item => 
    item.roles.includes(role) || role === ROLES.ADMIN // Admin can see all items
  )
}

function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()
  const userRole = user?.role || ROLES.ADMIN
  const [teacherClassroomId, setTeacherClassroomId] = useState(null)

  // Fetch teacher's classroom on component mount
  useEffect(() => {
    if (userRole === ROLES.TEACHER) {
      const fetchTeacherClassroom = async () => {
        try {
          const classrooms = await teacherApi.getMyClassrooms()
          const classroomList = classrooms.data || classrooms || []
          if (classroomList.length === 1) {
            setTeacherClassroomId(classroomList[0]._id)
          }
        } catch (err) {
          console.error('Failed to fetch teacher classroom:', err)
        }
      }
      fetchTeacherClassroom()
    }
  }, [userRole])

  const handleLogout = async () => {
    try {
      await logout()
      success('Logged out successfully')
      navigate('/login')
    } catch (error) {
      navigate('/login')
    }
  }

  // Get menu items based on user role
  // Only show items that the user's role has access to
  const menuItems = getMenuItemsForRole(userRole)

  const handleLinkClick = () => {
    if (onClose) onClose()
  }

  // Helper function to get the correct path for menu items
  const getMenuItemPath = (item) => {
    if (userRole === ROLES.TEACHER && item.label === 'Classrooms' && teacherClassroomId) {
      return `/classrooms/${teacherClassroomId}`
    }
    return item.path
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-card-white shadow-custom flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        h-screen md:h-auto overflow-y-auto
      `}>
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/logo.png" alt="Esync Logo" className="w-32 sm:w-40 h-20 sm:h-24 object-contain" />
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Close menu"
          >
            <X size={20} className="text-text-dark" />
          </button>
        </div>
        <nav className="flex-1 p-2 sm:p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const itemPath = getMenuItemPath(item)
              const isActive = location.pathname === itemPath
              return (
                <li key={item.label}>
                  <Link
                    to={itemPath}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors border-l-4 text-sm sm:text-base ${
                      isActive
                        ? 'bg-primary-blue text-white border-l-white'
                        : 'text-text-muted hover:bg-gray-50 hover:text-text-dark border-l-transparent hover:border-l-primary-blue'
                    }`}
                  >
                  <Icon size={18} className="flex-shrink-0" />
                  <span className="font-medium hidden sm:inline">{item.label}</span>
                  <span className="font-medium sm:hidden truncate">{item.label}</span>
                </Link>
              </li>
              )
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none text-sm sm:text-base"
          >
            <LogOut size={18} className="flex-shrink-0" />
            <span className="font-medium hidden sm:inline">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
