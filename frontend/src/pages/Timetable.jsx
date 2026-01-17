import { useState, useEffect, useMemo } from 'react'
import { Calendar, Search, Plus, Edit, Trash2, AlertCircle } from 'lucide-react'
import { timetableApi, classroomsApi, subjectsApi, teachersApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import Modal from '../components/Modal'
import TimetableForm from '../components/TimetableForm'
import ConfirmDialog from '../components/ConfirmDialog'
import useKeyboardShortcuts from '../utils/keyboardShortcuts.jsx'

function Timetable() {
  const [classrooms, setClassrooms] = useState([])
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [selectedClassroom, setSelectedClassroom] = useState(null)
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false })
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedClassroom) {
      loadTimetable(selectedClassroom)
    }
  }, [selectedClassroom])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [classroomsData, subjectsData, teachersData] = await Promise.all([
        classroomsApi.list(),
        subjectsApi.list(),
        teachersApi.list()
      ])
      setClassrooms(classroomsData)
      setSubjects(subjectsData)
      setTeachers(teachersData)
      if (classroomsData.length > 0) {
        setSelectedClassroom(classroomsData[0]._id || classroomsData[0].classroom_id)
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load data'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const loadTimetable = async (classroom_id) => {
    try {
      const data = await timetableApi.getByClassroom(classroom_id)
      setTimetable(data)
    } catch (err) {
      const errorMessage = err.message || 'Failed to load timetable'
      showError(errorMessage)
    }
  }

  const handleCreate = () => {
    setEditingEntry(null)
    setIsModalOpen(true)
  }

  const handleEdit = (entry) => {
    setEditingEntry(entry)
    setIsModalOpen(true)
  }

  const handleSubmit = async (formData) => {
    try {
      if (editingEntry) {
        await timetableApi.update(editingEntry._id, formData)
        success('Timetable entry updated successfully')
      } else {
        await timetableApi.create(formData)
        success('Timetable entry created successfully')
      }
      setIsModalOpen(false)
      setEditingEntry(null)
      if (selectedClassroom) {
        await loadTimetable(selectedClassroom)
      }
    } catch (err) {
      const errorMessage = err.message || (editingEntry ? 'Failed to update entry' : 'Failed to create entry')
      showError(errorMessage)
    }
  }

  const handleDelete = async (entry_id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Timetable Entry',
      message: 'Are you sure you want to delete this entry? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await timetableApi.delete(entry_id)
          success('Timetable entry deleted successfully')
          if (selectedClassroom) {
            await loadTimetable(selectedClassroom)
          }
          setConfirmDialog({ isOpen: false })
        } catch (err) {
          const errorMessage = err.message || 'Failed to delete entry'
          showError(errorMessage)
        }
      },
      onCancel: () => setConfirmDialog({ isOpen: false })
    })
  }

  // Keyboard shortcuts
  useKeyboardShortcuts({
    new: handleCreate,
    search: () => document.querySelector('input[placeholder="Search timetable..."]')?.focus()
  })

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const timeSlots = [...new Set(timetable.map(t => t.startTime || t.time))].filter(Boolean).sort()

  const filteredTimetable = useMemo(() => {
    if (!searchQuery.trim()) return timetable
    const query = searchQuery.toLowerCase()
    return timetable.filter((entry) => {
      return (
        (entry.dayOfWeek || entry.day)?.toLowerCase().includes(query) ||
        (entry.startTime || entry.time)?.includes(query) ||
        (entry.subject?.name || entry.subject)?.toLowerCase().includes(query)
      )
    })
  }, [timetable, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading timetable...</p>
        </div>
      </div>
    )
  }

  if (error && classrooms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-text-dark font-medium mb-2">Error loading timetable</p>
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
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-dark">Timetable</h1>
        <p className="text-sm sm:text-base text-text-muted mt-1">Manage class timetable</p>
      </div>

      {/* Controls - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {classrooms.length > 0 && (
          <select
            value={selectedClassroom || ''}
            onChange={(e) => setSelectedClassroom(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
          >
            {classrooms.map((classroom) => (
              <option key={classroom._id || classroom.classroom_id} value={classroom._id || classroom.classroom_id}>
                Grade {classroom.grade} - Section {classroom.section}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={handleCreate}
          className="w-full flex items-center justify-center sm:justify-start gap-2 bg-primary-blue text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors text-sm sm:text-base font-medium"
        >
          <Plus size={18} />
          <span>Add Entry</span>
        </button>
      </div>

      <div className="bg-card-white rounded-custom shadow-custom p-4 md:p-6">
        {timetable.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                placeholder="Search timetable..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
          </div>
        )}

        {filteredTimetable.length === 0 ? (
          <div className="text-center py-8 text-sm text-text-muted">
            {timetable.length === 0 ? 'No timetable data available' : 'No entries match your search'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-4 md:mx-0 md:overflow-visible">
              <table className="w-full min-w-max md:min-w-0">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-text-dark whitespace-nowrap">Time</th>
                    {days.map((day) => (
                      <th key={day} className="text-left py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-text-dark whitespace-nowrap">
                        {day.substring(0, 3)}
                      </th>
                    ))}
                    <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-text-dark whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((time, timeIndex) => (
                    <tr key={`${time}-${timeIndex}`} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-xs md:text-sm font-medium text-text-dark whitespace-nowrap">{time}</td>
                      {days.map((day) => {
                        const slot = filteredTimetable.find(t => (t.dayOfWeek || t.day) === day && (t.startTime || t.time) === time)
                        return (
                          <td key={`${day}-${time}`} className="py-3 px-2 md:px-4 text-xs md:text-sm text-text-muted whitespace-nowrap">
                            {slot?.subject?.name || slot?.subject || '-'}
                          </td>
                        )
                      })}
                      <td className="py-3 px-2 md:px-4">
                        {filteredTimetable.filter(t => (t.startTime || t.time) === time).length > 0 && (
                          <div className="flex items-center gap-1">
                            {filteredTimetable
                              .filter(t => (t.startTime || t.time) === time)
                              .map((entry) => (
                                <div key={entry._id} className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleEdit(entry)}
                                    className="text-primary-blue hover:text-primary-blue/80 p-1"
                                    title="Edit"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(entry._id)}
                                    className="text-red-500 hover:text-red-600 p-1"
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6">
              <p className="text-sm text-text-muted">
                Showing {filteredTimetable.length} of {timetable.length} entries
              </p>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingEntry(null)
        }}
        title={editingEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
      >
        <TimetableForm
          timetable={editingEntry}
          classrooms={classrooms}
          subjects={subjects}
          teachers={teachers}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingEntry(null)
          }}
        />
      </Modal>

      <ConfirmDialog {...confirmDialog} />
    </div>
  )
}

export default Timetable
