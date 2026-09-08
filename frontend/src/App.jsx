import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Interview from './pages/Interview'
import Report from './pages/Report'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/interview" element={
              <ProtectedRoute><Interview /></ProtectedRoute>
            } />
            <Route path="/report" element={
              <ProtectedRoute><Report /></ProtectedRoute>
            } />
            <Route path="/report/:id" element={
              <ProtectedRoute><Report /></ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
