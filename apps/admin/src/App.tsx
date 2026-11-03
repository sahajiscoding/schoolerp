import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Classes from './pages/Classes'
import People from './pages/People'

function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, profile } = useAuth()
  if (loading) return null
  return profile ? <>{children}</> : <Navigate to="/login" replace />
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { loading, profile } = useAuth()
  if (loading) return null
  return profile ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="classes" element={<Classes />} />
            <Route path="people" element={<People />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
