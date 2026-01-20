import { X, Download, Share2 } from 'lucide-react'

function ResultsViewer({ result, onClose }) {
  const percentage = result.totalMaxMarks > 0 
    ? ((result.totalScore / result.totalMaxMarks) * 100).toFixed(2)
    : 0

  const gradeColor = {
    'A+': 'text-green-700 bg-green-50',
    'A': 'text-green-700 bg-green-50',
    'B+': 'text-blue-700 bg-blue-50',
    'B': 'text-blue-700 bg-blue-50',
    'C+': 'text-yellow-700 bg-yellow-50',
    'C': 'text-yellow-700 bg-yellow-50',
    'D': 'text-orange-700 bg-orange-50',
    'F': 'text-red-700 bg-red-50'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-text-dark">
            Result Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Student & Exam Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-text-muted mb-1">Student</h3>
              <p className="text-lg font-semibold text-text-dark">{result.student?.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-muted mb-1">Exam</h3>
              <p className="text-lg font-semibold text-text-dark">{result.exam?.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-muted mb-1">Classroom</h3>
              <p className="text-lg font-semibold text-text-dark">
                Grade {result.classroom?.grade} - {result.classroom?.section}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-muted mb-1">Academic Year</h3>
              <p className="text-lg font-semibold text-text-dark">{result.academicYear}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-muted mb-1">Term</h3>
              <p className="text-lg font-semibold text-text-dark">
                {result.term === 'term1' ? 'Term 1' : result.term === 'term2' ? 'Term 2' : 'Term 3'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-text-muted mb-1">Status</h3>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                result.status === 'published' ? 'bg-green-100 text-green-800' :
                result.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                result.status === 'submitted' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {result.status.charAt(0).toUpperCase() + result.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Score Summary */}
          <div className="bg-gradient-to-r from-primary-blue to-blue-500 rounded-lg p-6 text-white">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm opacity-90 mb-1">Total Score</p>
                <p className="text-3xl font-bold">{result.totalScore}</p>
                <p className="text-xs opacity-75 mt-1">/ {result.totalMaxMarks}</p>
              </div>
              <div className="text-center">
                <p className="text-sm opacity-90 mb-1">Percentage</p>
                <p className="text-3xl font-bold">{percentage}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm opacity-90 mb-1">Grade</p>
                <p className="text-3xl font-bold">{result.overallGrade}</p>
              </div>
            </div>
          </div>

          {/* Subject Results */}
          <div>
            <h3 className="text-lg font-semibold text-text-dark mb-4">Subject-wise Results</h3>
            <div className="space-y-3">
              {result.subjectResults?.map((subject, index) => {
                const subjectPercentage = subject.maxMarks > 0 
                  ? ((subject.score / subject.maxMarks) * 100).toFixed(2)
                  : 0
                
                return (
                  <div key={index} className={`rounded-lg p-4 ${gradeColor[subject.grade] || 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-text-dark">{subject.subject?.name || subject.subject}</h4>
                      <span className="text-sm font-semibold text-text-dark">
                        {subject.score}/{subject.maxMarks} ({subjectPercentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-white rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          subject.grade === 'A+' || subject.grade === 'A' ? 'bg-green-500' :
                          subject.grade === 'B+' || subject.grade === 'B' ? 'bg-blue-500' :
                          subject.grade === 'C+' || subject.grade === 'C' ? 'bg-yellow-500' :
                          subject.grade === 'D' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${subjectPercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-text-dark">Grade: {subject.grade}</span>
                      {subject.remarks && (
                        <span className="text-text-muted">{subject.remarks}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Remarks */}
          {result.remarks && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-text-dark mb-2">Remarks</h3>
              <p className="text-text-muted">{result.remarks}</p>
            </div>
          )}

          {/* Submission Info */}
          <div className="bg-gray-50 rounded-lg p-4 text-xs text-text-muted space-y-2">
            {result.submittedBy && (
              <p>Submitted by: <span className="text-text-dark font-medium">{result.submittedBy?.name || 'System'}</span></p>
            )}
            {result.submittedAt && (
              <p>Submitted at: <span className="text-text-dark font-medium">{new Date(result.submittedAt).toLocaleString()}</span></p>
            )}
            {result.approvedBy && (
              <p>Approved by: <span className="text-text-dark font-medium">{result.approvedBy?.name || 'System'}</span></p>
            )}
            {result.approvedAt && (
              <p>Approved at: <span className="text-text-dark font-medium">{new Date(result.approvedAt).toLocaleString()}</span></p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-6 border-t">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-text-dark hover:bg-gray-50 transition-colors font-medium"
            >
              <Download size={18} />
              Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultsViewer
