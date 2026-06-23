import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function MyAttendance() {
  const { user } = useAuth();
  const sid = user?.student_id;
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!sid) return;
    api.get(`/attendance/student/${sid}`).then((r) => setData(r.data));
  }, [sid]);

  if (!data) return <div className="text-[#64748B]">Loading…</div>;

  // Build trend per 7-day buckets simplified to per-day data
  const trendMap = {};
  data.records.forEach((r) => {
    trendMap[r.date] = (trendMap[r.date] || 0) + (r.status === "present" ? 1 : 0);
  });
  const trend = Object.entries(trendMap).slice(0, 30).reverse().map(([date, v]) => ({ date, present: v }));

  const statusBadge = {
    present: "bg-[#22C55E]/15 text-[#22C55E]",
    absent: "bg-[#EF4444]/15 text-[#EF4444]",
    late: "bg-[#F59E0B]/15 text-[#F59E0B]",
    medical_leave: "bg-[#0EA5E9]/15 text-[#0EA5E9]",
    leave: "bg-[#64748B]/15 text-[#64748B]",
  };

  return (
    <div className="space-y-6" data-testid="my-attendance-page">
      <div>
        <p className="tiny-label">Personal Record</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A4331] mt-1" style={{fontFamily:'Outfit'}}>Attendance</h1>
        <p className="text-[#64748B] mt-1">Your daily attendance status and summary.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { l: "Percentage", v: `${data.summary.percentage}%`, c: "text-[#1A4331]" },
          { l: "Present", v: data.summary.present, c: "text-[#22C55E]" },
          { l: "Absent", v: data.summary.absent, c: "text-[#EF4444]" },
          { l: "Late", v: data.summary.late, c: "text-[#F59E0B]" },
          { l: "Leave", v: data.summary.leave, c: "text-[#64748B]" },
        ].map((m, i) => (
          <Card key={i} className="card-soft" data-testid={`my-att-metric-${i}`}>
            <CardContent className="p-5">
              <div className="tiny-label">{m.l}</div>
              <div className={`text-3xl font-semibold mt-2 ${m.c}`} style={{fontFamily:'Outfit'}}>{m.v}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="card-soft">
        <CardContent className="p-6">
          <p className="tiny-label">Recent Days</p>
          <h3 className="text-xl font-semibold mt-1" style={{fontFamily:'Outfit'}}>Day-by-day</h3>
          <div className="mt-4 space-y-2 max-h-[500px] overflow-y-auto">
            {data.records.slice(0, 30).map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 border border-[#E2E8F0] rounded-lg" data-testid={`att-record-${r.date}`}>
                <div className="text-sm">{r.date}</div>
                <Badge className={statusBadge[r.status]}>{r.status.replace("_", " ")}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
