import { useState, useEffect, useMemo } from 'react'
import { Award, Search, Plus, Edit, Trash2, AlertCircle } from 'lucide-react'
import { resultsApi, examsApi, subjectsApi, studentsApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Modal from '../components/Modal'
import ResultForm from '../components/ResultForm'

function Results() {
  const { user } = useAuth()
  const [results, setResults] = useState([])
  const [exams, setExams] = useState([])
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingResult, setEditingResult] = useState(null)
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedStudent || user?.role === 'student') {
      loadResults(user?.role === 'student' ? user.user_id : selectedStudent)
    }
  }, [selectedStudent, user])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [examsData, subjectsData, studentsData] = await Promise.all([
        examsApi.list(),
        subjectsApi.list(),
        studentsApi.list()
      ])
      setExams(examsData)
      setSubjects(subjectsData)
      setStudents(studentsData)
      
      // For student role, load their results directly
      if (user?.role === 'student') {
        const resultsData = await resultsApi.getByStudent(user.user_id)
        setResults(resultsData)
      } else if (studentsData.length > 0) {
        setSelectedStudent(studentsData[0].student_id)
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load data'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const loadResults = async (student_id) => {
    try {
      const data = await resultsApi.getByStudent(student_id)
      setResults(data)
    } catch (err) {
      const errorMessage = err.message || 'Failed to load results'
      showError(errorMessage)
    }
  }

  const handleCreate = () => {
    setEditingResult(null)
    setIsModalOpen(true)
  }

  const handleEdit = (result) => {
    setEditingResult(result)
    setIsModalOpen(true)
  }

  const handleSubmit = async (formData) => {
    try {
      if (editingResult) {
        await resultsApi.update(editingResult._id, formData)
        success('Result updated successfully')
      } else {
        await resultsApi.create(formData)
        success('Result created successfully')
      }
      setIsModalOpen(false)
      setEditingResult(null)
      if (selectedStudent || user?.role === 'student') {
        await loadResults(user?.role === 'student' ? user.user_id : selectedStudent)
      }
    } catch (err) {
      const errorMessage = err.message || (editingResult ? 'Failed to update result' : 'Failed to create result')
      showError(errorMessage)
    }
  }

  const handleDelete = async (result_id) => {
    if (window.confirm('Are you sure you want to delete this result?')) {
      try {
        await resultsApi.delete(result_id)
        success('Result deleted successfully')
        if (selectedStudent || user?.role === 'student') {
          await loadResults(user?.role === 'student' ? user.user_id : selectedStudent)
        }
      } catch (err) {
        const errorMessage = err.message || 'Failed to delete result'
        showError(errorMessage)
      }
    }
  }

  const getSubjectName = (result) => {
    // If subject is already a string (subject name from backend), return it
    if (result.subject && typeof result.subject === 'string') {
      return result.subject
    }
    // Otherwise try to look up by subject_id
    const subject_id = result.subject_id || result.subject
    return subjects.find(s => s.subject_id === subject_id)?.name || `Subject ${subject_id}`
  }

  const getExamName = (result) => {
    // Try to look up exam by exam_id
    const exam_id = result.exam_id
    return exams.find(e => e.exam_id === exam_id)?.name || exam_id ? `Exam ${exam_id}` : 'N/A'
  }

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return results
    const query = searchQuery.toLowerCase()
    return results.filter((result) => {
      const examName = getExamName(result).toLowerCase()
      const subjectName = getSubjectName(result).toLowerCase()
      return (
        examName.includes(query) ||
        subjectName.includes(query) ||
        result.marks?.toString().includes(query)
      )
    })
  }, [results, exams, subjects, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error && results.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-text-dark font-medium mb-2">Error loading results</p>
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
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-dark">Results</h1>
        <p className="text-sm sm:text-base text-text-muted mt-1">Manage exam results</p>
      </div>

      {/* Controls - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {user?.role !== 'student' && students.length > 0 && (
          <select
            value={selectedStudent || ''}
            onChange={(e) => setSelectedStudent(Number(e.target.value))}
            className="w-full px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
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
            className="w-full flex items-center justify-center sm:justify-start gap-2 bg-primary-blue text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors text-sm sm:text-base font-medium"
          >
            <Plus size={18} />
            <span>Add Result</span>
          </button>
        )}
      </div>

      <div className="bg-card-white rounded-custom shadow-custom p-4 md:p-6">
        {results.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                placeholder="Search results..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
          </div>
        )}

        <div className="overflow-x-auto -mx-4 md:mx-0 md:overflow-visible">
          <table className="w-full min-w-max md:min-w-0">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-text-dark whitespace-nowrap">Exam</th>
                <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-text-dark whitespace-nowrap">Subject</th>
                <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-text-dark whitespace-nowrap">Marks</th>
                {user?.role !== 'student' && (
                  <th className="text-left py-3 px-4 text-xs md:text-sm font-semibold text-text-dark whitespace-nowrap\">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={user?.role !== 'student' ? 4 : 3} className="py-8 px-4 text-center text-sm text-text-muted">
                    {results.length === 0 ? 'No results found' : 'No results match your search'}
                  </td>
                </tr>
              ) : (
                filteredResults.map((result) => (
                  <tr key={result._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-xs md:text-sm text-text-dark whitespace-nowrap">{getExamName(result)}</td>
                    <td className="py-3 px-4 text-xs md:text-sm text-text-dark whitespace-nowrap">{getSubjectName(result)}</td>
                    <td className="py-3 px-4 text-xs md:text-sm text-text-dark font-medium whitespace-nowrap">{result.marks || result.grade || 'N/A'}</td>
                    {user?.role !== 'student' && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleEdit(result)}
                            className="text-primary-blue hover:text-primary-blue/80 text-xs md:text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                          >
                            <Edit size={16} />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(result._id)}
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

        {results.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-text-muted">
              Showing {filteredResults.length} of {results.length} results
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingResult(null)
        }}
        title={editingResult ? 'Edit Result' : 'Add New Result'}
      >
        <ResultForm
          result={editingResult}
          students={students}
          exams={exams}
          subjects={subjects}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingResult(null)
          }}
        />
      </Modal>
    </div>
  )
}

export default Results
