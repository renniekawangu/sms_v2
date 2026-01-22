import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, AlertCircle, Lock } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { examResultsApi, classroomApi, examApi, subjectsApi, teacherApi } from '../services/api'

export default function ClassroomGradingForm({ onClose, onSuccess }) {
  const { showToast } = useToast()
  const { user } = useAuth()
  
  // Form state
  const [classroom, setClassroom] = useState('')
  const [exam, setExam] = useState('')
  const [subject, setSubject] = useState('')
  const [classrooms, setClassrooms] = useState([])
  const [exams, setExams] = useState([])
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])
  const [grades, setGrades] = useState({}) // { studentId: { score, remarks } }
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedClassroomData, setSelectedClassroomData] = useState(null)
  const [isTeacher, setIsTeacher] = useState(false)
  const [teacherClassrooms, setTeacherClassrooms] = useState([])

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        const [classroomsRes, examsRes] = await Promise.all([
          classroomApi.list(),
          examApi.list()
        ])
        setClassrooms(classroomsRes.data || classroomsRes)
        setExams(examsRes.data || examsRes)

        // If user is a teacher, fetch their classrooms
        if (user && user.role === 'teacher') {
          setIsTeacher(true)
          try {
            const myClassrooms = await teacherApi.getMyClassrooms()
            const classroomList = myClassrooms.data || myClassrooms || []
            setTeacherClassrooms(classroomList)

            // Auto-set classroom if teacher has exactly one classroom
            if (classroomList.length === 1) {
              setClassroom(classroomList[0]._id)
            }
          } catch (err) {
            console.error('Failed to load teacher classrooms:', err)
          }
        }
      } catch (err) {
        showToast('Failed to load classrooms and exams', 'error')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [])

  // Load students when classroom changes
  useEffect(() => {
    const loadClassroomData = async () => {
      if (!classroom) {
        setStudents([])
        setSubjects([])
        setSelectedClassroomData(null)
        return
      }

      try {
        setLoading(true)
        const classroomRes = await classroomApi.getById(classroom)
        const classroomDetails = classroomRes.data || classroomRes
        
        console.log('Classroom response:', classroomRes)
        console.log('Classroom details:', classroomDetails)
        
        // Get students in classroom
        const studentsInClassroom = classroomDetails.students || []
        console.log('Students in classroom:', studentsInClassroom)
        setStudents(studentsInClassroom)
        setSelectedClassroomData(classroomDetails)

        // Load subjects for this classroom (check if classroom has subjects or get all)
        const subjectsRes = await subjectsApi.list({ classLevel: classroomDetails.grade })
        console.log('Subjects response:', subjectsRes)
        setSubjects(subjectsRes.data || subjectsRes)
        
        // Reset grades when classroom changes
        setGrades({})
        setSubject('')
      } catch (err) {
        showToast('Failed to load classroom details', 'error')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadClassroomData()
  }, [classroom])

  // Initialize grades array when students load
  useEffect(() => {
    if (students.length > 0) {
      const initialGrades = {}
      students.forEach(student => {
        initialGrades[student._id] = { score: '', maxMarks: 100, remarks: '' }
      })
      setGrades(initialGrades)
    }
  }, [students])

  const handleGradeChange = (studentId, field, value) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!classroom) {
      showToast('Please select a classroom', 'error')
      return
    }
    if (!exam) {
      showToast('Please select an exam', 'error')
      return
    }
    if (!subject) {
      showToast('Please select a subject', 'error')
      return
    }

    // Validate grades
    const gradesArray = Object.entries(grades)
      .filter(([_, data]) => data.score !== '')
      .map(([studentId, data]) => ({
        studentId,
        subjectId: subject,
        score: parseFloat(data.score),
        maxMarks: parseFloat(data.maxMarks) || 100,
        remarks: data.remarks
      }))

    if (gradesArray.length === 0) {
      showToast('Please enter at least one grade', 'error')
      return
    }

    try {
      setSubmitting(true)

      // Create results array - each result can have one subject
      const resultsArray = gradesArray.map(grade => ({
        studentId: grade.studentId,
        subjectResults: [{
          subject: grade.subjectId,
          score: grade.score,
          maxMarks: grade.maxMarks,
          remarks: grade.remarks
        }],
        totalScore: grade.score,
        totalMaxMarks: grade.maxMarks
      }))

      console.log('Submitting grades:', {
        exam,
        classroom,
        resultsArray,
        academicYear: new Date().getFullYear().toString(),
        term: 'term1'
      })

      // Batch create
      const response = await examResultsApi.createBatch(
        exam, 
        classroom, 
        resultsArray,
        new Date().getFullYear().toString(),
        'term1'
      )

      console.log('Batch response:', response)
      console.log('Response type:', typeof response)
      console.log('Response keys:', Object.keys(response || {}))
      showToast(`Successfully added ${gradesArray.length} grades!`, 'success')
      onSuccess && onSuccess()
      onClose()
    } catch (err) {
      console.error('Error submitting grades:', err)
      showToast(err.message || 'Failed to save grades', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && classrooms.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>
        </div>
      </div>
    )
  }

  const selectedExam = exams.find(e => e._id === exam)
  const selectedSubject = subjects.find(s => s._id === subject)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-blue to-blue-600 p-3 sm:p-4 lg:p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Add Grades by Classroom</h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">Bulk add grades for all students in a classroom</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
          >
            <X size={18} className="sm:size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Selection Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
            <h3 className="font-semibold text-sm sm:text-base text-gray-800">1. Select Classroom, Exam & Subject</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {/* Classroom Select */}
              <div>
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 flex-1">
                    Classroom *
                  </label>
                  {isTeacher && teacherClassrooms.length === 1 && (
                    <div className="flex items-center gap-1 text-xs text-primary-blue">
                      <Lock size={14} />
                      <span>Locked</span>
                    </div>
                  )}
                </div>
                <select
                  value={classroom}
                  onChange={(e) => setClassroom(e.target.value)}
                  disabled={loading || (isTeacher && teacherClassrooms.length === 1)}
                  className={`w-full px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent ${
                    isTeacher && teacherClassrooms.length === 1 ? 'bg-gray-50 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">Select classroom...</option>
                  {isTeacher ? (
                    teacherClassrooms.map(c => (
                      <option key={c._id} value={c._id}>
                        Grade {c.grade} - {c.section} ({c.students?.length || 0} students)
                      </option>
                    ))
                  ) : (
                    classrooms.map(c => (
                      <option key={c._id} value={c._id}>
                        Grade {c.grade} - {c.section} ({c.students?.length || 0} students)
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Exam Select */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Exam *
                </label>
                <select
                  value={exam}
                  onChange={(e) => setExam(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  disabled={!classroom || loading}
                >
                  <option value="">Select exam...</option>
                  {exams.map(e => (
                    <option key={e._id} value={e._id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Select */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Subject *
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  disabled={!classroom || loading}
                >
                  <option value="">Select subject...</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {classroom && selectedClassroomData && (
              <div className="text-xs sm:text-sm text-gray-600 bg-white p-2 sm:p-3 rounded border border-gray-100">
                <strong>{selectedClassroomData.students?.length || 0}</strong> student(s) in this classroom
                {selectedExam && <> | Exam: <strong>{selectedExam.name}</strong></>}
                {selectedSubject && <> | Subject: <strong>{selectedSubject.name}</strong></>}
              </div>
            )}
          </div>

          {/* Grades Table */}
          {students.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
              <h3 className="font-semibold text-sm sm:text-base text-gray-800">2. Enter Grades</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200">
                      <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Student Name</th>
                      <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Score</th>
                      <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Max Marks</th>
                      <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Percentage</th>
                      <th className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, idx) => {
                      const studentGrade = grades[student._id] || {}
                      const percentage = studentGrade.score && studentGrade.maxMarks 
                        ? ((studentGrade.score / studentGrade.maxMarks) * 100).toFixed(1)
                        : '-'
                      
                      return (
                        <tr key={student._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                            {student.name || student.firstName + ' ' + student.lastName}
                          </td>
                          <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={studentGrade.score || ''}
                              onChange={(e) => handleGradeChange(student._id, 'score', e.target.value)}
                              placeholder="Score"
                              className="w-16 sm:w-20 px-2 py-1 text-xs sm:text-sm border border-gray-200 rounded focus:ring-2 focus:ring-primary-blue"
                            />
                          </td>
                          <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
                            <input
                              type="number"
                              min="0"
                              value={studentGrade.maxMarks || 100}
                              onChange={(e) => handleGradeChange(student._id, 'maxMarks', e.target.value)}
                              className="w-16 sm:w-20 px-2 py-1 text-xs sm:text-sm border border-gray-200 rounded focus:ring-2 focus:ring-primary-blue"
                            />
                          </td>
                          <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 font-medium">
                            {percentage}%
                          </td>
                          <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
                            <input
                              type="text"
                              value={studentGrade.remarks || ''}
                              onChange={(e) => handleGradeChange(student._id, 'remarks', e.target.value)}
                              placeholder="Optional"
                              className="w-24 sm:w-32 px-2 py-1 text-xs sm:text-sm border border-gray-200 rounded focus:ring-2 focus:ring-primary-blue"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="text-xs sm:text-sm text-gray-600 bg-blue-50 p-2 sm:p-3 rounded border border-blue-200 flex gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5 sm:size-5" />
                <span>Leave Score blank to skip a student. You can update them later.</span>
              </div>
            </div>
          )}

          {/* Summary */}
          {Object.values(grades).some(g => g.score !== '') && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 lg:p-6">
              <p className="text-xs sm:text-sm text-gray-700">
                <strong className="text-green-700">
                  {Object.values(grades).filter(g => g.score !== '').length}
                </strong>
                {' '}grade(s) ready to save
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end pt-2 sm:pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 text-xs sm:text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !classroom || !exam || !subject}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 text-xs sm:text-sm bg-primary-blue text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {submitting ? 'Saving...' : 'Save All Grades'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
