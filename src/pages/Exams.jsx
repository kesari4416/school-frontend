import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Calendar } from "@phosphor-icons/react";
import { toast } from "sonner";

function ExamsList({ onView }) {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", exam_type: "midterm", class_id: "", start_date: "", end_date: "", visibility: "draft" });

  const load = () => api.get("/exams").then((r) => setExams(r.data));

  useEffect(() => {
    load();
    api.get("/classes").then((r) => setClasses(r.data));
  }, []);

  const create = async () => {
    try {
      await api.post("/exams", form);
      toast.success("Exam created");
      setShowCreate(false);
      load();
    } catch (e) { toast.error("Failed to create exam"); }
  };

  const canCreate = user.role === "admin" || user.role === "office_staff";

  return (
    <div className="space-y-4" data-testid="exams-list-panel">
      <div className="flex justify-between">
        <p className="text-sm text-[#64748B]">Plan and announce examinations</p>
        {canCreate && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="bg-[#1A4331] hover:bg-[#133124] text-white" data-testid="create-exam-btn">
                <Plus size={16} className="mr-1" /> New Exam
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="create-exam-dialog">
              <DialogHeader><DialogTitle>Create Examination</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Exam name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="exam-name-input" />
                <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v })}>
                  <SelectTrigger data-testid="exam-class-select"><SelectValue placeholder="Class" /></SelectTrigger>
                  <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={form.exam_type} onValueChange={(v) => setForm({ ...form, exam_type: v })}>
                  <SelectTrigger data-testid="exam-type-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit_test">Unit Test</SelectItem>
                    <SelectItem value="midterm">Mid Term</SelectItem>
                    <SelectItem value="preboard">Pre-Board</SelectItem>
                    <SelectItem value="board">Board Exam</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} data-testid="exam-start-input" />
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} data-testid="exam-end-input" />
                </div>
                <Select value={form.visibility} onValueChange={(v) => setForm({ ...form, visibility: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button onClick={create} className="bg-[#1A4331] hover:bg-[#133124] text-white" data-testid="confirm-create-exam-btn">Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <Card className="card-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#F7F7F5]">
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((e) => (
                <TableRow key={e.id} data-testid={`exam-row-${e.id}`}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell><Badge variant="outline">{e.exam_type}</Badge></TableCell>
                  <TableCell className="text-sm text-[#64748B]">{e.class_id?.slice(0, 6)}…</TableCell>
                  <TableCell className="text-sm">{e.start_date} → {e.end_date}</TableCell>
                  <TableCell>
                    <Badge className={
                      e.visibility === "published" ? "bg-[#22C55E]/15 text-[#22C55E]" :
                      e.visibility === "scheduled" ? "bg-[#F59E0B]/15 text-[#F59E0B]" :
                      "bg-[#64748B]/15 text-[#64748B]"
                    }>{e.visibility}</Badge>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => onView(e)} className="text-xs text-[#1A4331] underline" data-testid={`view-schedule-${e.id}`}>
                      View schedule
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ScheduleView({ exam, onBack }) {
  const [schedules, setSchedules] = useState([]);
  useEffect(() => {
    if (!exam) return;
    api.get("/exam-schedules", { params: { exam_id: exam.id } }).then((r) => setSchedules(r.data));
  }, [exam]);
  if (!exam) return null;
  return (
    <div className="space-y-4" data-testid="schedule-view">
      <button onClick={onBack} className="text-sm text-[#1A4331]" data-testid="back-to-exams-btn">← Back to exams</button>
      <div>
        <p className="tiny-label">{exam.exam_type}</p>
        <h2 className="text-2xl font-semibold text-[#1A4331]" style={{fontFamily:'Outfit'}}>{exam.name}</h2>
        <p className="text-sm text-[#64748B] mt-1">{exam.start_date} → {exam.end_date}</p>
      </div>
      <Card className="card-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#F7F7F5]">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Hall</TableHead>
                <TableHead>Mode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((s) => (
                <TableRow key={s.id} data-testid={`schedule-row-${s.id}`}>
                  <TableCell>{s.date}</TableCell>
                  <TableCell className="font-medium">{s.subject_name}</TableCell>
                  <TableCell className="text-[#64748B]">{s.subject_code}</TableCell>
                  <TableCell>{s.start_time} - {s.end_time}</TableCell>
                  <TableCell>{s.hall}</TableCell>
                  <TableCell><Badge variant="outline">{s.mode}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Exams() {
  const [activeExam, setActiveExam] = useState(null);
  return (
    <div className="space-y-6" data-testid="exams-page">
      <div>
        <p className="tiny-label">Examinations</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A4331] mt-1" style={{fontFamily:'Outfit'}}>Exam Management</h1>
        <p className="text-[#64748B] mt-1">Plan, schedule, and announce all examinations.</p>
      </div>
      {activeExam ? <ScheduleView exam={activeExam} onBack={() => setActiveExam(null)} /> : <ExamsList onView={setActiveExam} />}
    </div>
  );
}
