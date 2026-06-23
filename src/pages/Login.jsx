import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GraduationCap, Eye, EyeSlash } from "@phosphor-icons/react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      const dest = location.state?.from?.pathname || "/dashboard";
      navigate(dest, { replace: true });
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-5 bg-[#F7F7F5]">
      {/* Left visual */}
      <div className="hidden lg:flex lg:col-span-3 relative overflow-hidden">
        <img
          src="https://images.pexels.com/photos/18145430/pexels-photo-18145430.jpeg"
          alt="ICSC Campus"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A4331]/85 via-[#1A4331]/70 to-[#0d2419]/85" />
        <div className="relative z-10 p-12 flex flex-col justify-end text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <GraduationCap size={26} weight="duotone" />
            </div>
            <div>
              <div className="text-2xl font-semibold" style={{fontFamily:'Outfit'}}>ICSC Connect</div>
              <div className="text-sm text-white/70">Central School Management Platform</div>
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-semibold leading-tight mb-3" style={{fontFamily:'Outfit'}}>
            Attendance, results, exams —<br />in one calm place.
          </h1>
          <p className="text-white/80 max-w-lg text-base">
            Empower teachers, engage parents in real time, and run examinations end-to-end with an ICSC-aligned workflow.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3 max-w-md">
            {["Attendance", "Results", "Examinations"].map((t) => (
              <div key={t} className="bg-white/10 backdrop-blur-md border border-white/15 rounded-lg p-3 text-center text-sm">
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="lg:col-span-2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-lg bg-[#1A4331] text-white flex items-center justify-center">
              <GraduationCap size={22} weight="duotone" />
            </div>
            <div className="text-lg font-semibold text-[#1A4331]" style={{fontFamily:'Outfit'}}>ICSC Connect</div>
          </div>
          <p className="tiny-label mb-2">Sign in</p>
          <h2 className="text-3xl font-semibold mb-2 text-[#1A4331]" style={{fontFamily:'Outfit'}}>
            Welcome back
          </h2>
          <p className="text-sm text-[#64748B] mb-8">Use your school credentials to continue.</p>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">Email address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="login-email-input"
                placeholder="you@school.edu"
                className="bg-white border-[#E2E8F0] focus:border-[#1A4331] focus:ring-1 focus:ring-[#1A4331]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#1E293B] mb-1.5 block">Password</label>
              <div className="relative">
                <Input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="login-password-input"
                  placeholder="••••••••"
                  className="bg-white border-[#E2E8F0] focus:border-[#1A4331] focus:ring-1 focus:ring-[#1A4331] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]"
                  data-testid="toggle-password-visibility"
                >
                  {showPwd ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {err && (
              <div className="text-sm text-[#EF4444] bg-[#EF4444]/10 px-3 py-2 rounded-md" data-testid="login-error">
                {err}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              data-testid="login-submit-btn"
              className="w-full bg-[#1A4331] hover:bg-[#133124] text-white"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-8 text-xs text-[#64748B] text-center">
            Need access? Please contact your school administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
