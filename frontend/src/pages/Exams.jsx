import { useState, useEffect, useMemo } from 'react'
import { FileText, Search, Plus, Edit, Trash2, AlertCircle } from 'lucide-react'
import { examsApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import Modal from '../components/Modal'
import ExamForm from '../components/ExamForm'

function Exams() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExam, setEditingExam] = useState(null)
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadExams()
  }, [])

  const loadExams = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await examsApi.list()
      setExams(data)
    } catch (err) {
      const errorMessage = err.message || 'Failed to load exams'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingExam(null)
    setIsModalOpen(true)
  }

  const handleEdit = (exam) => {
    setEditingExam(exam)
    setIsModalOpen(true)
  }

  const handleSubmit = async (formData) => {
    try {
      if (editingExam) {
        await examsApi.update(editingExam._id || editingExam.exam_id, formData)
        success('Exam updated successfully')
      } else {
        await examsApi.create(formData)
        success('Exam created successfully')
      }
      setIsModalOpen(false)
      setEditingExam(null)
      await loadExams()
    } catch (err) {
      const errorMessage = err.message || (editingExam ? 'Failed to update exam' : 'Failed to create exam')
      showError(errorMessage)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await examsApi.delete(id)
        success('Exam deleted successfully')
        await loadExams()
      } catch (err) {
        const errorMessage = err.message || 'Failed to delete exam'
        showError(errorMessage)
      }
    }
  }

  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) return exams
    const query = searchQuery.toLowerCase()
    return exams.filter((exam) => {
      return (
        exam.name?.toLowerCase().includes(query) ||
        exam.exam_id?.toString().includes(query)
      )
    })
  }, [exams, searchQuery])

  const getExamTypeName = (type) => {
    const types = { 1: 'Midterm', 2: 'Final', 3: 'Quiz', 4: 'Assignment' }
    return types[type] || `Type ${type}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading exams...</p>
        </div>
      </div>
    )
  }

  if (error && exams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-text-dark font-medium mb-2">Error loading exams</p>
          <p className="text-text-muted mb-4">{error}</p>
          <button
            onClick={loadExams}
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
          <h1 className="text-2xl font-semibold text-text-dark">Exams</h1>
          <p className="text-text-muted mt-1">Manage all exams</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors"
        >
          <Plus size={20} />
          Add Exam
        </button>
      </div>

      <div className="bg-card-white rounded-custom shadow-custom p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
            <input
              type="text"
              placeholder="Search exams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExams.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-text-muted">
                    No exams found
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => (
                  <tr key={exam._id || exam.exam_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-text-dark">{exam.exam_id}</td>
                    <td className="py-3 px-4 text-sm text-text-dark font-medium">{exam.name}</td>
                    <td className="py-3 px-4 text-sm text-text-muted">
                      {exam.date ? (exam.date.includes('T') ? exam.date.split('T')[0] : exam.date) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-muted">{getExamTypeName(exam.type)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(exam)}
                          className="text-primary-blue hover:text-primary-blue/80 text-sm font-medium flex items-center gap-1"
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(exam._id || exam.exam_id)}
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
            Showing {filteredExams.length} of {exams.length} exams
          </p>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingExam(null)
        }}
        title={editingExam ? 'Edit Exam' : 'Add New Exam'}
      >
        <ExamForm
          exam={editingExam}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingExam(null)
          }}
        />
      </Modal>
    </div>
  )
}

export default Exams
