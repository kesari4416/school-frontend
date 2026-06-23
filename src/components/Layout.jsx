import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  House, Users, ChartBar, ClipboardText, GraduationCap,
  CalendarBlank, Bell, ChartLineUp, SignOut, IdentificationCard,
  Student, ChalkboardTeacher
} from "@phosphor-icons/react";
import { useState } from "react";

const ROLE_LABEL = {
  admin: "Principal",
  class_teacher: "Class Teacher",
  subject_teacher: "Subject Teacher",
  office_staff: "Office Staff",
  parent: "Parent",
  student: "Student",
};

function navItemsFor(role) {
  const common = [{ to: "/dashboard", label: "Dashboard", icon: House, tid: "nav-dashboard" }];
  if (role === "admin" || role === "office_staff") {
    return [
      ...common,
      { to: "/students", label: "Students", icon: Users, tid: "nav-students" },
      { to: "/attendance", label: "Attendance", icon: ClipboardText, tid: "nav-attendance" },
      { to: "/marks", label: "Marks & Results", icon: GraduationCap, tid: "nav-marks" },
      { to: "/exams", label: "Exams & Schedule", icon: CalendarBlank, tid: "nav-exams" },
      { to: "/reports", label: "Reports", icon: ChartBar, tid: "nav-reports" },
      { to: "/notifications", label: "Notifications", icon: Bell, tid: "nav-notifications" },
    ];
  }
  if (role === "class_teacher" || role === "subject_teacher") {
    return [
      ...common,
      { to: "/students", label: "Students", icon: Users, tid: "nav-students" },
      { to: "/attendance", label: "Attendance", icon: ClipboardText, tid: "nav-attendance" },
      { to: "/marks", label: "Marks Entry", icon: GraduationCap, tid: "nav-marks" },
      { to: "/exams", label: "Exam Schedule", icon: CalendarBlank, tid: "nav-exams" },
      { to: "/notifications", label: "Notifications", icon: Bell, tid: "nav-notifications" },
    ];
  }
  if (role === "parent") {
    return [
      ...common,
      { to: "/my-attendance", label: "Attendance", icon: ClipboardText, tid: "nav-my-attendance" },
      { to: "/my-results", label: "Results", icon: ChartLineUp, tid: "nav-my-results" },
      { to: "/my-exams", label: "Exam Schedule", icon: CalendarBlank, tid: "nav-my-exams" },
      { to: "/admit-cards", label: "Admit Cards", icon: IdentificationCard, tid: "nav-admit-cards" },
      { to: "/notifications", label: "Notifications", icon: Bell, tid: "nav-notifications" },
    ];
  }
  // student
  return [
    ...common,
    { to: "/my-attendance", label: "My Attendance", icon: ClipboardText, tid: "nav-my-attendance" },
    { to: "/my-results", label: "My Results", icon: ChartLineUp, tid: "nav-my-results" },
    { to: "/my-exams", label: "My Exams", icon: CalendarBlank, tid: "nav-my-exams" },
    { to: "/admit-cards", label: "Admit Cards", icon: IdentificationCard, tid: "nav-admit-cards" },
    { to: "/notifications", label: "Notifications", icon: Bell, tid: "nav-notifications" },
  ];
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = user ? navItemsFor(user.role) : [];
  const [mobileOpen, setMobileOpen] = useState(false);

  const onLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const RoleIcon =
    user?.role === "student" ? Student :
    user?.role === "parent" ? Users :
    user?.role?.includes("teacher") ? ChalkboardTeacher : GraduationCap;

  return (
    <div className="min-h-screen flex bg-[#F7F7F5]">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-40 left-0 top-0 h-screen w-64 bg-white border-r border-[#E2E8F0] flex-col transition-transform ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 flex`}
        data-testid="sidebar"
      >
        <div className="p-6 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#1A4331] text-white">
              <GraduationCap size={22} weight="duotone" />
            </div>
            <div>
              <div className="font-semibold text-[#1A4331] tracking-tight" style={{fontFamily:'Outfit'}}>
                ICSC Connect
              </div>
              <div className="text-xs text-[#64748B]">School Management</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {items.map(({ to, label, icon: Icon, tid }) => (
            <NavLink
              key={to}
              to={to}
              data-testid={tid}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 my-0.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-[#1A4331] text-white"
                    : "text-[#1E293B] hover:bg-[#F7F7F5]"
                }`
              }
            >
              <Icon size={20} weight="duotone" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#D4A373]/30 flex items-center justify-center text-[#1A4331]">
              <RoleIcon size={20} weight="duotone" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate" data-testid="user-name">{user?.name}</div>
              <div className="text-xs text-[#64748B]">{ROLE_LABEL[user?.role]}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            data-testid="logout-button"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#E2E8F0] text-[#1E293B] hover:bg-[#F7F7F5] transition-colors text-sm"
          >
            <SignOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 lg:hidden z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0] sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
            data-testid="mobile-menu-btn"
            className="p-2 rounded-md border border-[#E2E8F0]"
          >
            ☰
          </button>
          <div className="font-semibold text-[#1A4331]" style={{fontFamily:'Outfit'}}>ICSC Connect</div>
          <div className="w-9" />
        </header>
        <main className="flex-1 px-6 lg:px-10 py-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
