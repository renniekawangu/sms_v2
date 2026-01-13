import { FileText, Calendar, Clock, BookOpen, Plus } from 'lucide-react'

function Exam() {
  // Mock exam data
  const exams = [
    { id: 1, name: 'Mid-Term Mathematics Exam', subject: 'Mathematics', date: '2025-07-15', time: '9:00 AM - 11:00 AM', grade: 'Grade 7', status: 'Upcoming' },
    { id: 2, name: 'Science Practical Test', subject: 'Science', date: '2025-07-18', time: '10:00 AM - 12:00 PM', grade: 'Grade 6', status: 'Upcoming' },
    { id: 3, name: 'English Literature Exam', subject: 'English', date: '2025-07-20', time: '9:00 AM - 11:00 AM', grade: 'Grade 5', status: 'Upcoming' },
    { id: 4, name: 'History Final Exam', subject: 'History', date: '2025-07-10', time: '2:00 PM - 4:00 PM', grade: 'Grade 7', status: 'Completed' },
    { id: 5, name: 'PP2 Assessment', subject: 'General', date: '2025-07-12', time: '11:00 AM - 1:00 PM', grade: 'PP2', status: 'Completed' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-dark">Exams</h1>
          <p className="text-text-muted mt-1">Manage and schedule examinations</p>
        </div>
        <button className="flex items-center gap-2 bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors">
          <Plus size={20} />
          Schedule Exam
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-card-white rounded-custom shadow-custom p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="text-primary-blue" size={24} />
            </div>
            <div>
              <p className="text-sm text-text-muted">Upcoming Exams</p>
              <p className="text-2xl font-semibold text-text-dark">12</p>
            </div>
          </div>
        </div>
        <div className="bg-card-white rounded-custom shadow-custom p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-text-muted">Completed</p>
              <p className="text-2xl font-semibold text-text-dark">45</p>
            </div>
          </div>
        </div>
        <div className="bg-card-white rounded-custom shadow-custom p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="text-accent-yellow" size={24} />
            </div>
            <div>
              <p className="text-sm text-text-muted">This Month</p>
              <p className="text-2xl font-semibold text-text-dark">8</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card-white rounded-custom shadow-custom p-6">
        <h2 className="text-lg font-semibold text-text-dark mb-6">Exam Schedule</h2>
        <div className="space-y-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen size={18} className="text-primary-blue" />
                    <h3 className="font-semibold text-text-dark">{exam.name}</h3>
                  </div>
                  <p className="text-sm text-text-muted mb-3">{exam.subject} • {exam.grade}</p>
                  <div className="flex items-center gap-4 text-sm text-text-muted">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>{exam.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>{exam.time}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                  exam.status === 'Upcoming'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {exam.status}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button className="text-sm text-primary-blue hover:text-primary-blue/80 font-medium">
                  View Details
                </button>
                <span className="text-text-muted">•</span>
                <button className="text-sm text-primary-blue hover:text-primary-blue/80 font-medium">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Exam
