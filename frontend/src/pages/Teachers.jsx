import { useState, useEffect, useMemo } from 'react'
import { User, Search, AlertCircle, Plus, Edit, Trash2 } from 'lucide-react'
import { teachersApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import Modal from '../components/Modal'
import TeacherForm from '../components/TeacherForm'

function Teachers() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadTeachers()
  }, [])

  const loadTeachers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await teachersApi.list()
      setTeachers(data)
    } catch (err) {
      const errorMessage = err.message || 'Failed to load teachers'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingTeacher(null)
    setIsModalOpen(true)
  }

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher)
    setIsModalOpen(true)
  }

  const handleSubmit = async (formData) => {
    try {
      if (editingTeacher) {
        // Use _id (ObjectId) for update operations
        await teachersApi.update(editingTeacher._id || editingTeacher.teacher_id, formData)
        success('Teacher updated successfully')
      } else {
        await teachersApi.create(formData)
        success('Teacher created successfully')
      }
      setIsModalOpen(false)
      setEditingTeacher(null)
      await loadTeachers()
    } catch (err) {
      const errorMessage = err.message || (editingTeacher ? 'Failed to update teacher' : 'Failed to create teacher')
      showError(errorMessage)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        // Use _id (ObjectId) for delete operations
        await teachersApi.delete(id)
        success('Teacher deleted successfully')
        await loadTeachers()
      } catch (err) {
        const errorMessage = err.message || 'Failed to delete teacher'
        showError(errorMessage)
      }
    }
  }

  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return teachers
    const query = searchQuery.toLowerCase()
    return teachers.filter((teacher) => {
      return (
        teacher.name?.toLowerCase().includes(query) ||
        teacher.email?.toLowerCase().includes(query) ||
        teacher.teacher_id?.toString().includes(query)
      )
    })
  }, [teachers, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading teachers...</p>
        </div>
      </div>
    )
  }

  if (error && teachers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-text-dark font-medium mb-2">Error loading teachers</p>
          <p className="text-text-muted mb-4">{error}</p>
          <button
            onClick={loadTeachers}
            className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-dark">Teachers</h1>
          <p className="text-text-muted mt-1">Manage all teacher records</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors"
        >
          <Plus size={20} />
          Add Teacher
        </button>
      </div>

      <div className="bg-card-white rounded-custom shadow-custom p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              aria-label="Search teachers"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Phone</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">DOB</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Date of Join</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-text-muted">
                    No teachers found
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher._id || teacher.teacher_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-text-dark">{teacher.teacher_id}</td>
                    <td className="py-3 px-4 text-sm text-text-dark font-medium">{teacher.name}</td>
                    <td className="py-3 px-4 text-sm text-text-muted">{teacher.email}</td>
                    <td className="py-3 px-4 text-sm text-text-muted">{teacher.phone}</td>
                    <td className="py-3 px-4 text-sm text-text-muted">
                      {teacher.dob ? (teacher.dob.includes('T') ? teacher.dob.split('T')[0] : teacher.dob) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-muted">
                      {teacher.date_of_join ? (teacher.date_of_join.includes('T') ? teacher.date_of_join.split('T')[0] : teacher.date_of_join) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="text-primary-blue hover:text-primary-blue/80 text-sm font-medium flex items-center gap-1"
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(teacher._id || teacher.teacher_id)}
                          className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-1"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <p className="text-sm text-text-muted">
            Showing {filteredTeachers.length} of {teachers.length} teachers
          </p>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTeacher(null)
        }}
        title={editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
      >
        <TeacherForm
          teacher={editingTeacher}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingTeacher(null)
          }}
        />
      </Modal>
    </div>
  )
}

export default Teachers
