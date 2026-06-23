import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";

const ROLES = ["admin", "class_teacher", "subject_teacher", "office_staff", "parent", "student"];

export default function Notifications() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", category: "general", recipient_roles: ["parent", "student"], send_email: false });

  const load = () => api.get("/notifications").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await api.post(`/notifications/${id}/read`);
    load();
  };

  const create = async () => {
    try {
      await api.post("/notifications", { ...form, recipient_user_ids: [] });
      toast.success("Notification sent");
      setShowCreate(false);
      setForm({ title: "", body: "", category: "general", recipient_roles: ["parent", "student"], send_email: false });
      load();
    } catch (e) { toast.error("Failed to send"); }
  };

  const canCreate = ["admin", "class_teacher", "office_staff"].includes(user.role);

  return (
    <div className="space-y-6" data-testid="notifications-page">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <p className="tiny-label">Communication</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#1A4331] mt-1" style={{fontFamily:'Outfit'}}>Notifications</h1>
          <p className="text-[#64748B] mt-1">Stay informed about school announcements.</p>
        </div>
        {canCreate && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="bg-[#1A4331] hover:bg-[#133124] text-white" data-testid="create-notification-btn">
                <Plus size={16} className="mr-1" /> New Notification
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="create-notification-dialog">
              <DialogHeader><DialogTitle>Send Notification</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Title" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} data-testid="notif-title-input" />
                <Textarea placeholder="Message" value={form.body} onChange={(e) => setForm({...form, body: e.target.value})} data-testid="notif-body-input" />
                <Select value={form.category} onValueChange={(v) => setForm({...form, category: v})}>
                  <SelectTrigger data-testid="notif-category-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="result">Result</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="fee">Fee</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                  </SelectContent>
                </Select>
                <div>
                  <div className="text-sm mb-2 text-[#64748B]">Recipient roles</div>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((r) => (
                      <label key={r} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={form.recipient_roles.includes(r)}
                          onCheckedChange={(v) => {
                            setForm((f) => ({
                              ...f,
                              recipient_roles: v ? [...f.recipient_roles, r] : f.recipient_roles.filter((x) => x !== r),
                            }));
                          }}
                          data-testid={`role-${r}-checkbox`}
                        />
                        {r.replace("_", " ")}
                      </label>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={form.send_email} onCheckedChange={(v) => setForm({...form, send_email: !!v})} data-testid="send-email-checkbox" />
                  Also send via Email (currently mocked)
                </label>
              </div>
              <DialogFooter>
                <Button onClick={create} className="bg-[#1A4331] hover:bg-[#133124] text-white" data-testid="confirm-create-notif-btn">Send</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-3">
        {items.length === 0 && <Card className="card-soft"><CardContent className="p-6 text-[#64748B]">No notifications yet.</CardContent></Card>}
        {items.map((n) => (
          <Card key={n.id} className="card-soft" data-testid={`notification-${n.id}`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${n.is_read ? "bg-[#F7F7F5]" : "bg-[#D4A373]/20"}`}>
                  <Bell size={20} className={n.is_read ? "text-[#64748B]" : "text-[#1A4331]"} weight="duotone" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium">{n.title}</span>
                    <Badge variant="outline" className="text-xs">{n.category}</Badge>
                    {!n.is_read && <Badge className="bg-[#D4A373]/30 text-[#1A4331] text-xs">New</Badge>}
                  </div>
                  <p className="text-sm text-[#64748B]">{n.body}</p>
                  <div className="text-xs text-[#94A3B8] mt-2">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                {!n.is_read && (
                  <button onClick={() => markRead(n.id)} className="text-xs text-[#1A4331] underline" data-testid={`mark-read-${n.id}`}>
                    Mark read
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
