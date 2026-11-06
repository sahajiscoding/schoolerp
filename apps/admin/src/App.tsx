import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppDataProvider } from "./lib/appData";
import { ThemeProvider } from "./lib/theme";
import AppShell from "./components/AppShell";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Approvals from "./pages/Approvals";
import CourseProgress from "./pages/CourseProgress";
import Events from "./pages/Events";
import Homeworks from "./pages/Homeworks";
import HomeworkSubmit from "./pages/HomeworkSubmit";
import StudyRoom from "./pages/StudyRoom";
import MyLibrary from "./pages/MyLibrary";
import IssueBook from "./pages/IssueBook";
import DigitalLibrary from "./pages/DigitalLibrary";
import ExaminationReportCards from "./pages/ExaminationReportCards";
import MyAttendance from "./pages/MyAttendance";
import FeeCollections from "./pages/FeeCollections";
import SchoolGallery from "./pages/SchoolGallery";
import SchoolGalleryViewer from "./pages/SchoolGalleryViewer";
import Circulars from "./pages/Circulars";
import CircularDetail from "./pages/CircularDetail";
import DeclarationForms from "./pages/DeclarationForms";
import Messages from "./pages/Messages";
import MessageCreate from "./pages/MessageCreate";
import MessageDetail from "./pages/MessageDetail";
import Polls from "./pages/Polls";
import Profile from "./pages/Profile";

function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, profile } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
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

/** Resets the shell's local UI state (mobile drawer, popover) on navigation. */
function ShellRoute() {
  const { pathname } = useLocation();
  return <AppShell key={pathname} />;
}

/**
 * Old → new redirect that preserves query strings verbatim (spec §2).
 * `to` may be a plain path; the current search string is appended unchanged.
 */
function QueryRedirect({ to }: { to: string }) {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
}

/** Legacy admin surfaces redirect to /dashboard with an in-app nuance (no dead end). */
function LegacyAdminNotice() {
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
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
                    <ShellRoute />
                  </RequireAuth>
                }
              >
                <Route index element={<Dashboard />} />
                {/* Canonical report URLs (spec §2) */}
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="approvals" element={<Approvals />} />
                <Route path="course-progress" element={<CourseProgress />} />
                <Route path="events" element={<Events />} />
                <Route path="homeworks" element={<Homeworks />} />
                <Route path="homeworks/:id/submit" element={<HomeworkSubmit />} />
                <Route path="study-room" element={<StudyRoom />} />
                <Route path="my-library" element={<MyLibrary />} />
                <Route path="issue-book" element={<IssueBook />} />
                <Route path="digital-library" element={<DigitalLibrary />} />
                <Route path="examination-report-cards" element={<ExaminationReportCards />} />
                <Route path="my-attendance" element={<MyAttendance />} />
                <Route path="fee-collections/create" element={<FeeCollections />} />
                <Route path="school-gallery" element={<SchoolGallery />} />
                <Route path="school-gallery/:albumId/:mediaId" element={<SchoolGalleryViewer />} />
                <Route path="circulars" element={<Circulars />} />
                <Route path="circulars/:id" element={<CircularDetail />} />
                <Route path="declaration-forms" element={<DeclarationForms />} />
                <Route path="messages" element={<Messages />} />
                <Route path="messages/create" element={<MessageCreate />} />
                <Route path="messages/:id" element={<MessageDetail />} />
                <Route path="polls" element={<Polls />} />
                <Route path="profile" element={<Profile />} />
                {/* Old → new redirects (spec §2), query strings preserved */}
                <Route path="assignments" element={<QueryRedirect to="/homeworks" />} />
                <Route path="library" element={<QueryRedirect to="/my-library" />} />
                <Route path="report-card" element={<QueryRedirect to="/examination-report-cards" />} />
                <Route path="attendance" element={<QueryRedirect to="/my-attendance" />} />
                <Route path="fees" element={<QueryRedirect to="/fee-collections/create" />} />
                <Route path="gallery" element={<QueryRedirect to="/school-gallery" />} />
                <Route path="communications" element={<QueryRedirect to="/messages" />} />
                <Route path="people" element={<LegacyAdminNotice />} />
                <Route path="classes" element={<LegacyAdminNotice />} />
                <Route path="subjects" element={<LegacyAdminNotice />} />
                <Route path="teaching-assignments" element={<LegacyAdminNotice />} />
                <Route path="enrollments" element={<LegacyAdminNotice />} />
                <Route path="audit-log" element={<LegacyAdminNotice />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AppDataProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
