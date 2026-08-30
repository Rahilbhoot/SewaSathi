import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  UserCircle,
  Phone,
  MapPin,
  ShieldCheck,
  Briefcase,
  Star,
  Loader2,
  ArrowLeft,
  BadgeCheck,
  IndianRupee,
  Calendar,
  Wrench,
} from "lucide-react";
import { useAuth, roleHome } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { apiFetch } from "@/lib/api";
import { listBookings, type Booking } from "@/lib/bookings";
import { AppHeader } from "@/components/AppHeader";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — SewaSathi" },
      {
        name: "description",
        content: "View your SewaSathi profile, booking history, and account details.",
      },
    ],
  }),
  component: ProfilePage,
});

type WelfareStatus = { eligible: boolean; scheme?: string; status?: string };

function ProfilePage() {
  const { user, ready, logout } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [welfare, setWelfare] = useState<WelfareStatus | null>(null);

  // Auth guard
  useEffect(() => {
    if (ready && !user) {
      navigate({ to: "/", replace: true });
    }
  }, [ready, user, navigate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listBookings();
      setBookings(Array.isArray(data) ? data : []);

      // Check welfare for workers
      if (user?.role === "worker" && user?.phone) {
        try {
          const res = await apiFetch<WelfareStatus>(
            `/welfare/check-status?phone=${encodeURIComponent(user.phone)}`
          );
          setWelfare(res);
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) void loadData();
  }, [user, loadData]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const completed = bookings.filter((b) => (b.status ?? "").toLowerCase() === "completed");
  const pending = bookings.filter((b) => (b.status ?? "").toLowerCase() === "pending");
  const gross = completed.reduce((sum, b) => sum + (b.amount ?? 0), 0);

  return (
    <div className="min-h-screen pb-10">
      <AppHeader />

      <main className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
        {/* Back button */}
        <Link
          to={roleHome(user.role)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline mb-5"
        >
          <ArrowLeft className="size-4" />
          {lang === "hi" ? "डैशबोर्ड पर वापस" : "Back to dashboard"}
        </Link>

        {/* Profile Header Card */}
        <div className="surface-card overflow-hidden animate-fade-in-up">
          <div className="gradient-hero px-6 py-8 text-white">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <UserCircle className="size-10" />
              </div>
              <div>
                <h1 className="text-2xl font-black">{user.name}</h1>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/80 capitalize">
                  {user.role === "worker" && <Wrench className="size-3.5" />}
                  {user.role === "customer" && <UserCircle className="size-3.5" />}
                  {user.role === "admin" && <ShieldCheck className="size-3.5" />}
                  {user.role === "worker"
                    ? (lang === "hi" ? "सेवा साथी" : "Service Partner")
                    : user.role === "admin"
                    ? (lang === "hi" ? "एडमिन" : "Admin")
                    : (lang === "hi" ? "ग्राहक" : "Customer")}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-3">
            {user.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="size-4 text-muted-foreground" />
                <span className="font-medium">{user.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {lang === "hi" ? "सदस्य" : "Member since joining"}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <StatCard
            icon={Briefcase}
            label={lang === "hi" ? "कुल बुकिंग" : "Total Bookings"}
            value={String(bookings.length)}
            color="primary"
          />
          <StatCard
            icon={BadgeCheck}
            label={lang === "hi" ? "पूर्ण" : "Completed"}
            value={String(completed.length)}
            color="success"
          />
          <StatCard
            icon={Star}
            label={lang === "hi" ? "लंबित" : "Pending"}
            value={String(pending.length)}
            color="warning"
          />
          {user.role === "worker" ? (
            <StatCard
              icon={IndianRupee}
              label={lang === "hi" ? "कमाई" : "Earnings"}
              value={`₹${gross.toLocaleString("en-IN")}`}
              color="success"
            />
          ) : (
            <StatCard
              icon={IndianRupee}
              label={lang === "hi" ? "खर्च" : "Spent"}
              value={`₹${gross.toLocaleString("en-IN")}`}
              color="primary"
            />
          )}
        </div>

        {/* Welfare Status (Workers only) */}
        {user.role === "worker" && (
          <div className="mt-5 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            {welfare?.eligible ? (
              <div className="rounded-xl border border-success/40 bg-success-soft p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-full bg-success text-success-foreground">
                    <ShieldCheck className="size-6" />
                  </span>
                  <div>
                    <p className="text-base font-black text-success">
                      {welfare.scheme ?? "e-Shram"} — {lang === "hi" ? "सक्रिय" : "Active"}
                    </p>
                    <p className="text-xs text-success/80">
                      {lang === "hi"
                        ? "आपकी सहकारी सदस्यता यह कवर सक्रिय रखती है"
                        : "Your cooperative membership keeps insurance cover active"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="surface-card p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-muted-foreground" />
                  <p className="font-bold">{lang === "hi" ? "कल्याण स्थिति" : "Welfare Status"}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {lang === "hi"
                    ? "कल्याण स्थिति जांचने के लिए डैशबोर्ड पर जाएं"
                    : "Visit your dashboard to check welfare eligibility"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Zero Commission Badge (Workers only) */}
        {user.role === "worker" && (
          <div className="mt-5 rounded-xl bg-success-soft border border-success/30 p-4 text-center animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <p className="text-lg font-black text-success">{t("zeroCommission")}</p>
            <p className="mt-1 text-xs text-success/70">
              {lang === "hi"
                ? "सेवासाथी कोई कमीशन नहीं लेता — आपकी पूरी कमाई आपकी"
                : "SewaSathi charges zero commission — 100% of your earnings are yours"}
            </p>
          </div>
        )}

        {/* Quick Actions */}
        {loading ? (
          <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> {t("loading")}
          </p>
        ) : null}
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
  color: "primary" | "success" | "warning";
}) {
  const iconBg =
    color === "success"
      ? "bg-success-soft text-success"
      : color === "warning"
      ? "bg-warning-soft text-warning"
      : "bg-primary-soft text-primary";

  return (
    <div className="surface-card p-3.5">
      <span className={`inline-flex size-8 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon className="size-4" />
      </span>
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-black">{value}</p>
    </div>
  );
}
