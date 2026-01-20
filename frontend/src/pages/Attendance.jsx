import { useState, useEffect, useMemo } from 'react'
import { CheckCircle, Search, Plus, Edit, Trash2, AlertCircle, Users, Calendar } from 'lucide-react'
import { attendanceApi, studentsApi, classroomsApi, teacherApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useSettings } from '../contexts/SettingsContext'
import Modal from '../components/Modal'
import AttendanceForm from '../components/AttendanceForm'
import BulkAttendanceForm from '../components/BulkAttendanceForm'

function Attendance() {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  
  const [classrooms, setClassrooms] = useState([])
  const [selectedClassroom, setSelectedClassroom] = useState(null)
  const [classroomStudents, setClassroomStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAttendance, setEditingAttendance] = useState(null)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Export attendance to CSV
  const handleExportCSV = () => {
    if (!attendance.length) return;
    const headers = ['Date','Student','Status','Marked By'];
    const rows = attendance.map(a => [
      a.date ? (a.date.includes('T') ? a.date.split('T')[0] : a.date) : '',
      a.studentId?.name || a.studentId || '',
      typeof a.status === 'string' ? a.status : (a.status ? 'present' : 'absent'),
      a.markedBy?.email || a.markedBy || ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedClassroom?.grade}_${selectedClassroom?.section}_${selectedDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    loadClassrooms()
  }, [user])

  const loadClassrooms = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await classroomsApi.list()
      setClassrooms(data)
      if (data.length > 0) {
        setSelectedClassroom(data[0])
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load classrooms'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedClassroom) {
      loadClassroomStudents()
      loadAttendance()
    }
  }, [selectedClassroom, selectedDate])

  const loadClassroomStudents = async () => {
    if (!selectedClassroom) return
    try {
      // Fetch full student details for the classroom
      if (selectedClassroom._id) {
        const response = await teacherApi.getClassroomStudents(selectedClassroom._id)
        const students = response?.data || response || []
        setClassroomStudents(students)
      } else if (selectedClassroom.students && selectedClassroom.students.length > 0) {
        // Fallback: use students from classroom object if available
        setClassroomStudents(selectedClassroom.students)
      }
    } catch (err) {
      showError(err.message || 'Failed to load classroom students')
    }
  }

  const loadAttendance = async () => {
    if (!selectedClassroom) return
    try {
      setLoading(true)
      setError(null)
      // Fetch attendance for all students in this classroom
      const data = await attendanceApi.getByClassroom(selectedClassroom._id)
      setAttendance(data?.data || data || [])
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
      await loadAttendance()
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
        await loadAttendance()
      } catch (err) {
        const errorMessage = err.message || 'Failed to delete attendance record'
        showError(errorMessage)
      }
    }
  }

  const filteredAttendance = useMemo(() => {
    let filtered = attendance;
    
    // Filter by date
    if (selectedDate) {
      filtered = filtered.filter(a => {
        const aDate = a.date ? (a.date.includes('T') ? a.date.split('T')[0] : a.date) : ''
        return aDate === selectedDate
      })
    }

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter(a => (typeof a.status === 'string' ? a.status : '').toLowerCase() === statusFilter);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((record) => {
        const studentName = record.studentId?.name || record.studentId || ''
        return studentName.toLowerCase().includes(query)
      });
    }
    
    return filtered;
  }, [attendance, selectedDate, statusFilter, searchQuery])

  const presentCount = filteredAttendance.filter(a => a.status === 'present').length
  const absentCount = filteredAttendance.filter(a => a.status === 'absent').length
  const totalCount = filteredAttendance.length

  if (loading && classrooms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading attendance...</p>
        </div>
      </div>
    )
  }

  if (error && classrooms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-text-dark font-medium mb-2">Error loading attendance</p>
          <p className="text-text-muted mb-4">{error}</p>
          <button
            onClick={loadClassrooms}
            className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-text-dark flex items-center gap-2">
          <Users size={32} className="text-primary-blue" />
          Classroom Attendance
        </h1>
        <p className="text-text-muted mt-1">Mark and manage attendance by classroom</p>
      </div>

      {/* Classroom & Date Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card-white rounded-lg shadow-custom p-6">
        <div>
          <label className="block text-sm font-medium text-text-dark mb-2">Select Classroom</label>
          <select
            value={selectedClassroom?._id || ''}
            onChange={(e) => {
              const classroom = classrooms.find(c => c._id === e.target.value)
              setSelectedClassroom(classroom)
            }}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            {classrooms.map((classroom) => (
              <option key={classroom._id} value={classroom._id}>
                Grade {classroom.grade} - Section {classroom.section}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-dark mb-2 flex items-center gap-2">
            <Calendar size={16} />
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
          />
        </div>
      </div>

      {/* Action Buttons */}
      {user?.role !== 'student' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleCreate}
            className="flex items-center justify-center gap-2 bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors font-medium"
          >
            <Plus size={18} />
            <span>Mark Attendance</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Export CSV
          </button>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            <option value="">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
          </select>
        </div>
      )}

      {/* Classroom Info */}
      {selectedClassroom && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-text-muted mb-1">Classroom</p>
            <p className="font-semibold text-text-dark">Grade {selectedClassroom.grade}-{selectedClassroom.section}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-xs text-text-muted mb-1">Total Students</p>
            <p className="font-semibold text-green-600">{classroomStudents.length}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-text-muted mb-1">Present</p>
            <p className="font-semibold text-blue-600">{presentCount}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-xs text-text-muted mb-1">Absent</p>
            <p className="font-semibold text-red-600">{absentCount}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-card-white rounded-lg shadow-custom p-6">
        {filteredAttendance.length > 0 || classroomStudents.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
              <input
                type="text"
                placeholder="Search by student name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
          </div>
        )}

        {/* Attendance Table */}
        <div className="overflow-x-auto -mx-6 md:mx-0 md:overflow-visible">
          <table className="w-full min-w-max md:min-w-0">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-text-dark">Student</th>
                <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-text-dark">Status</th>
                <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-text-dark">Marked By</th>
                {user?.role !== 'student' && (
                  <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-text-dark">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={user?.role !== 'student' ? 4 : 3} className="py-8 px-4 text-center text-text-muted text-sm">
                    {selectedDate ? 'No attendance records for this date' : 'Select a date to view attendance'}
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((record) => (
                  <tr key={record._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-xs md:text-sm text-text-dark font-medium">
                      {record.studentId?.name || record.studentId || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                          record.status === 'present' ? 'bg-green-100 text-green-700' :
                          record.status === 'absent' ? 'bg-red-100 text-red-700' :
                          record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {record.status === 'present' && (<><CheckCircle size={14} /> Present</>)}
                        {record.status === 'absent' && ('Absent')}
                        {record.status === 'late' && ('Late')}
                        {record.status === 'excused' && ('Excused')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs md:text-sm text-text-muted">
                      {record.markedBy?.email || '-'}
                    </td>
                    {user?.role !== 'student' && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(record)}
                            className="text-primary-blue hover:text-primary-blue/80 text-xs md:text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                          >
                            <Edit size={16} />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(record._id)}
                            className="text-red-500 hover:text-red-600 text-xs md:text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                          >
                            <Trash2 size={16} />
                            <span className="hidden sm:inline">Delete</span>
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

        {filteredAttendance.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-text-muted">
            Showing {filteredAttendance.length} records
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
          classroom={selectedClassroom}
          students={classroomStudents}
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
