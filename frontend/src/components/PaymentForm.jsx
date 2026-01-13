import { useState, useEffect } from 'react'

function PaymentForm({ payment, fees, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    fee_id: '',
    amount_paid: '',
    payment_date: new Date().toISOString().split('T')[0],
    method: 'Cash',
  })
  const [errors, setErrors] = useState({})
  const [selectedFee, setSelectedFee] = useState(null)

  useEffect(() => {
    if (payment) {
      setFormData({
        fee_id: payment.fee_id || '',
        amount_paid: payment.amount_paid || '',
        payment_date: payment.payment_date ? (payment.payment_date.includes('T') ? payment.payment_date.split('T')[0] : payment.payment_date) : new Date().toISOString().split('T')[0],
        method: payment.method || 'Cash',
      })
    } else {
      setFormData({
        fee_id: '',
        amount_paid: '',
        payment_date: new Date().toISOString().split('T')[0],
        method: 'Cash',
      })
    }
  }, [payment])

  useEffect(() => {
    if (formData.fee_id) {
      const fee = fees.find(f => f.fee_id === parseInt(formData.fee_id))
      setSelectedFee(fee)
      if (fee) {
        // Set max amount to remaining balance
        const maxAmount = fee.amount
        if (formData.amount_paid > maxAmount) {
          setFormData(prev => ({ ...prev, amount_paid: maxAmount }))
        }
      }
    } else {
      setSelectedFee(null)
    }
  }, [formData.fee_id, fees])

  const validate = () => {
    const newErrors = {}

    if (!formData.fee_id) {
      newErrors.fee_id = 'Fee is required'
    }

    if (!formData.amount_paid || formData.amount_paid <= 0) {
      newErrors.amount_paid = 'Amount must be greater than 0'
    }

    if (selectedFee && formData.amount_paid > selectedFee.amount) {
      newErrors.amount_paid = `Amount cannot exceed fee amount ($${selectedFee.amount})`
    }

    if (!formData.payment_date) {
      newErrors.payment_date = 'Payment date is required'
    }

    if (!formData.method) {
      newErrors.method = 'Payment method is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      // Convert date to ISO string and numbers for backend
      onSubmit({
        ...formData,
        fee_id: parseInt(formData.fee_id),
        amount_paid: parseFloat(formData.amount_paid),
        payment_date: formData.payment_date ? new Date(formData.payment_date).toISOString() : formData.payment_date
      })
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  // Filter fees to show only unpaid or partially paid
  const availableFees = fees.filter(f => f.status !== 'PAID')

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="fee_id" className="block text-sm font-medium text-text-dark mb-2">
          Fee <span className="text-red-500">*</span>
        </label>
        <select
          id="fee_id"
          name="fee_id"
          value={formData.fee_id}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.fee_id
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-200 focus:ring-primary-blue'
          }`}
        >
          <option value="">Select a fee</option>
          {availableFees.map((fee) => (
            <option key={fee.fee_id} value={fee.fee_id}>
              Fee #{fee.fee_id} - ${fee.amount} ({fee.term} {fee.year}) - {fee.status}
            </option>
          ))}
        </select>
        {errors.fee_id && <p className="mt-1 text-sm text-red-500">{errors.fee_id}</p>}
        {selectedFee && (
          <p className="mt-1 text-sm text-text-muted">
            Fee Amount: ${selectedFee.amount} | Status: {selectedFee.status}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount_paid" className="block text-sm font-medium text-text-dark mb-2">
            Amount Paid <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="amount_paid"
            name="amount_paid"
            value={formData.amount_paid}
            onChange={handleChange}
            min="0"
            max={selectedFee ? selectedFee.amount : undefined}
            step="0.01"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.amount_paid
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-200 focus:ring-primary-blue'
            }`}
            placeholder="Enter amount"
          />
          {errors.amount_paid && <p className="mt-1 text-sm text-red-500">{errors.amount_paid}</p>}
        </div>

        <div>
          <label htmlFor="payment_date" className="block text-sm font-medium text-text-dark mb-2">
            Payment Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="payment_date"
            name="payment_date"
            value={formData.payment_date}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.payment_date
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-200 focus:ring-primary-blue'
            }`}
          />
          {errors.payment_date && <p className="mt-1 text-sm text-red-500">{errors.payment_date}</p>}
        </div>

        <div>
          <label htmlFor="method" className="block text-sm font-medium text-text-dark mb-2">
            Payment Method <span className="text-red-500">*</span>
          </label>
          <select
            id="method"
            name="method"
            value={formData.method}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.method
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-200 focus:ring-primary-blue'
            }`}
          >
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Online">Online</option>
          </select>
          {errors.method && <p className="mt-1 text-sm text-red-500">{errors.method}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors font-medium"
        >
          Record Payment
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-200 text-text-dark px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default PaymentForm
