import { useState, useEffect, useMemo } from 'react'
import { DollarSign, Search, Plus, Edit, Trash2, AlertCircle } from 'lucide-react'
import { feesApi, studentsApi } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import Modal from '../components/Modal'
import FeeForm from '../components/FeeForm'
import { useCurrency, formatCurrency } from '../hooks/useCurrency'

function Fees() {
  const [fees, setFees] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFee, setEditingFee] = useState(null)
  const { success, error: showError } = useToast()
  const currency = useCurrency()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [feesData, studentsData] = await Promise.all([
        feesApi.list(),
        studentsApi.list()
      ])
      setFees(feesData)
      setStudents(studentsData)
    } catch (err) {
      const errorMessage = err.message || 'Failed to load data'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingFee(null)
    setIsModalOpen(true)
  }

  const handleEdit = (fee) => {
    setEditingFee(fee)
    setIsModalOpen(true)
  }

  const handleSubmit = async (formData) => {
    try {
      if (editingFee) {
        await feesApi.update(editingFee._id || editingFee.fee_id, formData)
        success('Fee updated successfully')
      } else {
        await feesApi.create(formData)
        success('Fee created successfully')
      }
      setIsModalOpen(false)
      setEditingFee(null)
      await loadData()
    } catch (err) {
      const errorMessage = err.message || (editingFee ? 'Failed to update fee' : 'Failed to create fee')
      showError(errorMessage)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this fee?')) {
      try {
        await feesApi.delete(id)
        success('Fee deleted successfully')
        await loadData()
      } catch (err) {
        const errorMessage = err.message || 'Failed to delete fee'
        showError(errorMessage)
      }
    }
  }

  const getStudentName = (student_id) => {
    return students.find(s => s.student_id === student_id)?.name || `Student ${student_id}`
  }

  const filteredFees = useMemo(() => {
    if (!searchQuery.trim()) return fees
    const query = searchQuery.toLowerCase()
    return fees.filter((fee) => {
      const studentName = getStudentName(fee.student_id).toLowerCase()
      return (
        studentName.includes(query) ||
        fee.fee_id?.toString().includes(query) ||
        fee.term?.toLowerCase().includes(query)
      )
    })
  }, [fees, students, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading fees...</p>
        </div>
      </div>
    )
  }

  if (error && fees.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-text-dark font-medium mb-2">Error loading fees</p>
          <p className="text-text-muted mb-4">{error}</p>
          <button
            onClick={loadData}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-text-dark">Fees</h1>
          <p className="text-sm sm:text-base text-text-muted mt-1">Manage student fees</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center sm:justify-start gap-2 bg-primary-blue text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-blue/90 transition-colors text-sm sm:text-base font-medium"
        >
          <Plus size={18} className="sm:size-5" />
          <span>Add Fee</span>
        </button>
      </div>

      <div className="bg-card-white rounded-custom shadow-custom p-3 sm:p-4 lg:p-6">
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Search fees by student or term..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Student</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Term</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Year</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-dark">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-text-muted">
                    No fees found
                  </td>
                </tr>
              ) : (
                filteredFees.map((fee) => (
                  <tr key={fee._id || fee.fee_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-text-dark">{fee.fee_id}</td>
                    <td className="py-3 px-4 text-sm text-text-dark">{getStudentName(fee.student_id)}</td>
                    <td className="py-3 px-4 text-sm text-text-dark font-medium">{formatCurrency(fee.amount, currency)}</td>
                    <td className="py-3 px-4 text-sm text-text-muted">{fee.term}</td>
                    <td className="py-3 px-4 text-sm text-text-muted">{fee.year}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          fee.status === 'PAID'
                            ? 'bg-green-100 text-green-700'
                            : fee.status === 'PARTIAL'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {fee.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(fee)}
                          className="text-primary-blue hover:text-primary-blue/80 text-sm font-medium flex items-center gap-1"
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(fee._id || fee.fee_id)}
                          className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center gap-1"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <p className="text-sm text-text-muted">
            Showing {filteredFees.length} of {fees.length} fees
          </p>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingFee(null)
        }}
        title={editingFee ? 'Edit Fee' : 'Add New Fee'}
      >
        <FeeForm
          fee={editingFee}
          students={students}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingFee(null)
          }}
        />
      </Modal>
    </div>
  )
}

export default Fees
