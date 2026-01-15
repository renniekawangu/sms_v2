import { useState, useEffect, useMemo } from 'react'
import { CheckCircle, Search, Plus, Edit, Trash2, AlertCircle } from 'lucide-react'
import { attendanceApi, studentsApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Modal from '../components/Modal'
import AttendanceForm from '../components/AttendanceForm'

function Attendance() {
          const [startDate, setStartDate] = useState('')
          const [endDate, setEndDate] = useState('')
        const [statusFilter, setStatusFilter] = useState('')
        const [subjectFilter, setSubjectFilter] = useState('')
      // Export attendance to CSV
      const handleExportCSV = () => {
        if (!attendance.length) return;
        const headers = ['Date','Status','Subject','Student','Marked By'];
        const rows = attendance.map(a => [
          a.date ? (a.date.includes('T') ? a.date.split('T')[0] : a.date) : '',
          typeof a.status === 'string' ? a.status : (a.status ? 'present' : 'absent'),
          a.subject || '',
          a.studentId?.name || a.studentId || '',
          a.markedBy?.email || a.markedBy || ''
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'attendance_report.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
    const [bulkImporting, setBulkImporting] = useState(false)
    const [bulkProgress, setBulkProgress] = useState({ total: 0, success: 0, error: 0 })
    const [bulkErrors, setBulkErrors] = useState([])

    // Bulk import handler
    const handleBulkImport = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      setBulkImporting(true)
      setBulkProgress({ total: 0, success: 0, error: 0 })
      setBulkErrors([])
      try {
        const text = await file.text()
        const lines = text.split(/\r?\n/).filter(Boolean)
        const headers = lines[0].split(',').map(h => h.trim())
        const required = ['studentId','status','date','subject']
        if (!required.every(h => headers.includes(h))) {
          showError('CSV must have headers: studentId,status,date,subject')
          setBulkImporting(false)
          return
        }
        const records = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim())
          const obj = {}
          headers.forEach((h,i) => { obj[h]=values[i] })
          return obj
        })
        setBulkProgress({ total: records.length, success: 0, error: 0 })
        let success = 0, error = 0, errors = []
        for (const rec of records) {
          try {
            await attendanceApi.mark({ ...rec, markedBy: user.user_id })
            success++
          } catch (err) {
            error++
            errors.push({ rec, err: err.message })
          }
          setBulkProgress({ total: records.length, success, error })
        }
        setBulkErrors(errors)
        if (success) success(`${success} attendance records imported.`)
        if (error) showError(`${error} records failed.`)
        await loadAttendance(selectedStudent || user.user_id)
      } catch (err) {
        showError('Bulk import failed: ' + err.message)
      }
      setBulkImporting(false)
    }
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
        let filtered = attendance;
        if (startDate) {
          filtered = filtered.filter(a => {
            const d = new Date(a.date)
            return d >= new Date(startDate)
          })
        }
        if (endDate) {
          filtered = filtered.filter(a => {
            const d = new Date(a.date)
            return d <= new Date(endDate)
          })
        }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((record) => {
        const dateStr = record.date ? (record.date.includes('T') ? record.date.split('T')[0] : record.date) : '';
        return dateStr.includes(query) || (typeof record.status === 'string' ? record.status : '').toLowerCase().includes(query);
      });
    }
    if (statusFilter) {
      filtered = filtered.filter(a => (typeof a.status === 'string' ? a.status : '').toLowerCase() === statusFilter);
    }
    if (subjectFilter) {
      filtered = filtered.filter(a => (a.subject || '').toLowerCase() === subjectFilter);
    }
    return filtered;
  }, [attendance, searchQuery, statusFilter, subjectFilter]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students
    const query = searchQuery.toLowerCase()
    return students.filter((student) => {
      const fullName = [student.firstName, student.lastName].filter(Boolean).join(' ').toLowerCase()
      return (
        fullName.includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        student.student_id?.toString().includes(query)
      )
    })
  }, [students, searchQuery])

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
  };
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
        <button
          onClick={handleExportCSV}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium mr-4"
        >
          Export to CSV
        </button>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-2 py-1 border rounded-lg mr-2"
        >
          <option value="">All Statuses</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="late">Late</option>
          <option value="excused">Excused</option>
        </select>
        <select
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          className="px-2 py-1 border rounded-lg"
        >
          <option value="">All Subjects</option>
          {[...new Set(attendance.map(a => a.subject).filter(Boolean))].map(subject => (
            <option key={subject} value={subject.toLowerCase()}>{subject}</option>
          ))}
        </select>
        <button
          onClick={handleExportCSV}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium mr-4"
        >
          Export to CSV
        </button>
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
                <div className="mt-6">
                  <h2 className="text-lg font-semibold mb-2">Per Student Summary</h2>
                  <table className="w-full mb-4">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-4 text-sm font-semibold text-text-dark">Student</th>
                        <th className="text-left py-2 px-4 text-sm font-semibold text-text-dark">Present</th>
                        <th className="text-left py-2 px-4 text-sm font-semibold text-text-dark">Absent</th>
                        <th className="text-left py-2 px-4 text-sm font-semibold text-text-dark">Late/Excused</th>
                        <th className="text-left py-2 px-4 text-sm font-semibold text-text-dark">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(filteredAttendance.reduce((acc, a) => {
                        const key = a.studentId?.name || a.studentId || 'Unknown';
                        if (!acc[key]) acc[key] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
                        if (a.status === 'present') acc[key].present++;
                        if (a.status === 'absent') acc[key].absent++;
                        if (a.status === 'late') acc[key].late++;
                        if (a.status === 'excused') acc[key].excused++;
                        acc[key].total++;
                        return acc;
                      }, {})).map(([student, stats]) => (
                        <tr key={student} className="border-b border-gray-100">
                          <td className="py-2 px-4 text-sm">{student}</td>
                          <td className="py-2 px-4 text-sm text-green-700">{stats.present}</td>
                          <td className="py-2 px-4 text-sm text-red-700">{stats.absent}</td>
                          <td className="py-2 px-4 text-sm text-yellow-700">{stats.late + stats.excused}</td>
                          <td className="py-2 px-4 text-sm">{stats.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                  )}
                  <div className="grid grid-cols-4 gap-4">
          <div className="bg-card-white rounded-custom shadow-custom p-4">
            <p className="text-sm text-text-muted mb-1">Total Records</p>
            <p className="text-2xl font-semibold text-text-dark">{attendance.length}</p>
          </div>
          <div className="bg-card-white rounded-custom shadow-custom p-4">
            <p className="text-sm text-text-muted mb-1">Present</p>
            <p className="text-2xl font-semibold text-green-600">{attendance.filter(a => a.status === 'present').length}</p>
          </div>
          <div className="bg-card-white rounded-custom shadow-custom p-4">
            <p className="text-sm text-text-muted mb-1">Absent</p>
            <p className="text-2xl font-semibold text-red-600">{attendance.filter(a => a.status === 'absent').length}</p>
          </div>
          <div className="bg-card-white rounded-custom shadow-custom p-4">
            <p className="text-sm text-text-muted mb-1">Late/Excused</p>
            <p className="text-2xl font-semibold text-yellow-600">{attendance.filter(a => a.status === 'late' || a.status === 'excused').length}</p>
          </div>
        </div>
      

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
