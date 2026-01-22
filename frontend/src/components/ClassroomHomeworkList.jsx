import { useState, useEffect } from 'react'
import { homeworkApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { BookOpen, Calendar, User, Download, FileText } from 'lucide-react'
import ErrorBoundary from './ErrorBoundary'
import HomeworkSubmission from './HomeworkSubmission'

function ClassroomHomeworkList({ classroomId }) {
  const { user } = useAuth()
  const { error: showError, success } = useToast()
  
  const [homework, setHomework] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [showingSubmissionId, setShowingSubmissionId] = useState(null)
  
  // Check user roles for submission access
  const isStudent = user?.role === 'student'
  const isParent = user?.role === 'parent'
  const isTeacher = user?.role === 'teacher'

  console.log('ClassroomHomeworkList - User:', { user, isStudent, isParent, isTeacher })

  useEffect(() => {
    loadHomework()
  }, [classroomId])

  const loadHomework = async () => {
    try {
      setLoading(true)
      const data = await homeworkApi.getByClassroom(classroomId)
      console.log('Homework data received:', data)
      
      // Handle different response formats
      let homeworkList = []
      if (Array.isArray(data)) {
        homeworkList = data
      } else if (data?.homework && Array.isArray(data.homework)) {
        homeworkList = data.homework
      } else if (data?.data && Array.isArray(data.data)) {
        homeworkList = data.data
      }
      
      console.log('Parsed homework list:', homeworkList)
      setHomework(homeworkList)
    } catch (err) {
      console.error('Error loading homework:', err)
      showError(err.message || 'Failed to load homework')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-text-muted text-sm">Loading homework...</p>
        </div>
      </div>
    )
  }

  if (homework.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen size={36} className="mx-auto text-text-muted opacity-50 mb-3" />
        <p className="text-text-muted">No homework assignments</p>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-3">
        {homework.map((hw) => {
          // Find if current user has submitted
          const userSubmission = hw.submissions?.find(
            sub => sub.student?.toString() === user?.id || sub.student === user?.id
          )
          const isSubmitted = userSubmission?.status === 'submitted' || userSubmission?.status === 'graded'
          const isGraded = userSubmission?.status === 'graded'
          
          return (
            <div
              key={hw._id}
              className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition cursor-pointer"
              onClick={() => setExpandedId(expandedId === hw._id ? null : hw._id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-text-dark mb-1">{hw.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-text-muted mb-2 flex-wrap">
                    <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {hw.subject}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      Due: {new Date(hw.dueDate).toLocaleDateString()}
                    </span>
                    {hw.teacher && (
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {typeof hw.teacher === 'object' 
                          ? `${hw.teacher.firstName || ''} ${hw.teacher.lastName || ''}`.trim()
                          : hw.teacher
                        }
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-2">
                  {isGraded && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Grade: {userSubmission?.grade}
                    </span>
                  )}
                  {isSubmitted && !isGraded && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Submitted
                    </span>
                  )}
                  {!isSubmitted && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === hw._id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-text-muted mb-3">{hw.description}</p>
                  
                  {/* Show teacher materials */}
                  {hw.attachments && hw.attachments.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                        <FileText size={16} />
                        📚 Learning Materials
                      </h5>
                      <div className="space-y-2">
                        {hw.attachments.map((material, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-blue-100">
                            <a
                              href={material.url || material.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary-blue hover:underline truncate flex-1 flex items-center gap-2"
                              title={material.name || material.filename}
                            >
                              <FileText size={14} />
                              {material.name || material.filename}
                            </a>
                            <a
                              href={material.url || material.path}
                              download
                              className="ml-2 p-1 text-blue-600 hover:bg-blue-100 rounded transition"
                              title="Download"
                            >
                              <Download size={16} />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Show submission form for those who haven't submitted */}
                  {!isSubmitted && showingSubmissionId === hw._id && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-xs text-blue-700 mb-3 font-medium">
                        {isStudent && '📝 Submit your homework'}
                        {isParent && `👨‍👩‍👧 Submitting on behalf of your child`}
                        {isTeacher && '👨‍🏫 Uploading homework materials'}
                        {!isStudent && !isParent && !isTeacher && '📝 Upload files'}
                      </div>
                      <HomeworkSubmission
                        homeworkId={hw._id}
                        classroomId={classroomId}
                        onSubmitSuccess={() => {
                          success('Homework submitted successfully!')
                          setShowingSubmissionId(null)
                          loadHomework()
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Show submit button for those who haven't submitted */}
                  {!isSubmitted && showingSubmissionId !== hw._id && (
                    <button
                      onClick={() => setShowingSubmissionId(hw._id)}
                      className="w-full mb-3 px-4 py-3 bg-primary-blue text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-md"
                    >
                      {isStudent && '📝 Submit Homework'}
                      {isParent && '👨‍👩‍👧 Submit on Behalf of Child'}
                      {isTeacher && '📤 Upload Materials'}
                      {!isStudent && !isParent && !isTeacher && '📝 Submit'}
                    </button>
                  )}
                  
                  {/* Teacher view: show submission info */}
                  {isTeacher && (
                    <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded">
                      <p className="text-xs font-medium text-amber-800 mb-1">📊 Submissions:</p>
                      <p className="text-sm text-amber-700">
                        {hw.submissions?.length || 0} submitted
                      </p>
                    </div>
                  )}
                  
                  {userSubmission && (
                    <div className="bg-gray-50 rounded p-3">
                      <h5 className="font-medium text-sm text-text-dark mb-2">
                        {isTeacher ? '📥 Student Submission:' : '✓ Your Submission:'}
                      </h5>
                      {userSubmission.submissionDate && (
                        <p className="text-xs text-text-muted mb-2">
                          Submitted: {new Date(userSubmission.submissionDate).toLocaleString()}
                        </p>
                      )}
                      
                      {/* Show submitted attachments */}
                      {userSubmission.attachments && userSubmission.attachments.length > 0 && (
                        <div className="mb-3 p-2 bg-white border border-gray-200 rounded">
                          <p className="text-xs font-medium text-text-dark mb-2">Submitted Files:</p>
                          <div className="space-y-1">
                            {userSubmission.attachments.map((att, idx) => (
                              <a
                                key={idx}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary-blue hover:underline block truncate"
                                title={att.name}
                              >
                                📄 {att.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {userSubmission.feedback && (
                        <div className="p-2 bg-white border border-gray-200 rounded">
                          <p className="text-xs font-medium text-text-dark">👨‍🏫 Teacher Feedback:</p>
                          <p className="text-sm text-text-muted mt-1">{userSubmission.feedback}</p>
                        </div>
                      )}
                      
                      {isTeacher && userSubmission.grade && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-xs font-medium text-green-800">Grade: {userSubmission.grade}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </ErrorBoundary>
  )
}

export default ClassroomHomeworkList
