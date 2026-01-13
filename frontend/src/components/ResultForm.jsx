import { useState, useEffect } from 'react'

function ResultForm({ result, students, exams, subjects, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    student_id: '',
    exam_id: '',
    subject_id: '',
    marks: '',
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (result) {
      setFormData({
        student_id: result.student_id || '',
        exam_id: result.exam_id || '',
        subject_id: result.subject_id || '',
        marks: result.marks || '',
      })
    } else {
      setFormData({
        student_id: '',
        exam_id: '',
        subject_id: '',
        marks: '',
      })
    }
  }, [result])

  const validate = () => {
    const newErrors = {}

    if (!formData.student_id) {
      newErrors.student_id = 'Student is required'
    }

    if (!formData.exam_id) {
      newErrors.exam_id = 'Exam is required'
    }

    if (!formData.subject_id) {
      newErrors.subject_id = 'Subject is required'
    }

    if (!formData.marks || formData.marks < 0 || formData.marks > 100) {
      newErrors.marks = 'Marks must be between 0 and 100'
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
        exam_id: parseInt(formData.exam_id),
        subject_id: parseInt(formData.subject_id),
        marks: parseFloat(formData.marks),
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
          <label htmlFor="exam_id" className="block text-sm font-medium text-text-dark mb-2">
            Exam <span className="text-red-500">*</span>
          </label>
          <select
            id="exam_id"
            name="exam_id"
            value={formData.exam_id}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.exam_id
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-200 focus:ring-primary-blue'
            }`}
          >
            <option value="">Select an exam</option>
            {exams.map((exam) => (
              <option key={exam.exam_id} value={exam.exam_id}>
                {exam.name} (ID: {exam.exam_id})
              </option>
            ))}
          </select>
          {errors.exam_id && <p className="mt-1 text-sm text-red-500">{errors.exam_id}</p>}
        </div>

        <div>
          <label htmlFor="subject_id" className="block text-sm font-medium text-text-dark mb-2">
            Subject <span className="text-red-500">*</span>
          </label>
          <select
            id="subject_id"
            name="subject_id"
            value={formData.subject_id}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.subject_id
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-200 focus:ring-primary-blue'
            }`}
          >
            <option value="">Select a subject</option>
            {subjects.map((subject) => (
              <option key={subject.subject_id} value={subject.subject_id}>
                {subject.name} (Grade {subject.grade})
              </option>
            ))}
          </select>
          {errors.subject_id && <p className="mt-1 text-sm text-red-500">{errors.subject_id}</p>}
        </div>

        <div>
          <label htmlFor="marks" className="block text-sm font-medium text-text-dark mb-2">
            Marks <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="marks"
            name="marks"
            value={formData.marks}
            onChange={handleChange}
            min="0"
            max="100"
            step="0.01"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.marks
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-200 focus:ring-primary-blue'
            }`}
            placeholder="Enter marks (0-100)"
          />
          {errors.marks && <p className="mt-1 text-sm text-red-500">{errors.marks}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors font-medium"
        >
          {result ? 'Update Result' : 'Add Result'}
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

export default ResultForm
