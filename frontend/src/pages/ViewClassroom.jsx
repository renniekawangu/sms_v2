import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classroomsApi } from '../services/api';
import { ArrowLeft } from 'lucide-react';

function ViewClassroom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchClassroom() {
      setLoading(true);
      setError(null);
      try {
        const data = await classroomsApi.get(id);
        setClassroom(data);
      } catch (err) {
        setError(err.message || 'Failed to load classroom');
      } finally {
        setLoading(false);
      }
    }
    fetchClassroom();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center">Loading classroom...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }
  if (!classroom) {
    return <div className="p-8 text-center">Classroom not found.</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-primary-blue hover:underline">
        <ArrowLeft size={18} /> Back
      </button>
      <h2 className="text-2xl font-bold mb-2">Grade {classroom.grade} - Section {classroom.section}</h2>
      <div className="mb-4">
        <span className="font-semibold">Teacher:</span> {classroom.teacher_id ? classroom.teacher_id.name || classroom.teacher_id : 'None'}
      </div>
      <div className="mb-4">
        <span className="font-semibold">Students:</span> {classroom.students?.length || 0}
      </div>
      {classroom.students && classroom.students.length > 0 && (
        <div className="mb-4">
          <span className="font-semibold">Student List:</span>
          <ul className="list-disc ml-6">
            {classroom.students.map((s, idx) => (
              <li key={s._id || idx}>{s.name || s.email || s._id}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ViewClassroom;
