"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dictionary, type Locale } from "@/lib/i18n";

type Member = {
  id: string;
  displayName: string;
  role: string;
  countryCode?: string | null;
};

export default function HeaderAuth({ lang }: { lang: Locale }) {
  const t = dictionary(lang);
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) setMember((await res.json()) as Member);
      else setMember(null);
    } catch {
      setMember(null);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    refresh();
    const onAuthChange = () => refresh();
    const onOpenModal = () => setOpen(true);
    window.addEventListener("econorank-auth-change", onAuthChange);
    window.addEventListener("econorank-open-login", onOpenModal);
    return () => {
      window.removeEventListener("econorank-auth-change", onAuthChange);
      window.removeEventListener("econorank-open-login", onOpenModal);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    try {
      const csrfRes = await fetch("/api/auth/csrf", { cache: "no-store" });
      if (csrfRes.ok) {
        const csrf = (await csrfRes.json()) as {
          token: string;
          headerName: string;
        };
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { [csrf.headerName]: csrf.token },
        });
      }
      setMember(null);
      window.dispatchEvent(new Event("econorank-auth-change"));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const myPageLabel =
    lang === "ko" ? "마이페이지" : lang === "ja" ? "マイページ" : "My Page";
  const adminLabel =
    lang === "ko" ? "관리자" : lang === "ja" ? "管理" : "Admin";

  if (!loaded) return null;

  return (
    <>
      <div className="header-auth">
        {member ? (
          <>
            {member.role === "ADMIN" && (
              <Link href={`/${lang}/admin`} className="header-auth-btn admin">
                {adminLabel}
              </Link>
            )}
            <Link href={`/${lang}/mypage`} className="header-auth-btn primary">
              {myPageLabel}
            </Link>
            <button
              type="button"
              className="header-auth-btn"
              disabled={busy}
              onClick={handleLogout}
            >
              {t.signOut}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="header-auth-btn primary"
            onClick={() => setOpen(true)}
          >
            {t.signIn}
          </button>
        )}
      </div>

      {open &&
        !member &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="auth-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label={t.signIn}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div className="panel auth-modal">
              <div className="auth-modal-head">
                <div>
                  <p className="eyebrow">ECONORANK</p>
                  <h2>{t.signIn}</h2>
                </div>
                <button
                  type="button"
                  className="auth-modal-close"
                  aria-label={t.cancel}
                  onClick={() => setOpen(false)}
                >
                  ×
                </button>
              </div>

              <a
                href={`/api/auth/google/start?lang=${encodeURIComponent(lang)}`}
                className="google-login-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
                <span>
                  {lang === "ko"
                    ? "Google로 계속하기"
                    : lang === "ja"
                      ? "Googleで続行"
                      : "Continue with Google"}
                </span>
              </a>

              <div className="vpn-notice" role="note">
                <strong>{t.vpnTitle}</strong>
                <p>{t.vpnBody}</p>
              </div>

              <p className="guidelines" style={{ margin: 0 }}>
                {t.guidelines}
              </p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
