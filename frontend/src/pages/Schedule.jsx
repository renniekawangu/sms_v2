import { Calendar, Clock, MapPin } from 'lucide-react'
import { GRADE_LEVELS } from '../utils/grades'

function Schedule() {
  // Mock schedule data
  const schedule = [
    { time: '8:00 AM - 9:00 AM', subject: 'Mathematics', teacher: 'Dr. Emily Chen', room: 'Room 101', grade: 'Grade 7' },
    { time: '9:00 AM - 10:00 AM', subject: 'Science', teacher: 'Prof. Robert Taylor', room: 'Lab 201', grade: 'Grade 7' },
    { time: '10:00 AM - 11:00 AM', subject: 'English', teacher: 'Ms. Lisa Anderson', room: 'Room 102', grade: 'Grade 7' },
    { time: '11:00 AM - 12:00 PM', subject: 'History', teacher: 'Mr. James Wilson', room: 'Room 103', grade: 'Grade 7' },
    { time: '1:00 PM - 2:00 PM', subject: 'Physics', teacher: 'Dr. Maria Garcia', room: 'Lab 202', grade: 'Grade 7' },
    { time: '2:00 PM - 3:00 PM', subject: 'Physical Education', teacher: 'Coach Johnson', room: 'Gym', grade: 'Grade 7' },
  ]

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-dark">Schedule</h1>
          <p className="text-text-muted mt-1">View and manage class schedules</p>
        </div>
        <div className="flex items-center gap-4">
          <select className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue">
            {GRADE_LEVELS.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
          <button className="bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors">
            Add Schedule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {daysOfWeek.map((day) => (
          <div key={day} className="bg-card-white rounded-custom shadow-custom p-4">
            <h3 className="font-semibold text-text-dark mb-4 text-center">{day}</h3>
            <div className="space-y-3">
              {schedule.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={14} className="text-text-muted" />
                    <span className="text-xs text-text-muted">{item.time}</span>
                  </div>
                  <h4 className="font-medium text-text-dark text-sm mb-1">{item.subject}</h4>
                  <p className="text-xs text-text-muted mb-2">{item.teacher}</p>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-text-muted" />
                    <span className="text-xs text-text-muted">{item.room}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card-white rounded-custom shadow-custom p-6">
        <h2 className="text-lg font-semibold text-text-dark mb-4">Today's Schedule</h2>
        <div className="space-y-3">
          {schedule.slice(0, 3).map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-16 text-sm font-medium text-text-dark">{item.time}</div>
                <div>
                  <h4 className="font-medium text-text-dark">{item.subject}</h4>
                  <p className="text-sm text-text-muted">{item.teacher}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-text-muted">{item.room}</span>
                <span className="px-3 py-1 bg-primary-blue/10 text-primary-blue rounded-lg text-sm">{item.grade}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Schedule
