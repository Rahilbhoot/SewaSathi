import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  Brush,
  Bug,
  Drill,
  Hammer,
  Leaf,
  PaintRoller,
  Plug,
  Wrench,
  CalendarClock,
  Loader2,
  IndianRupee,
  MapPin,
} from "lucide-react";
import { useI18n, type TKey } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { bookingService, listBookings, type Booking } from "@/lib/bookings";
import { BookingModal } from "@/components/BookingModal";
import { SahayakDrawer } from "@/components/SahayakDrawer";
import { StatusBadge } from "@/components/StatusBadge";
import { AppHeader } from "@/components/AppHeader";

export const Route = createFileRoute("/customer")({
  head: () => ({
    meta: [
      { title: "Service Dashboard — SewaSathi Customer Portal" },
      {
        name: "description",
        content:
          "Book verified electricians, plumbers and cleaners in your ward, or let the Sahayak AI co-pilot dispatch a partner for you.",
      },
      { property: "og:title", content: "SewaSathi Customer Portal" },
      {
        property: "og:description",
        content: "Book verified household services or dispatch a partner with Sahayak AI.",
      },
    ],
  }),
  component: CustomerPortal,
});

const SERVICES: { key: TKey; icon: typeof Plug; label: string }[] = [
  { key: "electrician", icon: Plug, label: "Electrician" },
  { key: "plumber", icon: Wrench, label: "Plumber" },
  { key: "cleaner", icon: Brush, label: "Deep Cleaning" },
  { key: "carpenter", icon: Hammer, label: "Carpenter" },
  { key: "painter", icon: PaintRoller, label: "Painter" },
  { key: "applianceRepair", icon: Drill, label: "Appliance Repair" },
  { key: "pestControl", icon: Bug, label: "Pest Control" },
  { key: "gardener", icon: Leaf, label: "Gardener" },
];

function CustomerPortal() {
  const { t } = useI18n();
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalService, setModalService] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Auth guard — redirect if not logged in or not a customer
  useEffect(() => {
    if (ready && (!user || user.role !== "customer")) {
      navigate({ to: "/", replace: true });
    }
  }, [ready, user, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "customer") void load();
  }, [load, user]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <AppHeader />

      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        {/* Customer Location Display */}
        <section className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm flex items-start gap-3">
          <div className="rounded-full bg-primary-soft p-2 text-primary shrink-0 mt-0.5">
            <MapPin className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Service Location</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {user?.address || "Address not set"}
            </p>
          </div>
        </section>

        <section>
          <h1 className="text-xl font-bold sm:text-2xl">{t("services")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verified cooperative partners near you. Tap a service to book.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 stagger-children">
            {SERVICES.map(({ key, icon: Icon, label }) => (
              <button
                key={label}
                onClick={() => setModalService(label)}
                className="surface-card-hover group flex flex-col items-start gap-3 p-4 text-left"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary transition-transform group-hover:scale-110">
                  <Icon className="size-5" />
                </span>
                <span className="text-sm font-semibold">{t(key)}</span>
                <span className="text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  {t("bookNow")} →
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{t("myBookings")}</h2>
            <button onClick={() => void load()} className="btn-outline text-xs">
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> {t("loading")}
            </p>
          ) : error ? (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          ) : bookings.length === 0 ? (
            <p className="surface-card mt-4 p-6 text-center text-sm text-muted-foreground">
              No bookings yet — book a service above or ask Sahayak.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {bookings.map((b) => (
                <li key={b._id} className="surface-card flex items-center justify-between gap-4 p-4 hover:shadow-lg transition-shadow">
                  <div className="min-w-0">
                    <p className="truncate font-semibold capitalize">{bookingService(b)}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      <CalendarClock className="size-3.5 shrink-0" />
                      {b.scheduledAt 
                        ? new Date(b.scheduledAt).toLocaleString() 
                        : b.createdAt 
                          ? new Date(b.createdAt).toLocaleString() 
                          : "—"}
                    </p>
                    {b.worker?.name && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Partner: <span className="font-semibold text-foreground">{b.worker.name}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge status={b.status} />
                    <span className="flex items-center text-xs font-bold text-foreground">
                      <IndianRupee className="size-3" />
                      {b.amount ?? 500}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <button
        onClick={() => setChatOpen(true)}
        className="btn-primary fixed bottom-5 right-5 z-30 rounded-full px-5 py-3 shadow-lift"
      >
        <Bot className="size-5" />
        {t("sahayak")}
      </button>

      {modalService && (
        <BookingModal
          service={modalService}
          onClose={() => setModalService(null)}
          onBooked={() => void load()}
        />
      )}
      <SahayakDrawer open={chatOpen} onClose={() => setChatOpen(false)} onBooked={() => void load()} />
    </div>
  );
}
