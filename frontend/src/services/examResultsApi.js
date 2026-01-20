import { API_BASE_URL } from '../config'

const getAuthToken = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return user.token
}

export const examResultsApi = {
  // Get all exam results with filtering
  async list(params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await fetch(
      `${API_BASE_URL}/results${query ? '?' + query : ''}`,
      {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      }
    )
    if (!response.ok) throw new Error('Failed to fetch exam results')
    return response.json()
  },

  // Get single result
  async getById(id) {
    const response = await fetch(`${API_BASE_URL}/results/${id}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    })
    if (!response.ok) throw new Error('Failed to fetch exam result')
    return response.json()
  },

  // Get student's results
  async getStudentResults(studentId, academicYear, term) {
    const query = new URLSearchParams()
    if (academicYear) query.append('academicYear', academicYear)
    if (term) query.append('term', term)

    const response = await fetch(
      `${API_BASE_URL}/results/student/${studentId}${query.toString() ? '?' + query.toString() : ''}`,
      {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      }
    )
    if (!response.ok) throw new Error('Failed to fetch student results')
    return response.json()
  },

  // Get classroom results for an exam
  async getClassroomExamResults(examId, classroomId) {
    const response = await fetch(
      `${API_BASE_URL}/results/exam/${examId}/classroom/${classroomId}`,
      {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      }
    )
    if (!response.ok) throw new Error('Failed to fetch classroom results')
    return response.json()
  },

  // Create/submit single result
  async create(resultData) {
    const response = await fetch(`${API_BASE_URL}/results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(resultData)
    })
    if (!response.ok) throw new Error('Failed to create exam result')
    return response.json()
  },

  // Batch create results
  async createBatch(examId, classroomId, results, academicYear, term) {
    const response = await fetch(`${API_BASE_URL}/results/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({
        examId,
        classroomId,
        results,
        academicYear,
        term
      })
    })
    if (!response.ok) throw new Error('Failed to batch create results')
    return response.json()
  },

  // Update result
  async update(id, updateData) {
    const response = await fetch(`${API_BASE_URL}/results/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify(updateData)
    })
    if (!response.ok) throw new Error('Failed to update exam result')
    return response.json()
  },

  // Submit result
  async submit(id) {
    const response = await fetch(`${API_BASE_URL}/results/${id}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    })
    if (!response.ok) throw new Error('Failed to submit result')
    return response.json()
  },

  // Approve result
  async approve(id) {
    const response = await fetch(`${API_BASE_URL}/results/${id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    })
    if (!response.ok) throw new Error('Failed to approve result')
    return response.json()
  },

  // Publish result
  async publish(id) {
    const response = await fetch(`${API_BASE_URL}/results/${id}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    })
    if (!response.ok) throw new Error('Failed to publish result')
    return response.json()
  },

  // Delete result
  async delete(id) {
    const response = await fetch(`${API_BASE_URL}/results/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    })
    if (!response.ok) throw new Error('Failed to delete result')
    return response.json()
  },

  // Get exam statistics
  async getExamStatistics(examId, classroomId, term) {
    const query = new URLSearchParams()
    if (classroomId) query.append('classroomId', classroomId)
    if (term) query.append('term', term)

    const response = await fetch(
      `${API_BASE_URL}/results/stats/exam/${examId}${query.toString() ? '?' + query.toString() : ''}`,
      {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      }
    )
    if (!response.ok) throw new Error('Failed to fetch exam statistics')
    return response.json()
  }
}
