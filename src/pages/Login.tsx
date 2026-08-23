import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (mode === "forgot") { setSuccess(true); setLoading(false); return; }
      navigate("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[380px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-[#1C4587] rounded-[5px] flex items-center justify-center">
            <span className="text-white font-bold text-[13px]">PL</span>
          </div>
          <span className="font-semibold text-[#141413] text-[16px]">PTU</span>
        </div>

        {/* Title */}
        <div className="text-center mb-7">
          <h1 className="text-h3 text-[#141413] mb-1">
            {mode === "login" ? "Sign in to PTU" : mode === "register" ? "Create your account" : "Reset password"}
          </h1>
          <p className="text-body-sm text-[#5C5C57]">
            {mode === "login" ? "Welcome back" : mode === "register" ? "Start your application journey" : "Enter your email and we'll send a reset link"}
          </p>
        </div>

        <div className="bg-white border border-[#E3E3DE] rounded-[12px] p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-full bg-[#EDFAF3] flex items-center justify-center mx-auto mb-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="#2E7D52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <p className="text-[14px] font-medium text-[#141413] mb-1">Check your email</p>
              <p className="text-body-sm text-[#5C5C57] mb-4">We sent a reset link to {email}</p>
              <button onClick={() => { setMode("login"); setSuccess(false); }} className="text-[13px] text-[#1C4587] hover:text-[#163571]">
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "register" && (
                <div>
                  <label className="text-[12px] font-medium text-[#141413] mb-1 block">Full name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] focus:outline-none focus:border-[#1C4587] focus:ring-2 focus:ring-[#1C4587]/10"
                    placeholder="Amir Tashkentov"
                  />
                </div>
              )}
              <div>
                <label className="text-[12px] font-medium text-[#141413] mb-1 block">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] focus:outline-none focus:border-[#1C4587] focus:ring-2 focus:ring-[#1C4587]/10"
                  placeholder="you@example.com"
                />
              </div>
              {mode !== "forgot" && (
                <div>
                  <label className="text-[12px] font-medium text-[#141413] mb-1 block">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 px-3.5 border border-[#E3E3DE] rounded-[6px] text-[14px] text-[#141413] focus:outline-none focus:border-[#1C4587] focus:ring-2 focus:ring-[#1C4587]/10"
                    placeholder="••••••••"
                  />
                </div>
              )}
              {mode === "login" && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => setMode("forgot")} className="text-[12px] text-[#1C4587] hover:text-[#163571]">
                    Forgot password?
                  </button>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-[#1C4587] text-white text-[14px] font-medium rounded-[6px] hover:bg-[#163571] disabled:opacity-40 transition-colors mt-1"
              >
                {loading ? "..." : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link"}
              </button>
            </form>
          )}
        </div>

        {/* Switch mode */}
        {!success && (
          <p className="text-center text-[13px] text-[#5C5C57] mt-5">
            {mode === "login" ? (
              <>Don't have an account?{" "}<button onClick={() => setMode("register")} className="text-[#1C4587] font-medium hover:text-[#163571]">Create one</button></>
            ) : mode === "register" ? (
              <>Already have an account?{" "}<button onClick={() => setMode("login")} className="text-[#1C4587] font-medium hover:text-[#163571]">Sign in</button></>
            ) : (
              <button onClick={() => setMode("login")} className="text-[#1C4587] font-medium hover:text-[#163571]">Back to sign in</button>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
