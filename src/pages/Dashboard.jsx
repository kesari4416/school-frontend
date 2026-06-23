import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, ClipboardText, Warning, CalendarBlank, ChartLineUp, GraduationCap, BookOpen, PaperPlaneTilt
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { toast } from "sonner";

function Metric({ icon: Icon, label, value, accent, tid }) {
  return (
    <Card className="card-soft" data-testid={tid}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="tiny-label">{label}</div>
            <div className="text-3xl font-semibold mt-2 text-[#1A4331]" style={{fontFamily:'Outfit'}}>{value}</div>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>
            <Icon size={22} weight="duotone" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [m, setM] = useState(null);
  const [trend, setTrend] = useState([]);
  const [sendingDigest, setSendingDigest] = useState(false);

  useEffect(() => {
    api.get("/dashboard/metrics").then((r) => setM(r.data)).catch(() => {});
    api.get("/attendance/analytics/trend?days=14").then((r) => setTrend(r.data)).catch(() => {});
  }, []);

  const sendDigest = async () => {
    setSendingDigest(true);
    try {
      const { data } = await api.post("/admin/run-daily-digest");
      if (data.skipped) {
        toast.info("Digest already sent today. Use ‘Force’ to resend.");
      } else {
        toast.success(`Digest sent to ${data.personalized_count} parents (emails: ${data.emails_dispatched})`);
      }
    } catch {
      toast.error("Failed to send digest");
    } finally {
      setSendingDigest(false);
    }
  };

  if (!m) return <div className="text-[#64748B]">Loading dashboard…</div>;

  return (
    <div className="space-y-8" data-testid="admin-dashboard">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="tiny-label">Overview</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A4331] mt-1" style={{fontFamily:'Outfit'}}>
            Good day, Principal
          </h1>
          <p className="text-[#64748B] mt-1">A snapshot of your school&apos;s pulse today.</p>
        </div>
        <button
          onClick={sendDigest}
          disabled={sendingDigest}
          data-testid="send-digest-btn"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A373] text-[#1A4331] hover:bg-[#c39361] font-medium transition-colors"
        >
          <PaperPlaneTilt size={18} weight="duotone" />
          {sendingDigest ? "Sending…" : "Send Daily Digest Now"}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric icon={Users} label="Total Students" value={m.total_students} accent="bg-[#1A4331]/10 text-[#1A4331]" tid="metric-students" />
        <Metric icon={ClipboardText} label="Avg Attendance" value={`${m.average_attendance}%`} accent="bg-[#D4A373]/20 text-[#1A4331]" tid="metric-attendance" />
        <Metric icon={Warning} label="Below 75% Threshold" value={m.below_threshold_count} accent="bg-[#EF4444]/10 text-[#EF4444]" tid="metric-below-threshold" />
        <Metric icon={CalendarBlank} label="Exams Scheduled" value={m.exams_scheduled} accent="bg-[#F59E0B]/15 text-[#F59E0B]" tid="metric-exams" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="card-soft lg:col-span-2" data-testid="attendance-trend-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="tiny-label">Attendance Trend</p>
                <h3 className="text-xl font-semibold mt-1" style={{fontFamily:'Outfit'}}>Last 14 days</h3>
              </div>
              <ChartLineUp size={22} className="text-[#1A4331]" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="percentage" stroke="#1A4331" strokeWidth={2.5} dot={{ r: 3, fill: "#D4A373" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="card-soft" data-testid="next-exam-card">
          <CardContent className="p-6">
            <p className="tiny-label">Next Examination</p>
            <h3 className="text-xl font-semibold mt-2" style={{fontFamily:'Outfit'}}>
              {m.next_exam?.name || "No upcoming exam"}
            </h3>
            {m.next_exam && (
              <>
                <p className="text-sm text-[#64748B] mt-1">
                  {m.next_exam.exam_type?.toUpperCase()} • Starts {m.next_exam.start_date}
                </p>
                <Badge className="mt-3 bg-[#D4A373]/20 text-[#1A4331] hover:bg-[#D4A373]/30">
                  {m.next_exam.visibility}
                </Badge>
              </>
            )}
            <button
              onClick={() => navigate("/exams")}
              data-testid="view-all-exams-btn"
              className="mt-6 w-full text-sm px-3 py-2 rounded-lg bg-[#1A4331] text-white hover:bg-[#133124] transition-colors"
            >
              Manage exams
            </button>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="card-soft hover:cursor-pointer" onClick={() => navigate("/students")} data-testid="quick-action-students">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#1A4331]/10 flex items-center justify-center text-[#1A4331]">
              <GraduationCap size={26} weight="duotone" />
            </div>
            <div>
              <h4 className="font-semibold" style={{fontFamily:'Outfit'}}>Student Directory</h4>
              <p className="text-sm text-[#64748B]">Manage student records</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-soft hover:cursor-pointer" onClick={() => navigate("/attendance")} data-testid="quick-action-attendance">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#D4A373]/20 flex items-center justify-center text-[#1A4331]">
              <ClipboardText size={26} weight="duotone" />
            </div>
            <div>
              <h4 className="font-semibold" style={{fontFamily:'Outfit'}}>Take Attendance</h4>
              <p className="text-sm text-[#64748B]">Mark today's roll call</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-soft hover:cursor-pointer" onClick={() => navigate("/marks")} data-testid="quick-action-marks">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#F59E0B]/15 flex items-center justify-center text-[#F59E0B]">
              <BookOpen size={26} weight="duotone" />
            </div>
            <div>
              <h4 className="font-semibold" style={{fontFamily:'Outfit'}}>Enter Marks</h4>
              <p className="text-sm text-[#64748B]">Update student results</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StudentParentDashboard() {
  const { user } = useAuth();
  const [att, setAtt] = useState(null);
  const [perf, setPerf] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const studentId = user?.student_id;

  useEffect(() => {
    if (!studentId) return;
    api.get(`/attendance/student/${studentId}`).then((r) => setAtt(r.data)).catch(() => {});
    api.get(`/marks/analytics/student/${studentId}`).then((r) => setPerf(r.data)).catch(() => {});
    api.get("/exams").then((r) => setUpcoming(r.data.filter((e) => e.start_date >= new Date().toISOString().slice(0,10)).slice(0,3))).catch(() => {});
  }, [studentId]);

  return (
    <div className="space-y-8" data-testid="student-parent-dashboard">
      <div>
        <p className="tiny-label">Welcome back</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A4331] mt-1" style={{fontFamily:'Outfit'}}>
          Hello, {user?.name}
        </h1>
        <p className="text-[#64748B] mt-1">Your latest academic snapshot.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Metric icon={ClipboardText} label="Attendance" value={`${att?.summary?.percentage ?? 0}%`} accent="bg-[#1A4331]/10 text-[#1A4331]" tid="metric-my-attendance" />
        <Metric icon={Users} label="Present Days" value={att?.summary?.present ?? 0} accent="bg-[#22C55E]/15 text-[#22C55E]" tid="metric-present" />
        <Metric icon={Warning} label="Absent Days" value={att?.summary?.absent ?? 0} accent="bg-[#EF4444]/10 text-[#EF4444]" tid="metric-absent" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-soft" data-testid="performance-card">
          <CardContent className="p-6">
            <p className="tiny-label">Subject Performance (Latest Exam)</p>
            <h3 className="text-xl font-semibold mt-1" style={{fontFamily:'Outfit'}}>Marks Overview</h3>
            {perf.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-[#64748B]">
                No results released yet.
              </div>
            ) : (
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perf}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="subject_name" tick={{ fontSize: 11, fill: "#64748B" }} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748B" }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#1A4331" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-soft" data-testid="upcoming-exams-card">
          <CardContent className="p-6">
            <p className="tiny-label">Upcoming Exams</p>
            <h3 className="text-xl font-semibold mt-1" style={{fontFamily:'Outfit'}}>Stay prepared</h3>
            <div className="mt-4 space-y-3">
              {upcoming.length === 0 && <p className="text-sm text-[#64748B]">No upcoming exams.</p>}
              {upcoming.map((e) => (
                <div key={e.id} className="p-4 border border-[#E2E8F0] rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium">{e.name}</div>
                    <div className="text-xs text-[#64748B] mt-1">{e.start_date} → {e.end_date}</div>
                  </div>
                  <Badge className="bg-[#D4A373]/20 text-[#1A4331] hover:bg-[#D4A373]/30">{e.exam_type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TeacherDashboard() {
  const { user } = useAuth();
  const [m, setM] = useState(null);
  const [trend, setTrend] = useState([]);
  useEffect(() => {
    api.get("/dashboard/metrics").then((r) => setM(r.data)).catch(() => {});
    api.get(`/attendance/analytics/trend?days=14${user?.class_id ? `&class_id=${user.class_id}` : ""}`).then((r) => setTrend(r.data)).catch(() => {});
  }, [user?.class_id]);

  if (!m) return <div className="text-[#64748B]">Loading…</div>;
  return (
    <div className="space-y-8" data-testid="teacher-dashboard">
      <div>
        <p className="tiny-label">Faculty Console</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A4331] mt-1" style={{fontFamily:'Outfit'}}>Hello, {user?.name}</h1>
        <p className="text-[#64748B] mt-1">Your classroom at a glance.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric icon={Users} label="Students" value={m.total_students} accent="bg-[#1A4331]/10 text-[#1A4331]" tid="metric-students" />
        <Metric icon={ClipboardText} label="Avg Attendance" value={`${m.average_attendance}%`} accent="bg-[#D4A373]/20 text-[#1A4331]" tid="metric-attendance" />
        <Metric icon={CalendarBlank} label="Upcoming Exams" value={m.exams_scheduled} accent="bg-[#F59E0B]/15 text-[#F59E0B]" tid="metric-exams" />
        <Metric icon={ChartLineUp} label="Results Pending" value={m.results_pending} accent="bg-[#EF4444]/10 text-[#EF4444]" tid="metric-pending" />
      </div>
      <Card className="card-soft">
        <CardContent className="p-6">
          <p className="tiny-label">Attendance Trend</p>
          <h3 className="text-xl font-semibold mt-1" style={{fontFamily:'Outfit'}}>Last 14 days</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748B" }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="percentage" stroke="#1A4331" strokeWidth={2.5} dot={{ r: 3, fill: "#D4A373" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === "admin" || user.role === "office_staff") return <AdminDashboard />;
  if (user.role === "parent" || user.role === "student") return <StudentParentDashboard />;
  return <TeacherDashboard />;
}
