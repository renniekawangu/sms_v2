import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, BookOpen, CheckCircle, DollarSign, Calendar, User, AlertCircle, Loader, TrendingUp, FileText, RefreshCw } from 'lucide-react'
import { parentsApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { useSettings } from '../contexts/SettingsContext'
import ChildHomework from '../components/ChildHomework'
import ErrorBoundary from '../components/ErrorBoundary'

function ChildDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { error: showError, success: showSuccess } = useToast()
  const { currentAcademicYear } = useSettings()

  const [child, setChild] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [downloadingReport, setDownloadingReport] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: 'cash', notes: '', fee_id: '' })

  // Detail data
  const [grades, setGrades] = useState([])
  const [attendance, setAttendance] = useState([])
  const [fees, setFees] = useState([])

  useEffect(() => {
    loadChildData()
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadChildData()
    }, 30000)
    return () => clearInterval(interval)
  }, [id, currentAcademicYear])

  const loadChildData = async () => {
    try {
      setLoading(true)
      const [gradesData, attendanceData, feesData] = await Promise.all([
        parentsApi.getChildGrades(id).catch((err) => {
          console.error('Error loading grades:', err)
          return []
        }),
        parentsApi.getChildAttendance(id).catch((err) => {
          console.error('Error loading attendance:', err)
          return []
        }),
        parentsApi.getChildFees(id).catch((err) => {
          console.error('Error loading fees:', err)
          return []
        })
      ])

      console.log('Grades:', gradesData)
      console.log('Attendance:', attendanceData)
      console.log('Fees:', feesData)

      setGrades(gradesData || [])
      setAttendance(attendanceData || [])
      setFees(feesData || [])

      // Get child basic info
      const dashboard = await parentsApi.getDashboard()
      const childData = dashboard.children?.find(c => c._id === id)
      if (childData) {
        setChild(childData)
      }
    } catch (err) {
      console.error('Error loading child data:', err)
      showError(err.message || 'Failed to load child data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadChildData()
    showSuccess('Data refreshed successfully')
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      showError('Please enter a valid payment amount')
      return
    }

    try {
      setPaymentLoading(true)
      const response = await parentsApi.makePayment(id, {
        fee_id: paymentForm.fee_id || undefined,
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes
      })

      showSuccess(`Payment of K${paymentForm.amount} recorded successfully`)
      setPaymentForm({ amount: '', paymentMethod: 'cash', notes: '', fee_id: '' })
      setShowPaymentForm(false)
      
      // Refresh fees data
      await loadChildData()
    } catch (err) {
      showError(err.message || 'Failed to record payment')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleDownloadReport = async () => {
    try {
      setDownloadingReport(true)
      const blob = await parentsApi.downloadChildReport(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${child?.firstName}_${child?.lastName}_Report.pdf`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      a.remove()
      showSuccess('Report downloaded successfully')
    } catch (err) {
      showError(err.message || 'Failed to download report')
    } finally {
      setDownloadingReport(false)
    }
  }

  const calculateAttendancePercentage = () => {
    if (attendance.length === 0) return 0
    const present = attendance.filter(a => a.status === 'present').length
    return Math.round((present / attendance.length) * 100)
  }

  const calculateAverageGrade = () => {
    if (grades.length === 0) return 'N/A'
    
    // Handle exam results format (from /results endpoint)
    if (grades[0]?.overallGrade !== undefined || grades[0]?.percentage !== undefined) {
      const total = grades.reduce((sum, result) => {
        // Use percentage if available, or try to convert grade to numeric
        const value = result.percentage || 
                     (result.overallGrade ? gradeToNumber(result.overallGrade) : 0)
        return sum + value
      }, 0)
      const average = total / grades.length
      return isNaN(average) ? 'N/A' : average.toFixed(2)
    }
    
    // Handle legacy grades format
    const total = grades.reduce((sum, g) => {
      // Try to get grade in order of preference: finalGrade > grade > endTermGrade > midTermGrade
      const gradeValue = g.finalGrade || g.grade || g.endTermGrade || g.midTermGrade || 0
      return sum + gradeValue
    }, 0)
    const average = total / grades.length
    return isNaN(average) ? 'N/A' : average.toFixed(2)
  }

  const gradeToNumber = (grade) => {
    const gradeMap = { 'A+': 95, 'A': 90, 'B+': 85, 'B': 80, 'C+': 75, 'C': 70, 'D': 60, 'F': 0 }
    return gradeMap[grade] || 0
  }

  const calculateFeesStatus = () => {
    // Use summary data from the backend which is already calculated
    if (fees && fees.summary) {
      const { totalFees, totalPaid, pendingFees } = fees.summary
      const percentage = totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0
      return {
        paid: totalPaid,
        pending: pendingFees,
        percentage
      }
    }

    // Fallback: handle legacy format or direct array
    let feesList = []
    
    if (Array.isArray(fees)) {
      feesList = fees
    } else if (fees && typeof fees === 'object' && fees.fees && Array.isArray(fees.fees)) {
      feesList = fees.fees
    }

    if (!Array.isArray(feesList) || feesList.length === 0) {
      return { paid: 0, pending: 0, percentage: 0 }
    }

    const totalAmount = feesList.reduce((sum, f) => sum + (f.amount || 0), 0)
    const paidAmount = feesList.reduce((sum, f) => sum + (f.amountPaid || 0), 0)
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

  if (!child) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-semibold text-text-dark mb-2">Child Not Found</h1>
        <button
          onClick={() => navigate('/children')}
          className="mt-4 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90"
        >
          Back to Children
        </button>
      </div>
    )
  }

  const feesStatus = calculateFeesStatus()
  const avgGrade = calculateAverageGrade()
  const attendancePercentage = calculateAttendancePercentage()

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-col gap-3 mb-4">
              <button
                onClick={() => navigate('/children')}
                className="flex items-center gap-2 text-primary-blue hover:text-primary-blue/80 transition text-xs sm:text-sm font-medium w-fit"
              >
                <ArrowLeft size={16} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Back to Children</span>
                <span className="sm:hidden">Back</span>
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center justify-center gap-1 px-3 py-2 sm:px-4 sm:py-2 bg-gray-200 text-text-dark rounded-lg hover:bg-gray-300 transition disabled:opacity-50 text-xs sm:text-sm font-medium flex-1 sm:flex-none"
                >
                  <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                  <span className="sm:hidden text-center">Refresh</span>
                </button>
                <button
                  onClick={handleDownloadReport}
                  disabled={downloadingReport}
                  className="flex items-center justify-center gap-1 px-3 py-2 sm:px-4 sm:py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition disabled:opacity-50 text-xs sm:text-sm font-medium flex-1 sm:flex-none"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">{downloadingReport ? 'Downloading...' : 'Download Report'}</span>
                  <span className="sm:hidden text-center">{downloadingReport ? 'Loading...' : 'Report'}</span>
                </button>
              </div>
            </div>

            {/* Child Header */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary-blue to-blue-600 flex items-center justify-center text-white flex-shrink-0">
                <User size={24} className="sm:w-8 sm:h-8" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-semibold text-text-dark truncate">
                  {child.firstName} {child.lastName}
                </h1>
                <p className="text-xs sm:text-sm text-text-muted truncate">Student ID: {child.studentId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {/* Average Grade */}
            <div className="bg-white rounded-lg shadow-custom p-3 sm:p-6 border-l-4 border-blue-500">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-text-muted text-xs sm:text-sm font-medium">Average Grade</p>
                  <p className="text-2xl sm:text-3xl font-bold text-primary-blue mt-1 sm:mt-2">{avgGrade}</p>
                </div>
                <TrendingUp size={24} className="hidden sm:block text-blue-500 opacity-20 flex-shrink-0" />
              </div>
            </div>

            {/* Attendance */}
            <div className="bg-white rounded-lg shadow-custom p-3 sm:p-6 border-l-4 border-green-500">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-text-muted text-xs sm:text-sm font-medium">Attendance Rate</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1 sm:mt-2">{attendancePercentage}%</p>
                </div>
                <CheckCircle size={24} className="hidden sm:block text-green-500 opacity-20 flex-shrink-0" />
              </div>
            </div>

            {/* Fees Status */}
            <div className="bg-white rounded-lg shadow-custom p-3 sm:p-6 border-l-4 border-orange-500">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-text-muted text-xs sm:text-sm font-medium">Fees Paid</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-600 mt-1 sm:mt-2">K{feesStatus.paid.toFixed(2)}</p>
                </div>
                <DollarSign size={24} className="hidden sm:block text-orange-500 opacity-20 flex-shrink-0" />
              </div>
            </div>

            {/* Pending Fees */}
            <div className="bg-white rounded-lg shadow-custom p-3 sm:p-6 border-l-4 border-red-500">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-text-muted text-xs sm:text-sm font-medium">Fees Pending</p>
                  <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1 sm:mt-2">K{feesStatus.pending.toFixed(2)}</p>
                </div>
                <AlertCircle size={24} className="hidden sm:block text-red-500 opacity-20 flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="bg-white rounded-lg shadow-custom overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <div className="flex overflow-x-auto">
                {['overview', 'grades', 'attendance', 'fees', 'homework'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm capitalize transition border-b-2 whitespace-nowrap ${
                      activeTab === tab
                        ? 'text-primary-blue border-primary-blue'
                        : 'text-text-muted border-transparent hover:text-text-dark'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Grades Summary */}
                    <div>
                      <h3 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
                        <BookOpen size={20} className="text-primary-blue" />
                        Recent Grades
                      </h3>
                      {grades.length > 0 ? (
                        <div className="space-y-2">
                          {grades.slice(0, 5).map((grade, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <span className="text-text-muted">{grade.subject}</span>
                              <span className="font-semibold text-text-dark">{grade.grade}</span>
                            </div>
                          ))}
                          {grades.length > 5 && (
                            <p className="text-sm text-primary-blue font-medium pt-2">
                              +{grades.length - 5} more grades
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-text-muted">No grades available yet</p>
                      )}
                    </div>

                    {/* Attendance Summary */}
                    <div>
                      <h3 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
                        <CheckCircle size={20} className="text-green-600" />
                        Attendance Summary
                      </h3>
                      {attendance.length > 0 ? (
                        <div className="space-y-3">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-green-500 h-3 rounded-full transition-all"
                              style={{ width: `${attendancePercentage}%` }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-green-50 rounded">
                              <p className="text-text-muted text-xs">Present</p>
                              <p className="text-xl font-bold text-green-600">
                                {attendance.filter(a => a.status === 'present').length}
                              </p>
                            </div>
                            <div className="p-3 bg-red-50 rounded">
                              <p className="text-text-muted text-xs">Absent</p>
                              <p className="text-xl font-bold text-red-600">
                                {attendance.filter(a => a.status === 'absent').length}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-text-muted">No attendance records yet</p>
                      )}
                    </div>
                  </div>

                  {/* Fees Overview */}
                  <div>
                    <h3 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
                      <DollarSign size={20} className="text-orange-600" />
                      Fees Overview
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-text-muted text-sm">Total Amount</p>
                        <p className="text-2xl font-bold text-primary-blue mt-1">
                          K{(feesStatus.paid + feesStatus.pending).toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-text-muted text-sm">Paid</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">
                          K{feesStatus.paid.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg">
                        <p className="text-text-muted text-sm">Pending</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">
                          K{feesStatus.pending.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Grades Tab */}
              {activeTab === 'grades' && (
                <div>
                  <h3 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
                    <BookOpen size={20} className="text-primary-blue" />
                    Academic Performance
                  </h3>
                  {grades.length > 0 ? (
                    <div className="space-y-2">
                      {grades.map((result, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <p className="font-semibold text-text-dark">
                                {result.exam?.name || 'Exam'} - {result.exam?.examType || 'Regular'}
                              </p>
                              <p className="text-xs text-text-muted">
                                {result.term && result.term.charAt(0).toUpperCase() + result.term.slice(1)} • {result.academicYear}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-bold text-primary-blue">{result.overallGrade || 'NA'}</p>
                              <p className="text-sm text-text-muted">{result.percentage}%</p>
                            </div>
                          </div>
                          
                          {/* Subject-wise results */}
                          {result.subjectResults && result.subjectResults.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-semibold text-text-muted mb-2">Subject Scores:</p>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {result.subjectResults.map((sr, sidx) => (
                                  <div key={sidx} className="bg-gray-50 p-2 rounded text-sm">
                                    <p className="text-xs text-text-muted truncate">
                                      {sr.subject?.name || 'Subject'}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-primary-blue">
                                        {sr.score}/{sr.maxMarks}
                                      </span>
                                      <span className="text-xs font-medium text-text-dark">
                                        {sr.grade}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-text-dark">Average Performance</p>
                          <p className="text-2xl font-bold text-primary-blue">{avgGrade}%</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-text-muted">No exam results available yet</p>
                      <p className="text-xs text-text-muted mt-1">Results will appear once exams are conducted and graded</p>
                    </div>
                  )}
                </div>
              )}

              {/* Attendance Tab */}
              {activeTab === 'attendance' && (
                <div>
                  <h3 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-600" />
                    Attendance Records
                  </h3>
                  {attendance.length > 0 ? (
                    <div className="space-y-3">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-green-500 h-4 rounded-full transition-all"
                          style={{ width: `${attendancePercentage}%` }}
                        />
                      </div>
                      <p className="text-center text-lg font-semibold text-text-dark">
                        Attendance Rate: {attendancePercentage}%
                      </p>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left p-3 text-sm font-semibold text-text-muted">Date</th>
                              <th className="text-left p-3 text-sm font-semibold text-text-muted">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendance.slice(0, 20).map((record, idx) => (
                              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="p-3 text-sm text-text-dark">
                                  {new Date(record.date).toLocaleDateString()}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                      record.status === 'present'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {record.status?.charAt(0).toUpperCase() + record.status?.slice(1)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-text-muted">No attendance records yet</p>
                  )}
                </div>
              )}

              {/* Fees Tab */}
              {activeTab === 'fees' && (
                <div>
                  <h3 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-orange-600" />
                    Fees & Payments
                  </h3>

                  {/* Fees Overview */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                      <div
                        className="bg-orange-500 h-3 rounded-full transition-all"
                        style={{ width: `${feesStatus.percentage}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-text-muted text-xs font-medium">Total</p>
                        <p className="text-lg font-bold text-text-dark">
                          K{(feesStatus.paid + feesStatus.pending).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-muted text-xs font-medium">Paid</p>
                        <p className="text-lg font-bold text-green-600">
                          K{feesStatus.paid.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-muted text-xs font-medium">Pending</p>
                        <p className="text-lg font-bold text-red-600">
                          K{feesStatus.pending.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <p className="text-center text-sm text-text-muted mt-2">
                      Payment Progress: {feesStatus.percentage}%
                    </p>
                  </div>

                  {/* Payment Button */}
                  {feesStatus.pending > 0 && (
                    <div className="mb-6">
                      <button
                        onClick={() => setShowPaymentForm(!showPaymentForm)}
                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                      >
                        {showPaymentForm ? 'Cancel Payment' : 'Make Payment'}
                      </button>
                    </div>
                  )}

                  {/* Payment Form */}
                  {showPaymentForm && feesStatus.pending > 0 && (
                    <form onSubmit={handlePayment} className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-text-dark mb-4">Record Payment</h4>
                      
                      <div className="space-y-4">
                        {/* Select Fee (optional) */}
                        {fees.fees && fees.fees.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-text-dark mb-1">
                              Apply to Specific Fee (Optional)
                            </label>
                            <select
                              value={paymentForm.fee_id}
                              onChange={(e) => setPaymentForm({...paymentForm, fee_id: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="">Distribute to all unpaid fees</option>
                              {fees.fees.filter(f => f.status !== 'paid').map((fee) => (
                                <option key={fee._id} value={fee._id}>
                                  {fee.feeType} - K{fee.amount}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Amount */}
                        <div>
                          <label className="block text-sm font-medium text-text-dark mb-1">
                            Amount (K)
                          </label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            max={feesStatus.pending}
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                            placeholder={`Max: K${feesStatus.pending.toFixed(2)}`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                          />
                        </div>

                        {/* Payment Method */}
                        <div>
                          <label className="block text-sm font-medium text-text-dark mb-1">
                            Payment Method
                          </label>
                          <select
                            value={paymentForm.paymentMethod}
                            onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="cash">Cash</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="mobile_money">Mobile Money</option>
                            <option value="cheque">Cheque</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="block text-sm font-medium text-text-dark mb-1">
                            Notes (Optional)
                          </label>
                          <textarea
                            value={paymentForm.notes}
                            onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                            placeholder="e.g., Reference number, payment details..."
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={paymentLoading}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium"
                        >
                          {paymentLoading ? 'Recording Payment...' : 'Record Payment'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Fees List */}
                  {fees.fees && fees.fees.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="font-medium text-text-dark mb-3">Fee Breakdown</h4>
                      {fees.fees.map((fee, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                          <div className="flex-1">
                            <p className="font-medium text-text-dark">{fee.feeType || 'Fee'}</p>
                            {fee.term && <p className="text-xs text-text-muted">Term {fee.term}</p>}
                            {fee.dueDate && <p className="text-xs text-text-muted">Due: {new Date(fee.dueDate).toLocaleDateString()}</p>}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-text-dark">K{fee.amount}</p>
                            <p className={`text-xs font-medium ${fee.status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                              {fee.status === 'paid' ? 'Paid' : 'Pending'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-text-muted">No fee records available yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Homework Tab */}
              {activeTab === 'homework' && (
                <div>
                  <h3 className="font-semibold text-text-dark mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-primary-blue" />
                    Homework Assignments
                  </h3>
                  <ChildHomework studentId={id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default ChildDetail
