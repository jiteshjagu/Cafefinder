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
      <span className="text-sm font-medium">{label}</span>
      <input type={type} required value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} data-testid={`auth-${k}-input`}
        className="mt-1 w-full rounded-xl border border-[#E4DACF] bg-white px-4 py-3 outline-none transition-colors focus:border-[#C86D3B]" />
    </label>
  );

  return (
    <div className="mx-auto grid min-h-[80vh] max-w-6xl items-center gap-12 px-5 py-12 md:grid-cols-2 md:px-8">
      <div className="rise">
        <p className="font-mono-x text-xs font-semibold uppercase tracking-[0.18em] text-[#C86D3B]">{isLogin ? "Welcome back" : "Join Café’ Reviews"}</p>
        <h1 className="font-display mt-3 text-5xl font-bold">{isLogin ? "Pull up a chair." : "Your table is waiting."}</h1>
        <p className="mt-3 text-[#6E5E55]">{isLogin ? "Log in to review and save cafes." : "Create an account to save favourites and share reviews."}</p>
        <form onSubmit={submit} className="mt-8 space-y-4" data-testid="auth-form">
          {!isLogin && field("name", "Name")}
          {field("email", "Email", "email")}
          {field("password", "Password", "password")}
          {err && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700" data-testid="auth-error">{err}</p>}
          <button disabled={busy} data-testid="auth-submit-button" className="w-full rounded-full bg-[#2C221E] py-3.5 font-semibold text-white transition-colors hover:bg-[#C86D3B] disabled:opacity-60">
            {busy ? "Please wait..." : isLogin ? "Log in" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-sm text-[#6E5E55]">
          {isLogin ? "New here? " : "Already have an account? "}
          <Link to={`${isLogin ? "/register" : "/login"}${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-[#C86D3B] hover:underline" data-testid="auth-switch-link">{isLogin ? "Create an account" : "Log in"}</Link>
        </p>
        {isLogin && <p className="font-mono-x mt-4 text-xs text-[#A89A8E]">Demo: demo@brewspot.app / demo123</p>}
      </div>
      <div className="relative hidden h-[560px] overflow-hidden rounded-[2rem] md:block">
        <img src={IMG} alt="Cappuccino" className="h-full w-full object-cover" />
        <p className="font-display absolute bottom-8 left-8 right-8 text-3xl italic text-white drop-shadow-lg">"Good coffee is a pleasure. Good friends are a treasure."</p>
      </div>
    </div>
  );
}
