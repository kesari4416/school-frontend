import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdmitCards() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    api.get("/exams").then(async (r) => {
      let classId = user?.class_id;
      if (!classId && user?.student_id) {
        const s = await api.get(`/students/${user.student_id}`);
        classId = s.data.class_id;
      }
      setExams(r.data.filter((e) => e.class_id === classId));
    });
  }, [user]);

  return (
    <div className="space-y-6" data-testid="admit-cards-page">
      <div>
        <p className="tiny-label">Examination Documents</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A4331] mt-1" style={{fontFamily:'Outfit'}}>Admit Cards</h1>
        <p className="text-[#64748B] mt-1">Download printable admit cards for upcoming exams.</p>
      </div>
      <Card className="card-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#F7F7F5]">
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-[#64748B] py-8">No exams available.</TableCell></TableRow>}
              {exams.map((e) => (
                <TableRow key={e.id} data-testid={`admit-row-${e.id}`}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell><Badge variant="outline">{e.exam_type}</Badge></TableCell>
                  <TableCell className="text-sm">{e.start_date} → {e.end_date}</TableCell>
                  <TableCell><Badge className="bg-[#1A4331]/10 text-[#1A4331]">{e.visibility}</Badge></TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => navigate(`/admit-card/${user.student_id}/${e.id}`)}
                      className="text-sm text-[#1A4331] underline"
                      data-testid={`download-admit-${e.id}`}
                    >
                      Download →
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
