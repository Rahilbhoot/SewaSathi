import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, MapPin, Send, Sparkles, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type Msg = { from: "user" | "ai"; text: string };

// Backend dispatch returns: { action: string, message: string, data?: any }
type DispatchResponse = {
  action?: string;
  message?: string;
  reply?: string;
  data?: unknown;
  booking?: { _id?: string; service?: string; serviceRequired?: string; ward?: string; status?: string };
  worker?: { name?: string };
};

export function SahayakDrawer({
  open,
  onClose,
  onBooked,
}: {
  open: boolean;
  onClose: () => void;
  onBooked: () => void;
}) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Msg[]>([
    { from: "ai", text: "Namaste! 🙏 Tell me what you need and I'll dispatch a verified partner for you." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || coords || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords(null),
      { timeout: 5000 },
    );
  }, [open, coords]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || busy) return;
    const newHistory = [...messages, { from: "user" as const, text: prompt }];
    setMessages(newHistory);
    setInput("");
    setBusy(true);
    try {
      const geminiHistory = newHistory.map(m => ({
        role: m.from === "ai" ? "model" : "user",
        parts: [{ text: m.text }]
      }));
      
      const res = await apiFetch<DispatchResponse>("/ai/dispatch", {
        method: "POST",
        body: JSON.stringify({ 
          prompt, 
          history: geminiHistory,
          lat: coords?.lat ?? null, 
          lng: coords?.lng ?? null 
        }),
      });

      let summary: string;

      if (res.action === "workers_found" && res.message) {
        // Backend found workers — show the message
        summary = res.message;
        if (Array.isArray(res.data) && res.data.length > 0) {
          const workerList = res.data
            .map((w: any) => `• ${w.name} (ID: ${w._id}) (${(w.skills ?? []).join(", ")}) — ⭐ ${w.rating ?? "N/A"}`)
            .join("\n");
          summary += "\n\n" + workerList;
        }
      } else if (res.action === "booking_created" && res.message) {
        // AI created a booking
        summary = res.message;
        onBooked();
      } else {
        // General chat response
        summary =
          res.message ??
          res.reply ??
          (res.booking
            ? `Booked ${res.booking.serviceRequired ?? res.booking.service ?? "service"}${
                res.booking.ward ? ` in ${res.booking.ward}` : ""
              }${res.worker?.name ? ` with ${res.worker.name}` : ""}.`
            : "Request received.");
        if (res.booking || res.action === "booking_created") onBooked();
      }

      setMessages((m) => [...m, { from: "ai", text: summary }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { from: "ai", text: err instanceof Error ? err.message : "Dispatch failed" },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-card shadow-lift transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Bot className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold">{t("sahayak")}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                {coords ? "Location shared" : "Location off"}
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label={t("cancel")} className="rounded-md p-1.5 hover:bg-muted transition-colors">
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => (
            <div key={i} className={m.from === "user" ? "flex justify-end" : "flex justify-start"}>
              <p
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line ${
                  m.from === "user"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-muted text-foreground"
                }`}
              >
                {m.text}
              </p>
            </div>
          ))}
          {busy && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Sahayak is dispatching…
            </p>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={send} className="flex items-center gap-2 border-t border-border p-3">
          <Sparkles className="size-4 shrink-0 text-primary" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("sahayakHint")}
            className="field-input"
          />
          <button type="submit" disabled={busy} className="btn-primary px-3" aria-label={t("send")}>
            <Send className="size-4" />
          </button>
        </form>
      </aside>
    </>
  );
}
