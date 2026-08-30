import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, LogIn, ShieldCheck, HandHeart, Users, Phone, Lock, UserCircle, Wrench, Shield } from "lucide-react";
import { useAuth, roleHome, type Role } from "@/lib/auth";
import { LanguageToggle, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SewaSathi — Login | Cooperative Gig Platform" },
      {
        name: "description",
        content:
          "Sign in to SewaSathi, the worker-owned cooperative platform for verified household services, welfare access and zero-commission earnings.",
      },
      { property: "og:title", content: "SewaSathi — Cooperative Gig Platform" },
      {
        property: "og:description",
        content: "Verified household services, welfare-linked partners, zero commission.",
      },
    ],
  }),
  component: LoginPage,
});

const ROLES: { id: Role; label: string; labelHi: string; icon: typeof UserCircle; desc: string }[] = [
  { id: "customer", label: "Customer", labelHi: "ग्राहक", icon: UserCircle, desc: "Book household services" },
  { id: "worker", label: "Service Partner", labelHi: "सेवा साथी", icon: Wrench, desc: "Manage assigned jobs" },
  { id: "admin", label: "Admin", labelHi: "एडमिन", icon: Shield, desc: "Federation console" },
];

function LoginPage() {
  const { t, lang } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("customer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const loggedInRole = await login({ phone, password, role });
      navigate({ to: roleHome(loggedInRole) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      {/* ─── Left hero panel (desktop) ─── */}
      <section className="hidden flex-col justify-between gradient-hero p-12 text-white lg:flex">
        <div>
          <p className="text-3xl font-black tracking-tight drop-shadow-md">{t("appName")}</p>
          <p className="mt-2 max-w-sm text-sm text-white/80">{t("tagline")}</p>
        </div>

        <ul className="space-y-6">
          {[
            { icon: ShieldCheck, title: "Verified partners", body: "Every worker is ward-verified by the federation." },
            { icon: HandHeart, title: "Welfare linked", body: "e-Shram insurance status surfaced automatically." },
            { icon: Users, title: "Worker owned", body: "Zero commission — earnings stay with the cooperative." },
          ].map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3 animate-fade-in-up">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Icon className="size-5 text-white" />
              </span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-white/70">{body}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="text-xs text-white/40">Smart India Hackathon · Cooperative Federation</p>
      </section>

      {/* ─── Right login form ─── */}
      <section className="flex min-h-screen flex-col justify-center px-5 py-10 sm:px-10 lg:min-h-0">
        <div className="mx-auto w-full max-w-sm animate-fade-in-up">
          <div className="mb-6 flex items-center justify-between">
            <div className="lg:hidden">
              <p className="text-xl font-black tracking-tight text-primary">{t("appName")}</p>
              <p className="text-xs text-muted-foreground">{t("tagline")}</p>
            </div>
            <LanguageToggle />
          </div>

          <h1 className="text-2xl font-bold">{t("login")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lang === "hi"
              ? "ग्राहक, सेवा साथी और एडमिन यहाँ साइन इन करें।"
              : "Customers, service partners and federation admins sign in here."}
          </p>

          {/* Role selector */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            {ROLES.map(({ id, label, labelHi, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setRole(id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-semibold transition-all ${
                  role === id
                    ? "border-primary bg-primary-soft text-primary shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:border-muted-foreground/30"
                }`}
              >
                <Icon className="size-5" />
                {lang === "hi" ? labelHi : label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5 text-muted-foreground" />
                {role === "admin" ? (lang === "hi" ? "यूज़रनेम" : "Username") : t("phone")}
              </span>
              <input
                required
                type={role === "admin" ? "text" : "tel"}
                inputMode={role === "admin" ? "text" : "tel"}
                autoComplete={role === "admin" ? "username" : "tel"}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={role === "admin" ? "admin" : "98XXXXXXXX"}
                className="field-input mt-1.5"
              />
            </label>
            <label className="block text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <Lock className="size-3.5 text-muted-foreground" />
                {t("password")}
              </span>
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="field-input mt-1.5"
              />
            </label>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
              {t("login")}
            </button>
          </form>

          {role !== "admin" && (
            <p className="mt-6 text-sm text-muted-foreground">
              {t("noAccount")}{" "}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                {t("register")}
              </Link>
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
