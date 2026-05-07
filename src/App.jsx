import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import OTP from './pages/OTP'
import Interests from './pages/Interests'
import Profile from './pages/Profile'
import Search from './pages/Search'
import Requests from './pages/Requests'
import Chat from './pages/Chat'
import BgOrbs from './components/BgOrbs'

/**
 * Защищённый маршрут — редиректит на /login если не авторизован.
 * Пока идёт инициализация (проверка токена) — ничего не рендерим.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: 36,
            height: 36,
            border: '3px solid rgba(59,130,246,0.2)',
            borderTopColor: '#3B82F6',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

/**
 * Маршрут только для неавторизованных — редиректит авторизованных на /search.
 */
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null

  if (isAuthenticated) {
    return <Navigate to="/search" replace />
  }

  return children
}

function AppRoutes() {
  return (
      <div className="relative min-h-screen overflow-hidden">
        <BgOrbs />
        <div className="relative z-10">
          <Routes>
            {/* Публичные страницы */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={
              <PublicOnlyRoute><Login /></PublicOnlyRoute>
            } />
            <Route path="/register" element={
              <PublicOnlyRoute><Register /></PublicOnlyRoute>
            } />
            <Route path="/otp" element={<OTP />} />
            <Route path="/interests" element={
              <ProtectedRoute><Interests /></ProtectedRoute>
            } />

            {/* Защищённые страницы */}
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            <Route path="/search" element={
              <ProtectedRoute><Search /></ProtectedRoute>
            } />
            <Route path="/requests" element={
              <ProtectedRoute><Requests /></ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute><Chat /></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
  )
}

export default function App() {
  return (
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
  )
}