import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Upload, Eye, AlertCircle, Loader, Edit, CheckCircle } from 'lucide-react'
import { resultApi, examApi, classroomApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { ROLES } from '../config/rbac'
import ResultsEntryForm from '../components/ResultsEntryForm'

function Results() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { error: showError, success: showSuccess } = useToast()
  
  const [classrooms, setClassrooms] = useState([])
  const [exams, setExams] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [selectedExam, setSelectedExam] = useState('')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [showGradeForm, setShowGradeForm] = useState(false)

  useEffect(() => {
    console.log('Results page mounted, loading initial data...')
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      console.log('Starting loadInitialData...')
      setLoading(true)
      
      console.log('Calling classroomApi.list()...')
      const classroomsData = await classroomApi.list()
      console.log('Classrooms response:', classroomsData)
      
      console.log('Calling examApi.list()...')
      const examsData = await examApi.list()
      console.log('Exams response:', examsData)
      
      // Handle different response formats
      const classroomsList = Array.isArray(classroomsData) 
        ? classroomsData 
        : classroomsData?.data 
        ? Array.isArray(classroomsData.data) 
          ? classroomsData.data 
          : [classroomsData.data]
        : classroomsData?.classrooms || []
        
      const examsList = Array.isArray(examsData)
        ? examsData
        : examsData?.exams || []
      
      console.log('Setting classrooms:', classroomsList)
      console.log('Setting exams:', examsList)
      
      setClassrooms(classroomsList)
      setExams(examsList)
    } catch (err) {
      console.error('LoadInitialData error:', err)
      showError(err.message || 'Failed to load initial data')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadResults = async () => {
    if (!selectedClassroom || !selectedExam) {
      showError('Please select both classroom and exam')
      return
    }

    try {
      setLoading(true)
      const data = await resultApi.getClassroomExamResults(selectedClassroom, selectedExam)
      
      // If no results exist, initialize them
      if (!data.results || data.results.length === 0) {
        console.log('No results found, initializing...')
        await resultApi.initializeResults({
          exam: selectedExam,
          classroom: selectedClassroom
        })
        
        // Reload results
        const newData = await resultApi.getClassroomExamResults(selectedClassroom, selectedExam)
        setResults(newData.results || [])
        showSuccess('Results initialized for all students')
      } else {
        setResults(data.results)
      }
    } catch (err) {
      showError(err.message || 'Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'draft': return 'bg-gray-100 text-gray-700'
      case 'submitted': return 'bg-blue-100 text-blue-700'
      case 'approved': return 'bg-yellow-100 text-yellow-700'
      case 'published': return 'bg-green-100 text-green-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-dark">Results Management</h1>
        <p className="text-sm text-text-muted mt-1">Enter and manage exam results</p>
      </div>

      {/* Selection Panel */}
      <div className="bg-card-white rounded-lg shadow-sm p-4 mb-6">
        {loading && <div className="text-sm text-text-muted mb-4">Loading classrooms and exams...</div>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Classroom</label>
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              disabled={loading || classrooms.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue disabled:bg-gray-100"
            >
              <option value="">
                {loading ? 'Loading...' : classrooms.length === 0 ? 'No classrooms available' : 'Select Classroom'}
              </option>
              {classrooms && classrooms.length > 0 && classrooms.map(classroom => (
                <option key={classroom._id || classroom.id} value={classroom._id || classroom.id}>
                  {classroom.name || `Grade ${classroom.grade} - ${classroom.section}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Exam</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              disabled={loading || !selectedClassroom}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-blue disabled:bg-gray-100"
            >
              <option value="">{!selectedClassroom ? 'Select classroom first' : 'Select Exam'}</option>
              {exams && exams.length > 0 && exams.filter(exam => exam.status !== 'closed' && exam.status !== 'cancelled').map(exam => (
                <option key={exam._id || exam.id} value={exam._id || exam.id}>
                  {exam.name || exam.title} - {exam.term}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleLoadResults}
              disabled={loading || !selectedClassroom || !selectedExam}
              className="w-full bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Load Results
            </button>
          </div>
        </div>

        {selectedClassroom && selectedExam && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowGradeForm(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
            >
              <Upload size={18} />
              Enter Grades
            </button>
          </div>
        )}
      </div>

      {/* Results Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader className="animate-spin" size={40} />
        </div>
      ) : results.length === 0 ? (
        <div className="bg-card-white rounded-lg shadow-sm p-12 text-center">
          <AlertCircle size={48} className="mx-auto text-text-muted mb-4" />
          <p className="text-text-muted text-lg">No results yet</p>
          <p className="text-sm text-text-muted mt-2">Select a classroom and exam, then enter grades</p>
        </div>
      ) : (
        <div className="bg-card-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Student</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Subject</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Score</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Grade</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map(result => (
                  <tr key={result._id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-text-dark">
                      {result.student?.name} ({result.student?.studentId})
                    </td>
                    <td className="px-4 py-3 text-sm text-text-dark">
                      {result.subject?.name}
                      {result.subject?.code && <span className="text-text-muted ml-1">({result.subject.code})</span>}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-text-dark">
                      {result.score}/{result.maxMarks}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-text-dark">
                      {result.grade}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                        {result.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {result.status === 'draft' && (
                        <button
                          onClick={() => navigate(`/results/${result._id}/edit`)}
                          className="text-primary-blue hover:text-opacity-80 flex items-center gap-1"
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submission Info */}
      {results.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Ready to Submit?</p>
              <p className="text-sm text-blue-700 mt-1">
                Once all grades are entered, you can submit the results for head-teacher approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grade Entry Form */}
      <ResultsEntryForm
        isOpen={showGradeForm}
        onClose={() => setShowGradeForm(false)}
        classroomId={selectedClassroom}
        examId={selectedExam}
        results={results}
        onSuccess={() => {
          showSuccess('Grades saved successfully')
          handleLoadResults()
        }}
      />
    </div>
  )
}

export default Results
