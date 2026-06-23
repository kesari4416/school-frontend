import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Attendance from "@/pages/Attendance";
import Marks from "@/pages/Marks";
import ReportCard from "@/pages/ReportCard";
import Exams from "@/pages/Exams";
import Notifications from "@/pages/Notifications";
import Reports from "@/pages/Reports";
import MyAttendance from "@/pages/MyAttendance";
import MyResults from "@/pages/MyResults";
import MyExams from "@/pages/MyExams";
import AdmitCard from "@/pages/AdmitCard";
import AdmitCards from "@/pages/AdmitCards";
import Users from "@/pages/Users";
import AcademicSetup from "@/pages/AcademicSetup";

const STAFF = ["admin", "class_teacher", "subject_teacher", "office_staff"];
const VIEWER = ["parent", "student"];

function Authed({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function RoleRoute({ roles, children }) {
  return (
    <ProtectedRoute allowedRoles={roles}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function HomeRedirect() {
  const { user } = useAuth();
  if (user === null) return <div className="min-h-screen flex items-center justify-center text-[#64748B]">Loading...</div>;
  if (user === false) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Authed><Dashboard /></Authed>} />

      <Route path="/students" element={<RoleRoute roles={STAFF}><Students /></RoleRoute>} />
      <Route path="/users" element={<RoleRoute roles={["admin"]}><Users /></RoleRoute>} />
      <Route path="/academic-setup" element={<RoleRoute roles={["admin"]}><AcademicSetup /></RoleRoute>} />
      <Route path="/attendance" element={<RoleRoute roles={STAFF}><Attendance /></RoleRoute>} />
      <Route path="/marks" element={<RoleRoute roles={STAFF}><Marks /></RoleRoute>} />
      <Route path="/report-card/:studentId/:examId" element={<Authed><ReportCard /></Authed>} />
      <Route path="/exams" element={<RoleRoute roles={STAFF}><Exams /></RoleRoute>} />
      <Route path="/reports" element={<RoleRoute roles={["admin", "class_teacher", "office_staff"]}><Reports /></RoleRoute>} />
      <Route path="/notifications" element={<Authed><Notifications /></Authed>} />

      <Route path="/my-attendance" element={<RoleRoute roles={VIEWER}><MyAttendance /></RoleRoute>} />
      <Route path="/my-results" element={<RoleRoute roles={VIEWER}><MyResults /></RoleRoute>} />
      <Route path="/my-exams" element={<RoleRoute roles={VIEWER}><MyExams /></RoleRoute>} />
      <Route path="/admit-cards" element={<RoleRoute roles={VIEWER}><AdmitCards /></RoleRoute>} />
      <Route path="/admit-card/:studentId/:examId" element={<Authed><AdmitCard /></Authed>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
