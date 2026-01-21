import { useState, useEffect } from 'react'
import { useSettings } from '../contexts/SettingsContext'

function FeeForm({ fee, students, onSubmit, onCancel }) {
  const { currentAcademicYear, academicYears } = useSettings()
  const [formData, setFormData] = useState({
    studentId: '',
    amount: '',
    description: '',
    dueDate: '',
    academicYear: currentAcademicYear?.year || '',
    term: 'General',
    status: 'unpaid',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (fee) {
      setFormData({
        studentId: fee.studentId?._id || fee.studentId || '',
        amount: fee.amount || '',
        description: fee.description || '',
        dueDate: fee.dueDate ? new Date(fee.dueDate).toISOString().split('T')[0] : '',
        academicYear: fee.academicYear || currentAcademicYear?.year || '',
        term: fee.term || 'General',
        status: fee.status || 'unpaid',
      })
    } else {
      setFormData({
        studentId: '',
        amount: '',
        description: '',
        dueDate: '',
        academicYear: currentAcademicYear?.year || '',
        term: 'General',
        status: 'unpaid',
      })
    }
  }, [fee, currentAcademicYear])

  const validate = () => {
    const newErrors = {}

    if (!formData.studentId) {
      newErrors.studentId = 'Student is required'
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required'
    }

    if (!formData.academicYear) {
      newErrors.academicYear = 'Academic year is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
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
        <label htmlFor="studentId" className="block text-sm font-medium text-text-dark mb-2">
          Student <span className="text-red-500">*</span>
        </label>
        <select
          id="studentId"
          name="studentId"
          value={formData.studentId}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.studentId
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-200 focus:ring-primary-blue'
          }`}
        >
          <option value="">Select a student</option>
          {students.map((student) => (
            <option key={student._id} value={student._id}>
              {student.firstName} {student.lastName} (ID: {student.studentId})
            </option>
          ))}
        </select>
        {errors.studentId && <p className="mt-1 text-sm text-red-500">{errors.studentId}</p>}
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
          <label htmlFor="dueDate" className="block text-sm font-medium text-text-dark mb-2">
            Due Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.dueDate
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-200 focus:ring-primary-blue'
            }`}
          />
          {errors.dueDate && <p className="mt-1 text-sm text-red-500">{errors.dueDate}</p>}
        </div>

        <div>
          <label htmlFor="academicYear" className="block text-sm font-medium text-text-dark mb-2">
            Academic Year <span className="text-red-500">*</span>
          </label>
          <select
            id="academicYear"
            name="academicYear"
            value={formData.academicYear}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.academicYear
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-200 focus:ring-primary-blue'
            }`}
          >
            <option value="">Select academic year</option>
            {academicYears?.map((year) => (
              <option key={year._id} value={year.year}>
                {year.year}
              </option>
            ))}
          </select>
          {errors.academicYear && <p className="mt-1 text-sm text-red-500">{errors.academicYear}</p>}
        </div>

        <div>
          <label htmlFor="term" className="block text-sm font-medium text-text-dark mb-2">
            Term
          </label>
          <select
            id="term"
            name="term"
            value={formData.term}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            <option value="General">General</option>
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-text-dark mb-2">
            Description
          </label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            placeholder="e.g., Tuition Fee"
          />
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
            <option value="unpaid">Unpaid</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
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
