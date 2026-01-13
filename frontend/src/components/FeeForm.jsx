import { useState, useEffect } from 'react'

function FeeForm({ fee, students, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
    term: '',
    year: new Date().getFullYear(),
    status: 'UNPAID',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (fee) {
      setFormData({
        student_id: fee.student_id || '',
        amount: fee.amount || '',
        term: fee.term || '',
        year: fee.year || new Date().getFullYear(),
        status: fee.status || 'UNPAID',
      })
    } else {
      setFormData({
        student_id: '',
        amount: '',
        term: '',
        year: new Date().getFullYear(),
        status: 'UNPAID',
      })
    }
  }, [fee])

  const validate = () => {
    const newErrors = {}

    if (!formData.student_id) {
      newErrors.student_id = 'Student is required'
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    if (!formData.term.trim()) {
      newErrors.term = 'Term is required'
    }

    if (!formData.year || formData.year < 2000) {
      newErrors.year = 'Valid year is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSubmit({
        ...formData,
        student_id: parseInt(formData.student_id),
        amount: parseFloat(formData.amount),
        year: parseInt(formData.year),
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="student_id" className="block text-sm font-medium text-text-dark mb-2">
          Student <span className="text-red-500">*</span>
        </label>
        <select
          id="student_id"
          name="student_id"
          value={formData.student_id}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.student_id
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-200 focus:ring-primary-blue'
          }`}
        >
          <option value="">Select a student</option>
          {students.map((student) => (
            <option key={student.student_id} value={student.student_id}>
              {student.name} (ID: {student.student_id})
            </option>
          ))}
        </select>
        {errors.student_id && <p className="mt-1 text-sm text-red-500">{errors.student_id}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-text-dark mb-2">
            Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            min="0"
            step="0.01"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.amount
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-200 focus:ring-primary-blue'
            }`}
            placeholder="Enter amount"
          />
          {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
        </div>

        <div>
          <label htmlFor="term" className="block text-sm font-medium text-text-dark mb-2">
            Term <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="term"
            name="term"
            value={formData.term}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.term
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-200 focus:ring-primary-blue'
            }`}
            placeholder="e.g., Term 1, Semester 1"
          />
          {errors.term && <p className="mt-1 text-sm text-red-500">{errors.term}</p>}
        </div>

        <div>
          <label htmlFor="year" className="block text-sm font-medium text-text-dark mb-2">
            Year <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="year"
            name="year"
            value={formData.year}
            onChange={handleChange}
            min="2000"
            max="2100"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.year
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-200 focus:ring-primary-blue'
            }`}
          />
          {errors.year && <p className="mt-1 text-sm text-red-500">{errors.year}</p>}
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-text-dark mb-2">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors font-medium"
        >
          {fee ? 'Update Fee' : 'Add Fee'}
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

export default FeeForm
