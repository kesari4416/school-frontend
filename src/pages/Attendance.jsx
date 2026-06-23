import { useEffect, useState } from "react";
import api, { API_BASE } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Check, X, Clock, FirstAid, NotePencil, UploadSimple } from "@phosphor-icons/react";
import { toast } from "sonner";

const STATUSES = [
  { value: "present", label: "Present", icon: Check, color: "bg-[#22C55E]/15 text-[#22C55E]" },
  { value: "absent", label: "Absent", icon: X, color: "bg-[#EF4444]/15 text-[#EF4444]" },
  { value: "late", label: "Late", icon: Clock, color: "bg-[#F59E0B]/15 text-[#F59E0B]" },
  { value: "medical_leave", label: "Medical", icon: FirstAid, color: "bg-[#0EA5E9]/15 text-[#0EA5E9]" },
  { value: "leave", label: "Leave", icon: NotePencil, color: "bg-[#64748B]/15 text-[#64748B]" },
];

function BulkUploadAttendance({ classId, sectionId, date, onDone }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const upload = async () => {
    if (!file || !classId || !sectionId || !date) {
      toast.error("Select class, section, and date first");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("class_id", classId);
      fd.append("section_id", sectionId);
      fd.append("date", date);
      const { data } = await api.post("/bulk/attendance", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`Saved ${data.saved}, skipped ${data.skipped.length}`);
      setOpen(false);
      onDone?.();
    } catch (e) {
      toast.error("Upload failed");
    } finally { setUploading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-[#1A4331] text-[#1A4331]" data-testid="bulk-att-btn">
          <UploadSimple size={16} className="mr-1" /> CSV
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="bulk-att-dialog">
        <DialogHeader><DialogTitle>Bulk Upload Attendance</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-[#64748B]">CSV columns: <code className="bg-[#F7F7F5] px-1 rounded">roll_no, status, remark</code> (status: present/absent/late/medical_leave/leave)</p>
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0])} className="block w-full" data-testid="bulk-att-file" />
          <div className="text-xs text-[#64748B]">Class · Section · Date are taken from the page selectors above.</div>
        </div>
        <DialogFooter>
          <Button onClick={upload} disabled={uploading || !file} className="bg-[#1A4331] hover:bg-[#133124] text-white" data-testid="bulk-att-upload-btn">
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MarkAttendance() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [classId, setClassId] = useState(user?.class_id || "");
  const [sectionId, setSectionId] = useState(user?.section_id || "");
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/classes").then((r) => setClasses(r.data));
    api.get("/sections").then((r) => setSections(r.data));
  }, []);

  useEffect(() => {
    if (!classId || !sectionId) {
      setStudents([]); return;
    }
    api.get("/students", { params: { class_id: classId, section_id: sectionId } }).then((r) => {
      setStudents(r.data);
      // default all to present
      const init = {};
      r.data.forEach((s) => { init[s.id] = "present"; });
      setMarks(init);
      // Load existing for date
      api.get("/attendance/by-date", { params: { class_id: classId, section_id: sectionId, date } })
        .then((res) => {
          const map = { ...init };
          res.data.forEach((rec) => { map[rec.student_id] = rec.status; });
          setMarks(map);
        });
    });
  }, [classId, sectionId, date]);

  const sectionsForClass = sections.filter((s) => s.class_id === classId);

  const setStatus = (sid, status) => setMarks((m) => ({ ...m, [sid]: status }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        class_id: classId,
        section_id: sectionId,
        date,
        subject_id: null,
        marks: students.map((s) => ({ student_id: s.id, status: marks[s.id] || "present" })),
      };
      const { data } = await api.post("/attendance/mark", payload);
      toast.success(`Saved attendance for ${data.saved} students.`);
    } catch (e) {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const summary = STATUSES.map((s) => ({
    ...s, count: Object.values(marks).filter((v) => v === s.value).length,
  }));

  return (
    <div className="space-y-6" data-testid="mark-attendance-panel">
      <Card className="card-soft">
        <CardContent className="p-6 grid sm:grid-cols-4 gap-3">
          <Select value={classId} onValueChange={(v) => { setClassId(v); setSectionId(""); }}>
            <SelectTrigger data-testid="mark-class-select"><SelectValue placeholder="Select Class" /></SelectTrigger>
            <SelectContent>
              {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sectionId} onValueChange={setSectionId} disabled={!classId}>
            <SelectTrigger data-testid="mark-section-select"><SelectValue placeholder="Select Section" /></SelectTrigger>
            <SelectContent>
              {sectionsForClass.map((s) => <SelectItem key={s.id} value={s.id}>Section {s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="mark-date-input" />
          <div className="flex gap-2">
            <Button
              onClick={save}
              disabled={saving || !classId || !sectionId || students.length === 0}
              className="flex-1 bg-[#1A4331] hover:bg-[#133124] text-white"
              data-testid="save-attendance-btn"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
            <BulkUploadAttendance classId={classId} sectionId={sectionId} date={date} onDone={() => window.location.reload()} />
          </div>
        </CardContent>
      </Card>

      {students.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {summary.map((s) => (
            <Badge key={s.value} className={`${s.color} hover:${s.color}`} data-testid={`summary-${s.value}`}>
              <s.icon size={14} className="mr-1" /> {s.label}: {s.count}
            </Badge>
          ))}
        </div>
      )}

      <Card className="card-soft">
        <CardContent className="p-6">
          {students.length === 0 ? (
            <p className="text-[#64748B] text-sm">Select class and section to load students.</p>
          ) : (
            <div className="space-y-2">
              {students.map((s, idx) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-[#E2E8F0]" data-testid={`attendance-row-${s.roll_no}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1A4331]/10 text-[#1A4331] flex items-center justify-center text-sm font-medium">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{s.name}</div>
                      <div className="text-xs text-[#64748B]">Roll: {s.roll_no}</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {STATUSES.map((st) => {
                      const active = marks[s.id] === st.value;
                      return (
                        <button
                          key={st.value}
                          onClick={() => setStatus(s.id, st.value)}
                          data-testid={`status-${s.roll_no}-${st.value}`}
                          className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${active ? "bg-[#1A4331] text-white border-[#1A4331]" : "border-[#E2E8F0] text-[#1E293B] hover:bg-[#F7F7F5]"}`}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ClassAnalytics() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/classes").then((r) => setClasses(r.data)); }, []);
  useEffect(() => {
    if (!classId) return;
    api.get(`/attendance/analytics/class?class_id=${classId}`).then((r) => setData(r.data));
  }, [classId]);

  return (
    <div className="space-y-6" data-testid="class-analytics-panel">
      <Card className="card-soft">
        <CardContent className="p-6 grid sm:grid-cols-3 gap-3 items-end">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger data-testid="analytics-class-select"><SelectValue placeholder="Select Class" /></SelectTrigger>
            <SelectContent>
              {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {data && (
            <>
              <div className="text-sm">
                <div className="tiny-label">Average</div>
                <div className="text-2xl font-semibold text-[#1A4331]" style={{fontFamily:'Outfit'}}>{data.average}%</div>
              </div>
              <div className="text-sm">
                <div className="tiny-label">Below {data.threshold}%</div>
                <div className="text-2xl font-semibold text-[#EF4444]" style={{fontFamily:'Outfit'}}>{data.below_threshold}</div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {data && (
        <Card className="card-soft">
          <CardContent className="p-0">
            <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-[#F7F7F5]">
                  <TableRow>
                    <TableHead>Roll</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Present</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Attendance %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.students.map((s) => (
                    <TableRow key={s.student_id} data-testid={`analytics-row-${s.roll_no}`}>
                      <TableCell>{s.roll_no}</TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell className="text-right">{s.present}</TableCell>
                      <TableCell className="text-right">{s.total}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={s.percentage < 75 ? "bg-[#EF4444]/15 text-[#EF4444]" : "bg-[#22C55E]/15 text-[#22C55E]"}>
                          {s.percentage}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Attendance() {
  return (
    <div className="space-y-6" data-testid="attendance-page">
      <div>
        <p className="tiny-label">Daily Operations</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A4331] mt-1" style={{fontFamily:'Outfit'}}>Attendance</h1>
        <p className="text-[#64748B] mt-1">Mark roll calls and review class analytics.</p>
      </div>
      <Tabs defaultValue="mark">
        <TabsList data-testid="attendance-tabs">
          <TabsTrigger value="mark" data-testid="tab-mark">Mark Attendance</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Class Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="mark" className="mt-6"><MarkAttendance /></TabsContent>
        <TabsContent value="analytics" className="mt-6"><ClassAnalytics /></TabsContent>
      </Tabs>
    </div>
  );
}
