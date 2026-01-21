import { useState, useEffect } from 'react'
import { homeworkApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { BookOpen, Plus, Trash2, Edit, Calendar, User, CheckCircle } from 'lucide-react'
import Modal from '../components/Modal'
import ErrorBoundary from '../components/ErrorBoundary'

function Homework({ classroomId }) {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const { currentAcademicYear } = useSettings()
  
  const [homework, setHomework] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHomework, setEditingHomework] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    dueDate: ''
  })

  useEffect(() => {
    loadHomework()
  }, [classroomId])

  const loadHomework = async () => {
    try {
      setLoading(true)
      const data = await homeworkApi.getByClassroom(
        classroomId,
        currentAcademicYear?.year
      )
      setHomework(data.homework || [])
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load homework')
      showError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClick = () => {
    setEditingHomework(null)
    setFormData({
      title: '',
      description: '',
      subject: '',
      dueDate: ''
    })
    setIsModalOpen(true)
  }

  const handleEditClick = (hw) => {
    setEditingHomework(hw)
    setFormData({
      title: hw.title,
      description: hw.description,
      subject: hw.subject,
      dueDate: hw.dueDate.split('T')[0]
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || !formData.subject || !formData.dueDate) {
      showError('All fields are required')
      return
    }

    try {
      const data = {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        dueDate: formData.dueDate,
        classroomId,
        academicYear: currentAcademicYear?.year
      }

      if (editingHomework) {
        await homeworkApi.update(editingHomework._id, data)
        success('Homework updated successfully')
      } else {
        await homeworkApi.create(data)
        success('Homework created successfully')
      }

      setIsModalOpen(false)
      await loadHomework()
    } catch (err) {
      showError(err.message || 'Failed to save homework')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this homework?')) {
      try {
        await homeworkApi.delete(id)
        success('Homework deleted successfully')
        await loadHomework()
      } catch (err) {
        showError(err.message || 'Failed to delete homework')
      }
    }
  }

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'head-teacher'

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-text-muted">Loading homework...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary-blue" />
            <h2 className="text-lg font-semibold text-text-dark">Homework</h2>
            <span className="text-sm text-text-muted">({homework.length})</span>
          </div>
          {isTeacher && (
            <button
              onClick={handleCreateClick}
              className="flex items-center gap-2 bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={18} />
              Add Homework
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {homework.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-text-muted opacity-50 mb-4" />
            <p className="text-text-muted">No homework yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {homework.map((hw) => (
              <div
                key={hw._id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-dark mb-1">{hw.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-text-muted mb-2">
                      <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {hw.subject}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        Due: {new Date(hw.dueDate).toLocaleDateString()}
                      </span>
                      {hw.teacher && (
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          {hw.teacher.firstName} {hw.teacher.lastName}
                        </span>
                      )}
                    </div>
                  </div>

                  {isTeacher && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(hw)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(hw._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-text-muted text-sm mb-3">{hw.description}</p>

                {hw.submissions && hw.submissions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-semibold text-text-muted mb-2">
                      Submissions: {hw.submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length}/{hw.submissions.length}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal for Create/Edit */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingHomework ? 'Edit Homework' : 'Add Homework'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-blue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-blue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="4"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-blue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">
                Due Date *
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-blue"
                required
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-text-dark hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-blue-700 transition"
              >
                {editingHomework ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </ErrorBoundary>
  )
}

export default Homework
