import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash, Sparkle } from "@phosphor-icons/react";
import { toast } from "sonner";

function ClassesPanel() {
  const [classes, setClasses] = useState([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/classes").then((r) => setClasses(r.data));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return toast.error("Name required");
    setBusy(true);
    try {
      await api.post("/classes", { name: name.trim(), grade_level: parseInt(grade || "0", 10) });
      toast.success("Class added");
      setName(""); setGrade(""); setOpen(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    } finally { setBusy(false); }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete "${c.name}"? Its sections and subjects will also be removed.`)) return;
    try {
      await api.delete(`/classes/${c.id}`);
      toast.success(`Deleted ${c.name}`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    }
  };

  const seedStandard = async () => {
    try {
      const { data } = await api.post("/classes/seed-standard");
      if (data.added.length === 0) toast.info("All standard classes already exist");
      else toast.success(`Added: ${data.added.join(", ")}`);
      load();
    } catch (e) { toast.error("Failed"); }
  };

  return (
    <div className="space-y-4" data-testid="classes-panel">
      <div className="flex justify-between items-center">
        <p className="text-sm text-[#64748B]">Pre-KG, LKG, UKG, Class 1 through Class 12 — or any level your school uses.</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={seedStandard} className="border-[#1A4331] text-[#1A4331]" data-testid="seed-standard-btn">
            <Sparkle size={16} className="mr-1" /> Seed Pre-KG → 12
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1A4331] hover:bg-[#133124] text-white" data-testid="add-class-btn">
                <Plus size={16} className="mr-1" /> Add class
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="class-dialog">
              <DialogHeader><DialogTitle>Add class</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Class 5" data-testid="class-name-input" />
                </div>
                <div>
                  <label className="text-sm font-medium">Grade order (number, for sorting)</label>
                  <Input type="number" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="e.g. 7" data-testid="class-grade-input" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={create} disabled={busy} className="bg-[#1A4331] hover:bg-[#133124] text-white" data-testid="confirm-add-class-btn">
                  {busy ? "Adding…" : "Add class"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card className="card-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#F7F7F5]">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-[#64748B] py-6">No classes yet.</TableCell></TableRow>}
              {classes.map((c) => (
                <TableRow key={c.id} data-testid={`class-row-${c.name}`}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell><Badge variant="outline">{c.grade_level}</Badge></TableCell>
                  <TableCell className="text-right">
                    <button onClick={() => remove(c)} className="text-xs text-[#EF4444] inline-flex items-center gap-1" data-testid={`delete-class-${c.name}`}>
                      <Trash size={14} /> Delete
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

function SectionsPanel() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [classId, setClassId] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/sections").then((r) => setSections(r.data));
  useEffect(() => {
    api.get("/classes").then((r) => setClasses(r.data));
    load();
  }, []);

  const create = async () => {
    if (!classId || !name.trim()) return toast.error("Pick a class and enter a section name");
    setBusy(true);
    try {
      await api.post("/sections", { class_id: classId, name: name.trim() });
      toast.success("Section added");
      setName("");
      load();
    } catch (e) { toast.error("Failed"); }
    finally { setBusy(false); }
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete section "${s.name}"?`)) return;
    try {
      await api.delete(`/sections/${s.id}`);
      toast.success("Section deleted");
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    }
  };

  const classMap = Object.fromEntries(classes.map((c) => [c.id, c.name]));
  const filtered = classId ? sections.filter((s) => s.class_id === classId) : sections;

  return (
    <div className="space-y-4" data-testid="sections-panel">
      <Card className="card-soft">
        <CardContent className="p-6 grid sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-sm font-medium">Class</label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger data-testid="section-class-select"><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">New section name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. A" data-testid="section-name-input" />
          </div>
          <Button onClick={create} disabled={busy || !classId} className="bg-[#1A4331] hover:bg-[#133124] text-white" data-testid="add-section-btn">
            {busy ? "Adding…" : "Add section"}
          </Button>
        </CardContent>
      </Card>

      <Card className="card-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#F7F7F5]">
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-[#64748B] py-6">No sections found.</TableCell></TableRow>}
              {filtered.map((s) => (
                <TableRow key={s.id} data-testid={`section-row-${s.name}`}>
                  <TableCell>{classMap[s.class_id] || "—"}</TableCell>
                  <TableCell className="font-medium">Section {s.name}</TableCell>
                  <TableCell className="text-right">
                    <button onClick={() => remove(s)} className="text-xs text-[#EF4444] inline-flex items-center gap-1" data-testid={`delete-section-${s.id}`}>
                      <Trash size={14} /> Delete
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

function SubjectsPanel() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classId, setClassId] = useState("");
  const [form, setForm] = useState({ name: "", code: "", max_marks: 100, passing_marks: 33, is_practical: false });
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/subjects").then((r) => setSubjects(r.data));
  useEffect(() => { api.get("/classes").then((r) => setClasses(r.data)); load(); }, []);

  const create = async () => {
    if (!classId || !form.name || !form.code) return toast.error("Class, name and code are required");
    setBusy(true);
    try {
      await api.post("/subjects", { class_id: classId, ...form });
      toast.success("Subject added");
      setForm({ name: "", code: "", max_marks: 100, passing_marks: 33, is_practical: false });
      load();
    } catch (e) { toast.error("Failed"); }
    finally { setBusy(false); }
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete subject "${s.name}"?`)) return;
    try {
      await api.delete(`/subjects/${s.id}`);
      toast.success("Subject deleted");
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    }
  };

  const classMap = Object.fromEntries(classes.map((c) => [c.id, c.name]));
  const filtered = classId ? subjects.filter((s) => s.class_id === classId) : subjects;

  return (
    <div className="space-y-4" data-testid="subjects-panel">
      <Card className="card-soft">
        <CardContent className="p-6 space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium">Class</label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger data-testid="subject-class-select"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Subject name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mathematics" data-testid="subject-name-input" />
            </div>
            <div>
              <label className="text-sm font-medium">Code</label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. MAT5" data-testid="subject-code-input" />
            </div>
          </div>
          <div className="grid sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-sm font-medium">Max marks</label>
              <Input type="number" value={form.max_marks} onChange={(e) => setForm({ ...form, max_marks: parseInt(e.target.value || "100", 10) })} data-testid="subject-max-input" />
            </div>
            <div>
              <label className="text-sm font-medium">Passing marks</label>
              <Input type="number" value={form.passing_marks} onChange={(e) => setForm({ ...form, passing_marks: parseInt(e.target.value || "33", 10) })} data-testid="subject-passing-input" />
            </div>
            <label className="flex items-center gap-2 mb-2">
              <Checkbox checked={form.is_practical} onCheckedChange={(v) => setForm({ ...form, is_practical: !!v })} data-testid="subject-practical-cb" />
              <span className="text-sm">Has practical</span>
            </label>
            <Button onClick={create} disabled={busy || !classId} className="bg-[#1A4331] hover:bg-[#133124] text-white" data-testid="add-subject-btn">
              {busy ? "Adding…" : "Add subject"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="card-soft">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#F7F7F5]">
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-right">Max / Pass</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-[#64748B] py-6">No subjects found.</TableCell></TableRow>}
              {filtered.map((s) => (
                <TableRow key={s.id} data-testid={`subject-row-${s.code}`}>
                  <TableCell>{classMap[s.class_id]}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-[#64748B]">{s.code}</TableCell>
                  <TableCell className="text-right text-sm">{s.max_marks} / {s.passing_marks}</TableCell>
                  <TableCell>{s.is_practical ? <Badge className="bg-[#D4A373]/20 text-[#1A4331]">Practical</Badge> : <Badge variant="outline">Theory</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <button onClick={() => remove(s)} className="text-xs text-[#EF4444] inline-flex items-center gap-1" data-testid={`delete-subject-${s.code}`}>
                      <Trash size={14} /> Delete
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

export default function AcademicSetup() {
  return (
    <div className="space-y-6" data-testid="academic-setup-page">
      <div>
        <p className="tiny-label">Configuration</p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A4331] mt-1" style={{ fontFamily: "Outfit" }}>
          Academic Setup
        </h1>
        <p className="text-[#64748B] mt-1">Classes, sections, and subjects — fully editable.</p>
      </div>
      <Tabs defaultValue="classes">
        <TabsList data-testid="academic-tabs">
          <TabsTrigger value="classes" data-testid="tab-classes">Classes</TabsTrigger>
          <TabsTrigger value="sections" data-testid="tab-sections">Sections</TabsTrigger>
          <TabsTrigger value="subjects" data-testid="tab-subjects">Subjects</TabsTrigger>
        </TabsList>
        <TabsContent value="classes" className="mt-6"><ClassesPanel /></TabsContent>
        <TabsContent value="sections" className="mt-6"><SectionsPanel /></TabsContent>
        <TabsContent value="subjects" className="mt-6"><SubjectsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
