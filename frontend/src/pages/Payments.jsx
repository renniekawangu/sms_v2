import { useState, useEffect, useMemo } from 'react'
import { CreditCard, Plus, AlertCircle, Search } from 'lucide-react'
import { paymentsApi, feesApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import Modal from '../components/Modal'
import PaymentForm from '../components/PaymentForm'
import { useCurrency, formatCurrency } from '../hooks/useCurrency'

function Payments() {
  const [payments, setPayments] = useState([])
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { success, error: showError } = useToast()
  const currency = useCurrency()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [paymentsData, feesData] = await Promise.all([
        paymentsApi.list(),
        feesApi.list()
      ])
      setPayments(paymentsData)
      setFees(feesData)
    } catch (err) {
      const errorMessage = err.message || 'Failed to load data'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setIsModalOpen(true)
  }

  const handleSubmit = async (formData) => {
    try {
      await paymentsApi.create(formData)
      success('Payment recorded successfully')
      setIsModalOpen(false)
      await loadData()
    } catch (err) {
      const errorMessage = err.message || 'Failed to record payment'
      showError(errorMessage)
    }
  }

  const getFeeInfo = (fee_id) => {
    return fees.find(f => f.fee_id === fee_id)
  }

  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments
    const query = searchQuery.toLowerCase()
    return payments.filter((payment) => {
      const fee = getFeeInfo(payment.fee_id)
      return (
        payment.payment_id?.toString().includes(query) ||
        payment.fee_id?.toString().includes(query) ||
        payment.amount_paid?.toString().includes(query) ||
        payment.method?.toLowerCase().includes(query) ||
        (fee && fee.student_id?.toString().includes(query))
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
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-dark">Payments</h1>
        <p className="text-sm sm:text-base text-text-muted mt-1">Record and view payment records</p>
      </div>
      <button
        onClick={handleCreate}
        className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 bg-primary-blue text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors text-sm sm:text-base font-medium"
      >
        <Plus size={18} />
        <span>Record Payment</span>
      </button>

      <div className="bg-card-white rounded-custom shadow-custom p-3 sm:p-4 lg:p-6">
        {payments.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                placeholder="Search payments..."
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
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Fee ID</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Amount Paid</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Payment Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => {
                    const fee = getFeeInfo(payment.fee_id)
                    return (
                      <tr key={payment.payment_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-text-dark">{payment.payment_id}</td>
                        <td className="py-3 px-4 text-sm text-text-dark">Fee #{payment.fee_id}</td>
                        <td className="py-3 px-4 text-sm text-text-dark font-medium">{formatCurrency(payment.amount_paid, currency)}</td>
                        <td className="py-3 px-4 text-sm text-text-muted">
                          {payment.payment_date ? (payment.payment_date.includes('T') ? payment.payment_date.split('T')[0] : payment.payment_date) : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-text-muted">{payment.method}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-6">
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
