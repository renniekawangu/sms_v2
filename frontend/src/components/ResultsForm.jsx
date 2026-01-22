import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Lock } from 'lucide-react'
import { examResultsApi, classroomsApi, studentsApi, teacherApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'

function ResultsForm({ result, exams, onClose }) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    exam: '',
    student: '',
    classroom: '',
    academicYear: new Date().getFullYear().toString(),
    term: 'term1',
    subjectResults: [{ subject: '', score: 0, maxMarks: 100, remarks: '' }],
    totalScore: 0,
    totalMaxMarks: 100
  })

  const [classrooms, setClassrooms] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [isTeacher, setIsTeacher] = useState(false)
  const [teacherClassrooms, setTeacherClassrooms] = useState([])
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadData()
    if (result) {
      setFormData(prev => ({
        ...prev,
        exam: result.exam || '',
        student: result.student || '',
        classroom: result.classroom || '',
        academicYear: result.academicYear || new Date().getFullYear().toString(),
        term: result.term || 'term1',
        subjectResults: result.subjectResults || [{ subject: '', score: 0, maxMarks: 100, remarks: '' }],
        totalScore: result.totalScore || 0,
        totalMaxMarks: result.totalMaxMarks || 100
      }))
    }
  }, [result])

  const loadData = async () => {
    try {
      const [classroomsData, studentsData] = await Promise.all([
        classroomsApi.list(),
        studentsApi.list()
      ])
      setClassrooms(classroomsData || [])
      setStudents(studentsData || [])

      // If user is a teacher, fetch their classrooms
      if (user && user.role === 'teacher') {
        setIsTeacher(true)
        try {
          const myClassrooms = await teacherApi.getMyClassrooms()
          const classroomList = myClassrooms.data || myClassrooms || []
          setTeacherClassrooms(classroomList)

          // Auto-set classroom if teacher has exactly one classroom
          if (classroomList.length === 1 && !result) {
            setFormData(prev => ({
              ...prev,
              classroom: classroomList[0]._id
            }))
          }
        } catch (err) {
          console.error('Failed to load teacher classrooms:', err)
        }
      }
    } catch (err) {
      showError('Failed to load data')
    }
  }

  const handleAddSubject = () => {
    setFormData({
      ...formData,
      subjectResults: [...formData.subjectResults, { subject: '', score: 0, maxMarks: 100, remarks: '' }]
    })
  }

  const handleRemoveSubject = (index) => {
    const updated = formData.subjectResults.filter((_, i) => i !== index)
    setFormData({ ...formData, subjectResults: updated })
    calculateTotal(updated)
  }

  const handleSubjectChange = (index, field, value) => {
    const updated = [...formData.subjectResults]
    updated[index][field] = field === 'score' || field === 'maxMarks' ? Number(value) : value
    setFormData({ ...formData, subjectResults: updated })
    calculateTotal(updated)
  }

  const calculateTotal = (subjects) => {
    const totalScore = subjects.reduce((sum, s) => sum + (s.score || 0), 0)
    const totalMaxMarks = subjects.reduce((sum, s) => sum + (s.maxMarks || 100), 0)
    setFormData(prev => ({
      ...prev,
      totalScore,
      totalMaxMarks
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.exam || !formData.student || !formData.classroom) {
      showError('Please select exam, student, and classroom')
      return
    }

    if (formData.subjectResults.some(s => !s.subject || s.score === undefined)) {
      showError('Please fill all subject results')
      return
    }

    try {
      setLoading(true)
      
      const resultData = {
        exam: formData.exam,
        student: formData.student,
        classroom: formData.classroom,
        academicYear: formData.academicYear,
        term: formData.term,
        subjectResults: formData.subjectResults,
        totalScore: formData.totalScore,
        totalMaxMarks: formData.totalMaxMarks
      }

      if (result) {
        await examResultsApi.update(result._id, resultData)
        success('Result updated successfully')
      } else {
        await examResultsApi.create(resultData)
        success('Result created successfully')
      }

      onClose(true)
    } catch (err) {
      showError(err.message || 'Failed to save result')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-text-dark">
            {result ? 'Edit Result' : 'Add New Result'}
          </h2>
          <button
            onClick={() => onClose(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} className="sm:size-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-dark mb-1 sm:mb-2">Exam *</label>
              <select
                value={formData.exam}
                onChange={(e) => setFormData({ ...formData, exam: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                required
              >
                <option value="">Select Exam</option>
                {exams.map(exam => (
                  <option key={exam._id} value={exam._id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-dark mb-1 sm:mb-2">Student *</label>
              <select
                value={formData.student}
                onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                required
              >
                <option value="">Select Student</option>
                {students.map(student => (
                  <option key={student._id} value={student._id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <label className="block text-xs sm:text-sm font-medium text-text-dark mb-1 sm:mb-2 flex-1">Classroom *</label>
                {isTeacher && teacherClassrooms.length === 1 && (
                  <div className="flex items-center gap-1 text-xs text-primary-blue mb-1 sm:mb-2">
                    <Lock size={12} className="sm:size-4" />
                    <span>Locked</span>
                  </div>
                )}
              </div>
              <select
                value={formData.classroom}
                onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                disabled={isTeacher && teacherClassrooms.length === 1}
                className={`w-full px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue ${
                  isTeacher && teacherClassrooms.length === 1 ? 'bg-gray-50 cursor-not-allowed' : ''
                }`}
                required
              >
                <option value="">Select Classroom</option>
                {isTeacher ? (
                  teacherClassrooms.map(classroom => (
                    <option key={classroom._id} value={classroom._id}>
                      Grade {classroom.grade} - {classroom.section}
                    </option>
                  ))
                ) : (
                  classrooms.map(classroom => (
                    <option key={classroom._id} value={classroom._id}>
                      Grade {classroom.grade} - {classroom.section}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-text-dark mb-1 sm:mb-2">Term</label>
              <select
                value={formData.term}
                onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              >
                <option value="term1">Term 1</option>
                <option value="term2">Term 2</option>
                <option value="term3">Term 3</option>
              </select>
            </div>
          </div>

          {/* Subject Results */}
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-text-dark">Subject Results</h3>
              <button
                type="button"
                onClick={handleAddSubject}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition-colors text-xs sm:text-sm"
              >
                <Plus size={14} className="sm:size-4" />
                Add Subject
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {formData.subjectResults.map((subject, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-text-dark mb-1">Subject *</label>
                      <input
                        type="text"
                        value={subject.subject || ''}
                        onChange={(e) => handleSubjectChange(index, 'subject', e.target.value)}
                        placeholder="Subject name"
                        className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-text-dark mb-1">Score *</label>
                      <input
                        type="number"
                        value={subject.score || ''}
                        onChange={(e) => handleSubjectChange(index, 'score', e.target.value)}
                        placeholder="Score"
                        min="0"
                        className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-text-dark mb-1">Max Marks</label>
                      <input
                        type="number"
                        value={subject.maxMarks || 100}
                        onChange={(e) => handleSubjectChange(index, 'maxMarks', e.target.value)}
                        placeholder="Max marks"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <input
                        type="text"
                        value={subject.remarks || ''}
                        onChange={(e) => handleSubjectChange(index, 'remarks', e.target.value)}
                        placeholder="Remarks"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      />
                      {formData.subjectResults.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(index)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 lg:p-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm text-text-muted">Total Score</p>
                <p className="text-base sm:text-lg lg:text-xl font-semibold text-text-dark">{formData.totalScore}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-text-muted">Total Max Marks</p>
                <p className="text-base sm:text-lg lg:text-xl font-semibold text-text-dark">{formData.totalMaxMarks}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-text-muted">Percentage</p>
                <p className="text-base sm:text-lg lg:text-xl font-semibold text-text-dark">
                  {(formData.totalMaxMarks > 0 ? (formData.totalScore / formData.totalMaxMarks * 100).toFixed(2) : 0)}%
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end pt-3 sm:pt-4 lg:pt-6 border-t">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg text-text-dark hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Saving...' : result ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResultsForm
