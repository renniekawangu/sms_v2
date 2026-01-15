import { useState, useEffect, useMemo } from 'react'
import { Users, Search, Plus, Edit, Trash2, Link as LinkIcon, Unlink, AlertCircle, ChevronDown, ChevronUp, X } from 'lucide-react'
import { parentsApi, studentsApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Modal from '../components/Modal'

function Parents() {
  const { user } = useAuth()
  const { success, error: showError } = useToast()
  const [parents, setParents] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedParentId, setExpandedParentId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' or 'edit'
  const [editingParent, setEditingParent] = useState(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    relationship: 'Guardian',
    address: '',
    occupation: ''
  })
  const [linkingParent, setLinkingParent] = useState(null)
  const [selectedStudents, setSelectedStudents] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [parentsData, studentsData] = await Promise.all([
        parentsApi.list(),
        studentsApi.list()
      ])
      setParents(parentsData.parents || parentsData)
      setStudents(studentsData)
    } catch (err) {
      showError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const filteredParents = useMemo(() => {
    return parents.filter(parent => {
      const query = searchQuery.toLowerCase()
      return (
        parent.firstName?.toLowerCase().includes(query) ||
        parent.lastName?.toLowerCase().includes(query) ||
        parent.email?.toLowerCase().includes(query) ||
        parent.phone?.includes(query)
      )
    })
  }, [parents, searchQuery])

  const handleOpenModal = (mode, parent = null) => {
    if (mode === 'create') {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        relationship: 'Guardian',
        address: '',
        occupation: ''
      })
    } else {
      setFormData({
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.email,
        phone: parent.phone,
        relationship: parent.relationship || 'Guardian',
        address: parent.address || '',
        occupation: parent.occupation || ''
      })
      setEditingParent(parent)
    }
    setModalMode(mode)
    setIsModalOpen(true)
  }

  const handleSaveParent = async (e) => {
    e.preventDefault()
    try {
      if (modalMode === 'create') {
        // Note: Create is typically done through user creation, but we can add it here if needed
        showError('Parents are created through user management. Please create a user with parent role first.')
        setIsModalOpen(false)
        return
      } else {
        // Update parent
        await parentsApi.update(editingParent._id, formData)
        success('Parent updated successfully')
        await loadData()
        setIsModalOpen(false)
      }
    } catch (err) {
      showError(err.message || 'Failed to save parent')
    }
  }

  const handleDeleteParent = async (parentId) => {
    if (!window.confirm('Are you sure you want to delete this parent?')) return
    try {
      await parentsApi.delete(parentId)
      success('Parent deleted successfully')
      await loadData()
    } catch (err) {
      showError(err.message || 'Failed to delete parent')
    }
  }

  const handleLinkStudent = async (parentId, studentId) => {
    try {
      await parentsApi.linkStudent(parentId, studentId)
      success('Student linked to parent')
      await loadData()
      setSelectedStudents(prev => ({ ...prev, [parentId]: [] }))
    } catch (err) {
      showError(err.message || 'Failed to link student')
    }
  }

  const handleUnlinkStudent = async (parentId, studentId) => {
    if (!window.confirm('Unlink this student from the parent?')) return
    try {
      await parentsApi.unlinkStudent(parentId, studentId)
      success('Student unlinked from parent')
      await loadData()
    } catch (err) {
      showError(err.message || 'Failed to unlink student')
    }
  }

  const getAvailableStudents = (parentId) => {
    const parent = parents.find(p => p._id === parentId)
    if (!parent) return []
    const linkedIds = (parent.students || []).map(s => s._id || s)
    return students.filter(s => !linkedIds.includes(s._id))
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary-blue to-blue-600 text-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-3">
              <Users size={32} />
              Parents Management
            </h1>
            <p className="text-blue-100">Manage parents and link them to students</p>
          </div>
          <button
            onClick={() => handleOpenModal('create')}
            className="bg-white text-primary-blue px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            New Parent
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search parents by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
        />
      </div>

      {/* No Results */}
      {filteredParents.length === 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-800">No parents found</h3>
              <p className="text-sm text-yellow-700">Create parent users in User Management to add parents to the system.</p>
            </div>
          </div>
        </div>
      )}

      {/* Parents List */}
      <div className="space-y-4">
        {filteredParents.map(parent => (
          <div
            key={parent._id}
            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            {/* Parent Header */}
            <div
              onClick={() => setExpandedParentId(expandedParentId === parent._id ? null : parent._id)}
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                    {parent.firstName?.[0]}{parent.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-dark truncate">
                      {parent.firstName} {parent.lastName}
                    </h3>
                    <div className="flex gap-4 text-xs text-text-muted mt-1">
                      <span>{parent.email}</span>
                      {parent.phone && <span>•</span>}
                      {parent.phone && <span>{parent.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenModal('edit', parent)
                    }}
                    className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteParent(parent._id)
                    }}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                  {expandedParentId === parent._id ? (
                    <ChevronUp className="text-gray-400" />
                  ) : (
                    <ChevronDown className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Quick Info */}
              <div className="flex gap-4 mt-3 text-sm">
                {parent.relationship && (
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                    {parent.relationship}
                  </span>
                )}
                <span className="text-text-muted">
                  {(parent.students || []).length} student{(parent.students || []).length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedParentId === parent._id && (
              <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
                {/* Parent Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-muted uppercase font-semibold">Email</p>
                    <p className="text-sm text-text-dark break-all">{parent.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase font-semibold">Phone</p>
                    <p className="text-sm text-text-dark">{parent.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase font-semibold">Relationship</p>
                    <p className="text-sm text-text-dark">{parent.relationship || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase font-semibold">Occupation</p>
                    <p className="text-sm text-text-dark">{parent.occupation || 'Not specified'}</p>
                  </div>
                  {parent.address && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-text-muted uppercase font-semibold">Address</p>
                      <p className="text-sm text-text-dark">{parent.address}</p>
                    </div>
                  )}
                </div>

                {/* Linked Students */}
                <div>
                  <h4 className="font-semibold text-text-dark mb-3 flex items-center gap-2">
                    <LinkIcon size={16} />
                    Linked Students ({(parent.students || []).length})
                  </h4>
                  {(parent.students || []).length > 0 ? (
                    <div className="space-y-2">
                      {parent.students.map(student => (
                        <div
                          key={student._id}
                          className="flex items-center justify-between bg-white p-2 rounded border border-gray-200"
                        >
                          <div>
                            <p className="text-sm font-medium text-text-dark">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-xs text-text-muted">ID: {student.studentId}</p>
                          </div>
                          <button
                            onClick={() => handleUnlinkStudent(parent._id, student._id)}
                            className="p-1 rounded hover:bg-red-50 text-red-600 transition-colors"
                            title="Unlink student"
                          >
                            <Unlink size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted italic">No students linked yet</p>
                  )}
                </div>

                {/* Link New Student */}
                <div>
                  <h4 className="font-semibold text-text-dark mb-3">Link New Student</h4>
                  <div className="space-y-2">
                    {getAvailableStudents(parent._id).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {getAvailableStudents(parent._id).map(student => (
                          <button
                            key={student._id}
                            onClick={() => handleLinkStudent(parent._id, student._id)}
                            className="text-left p-2 rounded border border-gray-200 hover:border-primary-blue hover:bg-blue-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <LinkIcon size={14} className="text-primary-blue flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-text-dark truncate">
                                  {student.firstName} {student.lastName}
                                </p>
                                <p className="text-xs text-text-muted">ID: {student.studentId}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-text-muted italic">All available students are already linked</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Parent Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Create Parent' : 'Edit Parent'}>
        <form onSubmit={handleSaveParent} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Phone</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Relationship</label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              >
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
                <option value="Sibling">Sibling</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Occupation</label>
            <input
              type="text"
              value={formData.occupation}
              onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-primary-blue text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Save Parent
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 bg-gray-200 text-text-dark py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Parents
