import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { UploadSimple } from "@phosphor-icons/react";
import { toast } from "sonner";

function BulkUploadMarks({ examId, subjectId, maxMarks, onDone }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const upload = async () => {
    if (!file || !examId || !subjectId) {
      toast.error("Select exam and subject first");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("exam_id", examId);
      fd.append("subject_id", subjectId);
      fd.append("max_marks", String(maxMarks || 100));
      const { data } = await api.post("/bulk/marks", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`Saved ${data.saved}, skipped ${data.skipped.length}`);
      setOpen(false);
      onDone?.();
    } catch (e) { toast.error("Upload failed"); }
    finally { setUploading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-[#1A4331] text-[#1A4331]" data-testid="bulk-marks-btn">
          <UploadSimple size={16} className="mr-1" /> CSV
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="bulk-marks-dialog">
        <DialogHeader><DialogTitle>Bulk Upload Marks</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-[#64748B]">CSV columns: <code className="bg-[#F7F7F5] px-1 rounded">roll_no, marks_obtained, remarks</code></p>
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0])} className="block w-full" data-testid="bulk-marks-file" />
          <div className="text-xs text-[#64748B]">Exam · Subject · Max marks are taken from the page selectors above.</div>
        </div>
        <DialogFooter>
          <Button onClick={upload} disabled={uploading || !file} className="bg-[#1A4331] hover:bg-[#133124] text-white" data-testid="bulk-marks-upload-btn">
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MarksEntry() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [maxMarks, setMaxMarks] = useState(100);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get("/classes").then((r) => setClasses(r.data)); }, []);
  useEffect(() => {
    if (!classId) { setExams([]); setSubjects([]); return; }
    api.get("/exams", { params: { class_id: classId } }).then((r) => setExams(r.data));
    api.get("/subjects", { params: { class_id: classId } }).then((r) => setSubjects(r.data));
    api.get("/students", { params: { class_id: classId } }).then((r) => {
      setStudents(r.data);
      const m = {};
      r.data.forEach((s) => { m[s.id] = ""; });
      setMarks(m);
    });
  }, [classId]);

  useEffect(() => {
    if (!examId || !subjectId) return;
    api.get("/marks/by-exam-subject", { params: { exam_id: examId, subject_id: subjectId } })
      .then((r) => {
        const m = {};
        students.forEach((s) => { m[s.id] = ""; });
        r.data.forEach((rec) => { m[rec.student_id] = rec.marks_obtained; });
        setMarks(m);
      });
  }, [examId, subjectId, students]);

  const save = async () => {
    setSaving(true);
    try {
      const entries = students.map((s) => ({
        student_id: s.id, subject_id: subjectId, exam_id: examId,
        marks_obtained: parseFloat(marks[s.id] || 0), max_marks: maxMarks,
      })).filter((e) => !isNaN(e.marks_obtained));
      const { data } = await api.post("/marks/bulk", { exam_id: examId, subject_id: subjectId, entries });
      toast.success(`Saved ${data.saved} entries`);
    } catch (e) {
      toast.error("Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="marks-entry-panel">
      <Card className="card-soft">
        <CardContent className="p-6 grid sm:grid-cols-4 gap-3">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger data-testid="marks-class-select"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={examId} onValueChange={setExamId} disabled={!classId}>
            <SelectTrigger data-testid="marks-exam-select"><SelectValue placeholder="Exam" /></SelectTrigger>
            <SelectContent>{exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={subjectId} onValueChange={setSubjectId} disabled={!classId}>
            <SelectTrigger data-testid="marks-subject-select"><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="number" value={maxMarks} onChange={(e) => setMaxMarks(parseInt(e.target.value || "100"))} placeholder="Max Marks" data-testid="marks-max-input" />
        </CardContent>
      </Card>

      {students.length > 0 && examId && subjectId && (
        <Card className="card-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="tiny-label">Enter marks (out of {maxMarks})</p>
              <div className="flex gap-2">
                <BulkUploadMarks examId={examId} subjectId={subjectId} maxMarks={maxMarks} onDone={() => window.location.reload()} />
                <Button onClick={save} disabled={saving} className="bg-[#1A4331] hover:bg-[#133124] text-white" data-testid="save-marks-btn">
                  {saving ? "Saving…" : "Save Marks"}
                </Button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {students.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 border border-[#E2E8F0] rounded-lg" data-testid={`marks-row-${s.roll_no}`}>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{s.name}</div>
                    <div className="text-xs text-[#64748B]">Roll {s.roll_no}</div>
                  </div>
                  <Input
                    type="number"
                    value={marks[s.id] ?? ""}
                    onChange={(e) => setMarks((m) => ({ ...m, [s.id]: e.target.value }))}
                    className="w-20"
                    data-testid={`marks-input-${s.roll_no}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ResultsView() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => { api.get("/classes").then((r) => setClasses(r.data)); }, []);
  useEffect(() => {
    if (!classId) { setExams([]); return; }
    api.get("/exams", { params: { class_id: classId } }).then((r) => setExams(r.data));
  }, [classId]);
  useEffect(() => {
    if (!examId) return;
    api.get("/reports/results", { params: { exam_id: examId } }).then((r) => setRows(r.data));
  }, [examId]);

  const publish = async () => {
    await api.post(`/exams/${examId}/publish`);
    toast.success("Exam results published");
    api.get("/exams", { params: { class_id: classId } }).then((r) => setExams(r.data));
  };

  const currExam = exams.find((e) => e.id === examId);

  return (
    <div className="space-y-6" data-testid="results-view-panel">
      <Card className="card-soft">
        <CardContent className="p-6 grid sm:grid-cols-3 gap-3 items-end">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger data-testid="results-class-select"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={examId} onValueChange={setExamId} disabled={!classId}>
            <SelectTrigger data-testid="results-exam-select"><SelectValue placeholder="Exam" /></SelectTrigger>
            <SelectContent>{exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name} ({e.visibility})</SelectItem>)}</SelectContent>
          </Select>
          {currExam && currExam.visibility !== "published" && (
            <Button onClick={publish} className="bg-[#D4A373] hover:bg-[#c39361] text-[#1A4331]" data-testid="publish-results-btn">
              Publish Results
            </Button>
          )}
        </CardContent>
      </Card>
      {rows.length > 0 && (
        <Card className="card-soft">
          <CardContent className="p-0">
            <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-[#F7F7F5]">
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Roll</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.student_id} data-testid={`result-row-${r.roll_no}`}>
                      <TableCell>
                        <Badge className={r.rank <= 3 ? "bg-[#D4A373]/30 text-[#1A4331]" : "bg-[#1A4331]/10 text-[#1A4331]"}>#{r.rank}</Badge>
                      </TableCell>
                      <TableCell>{r.roll_no}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell className="text-right">{r.total}/{r.max}</TableCell>
                      <TableCell className="text-right font-medium">{r.percentage}%</TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => navigate(`/report-card/${r.student_id}/${examId}`)}
                          className="text-xs text-[#1A4331] underline"
                          data-testid={`view-report-${r.roll_no}`}
                        >
                          View Report Card
                        </button>
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

export default function Marks() {
  return (
    <div className="space-y-6" data-testid="marks-page">
      <div>
        <p className="tiny-label">Academic Performance</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A4331] mt-1" style={{fontFamily:'Outfit'}}>Marks & Results</h1>
        <p className="text-[#64748B] mt-1">Enter marks, review rankings, and publish results.</p>
      </div>
      <Tabs defaultValue="entry">
        <TabsList data-testid="marks-tabs">
          <TabsTrigger value="entry" data-testid="tab-entry">Marks Entry</TabsTrigger>
          <TabsTrigger value="results" data-testid="tab-results">Class Results</TabsTrigger>
        </TabsList>
        <TabsContent value="entry" className="mt-6"><MarksEntry /></TabsContent>
        <TabsContent value="results" className="mt-6"><ResultsView /></TabsContent>
      </Tabs>
    </div>
  );
}
