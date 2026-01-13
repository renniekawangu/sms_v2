import { Users, Search, Plus, Filter } from 'lucide-react'

function Staffs() {
  // Mock staff data
  const staffs = [
    { id: 1, name: 'John Manager', role: 'Administrator', email: 'john.manager@school.com', phone: '+1234567700', department: 'Administration' },
    { id: 2, name: 'Sarah Secretary', role: 'Secretary', email: 'sarah.secretary@school.com', phone: '+1234567701', department: 'Administration' },
    { id: 3, name: 'Mike Security', role: 'Security Guard', email: 'mike.security@school.com', phone: '+1234567702', department: 'Security' },
    { id: 4, name: 'Lisa Librarian', role: 'Librarian', email: 'lisa.librarian@school.com', phone: '+1234567703', department: 'Library' },
    { id: 5, name: 'David Maintenance', role: 'Maintenance', email: 'david.maintenance@school.com', phone: '+1234567704', department: 'Facilities' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-dark">Staffs</h1>
          <p className="text-text-muted mt-1">Manage all staff records</p>
        </div>
        <button className="flex items-center gap-2 bg-primary-blue text-white px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors">
          <Plus size={20} />
          Add Staff
        </button>
      </div>

      <div className="bg-card-white rounded-custom shadow-custom p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
            <input
              type="text"
              placeholder="Search staffs..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter size={20} className="text-text-muted" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Role</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Department</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Phone</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffs.map((staff) => (
                <tr key={staff.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-text-dark">{staff.id}</td>
                  <td className="py-3 px-4 text-sm text-text-dark font-medium">{staff.name}</td>
                  <td className="py-3 px-4 text-sm text-text-muted">{staff.role}</td>
                  <td className="py-3 px-4 text-sm text-text-muted">{staff.department}</td>
                  <td className="py-3 px-4 text-sm text-text-muted">{staff.email}</td>
                  <td className="py-3 px-4 text-sm text-text-muted">{staff.phone}</td>
                  <td className="py-3 px-4">
                    <button className="text-primary-blue hover:text-primary-blue/80 text-sm font-medium">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-text-muted">Showing 1-5 of 165 staffs</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">Previous</button>
            <button className="px-3 py-1 bg-primary-blue text-white rounded-lg text-sm">1</button>
            <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">2</button>
            <button className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Staffs
