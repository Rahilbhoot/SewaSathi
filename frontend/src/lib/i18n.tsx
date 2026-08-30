import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "en" | "hi";

const dict = {
  en: {
    appName: "SewaSathi",
    tagline: "Cooperative Gig Platform for Household Services",
    login: "Log in",
    register: "Create account",
    email: "Email",
    password: "Password",
    name: "Full name",
    phone: "Phone number",
    role: "I am a",
    customer: "Customer",
    worker: "Service Partner",
    noAccount: "New to SewaSathi?",
    haveAccount: "Already registered?",
    logout: "Log out",
    services: "Services",
    bookNow: "Book now",
    myBookings: "My bookings",
    bookService: "Book a service",
    address: "Address / Ward",
    when: "Preferred date & time",
    notes: "Notes for the partner",
    confirmBooking: "Confirm booking",
    cancel: "Cancel",
    sahayak: "Sahayak AI",
    sahayakHint: "Describe what you need, e.g. \"Need plumber in Ward 12\"",
    send: "Send",
    jobs: "Jobs",
    welfare: "Welfare & Earnings",
    markComplete: "Mark completed",
    completed: "Completed",
    pending: "Pending",
    inProgress: "In progress",
    noJobs: "No jobs assigned right now.",
    earnings: "Earnings",
    zeroCommission: "Zero commission — you keep 100%",
    loading: "Loading…",
    electrician: "Electrician",
    plumber: "Plumber",
    cleaner: "Deep cleaning",
    carpenter: "Carpenter",
    painter: "Painter",
    applianceRepair: "Appliance repair",
    pestControl: "Pest control",
    gardener: "Gardener",
  },
  hi: {
    appName: "सेवासाथी",
    tagline: "घरेलू सेवाओं के लिए सहकारी गिग प्लेटफ़ॉर्म",
    login: "लॉग इन करें",
    register: "खाता बनाएँ",
    email: "ईमेल",
    password: "पासवर्ड",
    name: "पूरा नाम",
    phone: "मोबाइल नंबर",
    role: "मैं हूँ",
    customer: "ग्राहक",
    worker: "सेवा साथी",
    noAccount: "सेवासाथी पर नए हैं?",
    haveAccount: "पहले से पंजीकृत हैं?",
    logout: "लॉग आउट",
    services: "सेवाएँ",
    bookNow: "बुक करें",
    myBookings: "मेरी बुकिंग",
    bookService: "सेवा बुक करें",
    address: "पता / वार्ड",
    when: "पसंदीदा तारीख और समय",
    notes: "साथी के लिए विवरण",
    confirmBooking: "बुकिंग पक्की करें",
    cancel: "रद्द करें",
    sahayak: "सहायक एआई",
    sahayakHint: "अपनी ज़रूरत लिखें, जैसे \"वार्ड 12 में प्लंबर चाहिए\"",
    send: "भेजें",
    jobs: "काम",
    welfare: "कल्याण और कमाई",
    markComplete: "पूरा हुआ चिह्नित करें",
    completed: "पूरा हुआ",
    pending: "प्रतीक्षारत",
    inProgress: "चल रहा है",
    noJobs: "अभी कोई काम नहीं सौंपा गया है।",
    earnings: "कमाई",
    zeroCommission: "शून्य कमीशन — पूरी कमाई आपकी",
    loading: "लोड हो रहा है…",
    electrician: "इलेक्ट्रिशियन",
    plumber: "प्लंबर",
    cleaner: "गहरी सफ़ाई",
    carpenter: "बढ़ई",
    painter: "पेंटर",
    applianceRepair: "उपकरण मरम्मत",
    pestControl: "कीट नियंत्रण",
    gardener: "माली",
  },
} as const;

export type TKey = keyof (typeof dict)["en"];

type I18nValue = { lang: Lang; setLang: (l: Lang) => void; t: (key: TKey) => string };

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("sewasathi_lang") as Lang | null;
    if (saved === "en" || saved === "hi") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem("sewasathi_lang", l);
  }, []);

  const t = useCallback((key: TKey) => dict[lang][key] ?? dict.en[key], [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-border bg-card text-xs font-semibold">
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={
            "px-3 py-1.5 transition-colors " +
            (lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")
          }
        >
          {l === "en" ? "EN" : "हिं"}
        </button>
      ))}
    </div>
  );
}
