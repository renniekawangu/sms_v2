import { useState, useEffect, useMemo } from 'react'
import { CheckCircle, Search, AlertCircle, Users, Calendar } from 'lucide-react'
import { attendanceApi, classroomsApi, teacherApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [studentStatuses, setStudentStatuses] = useState({})
  const [submitting, setSubmitting] = useState(false)

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
        if (!Array.isArray(students) || students.length === 0) {
          setClassroomStudents([])
          showError('No students found for this classroom. Please check that students are assigned to this classroom in the backend.')
          // Debug log
          // eslint-disable-next-line no-console
          console.warn('No students found for classroom', selectedClassroom._id, students)
        } else {
          setClassroomStudents(students)
        }
      } else if (selectedClassroom.students && selectedClassroom.students.length > 0) {
        // Fallback: use students from classroom object if available
        setClassroomStudents(selectedClassroom.students)
      } else {
        setClassroomStudents([])
        showError('No students assigned to this classroom.')
      }
    } catch (err) {
      showError(err.message || 'Failed to load classroom students')
      // eslint-disable-next-line no-console
      console.error('Error loading classroom students:', err)
    }
  }

  const loadAttendance = async () => {
    if (!selectedClassroom) return
    try {
      setLoading(true)
      setError(null)
      // Fetch attendance for all students in this classroom
      const data = await attendanceApi.getByClassroom(selectedClassroom._id)
      // Filter records to only show for the selected date
      const allRecords = data?.data || data || []
      const filteredRecords = allRecords.filter(record => {
        if (!selectedDate) return true
        const recordDate = record.date.includes('T') ? record.date.split('T')[0] : record.date
        // eslint-disable-next-line no-console
        console.log('Date comparison:', { recordDate, selectedDate, match: recordDate === selectedDate })
        return recordDate === selectedDate
      })
      // eslint-disable-next-line no-console
      console.log('Loaded attendance records:', { 
        allRecords: allRecords.map(r => ({ _id: r._id, date: r.date, status: r.status })), 
        filteredRecords, 
        selectedDate 
      })
      setAttendance(filteredRecords)
    } catch (err) {
      const errorMessage = err.message || 'Failed to load attendance'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (studentId, status) => {
    setStudentStatuses(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? null : status
    }))
  }

  const handleMarkAttendanceSubmit = async () => {
    const recordsToSave = Object.entries(studentStatuses)
      .filter(([_, status]) => status !== null)
      .map(([studentId, status]) => ({
        studentId,
        status,
        date: selectedDate,
        markedBy: user?.user_id
      }))

    if (recordsToSave.length === 0) {
      showError('Please mark attendance for at least one student')
      return
    }

    try {
      setSubmitting(true)
      
      // Mark each attendance record
      for (const record of recordsToSave) {
        await attendanceApi.mark(record)
      }
      
      success(`Marked attendance for ${recordsToSave.length} student(s)`)
      setStudentStatuses({})
      
      // Add small delay to ensure backend has processed the records
      await new Promise(resolve => setTimeout(resolve, 300))
      await loadAttendance()
    } catch (err) {
      showError(err.message || 'Failed to mark attendance')
    } finally {
      setSubmitting(false)
    }
  }

  // Create a combined view of all classroom students with their attendance
  const studentAttendanceList = useMemo(() => {
    if (!classroomStudents.length) return []
    
    const list = classroomStudents.map(student => {
      // Find attendance record for this student on the selected date
      const attendanceRecord = attendance.find(a => {
        const studentMatch = a.studentId?._id === student._id || a.studentId === student._id
        const dateMatch = selectedDate ? (a.date ? (a.date.includes('T') ? a.date.split('T')[0] : a.date) : '') === selectedDate : true
        return studentMatch && dateMatch
      })
      
      return {
        ...student,
        attendanceRecord
      }
    }).filter(item => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      const name = item.name || [item.firstName, item.lastName].filter(Boolean).join(' ') || ''
      return name.toLowerCase().includes(query)
    })
    
    // eslint-disable-next-line no-console
    console.log('studentAttendanceList recalculated:', { 
      count: list.length, 
      attendance: attendance.length,
      withRecords: list.filter(s => s.attendanceRecord).length 
    })
    
    return list
  }, [classroomStudents, attendance, selectedDate, searchQuery])

  const presentCount = studentAttendanceList.filter(s => s.attendanceRecord?.status === 'present').length
  const absentCount = studentAttendanceList.filter(s => s.attendanceRecord?.status === 'absent').length
  const notMarkedCount = studentAttendanceList.filter(s => !s.attendanceRecord).length

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
        {classroomStudents.length > 0 && (
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
                <th className="text-center py-3 px-2 text-xs md:text-sm font-semibold text-text-dark">Present</th>
                <th className="text-center py-3 px-2 text-xs md:text-sm font-semibold text-text-dark">Absent</th>
                <th className="text-center py-3 px-2 text-xs md:text-sm font-semibold text-text-dark">Late</th>
                <th className="text-center py-3 px-2 text-xs md:text-sm font-semibold text-text-dark">Excused</th>
              </tr>
            </thead>
            <tbody>
              {studentAttendanceList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-text-muted text-sm">
                    {classroomStudents.length === 0 ? 'No students in this classroom' : 'No students match your search'}
                  </td>
                </tr>
              ) : (
                studentAttendanceList.map((student) => {
                  const studentName = student.name || [student.firstName, student.lastName].filter(Boolean).join(' ') || 'Unknown'
                  const selectedStatus = studentStatuses[student._id]
                  
                  return (
                    <tr key={student._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-xs md:text-sm text-text-dark font-medium">
                        {studentName}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedStatus === 'present'}
                          onChange={() => handleStatusChange(student._id, 'present')}
                          className="w-4 h-4 cursor-pointer accent-green-600"
                          title="Mark as Present"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedStatus === 'absent'}
                          onChange={() => handleStatusChange(student._id, 'absent')}
                          className="w-4 h-4 cursor-pointer accent-red-600"
                          title="Mark as Absent"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedStatus === 'late'}
                          onChange={() => handleStatusChange(student._id, 'late')}
                          className="w-4 h-4 cursor-pointer accent-yellow-600"
                          title="Mark as Late"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedStatus === 'excused'}
                          onChange={() => handleStatusChange(student._id, 'excused')}
                          className="w-4 h-4 cursor-pointer accent-blue-600"
                          title="Mark as Excused"
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Submit Button - Show only if there are pending changes */}
        {Object.values(studentStatuses).some(s => s !== null) && user?.role !== 'student' && (
          <div className="mt-6 flex gap-3 sticky bottom-0 bg-white p-4 border-t border-gray-200 rounded-b-lg">
            <button
              onClick={handleMarkAttendanceSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-semibold"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Submit Attendance ({Object.values(studentStatuses).filter(s => s !== null).length})
                </>
              )}
            </button>
            <button
              onClick={() => setStudentStatuses({})}
              disabled={submitting}
              className="px-4 py-3 bg-gray-200 text-text-dark rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors font-medium"
            >
              Clear
            </button>
          </div>
        )}

        {studentAttendanceList.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-text-muted">
            Showing {studentAttendanceList.length} students
          </div>
        )}
      </div>
    </div>
  )
}

export default Attendance