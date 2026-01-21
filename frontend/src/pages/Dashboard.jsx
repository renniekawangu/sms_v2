import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { Link } from 'react-router-dom'
import { GraduationCap, User, Users, School, FileText, Award, DollarSign, Calendar, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { studentsApi, teachersApi, classroomsApi, examsApi, feesApi, expensesApi, issuesApi, parentsApi } from '../services/api'

// Admin Dashboard
function AdminDashboard() {
  const { schoolSettings, currentAcademicYear } = useSettings()
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classrooms: 0,
    exams: 0,
    totalFees: 0,
    totalExpenses: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [students, teachers, classrooms, exams, fees, expenses] = await Promise.all([
        studentsApi.list(),
        teachersApi.list(),
        classroomsApi.list(),
        examsApi.list(),
        feesApi.list(),
        expensesApi.list()
      ])
      
      const totalFees = fees.reduce((sum, f) => sum + f.amount, 0)
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
      
      setStats({
        students: students.length,
        teachers: teachers.length,
        classrooms: classrooms.length,
        exams: exams.length,
        totalFees,
        totalExpenses
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-dark">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-text-muted mt-1">Overview of the school management system</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <Link to="/roles" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow border-t-4 border-t-primary-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">Users & Roles</p>
              <p className="text-3xl font-semibold text-text-dark">Manage</p>
            </div>
            <Users className="text-primary-blue" size={40} />
          </div>
        </Link>

        <Link to="/students" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow border-t-4 border-t-primary-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">Students</p>
              <p className="text-3xl font-semibold text-text-dark">{stats.students}</p>
            </div>
            <GraduationCap className="text-primary-blue" size={40} />
          </div>
        </Link>

        <Link to="/teachers" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow border-t-4 border-t-primary-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">Teachers</p>
              <p className="text-3xl font-semibold text-text-dark">{stats.teachers}</p>
            </div>
            <User className="text-primary-blue" size={40} />
          </div>
        </Link>

        <Link to="/classrooms" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow border-t-4 border-t-primary-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">Classrooms</p>
              <p className="text-3xl font-semibold text-text-dark">{stats.classrooms}</p>
            </div>
            <School className="text-primary-blue" size={40} />
          </div>
        </Link>

        <Link to="/exams" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow border-t-4 border-t-primary-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">Exams</p>
              <p className="text-3xl font-semibold text-text-dark">{stats.exams}</p>
            </div>
            <FileText className="text-primary-blue" size={40} />
          </div>
        </Link>

        <Link to="/fees" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow border-t-4 border-t-primary-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">Total Fees</p>
              <p className="text-3xl font-semibold text-text-dark">K{stats.totalFees}</p>
            </div>
            <DollarSign className="text-primary-blue" size={40} />
          </div>
        </Link>

        <Link to="/expenses" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow border-t-4 border-t-primary-blue">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted mb-1">Total Expenses</p>
              <p className="text-3xl font-semibold text-text-dark">K{stats.totalExpenses}</p>
            </div>
            <DollarSign className="text-primary-blue" size={40} />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        <Link to="/results" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow border-l-4 border-l-primary-blue">
          <div className="flex items-center gap-4">
            <Award className="text-primary-blue" size={32} />
            <div>
              <h3 className="font-semibold text-text-dark mb-1">Results</h3>
              <p className="text-sm text-text-muted">View exam results</p>
            </div>
          </div>
        </Link>

        <Link to="/issues" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <AlertCircle className="text-primary-blue" size={32} />
            <div>
              <h3 className="font-semibold text-text-dark mb-1">Issues</h3>
              <p className="text-sm text-text-muted">Manage issues</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

// Parent Dashboard
function ParentDashboard() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const data = await parentsApi.getDashboard()
      setDashboardData(data)
    } catch (error) {
      console.error('Error loading parent dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-dark">Parent Dashboard</h1>
          <p className="text-sm sm:text-base text-text-muted mt-1">Welcome back, {user?.name}</p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-text-muted">No profile data available yet</p>
        </div>
      </div>
    )
  }

  const { summary, children } = dashboardData

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-dark">Parent Dashboard</h1>
        <p className="text-sm sm:text-base text-text-muted mt-1">Welcome back, {user?.name}</p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* Children Card */}
        <div className="bg-card-white rounded-custom shadow-custom p-4 sm:p-6 border-t-4 border-t-blue-500">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs sm:text-sm text-text-muted font-medium">Total Children</p>
            <GraduationCap className="text-blue-500" size={24} />
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-text-dark">{summary?.totalChildren || 0}</p>
          <p className="text-xs sm:text-sm text-text-muted mt-2">Enrolled students</p>
        </div>

        {/* Fees Paid Card */}
        <div className="bg-card-white rounded-custom shadow-custom p-4 sm:p-6 border-t-4 border-t-green-500">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs sm:text-sm text-text-muted font-medium">Fees Paid</p>
            <TrendingUp className="text-green-500" size={24} />
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-green-600">K{(summary?.totalPaid || 0).toFixed(2)}</p>
          <p className="text-xs sm:text-sm text-text-muted mt-2">of K{(summary?.totalFees || 0).toFixed(2)}</p>
        </div>

        {/* Pending Fees Card */}
        <div className="bg-card-white rounded-custom shadow-custom p-4 sm:p-6 border-t-4 border-t-orange-500">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs sm:text-sm text-text-muted font-medium">Pending</p>
            <AlertCircle className="text-orange-500" size={24} />
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-orange-600">K{(summary?.pendingFees || 0).toFixed(2)}</p>
          <p className="text-xs sm:text-sm text-text-muted mt-2">Amount due</p>
        </div>

        {/* Attendance Card */}
        <div className="bg-card-white rounded-custom shadow-custom p-4 sm:p-6 border-t-4 border-t-purple-500">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs sm:text-sm text-text-muted font-medium">Attendance</p>
            <Award className="text-purple-500" size={24} />
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-purple-600">{(summary?.attendanceRate || 0).toFixed(1)}%</p>
          <p className="text-xs sm:text-sm text-text-muted mt-2">Overall rate</p>
        </div>
      </div>

      {/* Overdue Fees Alert */}
      {summary?.overdueFees > 0 && (
        <div className="p-4 bg-red-50 border-l-4 border-l-red-500 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="font-semibold text-red-600 text-sm sm:text-base">Overdue Fees</h3>
              <p className="text-xs sm:text-sm text-red-700 mt-1">You have K{(summary.overdueFees).toFixed(2)} in overdue fees. Please make payment as soon as possible.</p>
            </div>
          </div>
        </div>
      )}

      {/* Children Overview */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-text-dark mb-3 sm:mb-4">Children</h2>
        {children && children.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {children.map((child) => (
              <Link
                key={child._id}
                to={`/children/${child._id}`}
                className="bg-card-white rounded-custom shadow-custom p-4 sm:p-6 hover:shadow-lg transition-shadow"
              >
                <div>
                  <p className="text-sm text-text-muted mb-1">Student ID: {child.studentId}</p>
                  <p className="text-lg sm:text-xl font-semibold text-text-dark">{child.firstName} {child.lastName}</p>
                  {child.class && <p className="text-xs sm:text-sm text-text-muted mt-2">Class: {child.class}</p>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-text-muted text-sm">No children enrolled yet</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-text-dark mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <Link to="/children" className="bg-card-white rounded-custom shadow-custom p-4 sm:p-6 hover:shadow-lg transition-shadow flex items-center gap-4">
            <GraduationCap className="text-blue-500" size={32} />
            <div>
              <h3 className="font-semibold text-text-dark text-sm sm:text-base">View Children</h3>
              <p className="text-xs sm:text-sm text-text-muted">See all details</p>
            </div>
          </Link>

          <Link to="/messages" className="bg-card-white rounded-custom shadow-custom p-4 sm:p-6 hover:shadow-lg transition-shadow flex items-center gap-4">
            <FileText className="text-green-500" size={32} />
            <div>
              <h3 className="font-semibold text-text-dark text-sm sm:text-base">Messages</h3>
              <p className="text-xs sm:text-sm text-text-muted">Communication</p>
            </div>
          </Link>

          <Link to="/children" className="bg-card-white rounded-custom shadow-custom p-4 sm:p-6 hover:shadow-lg transition-shadow flex items-center gap-4">
            <DollarSign className="text-orange-500" size={32} />
            <div>
              <h3 className="font-semibold text-text-dark text-sm sm:text-base">Fees</h3>
              <p className="text-xs sm:text-sm text-text-muted">Payment info</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

// Teacher Dashboard
function TeacherDashboard() {
  const { user } = useAuth()
  
  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-dark">Teacher Dashboard</h1>
        <p className="text-sm sm:text-base text-text-muted mt-1">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <Link to="/classrooms" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <School className="text-primary-blue" size={32} />
            <div>
              <h3 className="font-semibold text-text-dark">Classrooms</h3>
              <p className="text-sm text-text-muted">View classes</p>
            </div>
          </div>
        </Link>

        <Link to="/timetable" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow border-l-4 border-l-primary-blue">
          <div className="flex items-center gap-4">
            <Calendar className="text-primary-blue" size={32} />
            <div>
              <h3 className="font-semibold text-text-dark">Attendance</h3>
              <p className="text-sm text-text-muted">Mark attendance</p>
            </div>
          </div>
        </Link>

        <Link to="/results" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <Award className="text-primary-blue" size={32} />
            <div>
              <h3 className="font-semibold text-text-dark">Results</h3>
              <p className="text-sm text-text-muted">Manage results</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

// Student Dashboard
function StudentDashboard() {
  const { user } = useAuth()
  
  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-dark">Student Dashboard</h1>
        <p className="text-sm sm:text-base text-text-muted mt-1">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <Link to="/subjects" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow border-l-4 border-l-primary-blue">
          <div className="flex items-center gap-4">
            <FileText className="text-primary-blue" size={32} />
            <div>
              <h3 className="font-semibold text-text-dark">Subjects</h3>
              <p className="text-sm text-text-muted">View subjects</p>
            </div>
          </div>
        </Link>


        <Link to="/timetable" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow border-l-4 border-l-primary-blue">
          <div className="flex items-center gap-4">
            <Calendar className="text-primary-blue" size={32} />
            <div>
              <h3 className="font-semibold text-text-dark">Timetable</h3>
              <p className="text-sm text-text-muted">View schedule</p>
            </div>
          </div>
        </Link>

        <Link to="/attendance" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow border-l-4 border-l-primary-blue">
          <div className="flex items-center gap-4">
            <Calendar className="text-primary-blue" size={32} />
            <div>
              <h3 className="font-semibold text-text-dark">Attendance</h3>
              <p className="text-sm text-text-muted">View attendance</p>
            </div>
          </div>
        </Link>

        <Link to="/results" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow border-l-4 border-l-primary-blue">
          <div className="flex items-center gap-4">
            <Award className="text-primary-blue" size={32} />
            <div>
              <h3 className="font-semibold text-text-dark">Results</h3>
              <p className="text-sm text-text-muted">View results</p>
            </div>
          </div>
        </Link>

        <Link to="/issues" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow border-l-4 border-l-primary-blue">
          <div className="flex items-center gap-4">
            <AlertCircle className="text-primary-blue" size={32} />
            <div>
              <h3 className="font-semibold text-text-dark">Issues</h3>
              <p className="text-sm text-text-muted">Report issues</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}

// Accounts Dashboard
function AccountsDashboard() {
  const [stats, setStats] = useState({
    totalFees: 0,
    totalExpenses: 0,
    totalPayments: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [fees, expenses] = await Promise.all([
        feesApi.list(),
        expensesApi.list()
      ])
      
      const totalFees = fees.reduce((sum, f) => sum + f.amount, 0)
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
      const paidFees = fees.filter(f => f.status === 'PAID').reduce((sum, f) => sum + f.amount, 0)
      
      setStats({
        totalFees,
        totalExpenses,
        totalPayments: paidFees
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const netBalance = stats.totalPayments - stats.totalExpenses

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-dark">Accounts Dashboard</h1>
        <p className="text-sm sm:text-base text-text-muted mt-1">Financial overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <Link to="/fees" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow">
          <div>
            <p className="text-sm text-text-muted mb-1">Total Fees</p>
            <p className="text-3xl font-semibold text-text-dark">${stats.totalFees}</p>
          </div>
        </Link>

        <Link to="/payments" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow">
          <div>
            <p className="text-sm text-text-muted mb-1">Total Payments</p>
            <p className="text-3xl font-semibold text-green-600">${stats.totalPayments}</p>
          </div>
        </Link>

        <Link to="/expenses" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow">
          <div>
            <p className="text-sm text-text-muted mb-1">Total Expenses</p>
            <p className="text-3xl font-semibold text-red-600">${stats.totalExpenses}</p>
          </div>
        </Link>

        <div className="bg-card-white rounded-custom shadow-custom p-6">
          <div>
            <p className="text-sm text-text-muted mb-1">Net Balance</p>
            <p className={`text-3xl font-semibold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netBalance}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <Link to="/fees" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <DollarSign className="text-primary-blue" size={32} />
            <div>
              <h3 className="font-semibold text-text-dark">Fees</h3>
              <p className="text-sm text-text-muted">Manage fees</p>
            </div>
          </div>
        </Link>

        <Link to="/payments" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <DollarSign className="text-primary-blue" size={32} />
            <div>
              <h3 className="font-semibold text-text-dark">Payments</h3>
              <p className="text-sm text-text-muted">View payments</p>
            </div>
          </div>
        </Link>

        <Link to="/expenses" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <DollarSign className="text-primary-blue" size={32} />
            <div>
              <h3 className="font-semibold text-text-dark">Expenses</h3>
              <p className="text-sm text-text-muted">Manage expenses</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
// Head Teacher Dashboard
function HeadTeacherDashboard (){
  const { user } = useAuth()
  const userName = user?.name || 'Head Teacher'

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-dark">Head Teacher Dashboard</h1>
        <p className="text-sm sm:text-base text-text-muted mt-1">Welcome back, {userName}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <Link to="/subjects" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow border-l-4 border-l-primary-blue">
          <div className="flex items-center gap-4">
            <FileText className="text-primary-blue" size={32} />
            <div>
              <h3 className="font-semibold text-text-dark">Subjects</h3>
              <p className="text-sm text-text-muted">View subjects</p>
            </div>
          </div>
        </Link>

        <Link to="/timetable" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow border-l-4 border-l-primary-blue">
          <div className="flex items-center gap-4">
            <Calendar className="text-primary-blue" size={32} />
            <div>
              <h3 className="font-semibold text-text-dark">Timetable</h3>
              <p className="text-sm text-text-muted">View schedule</p>
            </div>
          </div>
        </Link>

        <Link to="/attendance" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <Calendar className="text-primary-blue" size={32} />
            <div>
              <h3 className="font-semibold text-text-dark">Attendance</h3>
              <p className="text-sm text-text-muted">View attendance</p>
            </div>
          </div>
        </Link>

        <Link to="/results" className="bg-card-white rounded-custom shadow-custom p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <Award className="text-primary-blue" size={32} />
            <div>
              <h3 className="font-semibold text-text-dark">Results</h3>
              <p className="text-sm text-text-muted">View results</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )       
}

// Main Dashboard Component
function Dashboard() {
  const { user } = useAuth()
  const userRole = user?.role || 'admin'

  if (userRole === 'admin') {
    return <AdminDashboard />
  } else if (userRole === 'teacher') {
    return <TeacherDashboard />
  } else if (userRole === 'student') {
    return <StudentDashboard />
  } else if (userRole === 'accounts') {
    return <AccountsDashboard />
  } else if (userRole === 'parent') {
    return <ParentDashboard />
  } else if (userRole === 'head-teacher') {
    return <HeadTeacherDashboard />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-dark">Dashboard</h1>
        <p className="text-text-muted mt-1">Welcome to the School Management System</p>
      </div>
    </div>
  )
}

export default Dashboard
