import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";

export default function MyExams() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [schedules, setSchedules] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/exams").then(async (r) => {
      // For students/parents we already get filtered. We filter by user class
      const classId = user?.class_id || (await api.get(`/students/${user?.student_id}`)).data?.class_id;
      const myExams = r.data.filter((e) => e.class_id === classId);
      setExams(myExams);
      myExams.forEach((e) => {
        api.get("/exam-schedules", { params: { exam_id: e.id } }).then((sr) => {
          setSchedules((prev) => ({ ...prev, [e.id]: sr.data }));
        });
      });
    });
  }, [user]);

  return (
    <div className="space-y-6" data-testid="my-exams-page">
      <div>
        <p className="tiny-label">Examinations</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A4331] mt-1" style={{fontFamily:'Outfit'}}>Exam Schedule</h1>
        <p className="text-[#64748B] mt-1">Upcoming and recent examinations for your class.</p>
      </div>
      {exams.length === 0 && (
        <Card className="card-soft"><CardContent className="p-6 text-[#64748B]">No examinations available.</CardContent></Card>
      )}
      {exams.map((e) => (
        <Card key={e.id} className="card-soft" data-testid={`my-exam-${e.id}`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="tiny-label">{e.exam_type}</p>
                <h3 className="text-xl font-semibold mt-1" style={{fontFamily:'Outfit'}}>{e.name}</h3>
                <p className="text-sm text-[#64748B] mt-1">{e.start_date} → {e.end_date}</p>
              </div>
              <Badge className={
                e.visibility === "published" ? "bg-[#22C55E]/15 text-[#22C55E]" : "bg-[#F59E0B]/15 text-[#F59E0B]"
              }>{e.visibility}</Badge>
            </div>
            {schedules[e.id] && schedules[e.id].length > 0 && (
              <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-[#F7F7F5]">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Hall</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules[e.id].map((s) => (
                      <TableRow key={s.id} data-testid={`my-schedule-${s.id}`}>
                        <TableCell>{s.date}</TableCell>
                        <TableCell className="font-medium">{s.subject_name}</TableCell>
                        <TableCell>{s.start_time}-{s.end_time}</TableCell>
                        <TableCell>{s.hall}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <button
              onClick={() => navigate(`/admit-card/${user.student_id}/${e.id}`)}
              className="mt-4 text-sm text-[#1A4331] underline"
              data-testid={`view-admit-${e.id}`}
            >
              Download admit card →
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
