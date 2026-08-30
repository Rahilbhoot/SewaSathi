import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BadgeCheck,
  BarChart3,
  Download,
  FileText,
  Loader2,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  Lock,
  Phone,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch, apiFetchBlob, downloadBlob } from "@/lib/api";
import { useAuth, type Role } from "@/lib/auth";
import { LanguageToggle, useI18n } from "@/lib/i18n";
import {
  bookingCustomer,
  bookingService,
  bookingWorker,
  bookingAddress,
  listBookings,
  type Booking,
  type Worker,
} from "@/lib/bookings";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Federation Admin — SewaSathi Operations Console" },
      {
        name: "description",
        content:
          "Verify cooperative workers, monitor live bookings, forecast ward-level demand and issue GST invoices from the SewaSathi federation console.",
      },
      { property: "og:title", content: "SewaSathi Federation Admin" },
      {
        property: "og:description",
        content: "Verification, live operations, AI demand forecasting and invoicing.",
      },
    ],
  }),
  component: AdminPage,
});

// ─── Admin Authentication Gate ─────────────────────────────────────────────
function AdminPage() {
  const { user } = useAuth();

  // If logged in as admin, show dashboard directly
  if (user?.role === "admin") {
    return <AdminDashboard />;
  }

  // Otherwise show admin login gate
  return <AdminLoginGate />;
}

function AdminLoginGate() {
  const { t, lang } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const role = await login({ phone, password, role: "admin" });
      if (role !== "admin") {
        setError("Access denied — admin credentials required.");
        return;
      }
      // Stay on /admin — component will re-render with user now set
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-2xl gradient-hero text-white shadow-lg">
            <Lock className="size-7" />
          </div>
          <h1 className="text-2xl font-bold">{lang === "hi" ? "एडमिन लॉगिन" : "Admin Login"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lang === "hi" ? "फेडरेशन कंसोल एक्सेस करने के लिए लॉगिन करें" : "Sign in to access the Federation Console"}
          </p>
        </div>

        <div className="surface-card p-5">
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-medium">
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5 text-muted-foreground" />
                {lang === "hi" ? "यूज़रनेम" : "Username"}
              </span>
              <input
                required
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="admin"
                className="field-input mt-1"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="field-input mt-1"
              />
            </label>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              {lang === "hi" ? "लॉगिन करें" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {lang === "hi"
            ? "केवल अधिकृत फेडरेशन एडमिन के लिए"
            : "Restricted to authorized federation administrators only."}
        </p>
      </div>
    </main>
  );
}

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

type Section = "verify" | "ops" | "forecast";

type ForecastPoint = {
  ward?: string;
  name?: string;
  service?: string;
  demand?: number;
  bookings?: number;
  count?: number;
  predictedSpikePercentage?: number;
  reason?: string;
};

const NAV: { id: Section; label: string; icon: typeof Users }[] = [
  { id: "verify", label: "Verification", icon: BadgeCheck },
  { id: "ops", label: "Live Operations", icon: Activity },
  { id: "forecast", label: "AI Forecasting", icon: BarChart3 },
];

function AdminDashboard() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("verify");
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col gradient-sidebar p-4 text-sidebar-foreground transition-transform lg:static lg:translate-x-0 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-2 py-3">
          <p className="text-lg font-black tracking-tight">{t("appName")}</p>
          <p className="text-xs text-sidebar-foreground/60">Federation Console</p>
        </div>

        <nav className="mt-4 space-y-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setSection(id);
                setNavOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                section === id
                  ? "bg-sidebar-accent text-sidebar-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-sidebar-border pt-4">
          <p className="px-3 text-xs text-sidebar-foreground/60">{user?.name ?? "Admin"}</p>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/", replace: true });
            }}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/70 hover:bg-sidebar-accent/60"
          >
            <LogOut className="size-4" /> {t("logout")}
          </button>
        </div>
      </aside>

      {navOpen && (
        <div onClick={() => setNavOpen(false)} className="fixed inset-0 z-30 bg-foreground/40 lg:hidden" />
      )}

      <div className="flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setNavOpen(true)} className="btn-outline px-2 py-2 lg:hidden">
              <Menu className="size-4" />
            </button>
            <h1 className="text-base font-bold sm:text-lg">
              {NAV.find((n) => n.id === section)?.label}
            </h1>
          </div>
          <LanguageToggle />
        </header>

        <main className="px-4 py-6 sm:px-6">
          {section === "verify" && <VerificationSection />}
          {section === "ops" && <OperationsSection />}
          {section === "forecast" && <ForecastSection />}
        </main>
      </div>
    </div>
  );
}

// ─── Verification Section ────────────────────────────────────────────────────
function VerificationSection() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Worker[]>("/workers");
      setWorkers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load workers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleVerify(id: string) {
    setBusyId(id);
    try {
      await apiFetch(`/workers/${id}/verify`, { method: "PATCH" });
      setWorkers((prev) =>
        prev.map((w) => (w._id === id ? { ...w, isVerified: true, verified: true } : w))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <Loading />;

  return (
    <section className="surface-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <ShieldCheck className="size-4 text-primary" />
        <p className="font-bold">Worker verification workflow</p>
        <span className="ml-auto rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
          {workers.length} workers
        </span>
      </div>
      {error && <p className="px-4 py-3 text-sm text-destructive">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Skills</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {workers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No worker records available.
                </td>
              </tr>
            )}
            {workers.map((w) => {
              const verified = w.verified ?? w.isVerified ?? false;
              return (
                <tr key={w._id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-semibold">{w.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(w.skills ?? [w.skill]).filter(Boolean).map((s) => (
                        <span key={s} className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary capitalize">
                          {(s ?? "").replace(/_/g, " ")}
                        </span>
                      ))}
                      {!(w.skills?.length || w.skill) && <span className="text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">{w.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    {w.rating ? (
                      <span className="font-semibold">⭐ {w.rating}</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={verified ? "completed" : "pending"} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {verified ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success">
                        <BadgeCheck className="size-4" /> Verified
                      </span>
                    ) : (
                      <button
                        onClick={() => toggleVerify(w._id)}
                        disabled={busyId === w._id}
                        className="btn-primary px-3 py-1.5 text-xs"
                      >
                        {busyId === w._id && <Loader2 className="size-3.5 animate-spin" />}
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Operations Section ──────────────────────────────────────────────────────
function OperationsSection() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    listBookings()
      .then((d) => setBookings(Array.isArray(d) ? d : []))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Could not load bookings"),
      )
      .finally(() => setLoading(false));
  }, []);

  async function downloadInvoice(id: string) {
    setBusyId(id);
    try {
      const blob = await apiFetchBlob(`/invoices/${id}`);
      downloadBlob(blob, `sewasathi-invoice-${id}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invoice download failed");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <Loading />;

  const active = bookings.filter((b) => (b.status ?? "").toLowerCase() !== "cancelled");

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <KPI label="Active bookings" value={active.length} icon={Activity} color="primary" />
        <KPI
          label="Completed"
          value={bookings.filter((b) => (b.status ?? "").toLowerCase() === "completed").length}
          icon={BadgeCheck}
          color="success"
        />
        <KPI
          label="Awaiting dispatch"
          value={bookings.filter((b) => (b.status ?? "pending").toLowerCase() === "pending").length}
          icon={AlertTriangle}
          color="warning"
        />
      </div>

      <div className="surface-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <FileText className="size-4 text-primary" />
          <p className="font-bold">Live operations &amp; invoicing</p>
        </div>
        {error && <p className="px-4 py-3 text-sm text-destructive">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Partner</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {active.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No active bookings.
                  </td>
                </tr>
              )}
              {active.map((b) => (
                <tr key={b._id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-semibold capitalize">{bookingService(b)}</td>
                  <td className="px-4 py-3">{bookingCustomer(b)}</td>
                  <td className="px-4 py-3">{bookingWorker(b)}</td>
                  <td className="px-4 py-3">{bookingAddress(b)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(b.status ?? "").toLowerCase() === "completed" ? (
                      <button
                        onClick={() => void downloadInvoice(b._id)}
                        disabled={busyId === b._id}
                        className="btn-outline px-3 py-1.5 text-xs"
                      >
                        {busyId === b._id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Download className="size-3.5" />
                        )}
                        PDF
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─── Forecast Section ────────────────────────────────────────────────────────
function ForecastSection() {
  const [data, setData] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Backend returns { success: true, data: ForecastPoint[] }
    apiFetch<{ success: boolean; data: ForecastPoint[] }>("/ai/forecast")
      .then((res) => {
        const arr = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setData(arr);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Could not load forecast"),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const chartData = data.map((p) => ({
    ward: p.ward ?? p.name ?? "Ward",
    service: p.service ?? "",
    demand: p.predictedSpikePercentage ?? p.demand ?? p.bookings ?? p.count ?? 0,
    reason: p.reason ?? "",
  }));
  const peak = Math.max(0, ...chartData.map((d) => d.demand));

  return (
    <section className="space-y-4">
      <div className="surface-card p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              Predicted demand by ward
            </p>
            <p className="text-sm text-muted-foreground">
              Next 7 days · spikes highlighted for pre-emptive partner allocation
            </p>
          </div>
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
            Peak {peak}%
          </span>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="mt-6 h-[320px] w-full sm:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="ward"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                stroke="var(--border)"
              />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                stroke="var(--border)"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="demand" radius={[6, 6, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.demand === peak && peak > 0 ? "var(--warning)" : "var(--chart-1)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecast details table */}
      {chartData.length > 0 && (
        <div className="surface-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <BarChart3 className="size-4 text-primary" />
            <p className="font-bold">Forecast Details</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Ward</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Spike %</th>
                  <th className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((d, i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-semibold">{d.ward}</td>
                    <td className="px-4 py-3 capitalize">{d.service || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${d.demand === peak && peak > 0 ? "text-warning" : ""}`}>
                        {d.demand}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{d.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Shared components ───────────────────────────────────────────────────────

function KPI({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Activity;
  color: "primary" | "success" | "warning";
}) {
  const iconBg = color === "success" ? "bg-success-soft text-success"
    : color === "warning" ? "bg-warning-soft text-warning"
    : "bg-primary-soft text-primary";

  return (
    <div className="surface-card p-4 flex items-center gap-3">
      <span className={`flex size-10 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-black">{value}</p>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> Loading…
    </p>
  );
}
