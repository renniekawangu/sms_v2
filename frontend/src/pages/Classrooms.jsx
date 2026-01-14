import { useState, useEffect, useMemo } from 'react'
import { School, Search, Plus, Edit, Trash2, AlertCircle } from 'lucide-react'
import { classroomsApi, adminApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import Modal from '../components/Modal'
import ClassroomForm from '../components/ClassroomForm'

function Classrooms() {
  const [classrooms, setClassrooms] = useState([])
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClassroom, setEditingClassroom] = useState(null)
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [classroomsData, staffResp, studentsResp] = await Promise.all([
        classroomsApi.list(),
        adminApi.listStaff({ role: 'teacher', limit: 1000 }),
        adminApi.listStudents({ limit: 1000 })
      ])
      setClassrooms(classroomsData)
      // Normalize teachers to {_id, name}
      const teacherList = (staffResp.staff || []).map(t => ({
        _id: t._id,
        name: [t.firstName, t.lastName].filter(Boolean).join(' ').trim() || 'Teacher'
      }))
      setTeachers(teacherList)
      // Normalize students to {_id, name}
      const studentList = (studentsResp.students || []).map(s => ({
        _id: s._id,
        name: s.name || [s.firstName, s.lastName].filter(Boolean).join(' ').trim() || s.email || 'Student'
      }))
      setStudents(studentList)
    } catch (err) {
      const errorMessage = err.message || 'Failed to load data'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingClassroom(null)
    setIsModalOpen(true)
  }

  const handleEdit = (classroom) => {
    setEditingClassroom(classroom)
    setIsModalOpen(true)
  }

  const handleSubmit = async (formData) => {
    try {
      if (editingClassroom) {
        await classroomsApi.update(editingClassroom._id, formData)
        success('Classroom updated successfully')
      } else {
        await classroomsApi.create(formData)
        success('Classroom created successfully')
      }
      setIsModalOpen(false)
      setEditingClassroom(null)
      await loadData()
    } catch (err) {
      const errorMessage = err.message || (editingClassroom ? 'Failed to update classroom' : 'Failed to create classroom')
      showError(errorMessage)
    }
  }

  const handleDelete = async (_id) => {
    if (window.confirm('Are you sure you want to delete this classroom?')) {
      try {
        await classroomsApi.delete(_id)
        success('Classroom deleted successfully')
        await loadData()
      } catch (err) {
        const errorMessage = err.message || 'Failed to delete classroom'
        showError(errorMessage)
      }
    }
  }

  const getTeacherName = (teacher_id) => {
    if (!teacher_id) return 'No teacher assigned'
    return teachers.find(t => t._id === teacher_id)?.name || 'Unknown teacher'
  }

  const filteredClassrooms = useMemo(() => {
    if (!searchQuery.trim()) return classrooms
    const query = searchQuery.toLowerCase()
    return classrooms.filter((classroom) => {
      const teacherName = getTeacherName(classroom.teacher_id).toLowerCase()
      return (
        teacherName.includes(query) ||
        classroom.grade?.toString().includes(query) ||
        classroom.section?.toLowerCase().includes(query)
      )
    })
  }, [classrooms, teachers, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading classrooms...</p>
        </div>
      </div>
    )
  }

  if (error && classrooms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-text-dark font-medium mb-2">Error loading classrooms</p>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-dark">Classrooms</h1>
          <p className="text-text-muted mt-1">Manage all classrooms</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors"
        >
          <Plus size={20} />
          Add Classroom
        </button>
      </div>

      <div className="bg-card-white rounded-custom shadow-custom p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
            <input
              type="text"
              placeholder="Search classrooms by grade, section, or teacher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClassrooms.length === 0 ? (
            <div className="col-span-full text-center py-8 text-text-muted">
              No classrooms found
            </div>
          ) : (
            filteredClassrooms.map((classroom) => (
              <div key={classroom._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <School className="text-primary-blue" size={24} />
                    <div>
                      <h3 className="font-semibold text-text-dark">Grade {classroom.grade} - Section {classroom.section}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(classroom)}
                      className="text-primary-blue hover:text-primary-blue/80 p-1"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(classroom._id)}
                      className="text-red-500 hover:text-red-600 p-1"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-text-muted">Teacher: {getTeacherName(classroom.teacher_id)}</p>
                  <p className="text-text-muted">Students: {classroom.students?.length || 0}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6">
          <p className="text-sm text-text-muted">
            Showing {filteredClassrooms.length} of {classrooms.length} classrooms
          </p>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingClassroom(null)
        }}
        title={editingClassroom ? 'Edit Classroom' : 'Add New Classroom'}
      >
        <ClassroomForm
          classroom={editingClassroom}
          teachers={teachers}
          students={students}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingClassroom(null)
          }}
        />
      </Modal>
    </div>
  )
}

export default Classrooms
