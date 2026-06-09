import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import DashboardLayout from './components/layout/DashboardLayout'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Equipment from './pages/Equipment'
import Students from './pages/Students'
import Users from './pages/Users'
import IssueEquipment from './pages/IssueEquipment'
import ReturnEquipment from './pages/ReturnEquipment'
import QRScanner from './pages/QRScanner'
import Submissions from './pages/Submissions'
import SubmitPractical from './pages/SubmitPractical'
import MyEquipment from './pages/MyEquipment'
import MySubmissions from './pages/MySubmissions'
import Reports from './pages/Reports'
import AuditLogs from './pages/AuditLogs'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'

// Full-screen spinner shown while auth state loads
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  )
}

// Redirect unauthenticated users to login
function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <RoleHome />
  return children
}

// Redirect logged-in users away from login page
function RequireGuest({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <RoleHome />
  return children
}

// Send each role to their correct home page
function RoleHome() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'student') return <Navigate to="/my-equipment" replace />
  return <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />

      {/* Root — send to role home */}
      <Route path="/" element={<RequireAuth><RoleHome /></RequireAuth>} />

      {/* All authenticated routes share the dashboard layout */}
      <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>

        {/* Admin + Teacher */}
        <Route path="/dashboard" element={<RequireAuth roles={['admin', 'teacher']}><Dashboard /></RequireAuth>} />
        <Route path="/equipment" element={<RequireAuth roles={['admin', 'teacher']}><Equipment /></RequireAuth>} />
        <Route path="/students" element={<RequireAuth roles={['admin', 'teacher']}><Students /></RequireAuth>} />
        <Route path="/users" element={<RequireAuth roles={['admin']}><Users /></RequireAuth>} />
        <Route path="/issue" element={<RequireAuth roles={['admin', 'teacher']}><IssueEquipment /></RequireAuth>} />
        <Route path="/return" element={<RequireAuth roles={['admin', 'teacher']}><ReturnEquipment /></RequireAuth>} />
        <Route path="/submissions" element={<RequireAuth roles={['admin', 'teacher']}><Submissions /></RequireAuth>} />
        <Route path="/reports" element={<RequireAuth roles={['admin', 'teacher']}><Reports /></RequireAuth>} />
        <Route path="/audit" element={<RequireAuth roles={['admin']}><AuditLogs /></RequireAuth>} />

        {/* Student only */}
        <Route path="/my-equipment" element={<RequireAuth roles={['student']}><MyEquipment /></RequireAuth>} />
        <Route path="/my-submissions" element={<RequireAuth roles={['student']}><MySubmissions /></RequireAuth>} />
        <Route path="/submit" element={<RequireAuth roles={['student']}><SubmitPractical /></RequireAuth>} />

        {/* All roles */}
        <Route path="/scanner" element={<RequireAuth><QRScanner /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<RequireAuth><RoleHome /></RequireAuth>} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    </AuthProvider>
  )
}
