import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { GraduationCap, User, Users, School, FileText, Award, DollarSign, Calendar, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { studentsApi, teachersApi, classroomsApi, examsApi, feesApi, expensesApi, issuesApi } from '../services/api'

// Admin Dashboard
function AdminDashboard() {
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
