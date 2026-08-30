import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  IndianRupee,
  Loader2,
  MapPin,
  ShieldCheck,
  Wallet,
  Star,
  Calendar,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { bookingService, bookingCustomer, completeBooking, listBookings, type Booking } from "@/lib/bookings";
import { StatusBadge } from "@/components/StatusBadge";
import { AppHeader } from "@/components/AppHeader";

export const Route = createFileRoute("/worker")({
  head: () => ({
    meta: [
      { title: "Job Dashboard — SewaSathi Service Partner" },
      {
        name: "description",
        content:
          "Manage assigned household service jobs, mark them completed, and track e-Shram welfare status with zero-commission earnings.",
      },
      { property: "og:title", content: "SewaSathi Partner Dashboard" },
      {
        property: "og:description",
        content: "Assigned jobs, welfare status and zero-commission earnings in one place.",
      },
    ],
  }),
  component: WorkerPortal,
});

type WelfareStatus = { eligible: boolean; scheme?: string };

function WorkerPortal() {
  const { t } = useI18n();
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"jobs" | "welfare">("jobs");

  // Auth guard — redirect if not logged in or not a worker
  useEffect(() => {
    if (ready && (!user || user.role !== "worker")) {
      navigate({ to: "/", replace: true });
    }
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6">
      <AppHeader />

      {/* Worker Profile Header */}
      <section className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold">{user.name}</h2>
              <div className="mt-2 flex flex-col gap-1.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <MapPin className="size-4 shrink-0 text-primary" />
                  {user.address || "Address not set"}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <BadgeCheck className="size-4 shrink-0 text-primary" />
                  {user.skills && user.skills.length > 0 ? (
                    user.skills.map((skill: string) => (
                      <span key={skill} className="capitalize font-semibold text-foreground bg-muted px-2 py-0.5 rounded-full text-xs">
                        {skill.replace(/_/g, " ")}
                      </span>
                    ))
                  ) : (
                    "No skills registered"
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <nav className="sticky top-[57px] z-20 border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-3xl">
          {(
            [
              { id: "jobs" as const, label: t("jobs"), icon: Briefcase },
              { id: "welfare" as const, label: t("welfare"), icon: ShieldCheck },
            ]
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                tab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">
        {tab === "jobs" ? <JobsTab /> : <WelfareTab />}
      </main>
    </div>
  );
}

function JobsTab() {
  const { t } = useI18n();
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listBookings();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function complete(id: string) {
    setBusyId(id);
    try {
      await completeBooking(id);
      setJobs((prev) => prev.map((j) => (j._id === id ? { ...j, status: "completed" } : j)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  if (loading)
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> {t("loading")}
      </p>
    );

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{error}</p>
      )}
      {jobs.length === 0 && (
        <div className="surface-card p-8 text-center">
          <Briefcase className="mx-auto size-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">{t("noJobs")}</p>
        </div>
      )}
      {jobs.map((job) => {
        const done = (job.status ?? "").toLowerCase() === "completed";
        return (
          <article key={job._id} className="surface-card p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold capitalize">{bookingService(job)}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {job.customer?.address ?? "Location shared on accept"}
                  </span>
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="size-3.5 shrink-0" />
                  {job.scheduledAt 
                    ? new Date(job.scheduledAt).toLocaleString() 
                    : job.createdAt 
                      ? new Date(job.createdAt).toLocaleString() 
                      : "—"}
                </p>
                {job.customer?.name && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Customer: <span className="font-semibold text-foreground">{job.customer.name}</span>
                  </p>
                )}
              </div>
              <StatusBadge status={job.status} />
            </div>

            {job.notes && <p className="mt-3 rounded-md bg-muted p-3 text-sm">{job.notes}</p>}

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="flex items-center text-sm font-bold">
                <IndianRupee className="size-4" />
                {job.amount ?? 500}
              </p>
              {done ? (
                <span className="inline-flex items-center gap-2 text-sm font-bold text-success">
                  <CheckCircle2 className="size-4" /> {t("completed")}
                </span>
              ) : (
                <button
                  onClick={() => void complete(job._id)}
                  disabled={busyId === job._id}
                  className="btn-success w-full sm:w-auto"
                >
                  {busyId === job._id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  {t("markComplete")}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function WelfareTab() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [status, setStatus] = useState<WelfareStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const check = useCallback(async (num: string) => {
    if (!num) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<WelfareStatus>(
        `/welfare/check-status?phone=${encodeURIComponent(num)}`,
      );
      setStatus(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Welfare check failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.phone) void check(user.phone);
    listBookings()
      .then((d) => setBookings(Array.isArray(d) ? d : []))
      .catch(() => setBookings([]));
  }, [user?.phone, check]);

  const completed = bookings.filter((b) => (b.status ?? "").toLowerCase() === "completed");
  const gross = completed.reduce((sum, b) => sum + (b.amount ?? 0), 0);

  return (
    <div className="space-y-5">
      {status?.eligible ? (
        <div className="rounded-xl border border-success/40 bg-success-soft p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-success text-success-foreground">
              <BadgeCheck className="size-6" />
            </span>
            <div>
              <p className="text-base font-black text-success">
                Active {status.scheme ?? "e-Shram"} Insurance
              </p>
              <p className="text-xs text-success/80">
                Your cooperative membership keeps this cover active.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="surface-card p-5">
          <p className="font-bold">Welfare status</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your registered phone number to check e-Shram eligibility.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="98XXXXXXXX"
              className="field-input"
            />
            <button onClick={() => void check(phone)} disabled={loading} className="btn-primary">
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Check"}
            </button>
          </div>
          {status && !status.eligible && (
            <p className="mt-3 text-sm text-muted-foreground">
              Not enrolled yet — visit your ward federation desk to register for e-Shram.
            </p>
          )}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
      )}

      <div className="surface-card p-5">
        <div className="flex items-center gap-2">
          <Wallet className="size-5 text-primary" />
          <p className="font-bold">{t("earnings")}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="Gross earnings" value={`₹${gross.toLocaleString("en-IN")}`} icon={IndianRupee} />
          <Stat label="Platform commission" value="₹0" tone="success" icon={Star} />
          <Stat label="Jobs completed" value={String(completed.length)} icon={Briefcase} />
          <Stat label="Take home" value={`₹${gross.toLocaleString("en-IN")}`} tone="success" icon={Wallet} />
        </div>

        <p className="mt-4 rounded-md bg-success-soft px-3 py-2 text-sm font-semibold text-success">
          {t("zeroCommission")}
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone?: "success" | undefined;
  icon?: typeof IndianRupee;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon && <Icon className="size-3" />}
        {label}
      </p>
      <p className={`mt-1 text-lg font-black ${tone === "success" ? "text-success" : ""}`}>{value}</p>
    </div>
  );
}
