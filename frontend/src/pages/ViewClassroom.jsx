import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classroomsApi, teachersApi } from '../services/api';
import { ArrowLeft, School, Users, User, AlertCircle, Mail } from 'lucide-react';
import Homework from '../components/Homework';

function ViewClassroom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [teacherName, setTeacherName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchClassroom() {
      setLoading(true);
      setError(null);
      try {
        const data = await classroomsApi.get(id);
        setClassroom(data);

        // Fetch teacher name if teacher_id exists
        if (data.teacher_id) {
          try {
            const teacherResp = await teachersApi.get(data.teacher_id);
            const name = teacherResp.name || [teacherResp.firstName, teacherResp.lastName].filter(Boolean).join(' ').trim();
            setTeacherName(name || teacherResp.email || data.teacher_id);
          } catch (err) {
            // Fallback to ID if teacher fetch fails
            setTeacherName(data.teacher_id);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load classroom');
      } finally {
        setLoading(false);
      }
    }
    fetchClassroom();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading classroom details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-text-dark font-medium mb-2">Error loading classroom</p>
          <p className="text-text-muted mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <School className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-dark font-medium mb-2">Classroom not found</p>
          <p className="text-text-muted mb-6">The classroom you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const studentCount = classroom.students?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-3 sm:px-4 lg:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-primary-blue hover:text-primary-blue/80 font-medium transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Classrooms</span>
        </button>

        {/* Header Card */}
        <div className="bg-gradient-to-r from-primary-blue to-blue-600 rounded-lg shadow-lg p-6 sm:p-8 text-white mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <School size={28} />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold">
                  Grade {classroom.grade}
                  <span className="text-blue-100 ml-2">Section {classroom.section}</span>
                </h1>
              </div>
              <p className="text-blue-100 text-sm sm:text-base">Classroom Details</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Teacher Information Card */}
          <div className="bg-card-white rounded-lg shadow-custom p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="text-primary-blue" size={24} />
              </div>
              <h2 className="text-lg font-semibold text-text-dark">Assigned Teacher</h2>
            </div>
            <p className="text-text-muted text-sm mb-3">Class Teacher</p>
            <p className="text-text-dark font-medium text-lg">{teacherName || 'No teacher assigned'}</p>
          </div>

          {/* Student Count Card */}
          <div className="bg-card-white rounded-lg shadow-custom p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <Users className="text-green-600" size={24} />
              </div>
              <h2 className="text-lg font-semibold text-text-dark">Total Students</h2>
            </div>
            <p className="text-text-muted text-sm mb-3">Enrolled</p>
            <p className="text-text-dark font-bold text-3xl">{studentCount}</p>
          </div>
        </div>

        {/* Homework Section */}
        <div className="mb-6">
          <Homework classroomId={id} />
        </div>

        {/* Students List Card */}
        {studentCount > 0 ? (
          <div className="bg-card-white rounded-lg shadow-custom p-6">
            <h2 className="text-lg font-semibold text-text-dark mb-4 flex items-center gap-2">
              <Users size={20} className="text-primary-blue" />
              Student Roster ({studentCount})
            </h2>
            <div className="divide-y divide-gray-200">
              {classroom.students.map((student, idx) => (
                <div
                  key={student._id || idx}
                  className="py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary-blue/10 rounded-full flex items-center justify-center">
                      <User size={16} className="text-primary-blue" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-text-dark truncate">
                        {student.name || 'Student'}
                      </p>
                      {student.email && (
                        <p className="text-xs text-text-muted flex items-center gap-1 truncate">
                          <Mail size={12} />
                          {student.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Enrolled
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-card-white rounded-lg shadow-custom p-6 text-center">
            <Users className="mx-auto text-text-muted mb-3" size={32} />
            <p className="text-text-dark font-medium mb-1">No Students Yet</p>
            <p className="text-text-muted">No students have been assigned to this classroom.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewClassroom;
