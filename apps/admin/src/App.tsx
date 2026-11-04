import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppDataProvider } from './lib/appData';
import AppShell from './components/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Approvals from './pages/Approvals';
import CourseProgress from './pages/CourseProgress';
import Communications from './pages/Communications';
import Events from './pages/Events';
import Assignments from './pages/Assignments';
import StudyRoom from './pages/StudyRoom';
import Library from './pages/Library';
import ReportCard from './pages/ReportCard';
import Attendance from './pages/Attendance';
import Fees from './pages/Fees';
import Gallery from './pages/Gallery';
import People from './pages/People';
import Classes from './pages/Classes';
import Subjects from './pages/Subjects';
import TeachingAssignments from './pages/TeachingAssignments';
import Enrollments from './pages/Enrollments';
import AuditLog from './pages/AuditLog';

function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, profile } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-sand">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-olive/30 border-t-olive" />
      </div>
    );
  }
  return profile ? <>{children}</> : <Navigate to="/login" replace />;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { loading, profile } = useAuth();
  if (loading) return null;
  return profile ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

/** Administration routes are admin-only in every role view. */
function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  return isAdmin() ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestOnly>
                  <Login />
                </GuestOnly>
              }
            />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="approvals" element={<Approvals />} />
              <Route path="course-progress" element={<CourseProgress />} />
              <Route path="communications" element={<Communications />} />
              <Route path="events" element={<Events />} />
              <Route path="assignments" element={<Assignments />} />
              <Route path="study-room" element={<StudyRoom />} />
              <Route path="library" element={<Library />} />
              <Route path="report-card" element={<ReportCard />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="fees" element={<Fees />} />
              <Route path="gallery" element={<Gallery />} />
              <Route
                path="people"
                element={
                  <AdminOnly>
                    <People />
                  </AdminOnly>
                }
              />
              <Route
                path="classes"
                element={
                  <AdminOnly>
                    <Classes />
                  </AdminOnly>
                }
              />
              <Route
                path="subjects"
                element={
                  <AdminOnly>
                    <Subjects />
                  </AdminOnly>
                }
              />
              <Route
                path="teaching-assignments"
                element={
                  <AdminOnly>
                    <TeachingAssignments />
                  </AdminOnly>
                }
              />
              <Route
                path="enrollments"
                element={
                  <AdminOnly>
                    <Enrollments />
                  </AdminOnly>
                }
              />
              <Route
                path="audit-log"
                element={
                  <AdminOnly>
                    <AuditLog />
                  </AdminOnly>
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppDataProvider>
    </AuthProvider>
  );
}
