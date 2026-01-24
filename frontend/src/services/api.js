// Real API Service - connects to backend API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


// Helper function to get auth token
const getToken = () => {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      return JSON.parse(user).token;
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Helper function for API calls
export const apiCall = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch {
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` }
      }
      
      // Handle unauthorized - but check if it's a login endpoint first
      if (response.status === 401) {
        // For login endpoint, show the actual error message
        if (endpoint === '/auth/login') {
          throw new Error(errorData.message || errorData.error || 'Invalid credentials')
        }
        // For other endpoints, it's a session expiration
        localStorage.removeItem('user')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        throw new Error('Session expired. Please login again.')
      }
      
      throw new Error(errorData.error || errorData.message || 'Request failed')
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text()
      return text ? JSON.parse(text) : {}
    }
    
    return {}
  } catch (error) {
    // Re-throw if it's already an Error with message
    if (error instanceof Error) {
      throw error
    }
    // Network errors
    throw new Error('Network error. Please check your connection.')
  }
};

// Auth API
export const authApi = {
  login: async (email, password) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  logout: async () => {
    return apiCall('/auth/logout', {
      method: 'POST',
    });
  },

  me: async () => {
    return apiCall('/auth/me', {
      method: 'GET',
    });
  },
};

// Students API
export const studentsApi = {
  list: async () => {
    return apiCall('/students');
  },

  get: async (student_id) => {
    return apiCall(`/students/${student_id}`);
  },

  create: async (data) => {
    return apiCall('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (student_id, data) => {
    return apiCall(`/students/${student_id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (student_id) => {
    return apiCall(`/students/${student_id}`, {
      method: 'DELETE',
    });
  },
};

// Teachers API
export const teachersApi = {
  list: async () => {
    return apiCall('/teachers');
  },

  get: async (teacher_id) => {
    return apiCall(`/teachers/${teacher_id}`);
  },

  create: async (data) => {
    return apiCall('/teachers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (teacher_id, data) => {
    return apiCall(`/teachers/${teacher_id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (teacher_id) => {
    return apiCall(`/teachers/${teacher_id}`, {
      method: 'DELETE',
    });
  },
};

// Classrooms API
export const classroomsApi = {
  list: async () => {
    return apiCall('/classrooms');
  },

  get: async (id) => {
    return apiCall(`/classrooms/${id}`);
  },

  create: async (data) => {
    return apiCall('/classrooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    if (!id) throw new Error('Classroom id is required');
    return apiCall(`/classrooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (classroom_id) => {
    return apiCall(`/classrooms/${classroom_id}`, {
      method: 'DELETE',
    });
  },
};

// Subjects API
export const subjectsApi = {
  list: async () => {
    return apiCall('/subjects');
  },

  get: async (subject_id) => {
    return apiCall(`/subjects/${subject_id}`);
  },

  create: async (data) => {
    return apiCall('/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (subject_id, data) => {
    return apiCall(`/subjects/${subject_id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (subject_id) => {
    return apiCall(`/subjects/${subject_id}`, {
      method: 'DELETE',
    });
  },
};

// Timetable API - NOTE: Backend endpoints not yet implemented
// Timetable Schedule API - Comprehensive timetable management
export const timetableApi = {
  // Timetable Schedules
  schedules: {
    list: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiCall(`/timetable/schedules${query ? `?${query}` : ''}`);
    },

    get: async (id) => {
      return apiCall(`/timetable/schedules/${id}`);
    },

    getByClassroom: async (classroom_id, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiCall(`/timetable/schedules/classroom/${classroom_id}${query ? `?${query}` : ''}`);
    },

    getByInstructor: async (instructor_id, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiCall(`/timetable/schedules/instructor/${instructor_id}${query ? `?${query}` : ''}`);
    },

    create: async (data) => {
      return apiCall('/timetable/schedules', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id, data) => {
      return apiCall(`/timetable/schedules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id) => {
      return apiCall(`/timetable/schedules/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Instructors
  instructors: {
    list: async () => {
      return apiCall('/timetable/instructors');
    },

    get: async (id) => {
      return apiCall(`/timetable/instructors/${id}`);
    },

    getByStaff: async (staff_id) => {
      return apiCall(`/timetable/instructors/staff/${staff_id}`);
    },

    create: async (data) => {
      return apiCall('/timetable/instructors', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id, data) => {
      return apiCall(`/timetable/instructors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id) => {
      return apiCall(`/timetable/instructors/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Courses
  courses: {
    list: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiCall(`/timetable/courses${query ? `?${query}` : ''}`);
    },

    get: async (id) => {
      return apiCall(`/timetable/courses/${id}`);
    },

    getByClassroom: async (classroom_id, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiCall(`/timetable/courses/classroom/${classroom_id}${query ? `?${query}` : ''}`);
    },

    create: async (data) => {
      return apiCall('/timetable/courses', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id, data) => {
      return apiCall(`/timetable/courses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id) => {
      return apiCall(`/timetable/courses/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Legacy compatibility methods
  list: async () => {
    return apiCall('/timetable/schedules');
  },

  getByClassroom: async (classroom_id) => {
    return apiCall(`/timetable/schedules/classroom/${classroom_id}`);
  },

  create: async (data) => {
    return apiCall('/timetable/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (timetable_id, data) => {
    return apiCall(`/timetable/schedules/${timetable_id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (timetable_id) => {
    return apiCall(`/timetable/schedules/${timetable_id}`, {
      method: 'DELETE',
    });
  },
};

// Exams API - NOTE: Backend endpoints not yet implemented
export const examsApi = {
  list: async () => {
    return apiCall('/exams');
  },

  get: async (exam_id) => {
    return apiCall(`/exams/${exam_id}`);
  },

  create: async (data) => {
    return apiCall('/exams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (exam_id, data) => {
    return apiCall(`/exams/${exam_id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (exam_id) => {
    return apiCall(`/exams/${exam_id}`, {
      method: 'DELETE',
    });
  },
};

// Results API - NOTE: Backend endpoints not yet implemented  
export const resultsApi = {
  list: async () => {
    return apiCall('/results');
  },

  getByStudent: async (student_id) => {
    return apiCall(`/results/student/${student_id}`);
  },

  create: async (data) => {
    return apiCall('/results', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (result_id, data) => {
    return apiCall(`/results/${result_id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (result_id) => {
    return apiCall(`/results/${result_id}`, {
      method: 'DELETE',
    });
  },
};

// Attendance API
export const attendanceApi = {
  list: async () => {
    return apiCall('/attendance');
  },

  getByUser: async (user_id) => {
    return apiCall(`/attendance/${user_id}`);
  },

  getByClassroom: async (classroomId) => {
    return apiCall(`/teacher/classroom/${classroomId}/attendance`);
  },

  mark: async (data) => {
    return apiCall('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (attendance_id, data) => {
    return apiCall(`/attendance/record/${attendance_id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (attendance_id) => {
    return apiCall(`/attendance/record/${attendance_id}`, {
      method: 'DELETE',
    });
  },
};

// Fees API
export const feesApi = {
  list: async () => {
    return apiCall('/fees');
  },

  listByFilters: async (queryParams) => {
    const queryString = queryParams.toString();
    return apiCall(`/accounts/fees${queryString ? '?' + queryString : ''}`);
  },

  get: async (fee_id) => {
    return apiCall(`/fees/${fee_id}`);
  },

  create: async (data) => {
    return apiCall('/accounts/fees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (fee_id, data) => {
    return apiCall(`/fees/${fee_id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (fee_id) => {
    return apiCall(`/fees/${fee_id}`, {
      method: 'DELETE',
    });
  },
};

// Payments API
export const paymentsApi = {
  list: async () => {
    return apiCall('/payments');
  },

  create: async (data) => {
    return apiCall('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Expenses API
export const expensesApi = {
  list: async () => {
    return apiCall('/expenses');
  },

  get: async (expense_id) => {
    return apiCall(`/expenses/${expense_id}`);
  },

  create: async (data) => {
    return apiCall('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (expense_id, data) => {
    return apiCall(`/expenses/${expense_id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (expense_id) => {
    return apiCall(`/expenses/${expense_id}`, {
      method: 'DELETE',
    });
  },
};

// Issues API - NOTE: Backend endpoints not yet implemented
export const issuesApi = {
  list: async () => {
    return apiCall('/issues');
  },

  get: async (issue_id) => {
    return apiCall(`/issues/${issue_id}`);
  },

  create: async (data) => {
    return apiCall('/issues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (issue_id, data) => {
    return apiCall(`/issues/${issue_id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  resolve: async (issue_id) => {
    return apiCall(`/issues/${issue_id}/resolve`, {
      method: 'PUT',
    });
  },

  delete: async (issue_id) => {
    return apiCall(`/issues/${issue_id}`, {
      method: 'DELETE',
    });
  },
};

// Settings API
export const settingsApi = {
  getSchoolSettings: async () => {
    return apiCall('/settings', {
      method: 'GET',
    });
  },

  updateSchoolSettings: async (data) => {
    return apiCall('/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Academic Years
  getAllAcademicYears: async () => {
    return apiCall('/settings/academic-years', {
      method: 'GET',
    });
  },

  createAcademicYear: async (data) => {
    return apiCall('/settings/academic-years', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateAcademicYear: async (year_id, data) => {
    return apiCall(`/settings/academic-years/${year_id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  setCurrentAcademicYear: async (year_id) => {
    return apiCall(`/settings/academic-years/${year_id}/set-current`, {
      method: 'POST',
    });
  },

  deleteAcademicYear: async (year_id) => {
    return apiCall(`/settings/academic-years/${year_id}`, {
      method: 'DELETE',
    });
  },

  // Fee Structures
  getAllFeeStructures: async () => {
    return apiCall('/settings/fee-structures', {
      method: 'GET',
    });
  },

  createFeeStructure: async (data) => {
    return apiCall('/settings/fee-structures', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateFeeStructure: async (fee_id, data) => {
    return apiCall(`/settings/fee-structures/${fee_id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteFeeStructure: async (fee_id) => {
    return apiCall(`/settings/fee-structures/${fee_id}`, {
      method: 'DELETE',
    });
  },

  // Holidays
  getAllHolidays: async () => {
    return apiCall('/settings/holidays', {
      method: 'GET',
    });
  },

  createHoliday: async (data) => {
    return apiCall('/settings/holidays', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteHoliday: async (holiday_id) => {
    return apiCall(`/settings/holidays/${holiday_id}`, {
      method: 'DELETE',
    });
  },
};

// ============= ROLE-BASED APIs =============

// Admin API
export const adminApi = {
  getDashboard: async () => {
    return apiCall('/admin/dashboard', {
      method: 'GET',
    });
  },

  getUserManagement: async () => {
    return apiCall('/admin/users', {
      method: 'GET',
    });
  },

  getReports: async () => {
    return apiCall('/admin/reports', {
      method: 'GET',
    });
  },

  getAuditLogs: async () => {
    return apiCall('/admin/audit-logs', {
      method: 'GET',
    });
  },

  // Staff and Students raw lists (include _id)
  listStaff: async (params = {}) => {
    const query = new URLSearchParams({ limit: '1000', ...params }).toString();
    return apiCall(`/admin/staff-list?${query}`, { method: 'GET' });
  },

  listStudents: async (params = {}) => {
    const query = new URLSearchParams({ limit: '1000', ...params }).toString();
    return apiCall(`/admin/students-list?${query}`, { method: 'GET' });
  },
};

// Accounts API
export const accountsApi = {
  getDashboard: async () => {
    return apiCall('/accounts/dashboard', {
      method: 'GET',
    });
  },

  getFees: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiCall(`/accounts/fees?${params}`, {
      method: 'GET',
    });
  },

  createFee: async (data) => {
    return apiCall('/accounts/fees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateFee: async (fee_id, data) => {
    return apiCall(`/accounts/fees/${fee_id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteFee: async (fee_id) => {
    return apiCall(`/accounts/fees/${fee_id}`, {
      method: 'DELETE',
    });
  },

  getPayments: async (filters = {}) => {
    const params = filters instanceof URLSearchParams ? filters : new URLSearchParams(filters);
    return apiCall(`/accounts/payments?${params}`, {
      method: 'GET',
    });
  },

  createPayment: async (data) => {
    return apiCall('/accounts/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getExpenses: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiCall(`/accounts/expenses?${params}`, {
      method: 'GET',
    });
  },

  createExpense: async (data) => {
    return apiCall('/accounts/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateExpense: async (expense_id, data) => {
    return apiCall(`/accounts/expenses/${expense_id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteExpense: async (expense_id) => {
    return apiCall(`/accounts/expenses/${expense_id}`, {
      method: 'DELETE',
    });
  },

  // Financial Reports
  getReportSummary: async (filters = {}) => {
    const params = filters instanceof URLSearchParams ? filters : new URLSearchParams(filters);
    return apiCall(`/accounts/reports/summary?${params}`, {
      method: 'GET',
    });
  },

  getReportOverdue: async () => {
    return apiCall('/accounts/reports/overdue', {
      method: 'GET',
    });
  },

  getReportTrend: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return apiCall(`/accounts/reports/collection-trend?${params}`, {
      method: 'GET',
    });
  },

  getReports: async () => {
    return apiCall('/accounts/reports', {
      method: 'GET',
    });
  },

  exportReport: async (type, format = 'pdf') => {
    return apiCall(`/accounts/reports/export?type=${type}&format=${format}`, {
      method: 'GET',
    });
  },
};

// Teacher API
export const teacherApi = {
  getDashboard: async () => {
    return apiCall('/teacher/dashboard', {
      method: 'GET',
    });
  },

  getMyClasses: async () => {
    return apiCall('/teacher/classes', {
      method: 'GET',
    });
  },

  getMyStudents: async () => {
    return apiCall('/teacher/students', {
      method: 'GET',
    });
  },

  getMyClassrooms: async () => {
    return apiCall('/teacher/classrooms', {
      method: 'GET',
    });
  },

  getClassroomStudents: async (classroomId) => {
    return apiCall(`/teacher/classroom/${classroomId}/students`, {
      method: 'GET',
    });
  },

  getMySubjects: async () => {
    return apiCall('/teacher/subjects', {
      method: 'GET',
    });
  },

  getAttendanceRecords: async () => {
    return apiCall('/teacher/attendance', {
      method: 'GET',
    });
  },

  markAttendance: async (data) => {
    return apiCall('/teacher/attendance/mark', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getGrades: async () => {
    return apiCall('/teacher/grades', {
      method: 'GET',
    });
  },

  submitGrades: async (data) => {
    return apiCall('/teacher/grades', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPerformanceStats: async () => {
    return apiCall('/teacher/performance', {
      method: 'GET',
    });
  },
};

// Student API
export const studentApi = {
  getDashboard: async () => {
    return apiCall('/student/dashboard', {
      method: 'GET',
    });
  },

  getMyProfile: async () => {
    return apiCall('/student/profile', {
      method: 'GET',
    });
  },

  updateProfile: async (data) => {
    return apiCall('/student/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getMyGrades: async () => {
    return apiCall('/student/grades', {
      method: 'GET',
    });
  },

  getMyAttendance: async () => {
    return apiCall('/student/attendance', {
      method: 'GET',
    });
  },

  getMyFees: async () => {
    return apiCall('/student/fees', {
      method: 'GET',
    });
  },

  getMySubjects: async () => {
    return apiCall('/student/subjects', {
      method: 'GET',
    });
  },

  getExamSchedule: async () => {
    return apiCall('/student/exams', {
      method: 'GET',
    });
  },

  getTimeTable: async () => {
    return apiCall('/student/timetable', {
      method: 'GET',
    });
  },
};

// Head Teacher API
export const headTeacherApi = {
  getDashboard: async () => {
    return apiCall('/head-teacher/dashboard', {
      method: 'GET',
    });
  },

  getStudents: async () => {
    return apiCall('/head-teacher/students', {
      method: 'GET',
    });
  },

  getSubjects: async () => {
    return apiCall('/head-teacher/subjects', {
      method: 'GET',
    });
  },

  getStaffList: async () => {
    return apiCall('/head-teacher/staff', {
      method: 'GET',
    });
  },

  getAttendanceAnalytics: async () => {
    return apiCall('/head-teacher/attendance-analytics', {
      method: 'GET',
    });
  },

  getPerformanceMetrics: async () => {
    return apiCall('/head-teacher/performance', {
      method: 'GET',
    });
  },
};

// Parents API
export const parentsApi = {
  list: async () => {
    return apiCall('/parents');
  },

  getDashboard: async () => {
    return apiCall('/parents/dashboard', {
      method: 'GET',
    });
  },

  getMyChildren: async () => {
    return apiCall('/parents/children', {
      method: 'GET',
    });
  },

  getChildProgress: async (student_id) => {
    return apiCall(`/parents/children/${student_id}/progress`, {
      method: 'GET',
    });
  },

  getChildGrades: async (student_id) => {
    return apiCall(`/parents/children/${student_id}/grades`, {
      method: 'GET',
    });
  },

  getChildAttendance: async (student_id) => {
    return apiCall(`/parents/children/${student_id}/attendance`, {
      method: 'GET',
    });
  },

  getChildFees: async (student_id) => {
    return apiCall(`/parents/children/${student_id}/fees`, {
      method: 'GET',
    });
  },

  getChildHomework: async (student_id, academicYear) => {
    const query = new URLSearchParams();
    if (academicYear) query.append('academicYear', academicYear);
    return apiCall(`/parents/children/${student_id}/homework${query.toString() ? '?' + query.toString() : ''}`, {
      method: 'GET',
    });
  },

  getHomeworkDetails: async (homework_id) => {
    return apiCall(`/parents/homework/${homework_id}`, {
      method: 'GET',
    });
  },

  downloadHomeworkAttachment: async (homework_id, attachment_id) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/homework/${homework_id}/attachment/${attachment_id}/download`, {
      method: 'GET',
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to download attachment');
    }
    return await response.blob();
  },

  downloadChildReport: async (student_id) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/parents/children/${student_id}/report`, {
      method: 'GET',
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to download report');
    }
    return await response.blob();
  },

  makePayment: async (student_id, paymentData) => {
    // paymentData: { fee_id?, amount, paymentMethod, notes? }
    return apiCall(`/parents/children/${student_id}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },

  getPaymentHistory: async (student_id) => {
    return apiCall(`/parents/children/${student_id}/payment-history`, {
      method: 'GET',
    });
  },

  createPayment: async (data) => {
    return apiCall('/parents/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPaymentHistory: async () => {
    return apiCall('/parents/payments', {
      method: 'GET',
    });
  },

  update: async (parentId, data) => {
    return apiCall(`/parents/${parentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (parentId) => {
    return apiCall(`/parents/${parentId}`, {
      method: 'DELETE',
    });
  },

  linkStudent: async (parentId, studentId) => {
    return apiCall(`/parents/${parentId}/link/${studentId}`, {
      method: 'POST',
    });
  },

  unlinkStudent: async (parentId, studentId) => {
    return apiCall(`/parents/${parentId}/unlink/${studentId}`, {
      method: 'POST',
    });
  },
};

// Exam Results API
export const examResultsApi = {
  list: async (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiCall(`/results${query ? '?' + query : ''}`)
  },

  getById: async (id) => {
    return apiCall(`/results/${id}`)
  },

  getStudentResults: async (studentId, academicYear, term) => {
    const query = new URLSearchParams()
    if (academicYear) query.append('academicYear', academicYear)
    if (term) query.append('term', term)
    return apiCall(`/results/student/${studentId}${query.toString() ? '?' + query.toString() : ''}`)
  },

  getClassroomExamResults: async (examId, classroomId) => {
    return apiCall(`/results/exam/${examId}/classroom/${classroomId}`)
  },

  create: async (resultData) => {
    return apiCall('/results', {
      method: 'POST',
      body: JSON.stringify(resultData),
    })
  },

  createBatch: async (examId, classroomId, results, academicYear, term) => {
    return apiCall('/results/batch', {
      method: 'POST',
      body: JSON.stringify({ examId, classroomId, results, academicYear, term }),
    })
  },

  update: async (id, updateData) => {
    return apiCall(`/results/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })
  },

  submit: async (id) => {
    return apiCall(`/results/${id}/submit`, {
      method: 'POST',
    })
  },

  approve: async (id) => {
    return apiCall(`/results/${id}/approve`, {
      method: 'POST',
    })
  },

  publish: async (id) => {
    return apiCall(`/results/${id}/publish`, {
      method: 'POST',
    })
  },

  delete: async (id) => {
    return apiCall(`/results/${id}`, {
      method: 'DELETE',
    })
  },

  getExamStatistics: async (examId, classroomId, term) => {
    const query = new URLSearchParams()
    if (classroomId) query.append('classroomId', classroomId)
    if (term) query.append('term', term)
    return apiCall(`/results/stats/exam/${examId}${query.toString() ? '?' + query.toString() : ''}`)
  }
}

// Classroom API
export const classroomApi = {
  list: async (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiCall(`/classrooms${query ? '?' + query : ''}`)
  },

  getById: async (id) => {
    return apiCall(`/classrooms/${id}`)
  },

  create: async (data) => {
    return apiCall('/classrooms', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id, data) => {
    return apiCall(`/classrooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (id) => {
    return apiCall(`/classrooms/${id}`, {
      method: 'DELETE',
    })
  }
}

// Exams API
export const examApi = {
  list: async (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiCall(`/exams${query ? '?' + query : ''}`)
  },

  getById: async (id) => {
    return apiCall(`/exams/${id}`)
  },

  create: async (data) => {
    return apiCall('/exams', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id, data) => {
    return apiCall(`/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (id) => {
    return apiCall(`/exams/${id}`, {
      method: 'DELETE',
    })
  }
}

// Homework API
export const homeworkApi = {
  getByClassroom: async (classroomId, academicYear) => {
    const query = new URLSearchParams();
    if (academicYear) query.append('academicYear', academicYear);
    return apiCall(`/homework/classroom/${classroomId}${query.toString() ? '?' + query.toString() : ''}`)
  },

  getById: async (id) => {
    return apiCall(`/homework/${id}`)
  },

  create: async (data) => {
    return apiCall('/homework', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id, data) => {
    return apiCall(`/homework/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  addFiles: async (id, formData) => {
    const token = getToken()
    const response = await fetch(`${API_BASE_URL}/homework/${id}/add-files`, {
      method: 'PUT',
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to add files')
    }

    return await response.json()
  },

  delete: async (id) => {
    return apiCall(`/homework/${id}`, {
      method: 'DELETE',
    })
  },

  submit: async (id) => {
    return apiCall(`/homework/${id}/submit`, {
      method: 'POST',
    })
  },

  submitWithFiles: async (id, formData) => {
    const token = getToken()
    const response = await fetch(`${API_BASE_URL}/homework/${id}/submit`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to submit homework')
    }

    return await response.json()
  },

  createWithFiles: async (formData) => {
    const token = getToken()
    const response = await fetch(`${API_BASE_URL}/homework/create-with-files`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create homework')
    }

    return await response.json()
  },

  grade: async (id, studentId, grade, feedback) => {
    return apiCall(`/homework/${id}/grade`, {
      method: 'POST',
      body: JSON.stringify({ studentId, grade, feedback }),
    })
  },

  downloadAttachment: async (homeworkId, attachmentId) => {
    const token = getToken()
    const response = await fetch(`${API_BASE_URL}/homework/${homeworkId}/attachment/${attachmentId}/download`, {
      method: 'GET',
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    })
    if (!response.ok) {
      throw new Error('Failed to download attachment')
    }
    return await response.blob()
  },

  downloadSubmissionAttachment: async (homeworkId, studentId, attachmentId) => {
    const token = getToken()
    const response = await fetch(`${API_BASE_URL}/homework/${homeworkId}/submission/${studentId}/attachment/${attachmentId}/download`, {
      method: 'GET',
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    })
    if (!response.ok) {
      throw new Error('Failed to download submission attachment')
    }
    return await response.blob()
  }
}
