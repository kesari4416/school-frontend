import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DownloadSimple } from "@phosphor-icons/react";
import { toast } from "sonner";

function exportCsv(filename, rows) {
  if (!rows.length) { toast.error("No rows to export"); return; }
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function AttendanceReport() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => { api.get("/classes").then((r) => setClasses(r.data)); }, []);
  useEffect(() => {
    const params = classId ? { class_id: classId } : {};
    api.get("/reports/attendance", { params }).then((r) => setRows(r.data));
  }, [classId]);

  return (
    <div className="space-y-4" data-testid="attendance-report-panel">
      <div className="grid sm:grid-cols-3 gap-3">
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger data-testid="report-class-select"><SelectValue placeholder="All Classes" /></SelectTrigger>
          <SelectContent>
            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => exportCsv("attendance-report.csv", rows)} className="bg-[#1A4331] hover:bg-[#133124] text-white" data-testid="export-att-csv-btn">
          <DownloadSimple size={16} className="mr-2" /> Export CSV
        </Button>
      </div>
      <Card className="card-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#F7F7F5]">
              <TableRow>
                <TableHead>Roll</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Present</TableHead>
                <TableHead className="text-right">Absent</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Attendance %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.student_id} data-testid={`att-report-row-${r.roll_no}`}>
                  <TableCell>{r.roll_no}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell className="text-right">{r.present}</TableCell>
                  <TableCell className="text-right">{r.absent}</TableCell>
                  <TableCell className="text-right">{r.total}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={r.percentage < 75 ? "bg-[#EF4444]/15 text-[#EF4444]" : "bg-[#22C55E]/15 text-[#22C55E]"}>{r.percentage}%</Badge>
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

function ResultsReport() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => { api.get("/classes").then((r) => setClasses(r.data)); }, []);
  useEffect(() => {
    if (!classId) return;
    api.get("/exams", { params: { class_id: classId } }).then((r) => setExams(r.data));
  }, [classId]);
  useEffect(() => {
    if (!examId) return;
    api.get("/reports/results", { params: { exam_id: examId } }).then((r) => setRows(r.data));
  }, [examId]);

  return (
    <div className="space-y-4" data-testid="results-report-panel">
      <div className="grid sm:grid-cols-3 gap-3">
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger data-testid="report-class2-select"><SelectValue placeholder="Class" /></SelectTrigger>
          <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={examId} onValueChange={setExamId} disabled={!classId}>
          <SelectTrigger data-testid="report-exam-select"><SelectValue placeholder="Exam" /></SelectTrigger>
          <SelectContent>{exams.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
        </Select>
        <Button onClick={() => exportCsv("results-report.csv", rows)} className="bg-[#1A4331] hover:bg-[#133124] text-white" data-testid="export-results-csv-btn">
          <DownloadSimple size={16} className="mr-2" /> Export CSV
        </Button>
      </div>
      <Card className="card-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#F7F7F5]">
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Roll</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.student_id} data-testid={`results-report-row-${r.roll_no}`}>
                  <TableCell>#{r.rank}</TableCell>
                  <TableCell>{r.roll_no}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell className="text-right">{r.total}/{r.max}</TableCell>
                  <TableCell className="text-right font-medium">{r.percentage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Reports() {
  return (
    <div className="space-y-6" data-testid="reports-page">
      <div>
        <p className="tiny-label">Analytics & Compliance</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A4331] mt-1" style={{fontFamily:'Outfit'}}>Reports</h1>
        <p className="text-[#64748B] mt-1">Aggregate insights, exportable for compliance and review.</p>
      </div>
      <Tabs defaultValue="attendance">
        <TabsList data-testid="reports-tabs">
          <TabsTrigger value="attendance" data-testid="tab-att-report">Attendance</TabsTrigger>
          <TabsTrigger value="results" data-testid="tab-results-report">Results</TabsTrigger>
        </TabsList>
        <TabsContent value="attendance" className="mt-6"><AttendanceReport /></TabsContent>
        <TabsContent value="results" className="mt-6"><ResultsReport /></TabsContent>
      </Tabs>
    </div>
  );
}
