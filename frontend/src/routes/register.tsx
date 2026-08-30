import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { Loader2, UserPlus, MapPin, CheckCircle2, Navigation } from "lucide-react";
import { useAuth, roleHome, type Role } from "@/lib/auth";
import { LanguageToggle, useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — SewaSathi Cooperative" },
      {
        name: "description",
        content:
          "Create a SewaSathi account as a customer or service partner and join the worker-owned household services cooperative.",
      },
      { property: "og:title", content: "Join SewaSathi" },
      {
        property: "og:description",
        content: "Register as a customer or verified service partner in the cooperative.",
      },
    ],
  }),
  component: RegisterPage,
});

// Ward coordinates from backend's wardCoordinates + extra wards
const WARD_OPTIONS = [
  { label: "Ward 10 — Kothrud", value: "Ward 10", coords: [73.8520, 18.5250] },
  { label: "Ward 12 — Deccan", value: "Ward 12", coords: [73.8550, 18.5210] },
  { label: "Ward 14 — Shivajinagar", value: "Ward 14", coords: [73.8567, 18.5204] },
  { label: "Ward 8 — Aundh", value: "Ward 8", coords: [73.8070, 18.5590] },
  { label: "Ward 15 — Hadapsar", value: "Ward 15", coords: [73.9260, 18.5020] },
] as const;

const SKILL_OPTIONS = [
  "electrician", "plumber", "cleaner", "carpenter",
  "painter", "appliance_repair", "pest_control", "gardener"
];

function RegisterPage() {
  const { t, lang } = useI18n();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    role: "customer" as Role,
    skills: [] as string[],
    address: "",
    ward: "",
  });
  // Location state
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [locMethod, setLocMethod] = useState<"none" | "gps" | "ward">("none");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleSkill(skill: string) {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter((s) => s !== skill)
        : [...f.skills, skill],
    }));
  }

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords([pos.coords.longitude, pos.coords.latitude]);
        setLocMethod("gps");
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(
          err.code === 1
            ? "Location access denied. Please select your ward instead."
            : "Could not detect location. Please select your ward instead."
        );
        setGpsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  function selectWard(wardValue: string) {
    const ward = WARD_OPTIONS.find((w) => w.value === wardValue);
    if (ward) {
      setCoords([...ward.coords] as [number, number]);
      setLocMethod("ward");
      set("ward", wardValue);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (!coords) {
      setError(lang === "hi" ? "कृपया अपना स्थान चुनें" : "Please set your location first");
      setBusy(false);
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        phone: form.phone,
        password: form.password,
        role: form.role,
        location: {
          type: "Point",
          coordinates: coords,
        },
      };

      if (!form.address) {
        setError(lang === "hi" ? "पता आवश्यक है" : "Address is required");
        setBusy(false);
        return;
      }
      payload.address = form.address;

      if (form.role === "worker") {
        if (form.skills.length === 0) {
          setError(lang === "hi" ? "कम से कम एक कौशल चुनें" : "Select at least one skill");
          setBusy(false);
          return;
        }
        payload.skills = form.skills;
      }

      const role = await register(payload);
      navigate({ to: roleHome(role) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xl font-black tracking-tight text-primary">{t("appName")}</p>
          <p className="text-xs text-muted-foreground">{t("tagline")}</p>
        </div>
        <LanguageToggle />
      </div>

      <div className="glass-card p-5 sm:p-7 animate-fade-in-up">
        <h1 className="text-2xl font-bold">{t("register")}</h1>

        <form onSubmit={submit} className="mt-5 space-y-4">
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2">
            {(["customer", "worker"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => set("role", r)}
                className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all ${
                  form.role === r
                    ? "border-primary bg-primary-soft text-primary shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {t(r)}
              </button>
            ))}
          </div>

          {/* Name */}
          <label className="block text-sm font-medium">
            {t("name")}
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="field-input mt-1"
            />
          </label>

          {/* Phone */}
          <label className="block text-sm font-medium">
            {t("phone")}
            <input
              required
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="98XXXXXXXX"
              className="field-input mt-1"
            />
          </label>

          {/* Password */}
          <label className="block text-sm font-medium">
            {t("password")}
            <input
              required
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className="field-input mt-1"
            />
          </label>

          {/* Skills — only for worker */}
          {form.role === "worker" && (
            <div>
              <p className="text-sm font-medium mb-2">
                {lang === "hi" ? "कौशल चुनें" : "Select your skills"}
              </p>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                      form.skills.includes(skill)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {skill.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Address */}
          <label className="block text-sm font-medium">
            {t("address")}
            <input
              required
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder={lang === "hi" ? "फ्लैट 402, सनशाइन हाइट्स, वार्ड 12" : "Flat 402, Sunshine Heights, Ward 12"}
              className="field-input mt-1"
            />
          </label>

          {/* ─── Smart Location Picker ─── */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-semibold flex items-center gap-1.5 mb-3">
              <MapPin className="size-4 text-primary" />
              {lang === "hi" ? "अपना स्थान सेट करें" : "Set your location"}
            </p>

            {locMethod === "gps" && coords ? (
              <div className="flex items-center gap-2 rounded-lg bg-success-soft border border-success/30 px-3 py-2.5">
                <CheckCircle2 className="size-5 text-success shrink-0" />
                <div>
                  <p className="text-sm font-bold text-success">
                    {lang === "hi" ? "स्थान पहचाना गया ✓" : "Location detected ✓"}
                  </p>
                  <p className="text-xs text-success/70">
                    {lang === "hi" ? "GPS द्वारा स्वचालित पहचान" : "Auto-detected via GPS"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setCoords(null); setLocMethod("none"); }}
                  className="ml-auto text-xs text-success/60 hover:text-success underline"
                >
                  {lang === "hi" ? "बदलें" : "Change"}
                </button>
              </div>
            ) : locMethod === "ward" && coords ? (
              <div className="flex items-center gap-2 rounded-lg bg-primary-soft border border-primary/30 px-3 py-2.5">
                <MapPin className="size-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-bold text-primary">
                    {form.ward} {lang === "hi" ? "चुना गया ✓" : "selected ✓"}
                  </p>
                  <p className="text-xs text-primary/70">
                    {lang === "hi" ? "वार्ड आधारित स्थान" : "Ward-based location"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setCoords(null); setLocMethod("none"); set("ward", ""); }}
                  className="ml-auto text-xs text-primary/60 hover:text-primary underline"
                >
                  {lang === "hi" ? "बदलें" : "Change"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* GPS Button */}
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={gpsLoading}
                  className="btn-primary w-full text-sm"
                >
                  {gpsLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Navigation className="size-4" />
                  )}
                  {gpsLoading
                    ? (lang === "hi" ? "पहचान रहा है…" : "Detecting…")
                    : (lang === "hi" ? "📍 मेरा वर्तमान स्थान" : "📍 Use my current location")}
                </button>

                {gpsError && (
                  <p className="text-xs text-destructive">{gpsError}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  {lang === "hi" ? "या" : "or"}
                  <span className="h-px flex-1 bg-border" />
                </div>

                {/* Ward Dropdown */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    {lang === "hi" ? "अपना वार्ड चुनें" : "Select your ward"}
                  </p>
                  <select
                    value=""
                    onChange={(e) => selectWard(e.target.value)}
                    className="field-input text-sm"
                  >
                    <option value="" disabled>
                      {lang === "hi" ? "— वार्ड चुनें —" : "— Choose ward —"}
                    </option>
                    {WARD_OPTIONS.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            {t("register")}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link to="/" className="font-semibold text-primary hover:underline">
          {t("login")}
        </Link>
      </p>
    </main>
  );
}
