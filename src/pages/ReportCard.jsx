import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

export default function ReportCard() {
  const { studentId, examId } = useParams();
  const [card, setCard] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/marks/report-card/${studentId}/${examId}`)
      .then((r) => setCard(r.data))
      .catch((e) => setError(e.response?.data?.detail || "Failed to load"));
  }, [studentId, examId]);

  if (error) return <div className="text-[#EF4444]" data-testid="report-error">{error}</div>;
  if (!card) return <div className="text-[#64748B]">Loading report card…</div>;

  return (
    <div className="space-y-6" data-testid="report-card-page">
      <div className="flex justify-between items-center no-print">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[#1A4331]" data-testid="back-btn">
          <ArrowLeft size={16} /> Back
        </button>
        <Button onClick={() => window.print()} className="bg-[#1A4331] hover:bg-[#133124] text-white" data-testid="print-report-btn">
          <Printer size={16} className="mr-2" /> Print / Save PDF
        </Button>
      </div>

      <div className="bg-white border-2 border-[#1A4331] p-8 print-page mx-auto" style={{maxWidth: 900}}>
        <div className="text-center border-b-2 border-[#1A4331] pb-4 mb-6">
          <p className="tiny-label">ICSC Affiliated School</p>
          <h1 className="text-3xl font-semibold text-[#1A4331] mt-1" style={{fontFamily:'Outfit'}}>
            ICSC Connect Academy
          </h1>
          <p className="text-sm text-[#64748B] mt-1">Academic Report Card · {card.exam.name}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <div className="tiny-label">Student Name</div>
            <div className="font-semibold text-lg">{card.student.name}</div>
          </div>
          <div>
            <div className="tiny-label">Roll Number</div>
            <div className="font-semibold text-lg">{card.student.roll_no}</div>
          </div>
          <div>
            <div className="tiny-label">Class & Section</div>
            <div>{card.class?.name} - Section {card.section?.name}</div>
          </div>
          <div>
            <div className="tiny-label">Registration No.</div>
            <div>{card.student.registration_no}</div>
          </div>
        </div>

        <table className="w-full text-sm border-collapse mb-6" data-testid="report-card-table">
          <thead>
            <tr className="border-b-2 border-[#1A4331]">
              <th className="text-left py-2 px-3">Subject</th>
              <th className="text-left py-2 px-3">Code</th>
              <th className="text-right py-2 px-3">Marks Obtained</th>
              <th className="text-right py-2 px-3">Max Marks</th>
              <th className="text-right py-2 px-3">Grade</th>
            </tr>
          </thead>
          <tbody>
            {card.subjects.map((s, i) => (
              <tr key={i} className="border-b border-[#E2E8F0]">
                <td className="py-2 px-3">{s.subject}</td>
                <td className="py-2 px-3 text-[#64748B]">{s.code}</td>
                <td className="py-2 px-3 text-right font-medium">{s.marks_obtained}</td>
                <td className="py-2 px-3 text-right">{s.max_marks}</td>
                <td className="py-2 px-3 text-right font-semibold text-[#1A4331]">{s.grade}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-[#1A4331] bg-[#F7F7F5]">
              <td colSpan={2} className="py-3 px-3 font-semibold">Total</td>
              <td className="py-3 px-3 text-right font-semibold">{card.totals.obtained}</td>
              <td className="py-3 px-3 text-right">{card.totals.max}</td>
              <td className="py-3 px-3 text-right font-semibold text-[#1A4331]">{card.totals.grade}</td>
            </tr>
          </tbody>
        </table>

        <div className="grid grid-cols-3 gap-6 text-sm mb-8">
          <div className="border border-[#E2E8F0] rounded-lg p-4 text-center">
            <div className="tiny-label">Overall %</div>
            <div className="text-3xl font-semibold text-[#1A4331] mt-1" style={{fontFamily:'Outfit'}}>{card.totals.percentage}%</div>
          </div>
          <div className="border border-[#E2E8F0] rounded-lg p-4 text-center">
            <div className="tiny-label">Grade</div>
            <div className="text-3xl font-semibold text-[#D4A373] mt-1" style={{fontFamily:'Outfit'}}>{card.totals.grade}</div>
          </div>
          <div className="border border-[#E2E8F0] rounded-lg p-4 text-center">
            <div className="tiny-label">Class Rank</div>
            <div className="text-3xl font-semibold text-[#1A4331] mt-1" style={{fontFamily:'Outfit'}}>
              {card.rank ? `#${card.rank}` : "-"} <span className="text-sm text-[#64748B] font-normal">/ {card.class_size}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 pt-8 mt-8 border-t border-[#E2E8F0] text-sm">
          <div className="text-center">
            <div className="h-12 border-b border-[#1A4331]/40"></div>
            <div className="mt-2 text-[#64748B]">Class Teacher</div>
          </div>
          <div className="text-center">
            <div className="h-12 border-b border-[#1A4331]/40"></div>
            <div className="mt-2 text-[#64748B]">Principal</div>
          </div>
          <div className="text-center">
            <div className="h-12 border-b border-[#1A4331]/40"></div>
            <div className="mt-2 text-[#64748B]">Parent Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
}
