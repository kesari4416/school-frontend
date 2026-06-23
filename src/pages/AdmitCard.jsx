import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, IdentificationCard } from "@phosphor-icons/react";
import AuthImage from "@/components/AuthImage";

export default function AdmitCard() {
  const { studentId, examId } = useParams();
  const [card, setCard] = useState(null);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/admit-card/${studentId}/${examId}`)
      .then((r) => setCard(r.data))
      .catch((e) => setErr(e.response?.data?.detail || "Failed to load"));
  }, [studentId, examId]);

  if (err) return <div className="text-[#EF4444]" data-testid="admit-error">{err}</div>;
  if (!card) return <div className="text-[#64748B]">Loading admit card…</div>;

  return (
    <div className="space-y-6" data-testid="admit-card-page">
      <div className="flex justify-between items-center no-print">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[#1A4331]" data-testid="back-btn">
          <ArrowLeft size={16} /> Back
        </button>
        <Button onClick={() => window.print()} className="bg-[#1A4331] hover:bg-[#133124] text-white" data-testid="print-admit-btn">
          <Printer size={16} className="mr-2" /> Print Admit Card
        </Button>
      </div>

      <div className="bg-white border-2 border-[#1A4331] p-8 print-page mx-auto" style={{maxWidth: 900}}>
        <div className="border-b-2 border-[#1A4331] pb-4 mb-6 flex justify-between items-center">
          <div>
            <p className="tiny-label">ICSC Affiliated</p>
            <h1 className="text-2xl font-semibold text-[#1A4331] mt-1" style={{fontFamily:'Outfit'}}>ICSC Connect Academy</h1>
            <p className="text-sm text-[#64748B]">Examination Admit Card</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-[#1A4331] text-white flex items-center justify-center">
            <IdentificationCard size={32} weight="duotone" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6 text-sm">
          <div className="col-span-2 space-y-3">
            <div>
              <div className="tiny-label">Candidate Name</div>
              <div className="font-semibold text-lg">{card.student.name}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="tiny-label">Roll Number</div>
                <div className="font-medium">{card.student.roll_no}</div>
              </div>
              <div>
                <div className="tiny-label">Registration No.</div>
                <div className="font-medium">{card.student.registration_no}</div>
              </div>
              <div>
                <div className="tiny-label">Class & Section</div>
                <div className="font-medium">{card.class?.name} - {card.section?.name}</div>
              </div>
              <div>
                <div className="tiny-label">Examination</div>
                <div className="font-medium">{card.exam.name}</div>
              </div>
            </div>
          </div>
          <div className="border-2 border-dashed border-[#1A4331]/40 rounded-lg flex items-center justify-center h-44 overflow-hidden">
            {card.student.photo_url ? (
              <AuthImage path={card.student.photo_url} className="w-full h-full object-cover" alt={card.student.name} />
            ) : (
              <div className="text-[#64748B] text-xs text-center">
                Candidate<br />Photograph<br /><span className="text-[10px] mt-1 block">(affix here)</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <p className="tiny-label mb-2">Examination Schedule</p>
          <table className="w-full text-sm border-collapse" data-testid="admit-schedule-table">
            <thead>
              <tr className="border-b-2 border-[#1A4331]">
                <th className="text-left py-2 px-2">Date</th>
                <th className="text-left py-2 px-2">Subject</th>
                <th className="text-left py-2 px-2">Code</th>
                <th className="text-left py-2 px-2">Time</th>
                <th className="text-left py-2 px-2">Hall</th>
              </tr>
            </thead>
            <tbody>
              {card.schedules.map((s) => (
                <tr key={s.id} className="border-b border-[#E2E8F0]" data-testid={`admit-schedule-row-${s.id}`}>
                  <td className="py-2 px-2">{s.date}</td>
                  <td className="py-2 px-2 font-medium">{s.subject_name}</td>
                  <td className="py-2 px-2 text-[#64748B]">{s.subject_code}</td>
                  <td className="py-2 px-2">{s.start_time} - {s.end_time}</td>
                  <td className="py-2 px-2">{s.hall}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-xs text-[#64748B] leading-relaxed">
          <p className="font-semibold text-[#1A4331] mb-2">Instructions:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Report at least 30 minutes before the start of each paper.</li>
            <li>Bring this admit card and a valid school ID to every examination.</li>
            <li>Electronic devices and unauthorized materials are strictly prohibited.</li>
            <li>Special accommodations must be arranged in advance with the office.</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-6 pt-8 mt-8 border-t border-[#E2E8F0] text-sm">
          <div className="text-center">
            <div className="h-12 border-b border-[#1A4331]/40"></div>
            <div className="mt-2 text-[#64748B]">Candidate Signature</div>
          </div>
          <div className="text-center">
            <div className="h-12 border-b border-[#1A4331]/40"></div>
            <div className="mt-2 text-[#64748B]">Principal Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
}
