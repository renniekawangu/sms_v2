import { useState, useEffect, useMemo } from 'react'
import { Users, Search, Plus, Filter, Edit2, Trash2, AlertCircle } from 'lucide-react'
import { teachersApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import Modal from '../components/Modal'

function Staffs() {
  const [staffs, setStaffs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'teacher',
    department: 'Administration'
  })
  const { success, error: showError } = useToast()

  const roles = [
    { value: 'teacher', label: 'Teacher' },
    { value: 'administrator', label: 'Administrator' },
    { value: 'secretary', label: 'Secretary' },
    { value: 'librarian', label: 'Librarian' },
    { value: 'security', label: 'Security Guard' },
    { value: 'maintenance', label: 'Maintenance' }
  ]

  useEffect(() => {
    loadStaffs()
  }, [])

  const loadStaffs = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await teachersApi.list()
      // Transform API data to match our format
      const transformed = data.map(staff => ({
        ...staff,
        id: staff.teacher_id || staff._id,
        name: `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
        department: staff.department || 'Administration'
      }))
      setStaffs(transformed)
    } catch (err) {
      setError(err.message || 'Failed to load staff')
      showError('Failed to load staff records')
    } finally {
      setLoading(false)
    }
  }

  // Filtered and searched staffs
  const filteredStaffs = useMemo(() => {
    return staffs.filter(staff => {
      const matchesSearch = 
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = filterRole === 'all' || staff.role === filterRole
      return matchesSearch && matchesRole
    })
  }, [staffs, searchQuery, filterRole])

  const handleAddClick = () => {
    setEditingStaff(null)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'teacher',
      department: 'Administration'
    })
    setIsModalOpen(true)
  }

  const handleEditClick = (staff) => {
    setEditingStaff(staff)
    const [firstName, ...rest] = (staff.name || '').split(' ')
    const lastName = rest.join(' ')
    setFormData({
      firstName: firstName || '',
      lastName: lastName || '',
      email: staff.email || '',
      phone: staff.phone || '',
      role: staff.role || 'teacher',
      department: staff.department || 'Administration'
    })
    setIsModalOpen(true)
  }

  const handleDeleteClick = async (staff) => {
    if (!window.confirm(`Are you sure you want to delete ${staff.name}?`)) return

    try {
      await teachersApi.delete(staff.id)
      setStaffs(staffs.filter(s => s.id !== staff.id))
      success('Staff member deleted successfully')
    } catch (err) {
      showError(err.message || 'Failed to delete staff')
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.firstName.trim()) {
      showError('First name is required')
      return
    }
    if (!formData.email.trim()) {
      showError('Email is required')
      return
    }
    if (!formData.phone.trim()) {
      showError('Phone is required')
      return
    }

    try {
      const submitData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        department: formData.department
      }

      if (editingStaff) {
        // Update existing staff
        await teachersApi.update(editingStaff.id, submitData)
        setStaffs(staffs.map(s => 
          s.id === editingStaff.id 
            ? {
                ...s,
                ...submitData,
                name: `${submitData.firstName} ${submitData.lastName}`.trim()
              }
            : s
        ))
        success('Staff member updated successfully')
      } else {
        // Create new staff
        const newStaff = await teachersApi.create(submitData)
        setStaffs([...staffs, {
          ...newStaff,
          id: newStaff.teacher_id || newStaff._id,
          name: `${newStaff.firstName || ''} ${newStaff.lastName || ''}`.trim(),
          department: newStaff.department || 'Administration'
        }])
        success('Staff member added successfully')
      }

      setIsModalOpen(false)
    } catch (err) {
      showError(err.message || 'Failed to save staff')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-4"></div>
          <p className="text-text-muted">Loading staff records...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-dark">Staffs</h1>
          <p className="text-sm sm:text-base text-text-muted mt-1">Manage all staff records</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="flex items-center justify-center sm:justify-start gap-2 bg-primary-blue text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors font-medium text-sm sm:text-base"
        >
          <Plus size={18} className="sm:size-5" />
          <span>Add Staff</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm sm:text-base text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-card-white rounded-custom shadow-custom p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue min-w-[120px] sm:min-w-[140px]"
          >
            <option value="all">All Roles</option>
            {roles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </div>

        {filteredStaffs.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Users className="mx-auto mb-4 text-text-muted" size={40} />
            <p className="text-sm sm:text-base text-text-muted">No staff members found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm sm:text-base">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 sm:px-4 font-semibold text-text-dark">Name</th>
                  <th className="hidden sm:table-cell text-left py-3 px-4 font-semibold text-text-dark">Role</th>
                  <th className="hidden md:table-cell text-left py-3 px-4 font-semibold text-text-dark">Department</th>
                  <th className="hidden lg:table-cell text-left py-3 px-4 font-semibold text-text-dark">Email</th>
                  <th className="hidden md:table-cell text-left py-3 px-4 font-semibold text-text-dark">Phone</th>
                  <th className="text-left py-3 px-2 sm:px-4 font-semibold text-text-dark">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaffs.map((staff) => (
                  <tr key={staff.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-text-dark font-medium">{staff.name}</td>
                    <td className="hidden sm:table-cell py-3 px-4 text-sm text-text-muted capitalize">{staff.role}</td>
                    <td className="hidden md:table-cell py-3 px-4 text-sm text-text-muted">{staff.department}</td>
                    <td className="hidden lg:table-cell py-3 px-4 text-sm text-text-muted">{staff.email}</td>
                    <td className="hidden md:table-cell py-3 px-4 text-sm text-text-muted">{staff.phone}</td>
                    <td className="py-3 px-2 sm:px-4 flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => handleEditClick(staff)}
                        className="text-primary-blue hover:text-primary-blue/80 transition-colors p-1 rounded hover:bg-blue-50"
                        title="Edit"
                      >
                        <Edit2 size={16} className="sm:size-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(staff)}
                        className="text-red-600 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={16} className="sm:size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-text-muted">
          Showing {filteredStaffs.length} of {staffs.length} staff members
        </div>
      </div>

      {/* Staff Form Modal */}
      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-text-dark mb-4">
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-dark mb-2">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleFormChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-dark mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleFormChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="Enter last name"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-dark mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="Enter email"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-dark mb-2">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-dark mb-2">Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-dark mb-2">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleFormChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  placeholder="Enter department"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 sm:pt-4">
                <button
                  type="submit"
                  className="w-full sm:flex-1 bg-primary-blue text-white px-4 py-2 text-sm sm:text-base rounded-lg hover:bg-primary-blue/90 transition-colors font-medium"
                >
                  {editingStaff ? 'Update Staff' : 'Add Staff'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:flex-1 px-4 py-2 text-sm sm:text-base border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Staffs
