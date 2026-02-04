import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, Calendar, Award, GraduationCap } from 'lucide-react'
import { studentsApi, teachersApi, adminApi } from '../services/api'

function SearchResults() {
  const location = useLocation()
  const navigate = useNavigate()
  const [userDetails, setUserDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const userId = location.state?.userId
  const userType = location.state?.userType
  const initialUser = location.state?.user

  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        setLoading(true)
        let details = null

        if (userType === 'student') {
          details = await studentsApi.get(userId)
        } else if (userType === 'teacher') {
          details = await teachersApi.get(userId)
        } else {
          // For staff/other roles, fetch from admin API
          const staffList = await adminApi.listStaff()
          details = staffList.find(s => s._id === userId)
        }

        setUserDetails({ ...details, type: userType })
      } catch (err) {
        setError(err.message || 'Failed to load user details')
        // If API fails, use the initial user data
        if (initialUser) {
          setUserDetails({ ...initialUser, type: userType })
          setError(null)
        }
      } finally {
        setLoading(false)
      }
    }

    if (userId && userType) {
      loadUserDetails()
    } else {
      setError('No user selected')
      setLoading(false)
    }
  }, [userId, userType, initialUser])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading user details...</p>
        </div>
      </div>
    )
  }

  if (error && !userDetails) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary-blue hover:text-primary-blue/80 mb-6"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  if (!userDetails) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-primary-blue hover:text-primary-blue/80 mb-6"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <p className="text-text-muted">No user data available</p>
      </div>
    )
  }

  const getName = () => {
    if (userDetails.firstName) {
      return `${userDetails.firstName} ${userDetails.lastName || ''}`
    }
    return userDetails.name || 'Unknown'
  }

  const renderStudentDetails = () => (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className="bg-card-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-text-dark mb-4 flex items-center gap-2">
          <GraduationCap size={20} />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-text-muted">First Name</label>
            <p className="text-text-dark font-medium">{userDetails.firstName}</p>
          </div>
          <div>
            <label className="text-sm text-text-muted">Last Name</label>
            <p className="text-text-dark font-medium">{userDetails.lastName}</p>
          </div>
          <div>
            <label className="text-sm text-text-muted flex items-center gap-2">
              <Mail size={16} />
              Email
            </label>
            <p className="text-text-dark font-medium">{userDetails.email}</p>
          </div>
          <div>
            <label className="text-sm text-text-muted flex items-center gap-2">
              <Phone size={16} />
              Phone
            </label>
            <p className="text-text-dark font-medium">{userDetails.phone || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-text-muted flex items-center gap-2">
              <MapPin size={16} />
              Address
            </label>
            <p className="text-text-dark font-medium">{userDetails.address || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-text-muted">Gender</label>
            <p className="text-text-dark font-medium capitalize">{userDetails.gender || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Academic Information */}
      <div className="bg-card-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-text-dark mb-4">Academic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-text-muted">Class Level</label>
            <p className="text-text-dark font-medium">{userDetails.classLevel || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-text-muted flex items-center gap-2">
              <Calendar size={16} />
              Date of Birth
            </label>
            <p className="text-text-dark font-medium">
              {userDetails.dateOfBirth ? new Date(userDetails.dateOfBirth).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-sm text-text-muted">Enrollment Date</label>
            <p className="text-text-dark font-medium">
              {userDetails.enrollmentDate ? new Date(userDetails.enrollmentDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTeacherDetails = () => (
    <div className="space-y-6">
      <div className="bg-card-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-text-dark mb-4 flex items-center gap-2">
          <Briefcase size={20} />
          Professional Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-text-muted">Name</label>
            <p className="text-text-dark font-medium">{userDetails.name}</p>
          </div>
          <div>
            <label className="text-sm text-text-muted flex items-center gap-2">
              <Mail size={16} />
              Email
            </label>
            <p className="text-text-dark font-medium">{userDetails.email}</p>
          </div>
          <div>
            <label className="text-sm text-text-muted flex items-center gap-2">
              <Phone size={16} />
              Phone
            </label>
            <p className="text-text-dark font-medium">{userDetails.phone || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-text-muted flex items-center gap-2">
              <MapPin size={16} />
              Address
            </label>
            <p className="text-text-dark font-medium">{userDetails.address || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-text-muted">Gender</label>
            <p className="text-text-dark font-medium capitalize">{userDetails.sex || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-text-muted flex items-center gap-2">
              <Calendar size={16} />
              Date of Birth
            </label>
            <p className="text-text-dark font-medium">
              {userDetails.dob ? new Date(userDetails.dob).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-sm text-text-muted">Date of Join</label>
            <p className="text-text-dark font-medium">
              {userDetails.date_of_join ? new Date(userDetails.date_of_join).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStaffDetails = () => (
    <div className="space-y-6">
      <div className="bg-card-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-text-dark mb-4 flex items-center gap-2">
          <Briefcase size={20} />
          Staff Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-text-muted">Name</label>
            <p className="text-text-dark font-medium">{userDetails.name}</p>
          </div>
          <div>
            <label className="text-sm text-text-muted flex items-center gap-2">
              <Mail size={16} />
              Email
            </label>
            <p className="text-text-dark font-medium">{userDetails.email}</p>
          </div>
          <div>
            <label className="text-sm text-text-muted flex items-center gap-2">
              <Phone size={16} />
              Phone
            </label>
            <p className="text-text-dark font-medium">{userDetails.phone || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm text-text-muted flex items-center gap-2">
              <Award size={16} />
              Role
            </label>
            <p className="text-text-dark font-medium capitalize">{userDetails.role || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-primary-blue hover:text-primary-blue/80 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        Back to Search
      </button>

      {/* User Header */}
      <div className="bg-gradient-to-r from-primary-blue to-primary-blue/80 rounded-lg p-6 text-white mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{getName()}</h1>
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium capitalize">
              {userDetails.type}
            </span>
          </div>
        </div>
      </div>

      {/* User Details */}
      {userDetails.type === 'student' && renderStudentDetails()}
      {userDetails.type === 'teacher' && renderTeacherDetails()}
      {!['student', 'teacher'].includes(userDetails.type) && renderStaffDetails()}
    </div>
  )
}

export default SearchResults
