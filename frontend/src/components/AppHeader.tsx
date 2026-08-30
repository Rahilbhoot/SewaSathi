import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, UserCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { LanguageToggle, useI18n } from "@/lib/i18n";

export function AppHeader({ subtitle }: { subtitle?: string }) {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-base font-black tracking-tight text-primary">{t("appName")}</p>
          <p className="truncate text-xs text-muted-foreground">
            {subtitle ?? (user ? `${user.name} · ${user.role}` : t("tagline"))}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageToggle />
          {/* Profile link */}
          <Link
            to="/profile"
            className="btn-ghost px-2.5 py-2"
            aria-label="Profile"
          >
            <UserCircle className="size-4" />
          </Link>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/", replace: true });
            }}
            className="btn-outline px-2.5 py-2"
            aria-label={t("logout")}
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
