import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MagnifyingGlass, UserPlus } from "@phosphor-icons/react";
import { toast } from "sonner";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin / Principal" },
  { value: "class_teacher", label: "Class Teacher" },
  { value: "subject_teacher", label: "Subject Teacher" },
  { value: "office_staff", label: "Office Staff" },
  { value: "parent", label: "Parent" },
  { value: "student", label: "Student" },
];

const ROLE_LABEL = Object.fromEntries(ROLE_OPTIONS.map((r) => [r.value, r.label]));

const BLANK_FORM = {
  name: "",
  email: "",
  password: "",
  role: "class_teacher",
  phone: "",
  class_id: "",
  section_id: "",
  subject_ids: [],
  student_id: "",
  roll_no: "",
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [filterRole, setFilterRole] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    const params = filterRole !== "all" ? { role: filterRole } : {};
    api.get("/users", { params })
      .then((r) => setUsers(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get("/classes").then((r) => setClasses(r.data));
    api.get("/sections").then((r) => setSections(r.data));
    api.get("/subjects").then((r) => setSubjects(r.data));
    api.get("/students", { params: { limit: 2000 } }).then((r) => setStudents(r.data));
  }, []);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filterRole]);

  const filtered = q.trim()
    ? users.filter((u) =>
        (u.name || "").toLowerCase().includes(q.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(q.toLowerCase())
      )
    : users;

  const classMap = Object.fromEntries(classes.map((c) => [c.id, c.name]));
  const sectionMap = Object.fromEntries(sections.map((s) => [s.id, s.name]));
  const subjectsForClass = form.class_id
    ? subjects.filter((s) => s.class_id === form.class_id)
    : [];
  const sectionsForClass = form.class_id
    ? sections.filter((s) => s.class_id === form.class_id)
    : [];

  const create = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Name, email, and password are required");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
      phone: form.phone || null,
      class_id: form.class_id || null,
      section_id: form.section_id || null,
      subject_ids: form.subject_ids,
      student_id: form.student_id || null,
      roll_no: form.roll_no || null,
    };
    try {
      await api.post("/auth/register", payload);
      toast.success(`Created ${ROLE_LABEL[form.role]} · ${form.email}`);
      setShowCreate(false);
      setForm(BLANK_FORM);
      load();
    } catch (e) {
      const detail = e.response?.data?.detail || "Failed to create user";
      toast.error(typeof detail === "string" ? detail : "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  // Determine which extra fields are relevant per role
  const showClassSection = ["class_teacher", "student"].includes(form.role);
  const showSubjects = form.role === "subject_teacher";
  const showStudentLink = form.role === "parent" || form.role === "student";

  const toggleSubject = (sid) => {
    setForm((f) => ({
      ...f,
      subject_ids: f.subject_ids.includes(sid)
        ? f.subject_ids.filter((x) => x !== sid)
        : [...f.subject_ids, sid],
    }));
  };

  return (
    <div className="space-y-6" data-testid="users-page">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="tiny-label">Access control</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A4331] mt-1" style={{ fontFamily: "Outfit" }}>
            User Management
          </h1>
          <p className="text-[#64748B] mt-1">Create accounts for teachers, office staff, parents, and students.</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-[#1A4331] hover:bg-[#133124] text-white" data-testid="create-user-btn">
              <UserPlus size={18} className="mr-2" /> Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" data-testid="create-user-dialog">
            <DialogHeader><DialogTitle>Create User</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v, class_id: "", section_id: "", subject_ids: [], student_id: "", roll_no: "" })}>
                  <SelectTrigger data-testid="user-role-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Full name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="user-name-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="user-email-input" />
                </div>
                <div>
                  <label className="text-sm font-medium">Initial password</label>
                  <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="user-password-input" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Phone (optional)</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="user-phone-input" />
              </div>

              {(showClassSection || showSubjects) && (
                <div>
                  <label className="text-sm font-medium">Class</label>
                  <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v, section_id: "", subject_ids: [] })}>
                    <SelectTrigger data-testid="user-class-select"><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {showClassSection && form.class_id && (
                <div>
                  <label className="text-sm font-medium">Section</label>
                  <Select value={form.section_id} onValueChange={(v) => setForm({ ...form, section_id: v })}>
                    <SelectTrigger data-testid="user-section-select"><SelectValue placeholder="Select section" /></SelectTrigger>
                    <SelectContent>
                      {sectionsForClass.map((s) => <SelectItem key={s.id} value={s.id}>Section {s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {showSubjects && form.class_id && (
                <div>
                  <label className="text-sm font-medium block mb-2">Subjects taught</label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto border border-[#E2E8F0] rounded-md p-2">
                    {subjectsForClass.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.subject_ids.includes(s.id)}
                          onChange={() => toggleSubject(s.id)}
                          data-testid={`subject-cb-${s.code}`}
                        />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {form.role === "student" && (
                <div>
                  <label className="text-sm font-medium">Roll number</label>
                  <Input value={form.roll_no} onChange={(e) => setForm({ ...form, roll_no: e.target.value })} data-testid="user-rollno-input" />
                </div>
              )}

              {showStudentLink && (
                <div>
                  <label className="text-sm font-medium">Linked student</label>
                  <Select value={form.student_id} onValueChange={(v) => setForm({ ...form, student_id: v })}>
                    <SelectTrigger data-testid="user-student-select"><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.roll_no} · {s.name} · {classMap[s.class_id]}/{sectionMap[s.section_id]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={create} disabled={saving} className="bg-[#1A4331] hover:bg-[#133124] text-white" data-testid="confirm-create-user-btn">
                {saving ? "Creating…" : "Create user"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="card-soft">
        <CardContent className="p-6">
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <div className="relative">
              <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name or email"
                className="pl-9 bg-white"
                data-testid="users-search-input"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger data-testid="users-role-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {ROLE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Badge className="bg-[#1A4331]/10 text-[#1A4331] hover:bg-[#1A4331]/10 justify-center" data-testid="users-count">
              {filtered.length} users
            </Badge>
          </div>

          <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-[#F7F7F5]">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={4} className="text-center text-[#64748B] py-8">Loading…</TableCell></TableRow>}
                {!loading && filtered.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-[#64748B] py-8">No users found.</TableCell></TableRow>
                )}
                {filtered.map((u) => (
                  <TableRow key={u.id} data-testid={`user-row-${u.email}`}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell><Badge variant="outline">{ROLE_LABEL[u.role] || u.role}</Badge></TableCell>
                    <TableCell className="text-sm text-[#64748B]">{u.phone || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
