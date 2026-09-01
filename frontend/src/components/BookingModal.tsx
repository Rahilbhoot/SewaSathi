import { useState } from "react";
import { X, Loader2, CalendarClock, MapPin, FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { createBooking } from "@/lib/bookings";

export function BookingModal({
  service,
  onClose,
  onBooked,
}: {
  service: string;
  onClose: () => void;
  onBooked: () => void;
}) {
  const { t, lang } = useI18n();
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createBooking({ 
        serviceRequired: service, 
        notes, 
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined 
      });
      onBooked();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-4 rounded-t-2xl bg-card p-5 shadow-lift sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">{t("bookService")}</h2>
            <p className="mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
              {service}
            </p>
          </div>
          <button onClick={onClose} aria-label={t("cancel")} className="rounded-md p-1.5 hover:bg-muted transition-colors">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm font-medium">
            <span className="flex items-center gap-1.5">
              <CalendarClock className="size-3.5 text-muted-foreground" />
              {t("when")}
            </span>
            <input
              required
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="field-input mt-1"
            />
          </label>
          <label className="block text-sm font-medium">
            <span className="flex items-center gap-1.5">
              <FileText className="size-3.5 text-muted-foreground" />
              {t("notes")}
            </span>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === "hi" ? "अतिरिक्त विवरण…" : "Any extra details…"}
              className="field-input mt-1 resize-none"
            />
          </label>

          <div className="rounded-lg bg-primary-soft/50 p-3 border border-primary/20 flex items-start gap-2">
            <span className="text-primary mt-0.5">₹</span>
            <div>
              <p className="text-sm font-semibold text-primary">Consultant Fee: ₹500</p>
              <p className="text-xs text-primary/80 mt-0.5">
                {lang === "hi" 
                  ? "बुकिंग के लिए शुरुआती ₹500 का शुल्क देना होगा।" 
                  : "An initial consultant fee of ₹500 is required for this booking."}
              </p>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              {t("cancel")}
            </button>
            <button type="submit" disabled={busy} className="btn-primary flex-1">
              {busy && <Loader2 className="size-4 animate-spin" />}
              {t("confirmBooking")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
