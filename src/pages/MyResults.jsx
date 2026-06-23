import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";

export default function MyResults() {
  const { user } = useAuth();
  const sid = user?.student_id;
  const [marks, setMarks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sid) return;
    api.get(`/marks/student/${sid}`).then((r) => setMarks(r.data));
  }, [sid]);

  const byExam = marks.reduce((acc, m) => {
    acc[m.exam_id] = acc[m.exam_id] || { exam_name: m.exam_name, exam_type: m.exam_type, items: [] };
    acc[m.exam_id].items.push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6" data-testid="my-results-page">
      <div>
        <p className="tiny-label">Academic Record</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A4331] mt-1" style={{fontFamily:'Outfit'}}>Results</h1>
        <p className="text-[#64748B] mt-1">Your published results across examinations.</p>
      </div>

      {Object.keys(byExam).length === 0 && (
        <Card className="card-soft"><CardContent className="p-6 text-[#64748B]">No results released yet.</CardContent></Card>
      )}

      {Object.entries(byExam).map(([examId, exam]) => {
        const total = exam.items.reduce((a, b) => a + b.marks_obtained, 0);
        const max = exam.items.reduce((a, b) => a + b.max_marks, 0);
        const pct = max ? Math.round((total / max) * 1000) / 10 : 0;
        return (
          <Card key={examId} className="card-soft" data-testid={`result-exam-${examId}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="tiny-label">{exam.exam_type}</p>
                  <h3 className="text-xl font-semibold mt-1" style={{fontFamily:'Outfit'}}>{exam.exam_name}</h3>
                </div>
                <div className="text-right">
                  <Badge className="bg-[#1A4331]/10 text-[#1A4331]">{pct}%</Badge>
                  <div className="text-xs text-[#64748B] mt-1">{total}/{max}</div>
                </div>
              </div>
              <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-[#F7F7F5]">
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-right">Marks</TableHead>
                      <TableHead className="text-right">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exam.items.map((m) => (
                      <TableRow key={m.id} data-testid={`result-subject-${m.subject_code}`}>
                        <TableCell className="font-medium">{m.subject_name}</TableCell>
                        <TableCell className="text-right">{m.marks_obtained}/{m.max_marks}</TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-[#D4A373]/20 text-[#1A4331]">{m.grade}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <button
                onClick={() => navigate(`/report-card/${sid}/${examId}`)}
                className="mt-4 text-sm text-[#1A4331] underline"
                data-testid={`view-report-card-${examId}`}
              >
                View full report card →
              </button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
