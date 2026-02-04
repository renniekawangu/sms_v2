import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { SettingsProvider } from './contexts/SettingsContext'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import RoleBasedDashboard from './components/RoleBasedDashboard'
import Layout from './components/Layout'
import './index-responsive.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import RoleManagement from './pages/RoleManagement'
import Students from './pages/Students'
import Teachers from './pages/Teachers'
import Staffs from './pages/Staffs'
import Classrooms from './pages/Classrooms'
import ViewClassroom from './pages/ViewClassroom'
import Subjects from './pages/Subjects'
import Timetable from './pages/Timetable'
import Children from './pages/Children'
import ChildDetail from './pages/ChildDetail'
import Parents from './pages/Parents'
import Attendance from './pages/Attendance'
import Fees from './pages/Fees'
import Payments from './pages/Payments'
import FinancialReports from './pages/FinancialReports'
import Expenses from './pages/Expenses'
import Issues from './pages/Issues'
import SearchResults from './pages/SearchResults'
import Settings from './pages/Settings'
import UsersManagement from './pages/UsersManagement'
import Messages from './pages/Messages'
import Reports from './pages/Reports'
import Exams from './pages/Exams'
import Results from './pages/Results'
import ResultsApproval from './pages/ResultsApproval'
import { PermissionGate } from './components/PermissionGate'
import { ROLES, PERMISSIONS } from './config/rbac'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <SettingsProvider>
            <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
          
              {/* Dashboard - Routes to role-based dashboards */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <RoleBasedDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Dashboard fallback for direct access */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Admin Panel - ADMIN ONLY */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole={ROLES.ADMIN} route="/admin">
                    <Layout>
                      <AdminPanel />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Role Management - ADMIN ONLY */}
              <Route
                path="/roles"
                element={
                  <ProtectedRoute requiredRole={ROLES.ADMIN} route="/roles">
                    <Layout>
                      <PermissionGate permission={PERMISSIONS.ROLE_ASSIGN}>
                        <RoleManagement />
                      </PermissionGate>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Users Management - ADMIN ONLY */}
              <Route
                path="/users"
                element={
                  <ProtectedRoute requiredRole={ROLES.ADMIN} route="/users">
                    <Layout>
                      <PermissionGate permission={PERMISSIONS.USER_CREATE}>
                        <UsersManagement />
                      </PermissionGate>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Students - Accessible to multiple roles */}
              <Route
                path="/students"
                element={
                  <ProtectedRoute route="/students">
                    <Layout>
                      <Students />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Parents - ADMIN ONLY */}
              <Route
                path="/parents"
                element={
                  <ProtectedRoute requiredRole={ROLES.ADMIN} route="/parents">
                    <Layout>
                      <Parents />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Teachers - HEAD TEACHER & ADMIN */}
              <Route
                path="/teachers"
                element={
                  <ProtectedRoute requiredRole={[ROLES.HEAD_TEACHER, ROLES.ADMIN]} route="/teachers">
                    <Layout>
                      <Teachers />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Staffs - HEAD TEACHER & ADMIN */}
              <Route
                path="/staffs"
                element={
                  <ProtectedRoute requiredRole={[ROLES.HEAD_TEACHER, ROLES.ADMIN]} route="/staffs">
                    <Layout>
                      <Staffs />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Classrooms - TEACHER, HEAD_TEACHER & ADMIN */}
              <Route
                path="/classrooms"
                element={
                  <ProtectedRoute requiredRole={[ROLES.TEACHER, ROLES.HEAD_TEACHER, ROLES.ADMIN]} route="/classrooms">
                    <Layout>
                      <Classrooms />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* View Classroom - TEACHER, HEAD_TEACHER & ADMIN */}
              <Route
                path="/classrooms/:id"
                element={
                  <ProtectedRoute requiredRole={[ROLES.TEACHER, ROLES.HEAD_TEACHER, ROLES.ADMIN]}>
                    <Layout>
                      <ViewClassroom />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Subjects - TEACHER, HEAD_TEACHER & ADMIN */}
              <Route
                path="/subjects"
                element={
                  <ProtectedRoute requiredRole={[ROLES.TEACHER, ROLES.HEAD_TEACHER, ROLES.ADMIN]} route="/subjects">
                    <Layout>
                      <Subjects />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Timetable - All authenticated users */}
              <Route
                path="/timetable"
                element={
                  <ProtectedRoute route="/timetable">
                    <Layout>
                      <Timetable />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Children - PARENT & ADMIN ONLY */}
              <Route
                path="/children"
                element={
                  <ProtectedRoute requiredRole={[ROLES.PARENT, ROLES.ADMIN]} route="/children">
                    <Layout>
                      <Children />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Child Detail - PARENT & ADMIN ONLY (self-access enforced on backend) */}
              <Route
                path="/children/:id"
                element={
                  <ProtectedRoute requiredRole={[ROLES.PARENT, ROLES.ADMIN]}>
                    <Layout>
                      <ChildDetail />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Attendance - TEACHER, HEAD_TEACHER & ADMIN */}
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute requiredRole={[ROLES.TEACHER, ROLES.HEAD_TEACHER, ROLES.ADMIN]} route="/attendance">
                    <Layout>
                      <Attendance />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Exams - TEACHER, HEAD_TEACHER & ADMIN */}
              <Route
                path="/exams"
                element={
                  <ProtectedRoute requiredRole={[ROLES.TEACHER, ROLES.HEAD_TEACHER, ROLES.ADMIN]} route="/exams">
                    <Layout>
                      <Exams />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Results - TEACHER, HEAD_TEACHER & ADMIN */}
              <Route
                path="/results"
                element={
                  <ProtectedRoute requiredRole={[ROLES.TEACHER, ROLES.HEAD_TEACHER, ROLES.ADMIN]} route="/results">
                    <Layout>
                      <Results />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Results Approval - HEAD_TEACHER & ADMIN */}
              <Route
                path="/results-approval"
                element={
                  <ProtectedRoute requiredRole={[ROLES.HEAD_TEACHER, ROLES.ADMIN]} route="/results-approval">
                    <Layout>
                      <ResultsApproval />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Fees - ACCOUNTS, HEAD_TEACHER & ADMIN */}
              <Route
                path="/fees"
                element={
                  <ProtectedRoute requiredRole={[ROLES.ACCOUNTS, ROLES.HEAD_TEACHER, ROLES.ADMIN]} route="/fees">
                    <Layout>
                      <Fees />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Payments - ACCOUNTS, HEAD_TEACHER & ADMIN */}
              <Route
                path="/payments"
                element={
                  <ProtectedRoute requiredRole={[ROLES.ACCOUNTS, ROLES.HEAD_TEACHER, ROLES.ADMIN]} route="/payments">
                    <Layout>
                      <Payments />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Financial Reports - ACCOUNTS, HEAD_TEACHER & ADMIN */}
              <Route
                path="/financial-reports"
                element={
                  <ProtectedRoute requiredRole={[ROLES.ACCOUNTS, ROLES.HEAD_TEACHER, ROLES.ADMIN]} route="/financial-reports">
                    <Layout>
                      <FinancialReports />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Expenses - ACCOUNTS & ADMIN */}
              <Route
                path="/expenses"
                element={
                  <ProtectedRoute requiredRole={[ROLES.ACCOUNTS, ROLES.ADMIN]} route="/expenses">
                    <Layout>
                      <Expenses />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Issues - All authenticated users can view/create */}
              <Route
                path="/issues"
                element={
                  <ProtectedRoute route="/issues">
                    <Layout>
                      <Issues />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Search Results - All authenticated users */}
              <Route
                path="/search-results"
                element={
                  <ProtectedRoute route="/search-results">
                    <Layout>
                      <SearchResults />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Messages - All authenticated users */}
              <Route
                path="/messages"
                element={
                  <ProtectedRoute route="/messages">
                    <Layout>
                      <Messages />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Reports - HEAD_TEACHER & ADMIN */}
              <Route
                path="/reports"
                element={
                  <ProtectedRoute requiredRole={[ROLES.HEAD_TEACHER, ROLES.ADMIN]} route="/reports">
                    <Layout>
                      <Reports />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Settings - ADMIN ONLY */}
              <Route
                path="/settings"
                element={
                  <ProtectedRoute requiredRole={ROLES.ADMIN} route="/settings">
                    <Layout>
                      <PermissionGate permission={PERMISSIONS.SYSTEM_SETTINGS_UPDATE}>
                        <Settings />
                      </PermissionGate>
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Router>
          </SettingsProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
