import { useState, useEffect } from 'react'
import { User, BookOpen, CheckCircle, DollarSign, TrendingUp, ChevronRight, AlertCircle, Loader } from 'lucide-react'
import { parentsApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'

function Children() {
  const { user } = useAuth()
  const { error: showError } = useToast()
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedChild, setExpandedChild] = useState(null)
  const [childDetails, setChildDetails] = useState({})

  useEffect(() => {
    loadChildren()
  }, [])

  const loadChildren = async () => {
    try {
      setLoading(true)
      const dashboard = await parentsApi.getDashboard()
      setChildren(dashboard.children || [])
    } catch (err) {
      const errorMessage = err.message || 'Failed to load children'
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const loadChildDetails = async (childId) => {
    if (childDetails[childId]) {
      setExpandedChild(expandedChild === childId ? null : childId)
      return
    }

    try {
      const [grades, attendance, fees] = await Promise.all([
        parentsApi.getChildGrades(childId).catch(() => []),
        parentsApi.getChildAttendance(childId).catch(() => []),
        parentsApi.getChildFees(childId).catch(() => [])
      ])

      setChildDetails(prev => ({
        ...prev,
        [childId]: {
          grades: grades,
          attendance: attendance,
          fees: fees
        }
      }))
      setExpandedChild(childId)
    } catch (err) {
      showError('Failed to load child details')
    }
  }

  const handleDownloadReport = async (childId, nameLabel) => {
    try {
      const blob = await parentsApi.downloadChildReport(childId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Report_${nameLabel || childId}.pdf`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      a.remove()
    } catch (err) {
      showError(err.message || 'Failed to download report')
    }
  }

  const calculateAttendancePercentage = (attendance) => {
    if (attendance.length === 0) return 0
    const present = attendance.filter(a => a.status === 'present').length
    return Math.round((present / attendance.length) * 100)
  }

  const calculateAverageGrade = (grades) => {
    if (grades.length === 0) return 'N/A'
    const total = grades.reduce((sum, g) => sum + (g.grade || 0), 0)
    return (total / grades.length).toFixed(2)
  }

  const calculateFeesStatus = (fees) => {
    if (fees.length === 0) return { paid: 0, pending: 0, percentage: 0 }
    const totalAmount = fees.reduce((sum, f) => sum + (f.amount || 0), 0)
    const paidAmount = fees.reduce((sum, f) => sum + (f.amountPaid || 0), 0)
    const percentage = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0
    return {
      paid: paidAmount,
      pending: totalAmount - paidAmount,
      percentage
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-primary-blue" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary-blue to-blue-600 text-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">My Children</h1>
        <p className="text-blue-100">View your children's academic progress, attendance, and fees status</p>
      </div>

      {/* No Children Message */}
      {children.length === 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-yellow-800 font-semibold">No Children Found</h3>
              <p className="text-yellow-700 text-sm">Please contact your school administrator to add children to your account.</p>
            </div>
          </div>
        </div>
      )}

      {/* Children Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {children.map((child) => {
          const isExpanded = expandedChild === child._id
          const details = childDetails[child._id]

          return (
            <div
              key={child._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div
                onClick={() => loadChildDetails(child._id)}
                className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-blue to-blue-600 flex items-center justify-center text-white flex-shrink-0">
                      <User size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-dark truncate">
                        {child.firstName} {child.lastName}
                      </h3>
                      <p className="text-xs text-text-muted">ID: {child.studentId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isExpanded && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownloadReport(child._id, `${child.firstName}_${child.lastName}`)
                        }}
                        className="px-3 py-1.5 text-sm rounded bg-primary-blue text-white hover:bg-blue-700"
                      >
                        Download Report
                      </button>
                    )}
                    <ChevronRight
                      size={20}
                      className={`text-text-muted transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </div>
                </div>

                {/* Quick Stats */}
                {details && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-blue-50 p-2 rounded text-center">
                      <p className="text-xs text-text-muted">Grade</p>
                      <p className="font-semibold text-sm text-primary-blue">
                        {calculateAverageGrade(details.grades)}
                      </p>
                    </div>
                    <div className="bg-green-50 p-2 rounded text-center">
                      <p className="text-xs text-text-muted">Attendance</p>
                      <p className="font-semibold text-sm text-green-600">
                        {calculateAttendancePercentage(details.attendance)}%
                      </p>
                    </div>
                    <div className="bg-orange-50 p-2 rounded text-center">
                      <p className="text-xs text-text-muted">Fees</p>
                      <p className="font-semibold text-sm text-orange-600">
                        {calculateFeesStatus(details.fees).percentage}%
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && details && (
                <div className="border-t border-gray-100 bg-gray-50">
                  {/* Grades Section */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen size={18} className="text-primary-blue" />
                      <h4 className="font-semibold text-text-dark">Academic Performance</h4>
                    </div>
                    {details.grades.length > 0 ? (
                      <div className="space-y-2">
                        {details.grades.slice(0, 3).map((grade, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-text-muted">{grade.subject || 'Subject'}</span>
                            <span className="font-semibold text-text-dark">{grade.grade || 'N/A'}</span>
                          </div>
                        ))}
                        {details.grades.length > 3 && (
                          <p className="text-xs text-primary-blue font-medium mt-2">
                            +{details.grades.length - 3} more grades
                          </p>
                        )}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-text-dark">Average</span>
                            <span className="font-bold text-primary-blue">
                              {calculateAverageGrade(details.grades)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-text-muted">No grades available yet</p>
                    )}
                  </div>

                  {/* Attendance Section */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle size={18} className="text-green-600" />
                      <h4 className="font-semibold text-text-dark">Attendance</h4>
                    </div>
                    {details.attendance.length > 0 ? (
                      <div className="space-y-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${calculateAttendancePercentage(details.attendance)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-muted">Attendance Rate</span>
                          <span className="font-semibold text-green-600">
                            {calculateAttendancePercentage(details.attendance)}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                          <div className="bg-white p-2 rounded">
                            <p className="text-text-muted">Present</p>
                            <p className="font-semibold text-text-dark">
                              {details.attendance.filter(a => a.status === 'present').length}
                            </p>
                          </div>
                          <div className="bg-white p-2 rounded">
                            <p className="text-text-muted">Absent</p>
                            <p className="font-semibold text-text-dark">
                              {details.attendance.filter(a => a.status === 'absent').length}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-text-muted">No attendance records yet</p>
                    )}
                  </div>

                  {/* Fees Section */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign size={18} className="text-orange-600" />
                      <h4 className="font-semibold text-text-dark">Fees & Payments</h4>
                    </div>
                    {details.fees.length > 0 ? (
                      <div className="space-y-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full transition-all"
                            style={{ width: `${calculateFeesStatus(details.fees).percentage}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-text-muted text-xs">Paid</p>
                            <p className="font-semibold text-text-dark">
                              ${calculateFeesStatus(details.fees).paid.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-text-muted text-xs">Pending</p>
                            <p className="font-semibold text-orange-600">
                              ${calculateFeesStatus(details.fees).pending.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-200">
                          <span className="text-text-muted">Payment Progress</span>
                          <span className="font-semibold text-orange-600">
                            {calculateFeesStatus(details.fees).percentage}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-text-muted">No fee information available</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Children
