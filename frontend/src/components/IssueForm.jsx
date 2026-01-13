import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

function IssueForm({ issue, onSubmit, onCancel }) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    raised_by: '',
    type: '',
    details: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (issue) {
      setFormData({
        raised_by: issue.raised_by || '',
        type: issue.type || '',
        details: issue.details || '',
      })
    } else {
      // Auto-set raised_by based on user role
      const defaultRaisedBy = user?.role === 'student' ? 'student' : user?.role === 'teacher' ? 'teacher' : 'student'
      setFormData({
        raised_by: defaultRaisedBy,
        type: '',
        details: '',
      })
    }
  }, [issue, user])

  const validate = () => {
    const newErrors = {}

    if (!formData.raised_by) {
      newErrors.raised_by = 'Raised by is required'
    }

    if (!formData.type.trim()) {
      newErrors.type = 'Issue type is required'
    }

    if (!formData.details.trim()) {
      newErrors.details = 'Details are required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const issueTypes = [
    'Academic',
    'Administrative',
    'Technical',
    'Financial',
    'Facilities',
    'Other'
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="raised_by" className="block text-sm font-medium text-text-dark mb-2">
          Raised By <span className="text-red-500">*</span>
        </label>
        <select
          id="raised_by"
          name="raised_by"
          value={formData.raised_by}
          onChange={handleChange}
          disabled={!!issue || user?.role === 'student' || user?.role === 'teacher'}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.raised_by
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-200 focus:ring-primary-blue'
          } ${(issue || user?.role === 'student' || user?.role === 'teacher') ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        >
          <option value="">Select who raised the issue</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
        {errors.raised_by && <p className="mt-1 text-sm text-red-500">{errors.raised_by}</p>}
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-text-dark mb-2">
          Issue Type <span className="text-red-500">*</span>
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.type
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-200 focus:ring-primary-blue'
          }`}
        >
          <option value="">Select issue type</option>
          {issueTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
      </div>

      <div>
        <label htmlFor="details" className="block text-sm font-medium text-text-dark mb-2">
          Details <span className="text-red-500">*</span>
        </label>
        <textarea
          id="details"
          name="details"
          value={formData.details}
          onChange={handleChange}
          rows="4"
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.details
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-200 focus:ring-primary-blue'
          }`}
          placeholder="Describe the issue in detail..."
        />
        {errors.details && <p className="mt-1 text-sm text-red-500">{errors.details}</p>}
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors font-medium"
        >
          {issue ? 'Update Issue' : 'Create Issue'}
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

export default IssueForm
