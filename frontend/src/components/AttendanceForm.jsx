import { useState, useEffect } from 'react'

function AttendanceForm({ attendance, students, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    user_id: '',
    date: new Date().toISOString().split('T')[0],
    status: true,
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (attendance) {
      setFormData({
        user_id: attendance.user_id || '',
        date: attendance.date ? (attendance.date.includes('T') ? attendance.date.split('T')[0] : attendance.date) : new Date().toISOString().split('T')[0],
        status: attendance.status !== undefined ? attendance.status : true,
      })
    } else {
      setFormData({
        user_id: '',
        date: new Date().toISOString().split('T')[0],
        status: true,
      })
    }
  }, [attendance])

  const validate = () => {
    const newErrors = {}

    if (!formData.user_id) {
      newErrors.user_id = 'Student is required'
    }

    if (!formData.date) {
      newErrors.date = 'Date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSubmit({
        ...formData,
        user_id: parseInt(formData.user_id),
        date: formData.date ? new Date(formData.date).toISOString() : formData.date,
        status: formData.status === 'true' || formData.status === true,
      })
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : (name === 'status' ? value === 'true' : value)
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="user_id" className="block text-sm font-medium text-text-dark mb-2">
          Student <span className="text-red-500">*</span>
        </label>
        <select
          id="user_id"
          name="user_id"
          value={formData.user_id}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            errors.user_id
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
        {errors.user_id && <p className="mt-1 text-sm text-red-500">{errors.user_id}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-text-dark mb-2">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.date
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-200 focus:ring-primary-blue'
            }`}
          />
          {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-text-dark mb-2">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            id="status"
            name="status"
            value={formData.status ? 'true' : 'false'}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            <option value="true">Present</option>
            <option value="false">Absent</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors font-medium"
        >
          {attendance ? 'Update Attendance' : 'Mark Attendance'}
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

export default AttendanceForm
