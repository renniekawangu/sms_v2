import { useState, useEffect } from 'react'
import { BarChart3, Search, Plus, Filter, Eye, Edit, Trash2 } from 'lucide-react'
import { examResultsApi, examsApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import ResultsForm from '../components/ResultsForm'
import ResultsViewer from '../components/ResultsViewer'
import ClassroomGradingForm from '../components/ClassroomGradingForm'

function Results() {
  const [results, setResults] = useState([])
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showViewer, setShowViewer] = useState(false)
  const [showClassroomGrading, setShowClassroomGrading] = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)
  
  // Filters
  const [filters, setFilters] = useState({
    academicYear: new Date().getFullYear().toString(),
    term: 'term1',
    status: 'all'
  })

  const { success, error: showError } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (results.length > 0) {
      loadResults()
    }
  }, [filters])

  const loadData = async () => {
    try {
      setLoading(true)
      const [examsData, resultsData] = await Promise.all([
        examsApi.list(),
        examResultsApi.list({
          academicYear: filters.academicYear,
          term: filters.term
        })
      ])
      setExams(examsData || [])
      setResults(resultsData.results || [])
    } catch (err) {
      showError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadResults = async () => {
    try {
      const filterParams = {
        academicYear: filters.academicYear,
        term: filters.term
      }
      if (filters.status !== 'all') {
        filterParams.status = filters.status
      }

      const data = await examResultsApi.list(filterParams)
      setResults(data.results || [])
    } catch (err) {
      showError(err.message || 'Failed to load results')
    }
  }

  const filteredResults = results.filter(result => {
    const query = searchQuery.toLowerCase()
    return (
      result.student?.name?.toLowerCase().includes(query) ||
      result.exam?.name?.toLowerCase().includes(query) ||
      result.classroom?.grade?.toString().includes(query)
    )
  })

  const handleViewResult = (result) => {
    setSelectedResult(result)
    setShowViewer(true)
  }

  const handleEditResult = (result) => {
    setSelectedResult(result)
    setShowForm(true)
  }

  const handleDeleteResult = async (resultId) => {
    if (!window.confirm('Are you sure you want to delete this result?')) return

    try {
      await examResultsApi.delete(resultId)
      success('Result deleted successfully')
      await loadResults()
    } catch (err) {
      showError(err.message || 'Failed to delete result')
    }
  }

  const handleFormClose = (shouldRefresh) => {
    setShowForm(false)
    setSelectedResult(null)
    if (shouldRefresh) {
      loadResults()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-dark flex items-center gap-2">
            <BarChart3 size={24} className="flex-shrink-0" />
            Exam Results
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">View and manage student exam results</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          <button
            onClick={() => {
              setSelectedResult(null)
              setShowForm(true)
            }}
            className="flex items-center justify-center gap-2 bg-primary-blue text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors font-medium text-xs sm:text-sm"
          >
            <Plus size={18} />
            Add Result
          </button>
          <button
            onClick={() => setShowClassroomGrading(true)}
            className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-xs sm:text-sm"
          >
            <BarChart3 size={18} />
            Add Grades by Class
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card-white rounded-custom shadow-custom p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-dark mb-1">Academic Year</label>
            <input
              type="text"
              value={filters.academicYear}
              onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-dark mb-1">Term</label>
            <select
              value={filters.term}
              onChange={(e) => setFilters({ ...filters, term: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="term1">Term 1</option>
              <option value="term2">Term 2</option>
              <option value="term3">Term 3</option>
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-dark mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-dark mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                placeholder="Student or exam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-card-white rounded-custom shadow-custom overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-text-dark">Student</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-text-dark hidden sm:table-cell">Exam</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-text-dark">Score</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-text-dark">Grade</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-text-dark">Status</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-text-dark">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-3 sm:px-4 py-6 sm:py-8 text-center text-text-muted text-xs sm:text-sm">
                    No results found
                  </td>
                </tr>
              ) : (
                filteredResults.map((result) => (
                  <tr key={result._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-text-dark font-medium">
                      {result.student?.name}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-text-muted hidden sm:table-cell">
                      {result.exam?.name}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-text-dark">
                      {result.totalScore}/{result.totalMaxMarks}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                        result.overallGrade === 'A+' ? 'bg-green-100 text-green-800' :
                        result.overallGrade === 'A' ? 'bg-green-100 text-green-800' :
                        result.overallGrade === 'B+' ? 'bg-blue-100 text-blue-800' :
                        result.overallGrade === 'B' ? 'bg-blue-100 text-blue-800' :
                        result.overallGrade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                        result.overallGrade === 'D' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {result.overallGrade}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        result.status === 'published' ? 'bg-green-100 text-green-800' :
                        result.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        result.status === 'submitted' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewResult(result)}
                          title="View"
                          className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEditResult(result)}
                          title="Edit"
                          className="p-1.5 hover:bg-yellow-100 rounded-lg transition-colors text-yellow-600"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteResult(result._id)}
                          title="Delete"
                          className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forms */}
      {showForm && (
        <ResultsForm
          result={selectedResult}
          exams={exams}
          onClose={handleFormClose}
        />
      )}

      {showViewer && selectedResult && (
        <ResultsViewer
          result={selectedResult}
          onClose={() => setShowViewer(false)}
        />
      )}

      {showClassroomGrading && (
        <ClassroomGradingForm
          onClose={() => setShowClassroomGrading(false)}
          onSuccess={() => {
            loadResults()
            setShowClassroomGrading(false)
          }}
        />
      )}
    </div>
  )
}

export default Results
