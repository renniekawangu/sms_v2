import { useState, useEffect, useMemo } from 'react'
import { AlertCircle, Plus, Edit, Trash2, Search, CheckCircle } from 'lucide-react'
import { issuesApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Modal from '../components/Modal'
import IssueForm from '../components/IssueForm'

function Issues() {
  const { user } = useAuth()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState(null)
  const { success, error: showError } = useToast()

  useEffect(() => {
    loadIssues()
  }, [])

  const loadIssues = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await issuesApi.list()
      setIssues(data)
    } catch (err) {
      const errorMessage = err.message || 'Failed to load issues'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingIssue(null)
    setIsModalOpen(true)
  }

  const handleEdit = (issue) => {
    setEditingIssue(issue)
    setIsModalOpen(true)
  }

  const handleSubmit = async (formData) => {
    try {
      if (editingIssue) {
        await issuesApi.update(editingIssue.issue_id, formData)
        success('Issue updated successfully')
      } else {
        await issuesApi.create(formData)
        success('Issue created successfully')
      }
      setIsModalOpen(false)
      setEditingIssue(null)
      await loadIssues()
    } catch (err) {
      const errorMessage = err.message || (editingIssue ? 'Failed to update issue' : 'Failed to create issue')
      showError(errorMessage)
    }
  }

  const handleResolve = async (issue_id) => {
    try {
      await issuesApi.resolve(issue_id)
      success('Issue resolved successfully')
      await loadIssues()
    } catch (err) {
      const errorMessage = err.message || 'Failed to resolve issue'
      showError(errorMessage)
    }
  }

  const handleDelete = async (issue_id) => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      try {
        await issuesApi.delete(issue_id)
        success('Issue deleted successfully')
        await loadIssues()
      } catch (err) {
        const errorMessage = err.message || 'Failed to delete issue'
        showError(errorMessage)
      }
    }
  }

  const filteredIssues = useMemo(() => {
    if (!searchQuery.trim()) return issues
    const query = searchQuery.toLowerCase()
    return issues.filter((issue) => {
      return (
        issue.type?.toLowerCase().includes(query) ||
        issue.details?.toLowerCase().includes(query) ||
        issue.raised_by?.toLowerCase().includes(query) ||
        issue.issue_id?.toString().includes(query)
      )
    })
  }, [issues, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading issues...</p>
        </div>
      </div>
    )
  }

  if (error && issues.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-text-dark font-medium mb-2">Error loading issues</p>
          <p className="text-text-muted mb-4">{error}</p>
          <button
            onClick={loadIssues}
            className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-dark">Issues</h1>
        <p className="text-sm sm:text-base text-text-muted mt-1">View and manage issues</p>
      </div>
      <button
        onClick={handleCreate}
        className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 bg-primary-blue text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors text-sm sm:text-base font-medium"
      >
        <Plus size={18} />
        <span>Create Issue</span>
      </button>

      <div className="bg-card-white rounded-custom shadow-custom p-6">
        {issues.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={20} />
              <input
                type="text"
                placeholder="Search issues by type, details, or raised by..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Raised By</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Details</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-text-muted">
                    {issues.length === 0 ? 'No issues found' : 'No issues match your search'}
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => (
                  <tr key={issue.issue_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-text-dark">{issue.issue_id}</td>
                    <td className="py-3 px-4 text-sm text-text-dark capitalize">{issue.raised_by}</td>
                    <td className="py-3 px-4 text-sm text-text-muted">{issue.type}</td>
                    <td className="py-3 px-4 text-sm text-text-muted">{issue.details}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          issue.is_resolved
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {issue.is_resolved ? 'Resolved' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {!issue.is_resolved && (
                          <>
                            {(user?.role === 'admin' || (user?.role === issue.raised_by)) && (
                              <button
                                onClick={() => handleEdit(issue)}
                                className="text-primary-blue hover:text-primary-blue/80 text-sm font-medium flex items-center gap-1"
                              >
                                <Edit size={16} />
                                Edit
                              </button>
                            )}
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => handleResolve(issue.issue_id)}
                                className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                              >
                                <CheckCircle size={16} />
                                Resolve
                              </button>
                            )}
                          </>
                        )}
                        {(user?.role === 'admin' || (user?.role === issue.raised_by)) && (
                          <button
                            onClick={() => handleDelete(issue.issue_id)}
                            className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-1"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {issues.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-text-muted">
              Showing {filteredIssues.length} of {issues.length} issues
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingIssue(null)
        }}
        title={editingIssue ? 'Edit Issue' : 'Create New Issue'}
      >
        <IssueForm
          issue={editingIssue}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingIssue(null)
          }}
        />
      </Modal>
    </div>
  )
}

export default Issues
