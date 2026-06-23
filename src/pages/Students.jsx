import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { MagnifyingGlass, UploadSimple, User } from "@phosphor-icons/react";
import AuthImage from "@/components/AuthImage";
import { toast } from "sonner";

export default function Students() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [classId, setClassId] = useState("all");
  const [sectionId, setSectionId] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    const params = {};
    if (classId !== "all") params.class_id = classId;
    if (sectionId !== "all") params.section_id = sectionId;
    if (q.trim()) params.q = q.trim();
    setLoading(true);
    api.get("/students", { params }).then((r) => setStudents(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get("/classes").then((r) => setClasses(r.data));
    api.get("/sections").then((r) => setSections(r.data));
  }, []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [classId, sectionId, q]);

  const sectionsForClass = classId === "all" ? sections : sections.filter((s) => s.class_id === classId);
  const classMap = Object.fromEntries(classes.map((c) => [c.id, c.name]));
  const sectionMap = Object.fromEntries(sections.map((s) => [s.id, s.name]));
  const canUpload = ["admin", "office_staff", "class_teacher"].includes(user.role);

  const uploadPhoto = async (e) => {
    const f = e.target.files?.[0];
    if (!f || !activePhoto) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const { data } = await api.post(`/upload/student-photo/${activePhoto.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Photo uploaded");
      setActivePhoto({ ...activePhoto, photo_url: data.photo_url });
      load();
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="students-page">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="tiny-label">Records</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A4331] mt-1" style={{fontFamily:'Outfit'}}>Student Directory</h1>
          <p className="text-[#64748B] mt-1">All learners in one searchable view.</p>
        </div>
        <Badge className="bg-[#1A4331]/10 text-[#1A4331] hover:bg-[#1A4331]/15" data-testid="students-count">
          {students.length} students
        </Badge>
      </div>

      <Card className="card-soft">
        <CardContent className="p-6">
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <div className="relative">
              <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name or roll no."
                className="pl-9 bg-white"
                data-testid="students-search-input"
              />
            </div>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger data-testid="students-class-filter"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger data-testid="students-section-filter"><SelectValue placeholder="Section" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sectionsForClass.map((s) => <SelectItem key={s.id} value={s.id}>Section {s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-[#F7F7F5]">
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (<TableRow><TableCell colSpan={7} className="text-center text-[#64748B] py-8">Loading…</TableCell></TableRow>)}
                {!loading && students.length === 0 && (<TableRow><TableCell colSpan={7} className="text-center text-[#64748B] py-8">No students found.</TableCell></TableRow>)}
                {students.map((s) => (
                  <TableRow key={s.id} data-testid={`student-row-${s.roll_no}`}>
                    <TableCell>
                      <div className="w-10 h-10 rounded-full bg-[#1A4331]/10 text-[#1A4331] flex items-center justify-center overflow-hidden">
                        {s.photo_url ? <AuthImage path={s.photo_url} className="w-full h-full object-cover" alt={s.name} /> : <User size={20} />}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{s.roll_no}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{classMap[s.class_id]}</TableCell>
                    <TableCell>Section {sectionMap[s.section_id]}</TableCell>
                    <TableCell className="text-sm">{s.parent_name}</TableCell>
                    <TableCell className="text-right">
                      {canUpload && (
                        <button
                          onClick={() => setActivePhoto(s)}
                          className="text-xs text-[#1A4331] underline"
                          data-testid={`upload-photo-${s.roll_no}`}
                        >
                          {s.photo_url ? "Change photo" : "Add photo"}
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!activePhoto} onOpenChange={(v) => !v && setActivePhoto(null)}>
        <DialogContent data-testid="upload-photo-dialog">
          <DialogHeader>
            <DialogTitle>Upload photo · {activePhoto?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="w-32 h-32 mx-auto rounded-lg bg-[#F7F7F5] flex items-center justify-center overflow-hidden border border-[#E2E8F0]">
              {activePhoto?.photo_url ? <AuthImage path={activePhoto.photo_url} className="w-full h-full object-cover" /> : <User size={40} className="text-[#64748B]" />}
            </div>
            <div>
              <label className="block">
                <span className="text-sm text-[#64748B]">JPEG / PNG up to 4 MB</span>
                <input type="file" accept="image/*" onChange={uploadPhoto} className="mt-2 block w-full text-sm" data-testid="photo-file-input" />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setActivePhoto(null)} className="bg-[#1A4331] hover:bg-[#133124] text-white" data-testid="close-photo-dialog-btn">
              {uploading ? "Uploading…" : "Done"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
