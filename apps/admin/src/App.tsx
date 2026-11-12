import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { isDemoPath } from './lib/demo';
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
      <div className="flex min-h-screen items-center justify-center bg-daylight px-6 text-ink">
        <div role="status" className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-paper p-2 shadow-card">
            <img src="/brand/pws-logo.png" alt="" width="64" height="64" className="h-full w-full object-contain" />
          </span>
          <span className="mt-4 font-display text-xl font-semibold">Opening your school day</span>
          <span className="mt-3 h-1.5 w-28 overflow-hidden rounded-full bg-leaf">
            <span className="block h-full w-1/2 animate-pulse rounded-full bg-olive" />
          </span>
          <span className="sr-only">Checking your session</span>
        </div>
      </div>
    );
  }
  return profile ? <>{children}</> : <Navigate to="/login" replace />;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { loading, profile } = useAuth();
  // Demo entry must remain available while live auth is slow or offline.
  if (loading) return <>{children}</>;
  return profile ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

/** Administration routes are admin-only in every role view. */
function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  return isAdmin() ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

/** Resets the shell's local UI state (mobile drawer, popover) on navigation. */
function ShellRoute() {
  const { pathname } = useLocation();
  return <AppShell key={pathname} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <BrowserRouter basename={isDemoPath ? '/demo' : '/'}>
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
                  <ShellRoute />
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
