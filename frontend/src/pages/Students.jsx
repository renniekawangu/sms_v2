import { useState, useEffect, useMemo } from 'react'
import { GraduationCap, Search, Plus, Edit, Trash2, AlertCircle } from 'lucide-react'
import { studentsApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import Modal from '../components/Modal'
import StudentForm from '../components/StudentForm'

function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await studentsApi.list()
      setStudents(data)
    } catch (err) {
      const errorMessage = err.message || 'Failed to load students'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingStudent(null)
    setIsModalOpen(true)
  }

  const handleEdit = (student) => {
    setEditingStudent(student)
    setIsModalOpen(true)
  }

  const handleSubmit = async (formData) => {
    try {
      if (editingStudent) {
        await studentsApi.update(editingStudent.student_id, formData)
        success('Student updated successfully')
      } else {
        await studentsApi.create(formData)
        success('Student created successfully')
      }
      setIsModalOpen(false)
      setEditingStudent(null)
      await loadStudents()
    } catch (err) {
      const errorMessage = err.message || (editingStudent ? 'Failed to update student' : 'Failed to create student')
      showError(errorMessage)
    }
  }

  const handleDelete = async (student_id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentsApi.delete(student_id)
        success('Student deleted successfully')
        await loadStudents()
      } catch (err) {
        const errorMessage = err.message || 'Failed to delete student'
        showError(errorMessage)
      }
    }
  }

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students
    const query = searchQuery.toLowerCase()
    return students.filter((student) => {
      return (
        student.name?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        student.student_id?.toString().includes(query)
      )
    })
  }, [students, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading students...</p>
        </div>
      </div>
    )
  }

  if (error && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-text-dark font-medium mb-2">Error loading students</p>
          <p className="text-text-muted mb-4">{error}</p>
          <button
            onClick={loadStudents}
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
          <h1 className="text-2xl font-semibold text-text-dark">Students</h1>
          <p className="text-text-muted mt-1">Manage all student records</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors"
        >
          <Plus size={20} />
          Add Student
        </button>
      </div>

      <div className="bg-card-white rounded-custom shadow-custom p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              aria-label="Search students"
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
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-text-muted">
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.student_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-text-dark">{student.student_id}</td>
                    <td className="py-3 px-4 text-sm text-text-dark font-medium">{student.name}</td>
                    <td className="py-3 px-4 text-sm text-text-muted">{student.email}</td>
                    <td className="py-3 px-4 text-sm text-text-muted">{student.phone}</td>
                    <td className="py-3 px-4 text-sm text-text-muted">
                      {student.dob ? (student.dob.includes('T') ? student.dob.split('T')[0] : student.dob) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-muted">
                      {student.date_of_join ? (student.date_of_join.includes('T') ? student.date_of_join.split('T')[0] : student.date_of_join) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(student)}
                          className="text-primary-blue hover:text-primary-blue/80 text-sm font-medium flex items-center gap-1"
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(student.student_id)}
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

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Showing {filteredStudents.length} of {students.length} students
          </p>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingStudent(null)
        }}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
      >
        <StudentForm
          student={editingStudent}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingStudent(null)
          }}
        />
      </Modal>
    </div>
  )
}

export default Students
