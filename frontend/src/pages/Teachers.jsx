import { useState, useEffect, useMemo } from 'react'
import { User, Search, AlertCircle, Plus, Edit, Trash2, Download, CheckSquare, Square } from 'lucide-react'
import { teachersApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import Modal from '../components/Modal'
import TeacherForm from '../components/TeacherForm'
import AdvancedSearch from '../components/AdvancedSearch'
import Pagination from '../components/Pagination'
import SkeletonLoader from '../components/SkeletonLoader'
import ConfirmDialog from '../components/ConfirmDialog'
import { exportToCSV } from '../utils/exportData'
import { filterData, sortData, searchData, paginateData } from '../utils/filterSort'
import useKeyboardShortcuts from '../utils/keyboardShortcuts.jsx'

function Teachers() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({})
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false })
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
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Teacher',
      message: 'Are you sure you want to delete this teacher? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await teachersApi.delete(id)
          success('Teacher deleted successfully')
          await loadTeachers()
          setConfirmDialog({ isOpen: false })
        } catch (err) {
          showError(err.message || 'Failed to delete teacher')
        }
      },
      onCancel: () => setConfirmDialog({ isOpen: false })
    })
  }

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds)
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Multiple Teachers',
      message: `Are you sure you want to delete ${ids.length} teacher(s)? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete All',
      onConfirm: async () => {
        try {
          for (const id of ids) {
            await teachersApi.delete(id)
          }
          success(`${ids.length} teacher(s) deleted successfully`)
          setSelectedIds(new Set())
          await loadTeachers()
          setConfirmDialog({ isOpen: false })
        } catch (err) {
          showError(err.message || 'Failed to delete teachers')
        }
      },
      onCancel: () => setConfirmDialog({ isOpen: false })
    })
  }

  const handleExportAll = () => {
    exportToCSV(processedTeachers, 'teachers.csv', [
      'teacher_id',
      'name',
      'email',
      'phone',
      'dob',
      'date_of_join'
    ])
  }

  const handleExportSelected = () => {
    const selectedData = teachers.filter(t => selectedIds.has(t._id || t.teacher_id))
    if (selectedData.length === 0) {
      showError('No teachers selected for export')
      return
    }
    exportToCSV(selectedData, 'teachers_selected.csv', [
      'teacher_id',
      'name',
      'email',
      'phone',
      'dob',
      'date_of_join'
    ])
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === processedTeachers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(processedTeachers.map(t => t._id || t.teacher_id)))
    }
  }

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  // Keyboard shortcuts
  useKeyboardShortcuts({
    new: handleCreate,
    export: handleExportAll,
    search: () => document.querySelector('input[type="text"]')?.focus()
  })

  // Filter, sort, search, and paginate
  let processedTeachers = useMemo(() => {
    let result = filterData(teachers, filters)
    result = searchData(result, searchQuery, ['name', 'email', 'teacher_id'])
    result = sortData(result, sortBy, sortOrder)
    return result
  }, [teachers, filters, searchQuery, sortBy, sortOrder])

  const paginatedData = useMemo(() => {
    return paginateData(processedTeachers, currentPage, pageSize)
  }, [processedTeachers, currentPage, pageSize])

  if (loading) {
    return (
      <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3"></div>
        <div className="bg-card-white rounded-custom shadow-custom p-4 overflow-x-auto">
          <table className="min-w-full">
            <tbody>
              <SkeletonLoader count={5} variant="row" />
            </tbody>
          </table>
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
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-dark">Teachers</h1>
          <p className="text-sm sm:text-base text-text-muted mt-1">Manage all teacher records ({teachers.length})</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleCreate}
            className="flex items-center justify-center gap-2 bg-primary-blue text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors text-sm font-medium"
            title="Ctrl+N"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Teacher</span>
          </button>
          <button
            onClick={handleExportAll}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            title="Ctrl+E"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export All</span>
          </button>
          {selectedIds.size > 0 && (
            <button
              onClick={handleExportSelected}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export ({selectedIds.size})</span>
            </button>
          )}
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center justify-center gap-2 bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              <Trash2 size={18} />
              <span className="hidden sm:inline">Delete ({selectedIds.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Search */}
      <AdvancedSearch
        searchFields={['name', 'email', 'teacher_id']}
        filterOptions={{
          department: ['Mathematics', 'Science', 'English', 'History', 'PE'],
          status: ['Active', 'Inactive', 'On Leave']
        }}
        onSearch={setSearchQuery}
        onFilter={setFilters}
        onClear={() => {
          setSearchQuery('')
          setFilters({})
        }}
        loading={loading}
      />

      <div className="bg-card-white rounded-custom shadow-custom p-3 sm:p-4 lg:p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 sm:px-4 w-8">
                  <button
                    onClick={toggleSelectAll}
                    className="text-primary-blue hover:text-primary-blue/80"
                    title="Select all"
                  >
                    {selectedIds.size === paginatedData.data.length ? (
                      <CheckSquare size={18} />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th 
                  className="hidden sm:table-cell text-left py-3 px-2 sm:px-4 font-semibold text-text-dark cursor-pointer hover:bg-gray-50"
                  onClick={() => setSortBy('teacher_id')}
                >
                  ID {sortBy === 'teacher_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="text-left py-3 px-2 sm:px-4 font-semibold text-text-dark cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setSortBy('name')
                    setSortOrder(sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc')
                  }}
                >
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="hidden md:table-cell text-left py-3 px-4 font-semibold text-text-dark cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    setSortBy('email')
                    setSortOrder(sortBy === 'email' && sortOrder === 'asc' ? 'desc' : 'asc')
                  }}>
                  Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="hidden lg:table-cell text-left py-3 px-4 font-semibold text-text-dark">Phone</th>
                <th className="hidden lg:table-cell text-left py-3 px-4 font-semibold text-text-dark">DOB</th>
                <th className="hidden xl:table-cell text-left py-3 px-4 font-semibold text-text-dark">Date of Join</th>
                <th className="text-left py-3 px-2 sm:px-4 font-semibold text-text-dark">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-xs sm:text-sm text-text-muted">
                    No teachers found
                  </td>
                </tr>
              ) : (
                paginatedData.data.map((teacher) => (
                  <tr key={teacher._id || teacher.teacher_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-2 sm:px-4">
                      <button
                        onClick={() => toggleSelect(teacher._id || teacher.teacher_id)}
                        className="text-primary-blue hover:text-primary-blue/80"
                      >
                        {selectedIds.has(teacher._id || teacher.teacher_id) ? (
                          <CheckSquare size={18} />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </td>
                    <td className="hidden sm:table-cell py-3 px-2 sm:px-4 text-text-dark">{teacher.teacher_id}</td>
                    <td className="py-3 px-2 sm:px-4 text-text-dark font-medium">{teacher.name}</td>
                    <td className="hidden md:table-cell py-3 px-4 text-sm text-text-muted">{teacher.email}</td>
                    <td className="hidden lg:table-cell py-3 px-4 text-sm text-text-muted">{teacher.phone}</td>
                    <td className="hidden lg:table-cell py-3 px-4 text-sm text-text-muted">
                      {teacher.dob ? (teacher.dob.includes('T') ? teacher.dob.split('T')[0] : teacher.dob) : '-'}
                    </td>
                    <td className="hidden xl:table-cell py-3 px-4 text-sm text-text-muted">
                      {teacher.date_of_join ? (teacher.date_of_join.includes('T') ? teacher.date_of_join.split('T')[0] : teacher.date_of_join) : '-'}
                    </td>
                    <td className="py-3 px-2 sm:px-4">
                      <div className="flex items-center gap-1 sm:gap-3">
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="text-primary-blue hover:text-primary-blue/80 text-xs sm:text-sm font-medium flex items-center gap-1 p-1 rounded hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit size={14} className="sm:size-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(teacher._id || teacher.teacher_id)}
                          className="text-red-500 hover:text-red-600 text-xs sm:text-sm font-medium flex items-center gap-1 p-1 rounded hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={14} className="sm:size-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {paginatedData.pageCount > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={paginatedData.pageCount}
            totalItems={paginatedData.total}
            pageSize={pageSize}
            onPageChange={(page, newPageSize) => {
              if (newPageSize) {
                setPageSize(newPageSize)
                setCurrentPage(1)
              } else {
                setCurrentPage(page)
              }
            }}
          />
        )}
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

      <ConfirmDialog {...confirmDialog} />
    </div>
  )
}

export default Teachers
