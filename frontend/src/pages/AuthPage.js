import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { formatError } from "@/lib/api";

const IMG = "https://images.unsplash.com/photo-1558220829-4694a46bb01f?w=1200&q=80";

export default function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const u = isLogin ? await login({ email: f.email, password: f.password }) : await register(f);
      toast.success(`Welcome${isLogin ? " back" : ""}, ${u.name.split(" ")[0]}!`);
      nav(next || (u.role === "admin" ? "/admin" : "/explore"));
    } catch (e2) { setErr(formatError(e2)); }
    setBusy(false);
  };

  const field = (k, label, type = "text") => (
    <label className="block">
      <span className="text-sm font-medium text-[#2C221E]">{label}</span>
      <input type={type} required value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} data-testid={`auth-${k}-input`}
        className="mt-1.5 w-full rounded-xl border border-[#EFE6D8] bg-white px-4 py-3 outline-none transition-colors focus:border-[#D3B683]" />
    </label>
  );

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md items-center justify-center px-5 py-16">
      <div className="rise w-full rounded-3xl border border-[#EFE6D8] bg-white p-8 shadow-sm sm:p-10">
        <p className="font-mono-x text-xs font-semibold uppercase tracking-[0.18em] text-[#9E7738]">{isLogin ? "Welcome back" : "Join Café’ Reviews"}</p>
        <h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">{isLogin ? "Log in" : "Create account"}</h1>
        <p className="mt-2 text-sm text-[#6E5E55]">{isLogin ? "Log in to review and save your favorite cafes." : "Create an account to save favourites and share reviews."}</p>
        <form onSubmit={submit} className="mt-6 space-y-4" data-testid="auth-form">
          {!isLogin && field("name", "Name")}
          {field("email", "Email", "email")}
          {field("password", "Password", "password")}
          {err && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700" data-testid="auth-error">{err}</p>}
          <button disabled={busy} data-testid="auth-submit-button" className="w-full rounded-full bg-[#D3B683] py-3.5 font-semibold text-[#2C221E] transition-colors hover:bg-[#C2A36E] disabled:opacity-60">
            {busy ? "Please wait..." : isLogin ? "Log in" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[#6E5E55]">
          {isLogin ? "New here? " : "Already have an account? "}
          <Link to={`${isLogin ? "/register" : "/login"}${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-[#9E7738] hover:underline" data-testid="auth-switch-link">{isLogin ? "Create an account" : "Log in"}</Link>
        </p>
        {isLogin && <p className="font-mono-x mt-4 rounded-lg bg-[#FAF7F2] p-2 text-center text-xs text-[#6E5E55]">Demo: demo@brewspot.app / demo123</p>}
      </div>
    </div>
  );
}
