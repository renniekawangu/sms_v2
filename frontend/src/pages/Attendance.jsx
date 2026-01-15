import { useState, useEffect, useMemo } from 'react'
import { CheckCircle, Search, Plus, Edit, Trash2, AlertCircle } from 'lucide-react'
import { attendanceApi, studentsApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Modal from '../components/Modal'
import AttendanceForm from '../components/AttendanceForm'

function Attendance() {
  const { user } = useAuth()
  const [attendance, setAttendance] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAttendance, setEditingAttendance] = useState(null)
  const { success, error: showError } = useToast()

  useEffect(() => {
    if (user?.role !== 'student') {
      loadStudents()
    }
  }, [user])

  useEffect(() => {
    if (selectedStudent || user?.role === 'student') {
      loadAttendance(user?.role === 'student' ? user.user_id : selectedStudent)
    }
  }, [selectedStudent, user])

  const loadStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await studentsApi.list()
      setStudents(data)
      if (data.length > 0) {
        setSelectedStudent(data[0].student_id)
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load students'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const loadAttendance = async (user_id) => {
    try {
      setLoading(true)
      setError(null)
      const data = await attendanceApi.getByUser(user_id)
      setAttendance(data)
    } catch (err) {
      const errorMessage = err.message || 'Failed to load attendance'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingAttendance(null)
    setIsModalOpen(true)
  }

  const handleEdit = (record) => {
    setEditingAttendance(record)
    setIsModalOpen(true)
  }

  const handleSubmit = async (formData) => {
    try {
      const attendanceData = { ...formData, markedBy: user?.user_id };
      if (editingAttendance) {
        await attendanceApi.update(editingAttendance._id, attendanceData)
        success('Attendance updated successfully')
      } else {
        await attendanceApi.mark(attendanceData)
        success('Attendance marked successfully')
      }
      setIsModalOpen(false)
      setEditingAttendance(null)
      if (selectedStudent || user?.role === 'student') {
        await loadAttendance(user?.role === 'student' ? user.user_id : selectedStudent)
      }
    } catch (err) {
      const errorMessage = err.message || (editingAttendance ? 'Failed to update attendance' : 'Failed to mark attendance')
      showError(errorMessage)
    }
  }

  const handleDelete = async (attendance_id) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      try {
        await attendanceApi.delete(attendance_id)
        success('Attendance record deleted successfully')
        if (selectedStudent || user?.role === 'student') {
          await loadAttendance(user?.role === 'student' ? user.user_id : selectedStudent)
        }
      } catch (err) {
        const errorMessage = err.message || 'Failed to delete attendance record'
        showError(errorMessage)
      }
    }
  }

  const filteredAttendance = useMemo(() => {
    if (!searchQuery.trim()) return attendance
    const query = searchQuery.toLowerCase()
    return attendance.filter((record) => {
      const dateStr = record.date ? (record.date.includes('T') ? record.date.split('T')[0] : record.date) : ''
      return (
        dateStr.includes(query) ||
        (record.status ? 'present' : 'absent').includes(query)
      )
    })
  }, [attendance, searchQuery])

  const presentCount = attendance.filter(a => a.status).length
  const absentCount = attendance.filter(a => !a.status).length
  const totalCount = attendance.length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading attendance...</p>
        </div>
      </div>
    )
  }

  if (error && attendance.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-text-dark font-medium mb-2">Error loading attendance</p>
          <p className="text-text-muted mb-4">{error}</p>
          <button
            onClick={() => loadAttendance(user?.role === 'student' ? user.user_id : selectedStudent)}
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
          <h1 className="text-2xl font-semibold text-text-dark">Attendance</h1>
          <p className="text-text-muted mt-1">Manage attendance records</p>
        </div>
        <div className="flex items-center gap-3">
          {user?.role !== 'student' && students.length > 0 && (
            <select
              value={selectedStudent || ''}
              onChange={(e) => setSelectedStudent(Number(e.target.value))}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              {students.map((student) => (
                <option key={student.student_id} value={student.student_id}>
                  {student.name}
                </option>
              ))}
            </select>
          )}
          {user?.role !== 'student' && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors"
            >
              <Plus size={20} />
              Mark Attendance
            </button>
          )}
        </div>
      </div>

      {totalCount > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card-white rounded-custom shadow-custom p-4">
            <p className="text-sm text-text-muted mb-1">Total Days</p>
            <p className="text-2xl font-semibold text-text-dark">{totalCount}</p>
          </div>
          <div className="bg-card-white rounded-custom shadow-custom p-4">
            <p className="text-sm text-text-muted mb-1">Present</p>
            <p className="text-2xl font-semibold text-green-600">{presentCount}</p>
          </div>
          <div className="bg-card-white rounded-custom shadow-custom p-4">
            <p className="text-sm text-text-muted mb-1">Absent</p>
            <p className="text-2xl font-semibold text-red-600">{absentCount}</p>
          </div>
        </div>
      )}

      <div className="bg-card-white rounded-custom shadow-custom p-6">
        {attendance.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
              <input
                type="text"
                placeholder="Search attendance by date or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Status</th>
                {user?.role !== 'student' && (
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={user?.role !== 'student' ? 3 : 2} className="py-8 text-center text-text-muted">
                    {attendance.length === 0 ? 'No attendance records found' : 'No records match your search'}
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((record) => (
                  <tr key={record._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-text-dark">
                      {record.date ? (record.date.includes('T') ? record.date.split('T')[0] : record.date) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          record.status
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {record.status ? (
                          <>
                            <CheckCircle size={14} />
                            Present
                          </>
                        ) : (
                          'Absent'
                        )}
                      </span>
                    </td>
                    {user?.role !== 'student' && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEdit(record)}
                            className="text-primary-blue hover:text-primary-blue/80 text-sm font-medium flex items-center gap-1"
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(record._id)}
                            className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-1"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {attendance.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-text-muted">
              Showing {filteredAttendance.length} of {attendance.length} records
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingAttendance(null)
        }}
        title={editingAttendance ? 'Edit Attendance' : 'Mark Attendance'}
      >
        <AttendanceForm
          attendance={editingAttendance}
          students={students}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingAttendance(null)
          }}
        />
      </Modal>
    </div>
  )
}

export default Attendance
