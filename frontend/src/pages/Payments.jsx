import { useState, useEffect, useMemo } from 'react'
import { CreditCard, Plus, AlertCircle, Search, RefreshCw, Filter, Calendar } from 'lucide-react'
import { accountsApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import Modal from '../components/Modal'
import PaymentForm from '../components/PaymentForm'

function Payments() {
  const [payments, setPayments] = useState([])
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1, limit: 50 })
  const [summary, setSummary] = useState({})
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    method: '',
    startDate: '',
    endDate: '',
    studentId: ''
  })
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadData()
  }, [currentPage, filters])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const queryParams = new URLSearchParams()
      queryParams.append('page', currentPage)
      queryParams.append('limit', 50)
      
      if (filters.method) queryParams.append('method', filters.method)
      if (filters.startDate) queryParams.append('startDate', filters.startDate)
      if (filters.endDate) queryParams.append('endDate', filters.endDate)
      if (filters.studentId) queryParams.append('studentId', filters.studentId)

      const [paymentsData, feesData] = await Promise.all([
        accountsApi.getPayments(queryParams),
        accountsApi.getFees()
      ])
      setPayments(paymentsData.payments || [])
      setSummary(paymentsData.summary || {})
      setPagination(paymentsData.pagination || { total: 0, pages: 1, page: 1, limit: 50 })
      const feesArray = Array.isArray(feesData) 
        ? feesData 
        : (feesData?.fees || feesData?.data || [])
      setFees(feesArray)
    } catch (err) {
      const errorMessage = err.message || 'Failed to load data'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
  }

  const handleCreate = () => {
    setIsModalOpen(true)
  }

  const handleSubmit = async (formData) => {
    try {
      await accountsApi.createPayment(formData)
      success('Payment recorded successfully')
      setIsModalOpen(false)
      setCurrentPage(1)
      await loadData()
    } catch (err) {
      const errorMessage = err.message || 'Failed to record payment'
      showError(errorMessage)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({ method: '', startDate: '', endDate: '', studentId: '' })
    setCurrentPage(1)
  }

  const getFeeInfo = (feeId) => {
    if (!Array.isArray(fees)) return null
    return fees.find(f => f._id === feeId || f.id === feeId)
  }

  const getStudentName = (feeId) => {
    const fee = getFeeInfo(feeId)
    if (fee?.studentId?.firstName && fee?.studentId?.lastName) {
      return `${fee.studentId.firstName} ${fee.studentId.lastName}`
    }
    return fee?.studentId?.name || 'Unknown'
  }

  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments
    const query = searchQuery.toLowerCase()
    return payments.filter((payment) => {
      return (
        payment._id?.toString().includes(query) ||
        payment.feeId?.toString().includes(query) ||
        payment.amountPaid?.toString().includes(query) ||
        payment.method?.toLowerCase().includes(query) ||
        getStudentName(payment.feeId).toLowerCase().includes(query)
      )
    })
  }, [payments, fees, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading payments...</p>
        </div>
      </div>
    )
  }

  if (error && payments.length === 0 && fees.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-text-dark font-medium mb-2">Error loading data</p>
          <p className="text-text-muted mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-dark">Payments</h1>
          <p className="text-sm sm:text-base text-text-muted mt-1">Record and manage payment records</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-text-dark rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <button
        onClick={handleCreate}
        className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 bg-primary-blue text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors text-sm sm:text-base font-medium"
      >
        <Plus size={18} />
        <span>Record Payment</span>
      </button>

      {/* Payment Summary Card */}
      {Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Object.entries(summary).map(([method, data]) => (
            <div key={method} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-gray-600 capitalize font-medium">{method}</p>
              <p className="text-xl font-bold text-text-dark mt-1">K{data.amount?.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{data.count} payments</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters Panel */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-primary-blue font-medium hover:text-primary-blue/80 transition-colors"
        >
          <Filter size={18} />
          <span>Advanced Filters</span>
        </button>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">Payment Method</label>
              <select
                value={filters.method}
                onChange={(e) => handleFilterChange('method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="bank transfer">Bank Transfer</option>
                <option value="mobile money">Mobile Money</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>

            <div className="flex items-end">
              {Object.values(filters).some(v => v) && (
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-2 bg-gray-200 text-text-dark rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6">
        {payments.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                placeholder="Search by student name, amount, method..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                aria-label="Search payments"
              />
            </div>
          </div>
        )}

        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-text-muted mb-2">
              {payments.length === 0 ? 'No payment records found' : 'No payments match your search'}
            </p>
            {payments.length === 0 && (
              <p className="text-sm text-text-muted">
                Use the "Record Payment" button to record a new payment
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 sm:px-4 font-semibold text-text-dark">Date</th>
                    <th className="text-left py-3 px-3 sm:px-4 font-semibold text-text-dark">Student</th>
                    <th className="text-left py-3 px-3 sm:px-4 font-semibold text-text-dark">Fee Type</th>
                    <th className="text-left py-3 px-3 sm:px-4 font-semibold text-text-dark">Amount</th>
                    <th className="text-left py-3 px-3 sm:px-4 font-semibold text-text-dark">Method</th>
                    <th className="text-left py-3 px-3 sm:px-4 font-semibold text-text-dark">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => {
                    const fee = getFeeInfo(payment.feeId)
                    const studentName = getStudentName(payment.feeId)
                    return (
                      <tr key={payment._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3 sm:px-4 text-text-dark">
                          {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-text-dark font-medium">{studentName}</td>
                        <td className="py-3 px-3 sm:px-4 text-text-dark text-sm">{fee?.description || '-'}</td>
                        <td className="py-3 px-3 sm:px-4 text-text-dark font-semibold">K{payment.amountPaid?.toFixed(2)}</td>
                        <td className="py-3 px-3 sm:px-4 text-text-muted capitalize">{payment.method}</td>
                        <td className="py-3 px-3 sm:px-4">
                          {fee?.status === 'paid' ? (
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Paid</span>
                          ) : (
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-text-muted">
                  Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                    disabled={currentPage === pagination.pages}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4">
              <p className="text-sm text-text-muted">
                Showing {filteredPayments.length} of {payments.length} payments
              </p>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Payment"
      >
        <PaymentForm
          fees={fees}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  )
}

export default Payments
