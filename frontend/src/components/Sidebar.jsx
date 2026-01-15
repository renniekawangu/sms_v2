import { Link, useLocation } from 'react-router-dom'
import { Grid, GraduationCap, User, Users, School, BookOpen, Calendar, FileText, Award, CheckCircle, DollarSign, CreditCard, TrendingDown, AlertCircle, Settings, UserCog, Lock, X, Search, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'

// Admin menu items
const adminMenuItems = [
  { label: 'Dashboard', icon: Grid, path: '/' },
  { label: 'Admin Panel', icon: Lock, path: '/admin' },
  { label: 'Users & Roles', icon: Users, path: '/roles' },
  { label: 'Users', icon: UserCog, path: '/users' },
  { label: 'Students', icon: GraduationCap, path: '/students' },
  { label: 'Teachers', icon: User, path: '/teachers' },
  { label: 'Staffs', icon: UserCog, path: '/staffs' },
  { label: 'Classrooms', icon: School, path: '/classrooms' },
  { label: 'Subjects', icon: BookOpen, path: '/subjects' },
  { label: 'Timetable', icon: Calendar, path: '/timetable' },
  { label: 'Exams', icon: FileText, path: '/exams' },
  { label: 'Results', icon: Award, path: '/results' },
  { label: 'Attendance', icon: CheckCircle, path: '/attendance' },
  { label: 'Fees', icon: DollarSign, path: '/fees' },
  { label: 'Payments', icon: CreditCard, path: '/payments' },
  { label: 'Expenses', icon: TrendingDown, path: '/expenses' },
  { label: 'Issues', icon: AlertCircle, path: '/issues' },
  { label: 'Settings', icon: Settings, path: '/settings' }
]

// Teacher menu items
const teacherMenuItems = [
  { label: 'Dashboard', icon: Grid, path: '/' },
  { label: 'Classrooms', icon: School, path: '/classrooms' },
  { label: 'Timetable', icon: Calendar, path: '/timetable' },
  { label: 'Attendance', icon: CheckCircle, path: '/attendance' },
  { label: 'Results', icon: Award, path: '/results' }
]

// Student menu items
const studentMenuItems = [
  { label: 'Dashboard', icon: Grid, path: '/' },
  { label: 'Subjects', icon: BookOpen, path: '/subjects' },
  { label: 'Timetable', icon: Calendar, path: '/timetable' },
  { label: 'Attendance', icon: CheckCircle, path: '/attendance' },
  { label: 'Results', icon: Award, path: '/results' },
  { label: 'Issues', icon: AlertCircle, path: '/issues' }
]

// Accounts menu items
const accountsMenuItems = [
  { label: 'Dashboard', icon: Grid, path: '/' },
  { label: 'Students', icon: GraduationCap, path: '/students' },
  { label: 'Fees', icon: DollarSign, path: '/fees' },
  { label: 'Payments', icon: CreditCard, path: '/payments' },
  { label: 'Expenses', icon: TrendingDown, path: '/expenses' },
  { label: 'Settings', icon: Settings, path: '/settings' }
]

// Head Teacher menu items
const headTeacherMenuItems = [
  { label: 'Dashboard', icon: Grid, path: '/' },
  { label: 'Students', icon: GraduationCap, path: '/students' },
  { label: 'Subjects', icon: BookOpen, path: '/subjects' },
  { label: 'Staffs', icon: UserCog, path: '/staffs' },
  { label: 'Attendance', icon: CheckCircle, path: '/attendance' },
  { label: 'Results', icon: Award, path: '/results' }
]

// Parent menu items
const parentMenuItems = [
  { label: 'Dashboard', icon: Grid, path: '/' },
  { label: 'My Children', icon: Users, path: '/children' },
  { label: 'Fees & Payments', icon: DollarSign, path: '/fees' }
]

function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { success } = useToast()
  const navigate = useNavigate()
  const userRole = user?.role || 'admin'

  const handleLogout = async () => {
    try {
      await logout()
      success('Logged out successfully')
      navigate('/login')
    } catch (error) {
      navigate('/login')
    }
  }

  // Get menu items based on role
  let menuItems = []
  if (userRole === 'admin') {
    menuItems = adminMenuItems
  } else if (userRole === 'teacher') {
    menuItems = teacherMenuItems
  } else if (userRole === 'student') {
    menuItems = studentMenuItems
  } else if (userRole === 'accounts') {
    menuItems = accountsMenuItems
  } else if (userRole === 'head-teacher') {
    menuItems = headTeacherMenuItems
  } else if (userRole === 'parent') {
    menuItems = parentMenuItems
  }

  const handleLinkClick = () => {
    if (onClose) onClose()
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
        fixed lg:static inset-y-0 left-0 z-50
        w-[260px] bg-card-white shadow-custom flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Esync Logo" className="w-40 h-24 object-contain" />
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X size={24} className="text-text-dark" />
          </button>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border-l-4 ${
                      isActive
                        ? 'bg-primary-blue text-white border-l-white'
                        : 'text-text-muted hover:bg-gray-50 hover:text-text-dark border-l-transparent hover:border-l-primary-blue'
                    }`}
                  >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
              )
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
