"use client";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { amount, metricAmount, type Company, type Ranking } from "@/lib/api";
import { countryName } from "@/lib/geography";
import { dictionary, type Locale } from "@/lib/i18n";
import CountryFlag from "@/components/CountryFlag";
import CompanyLogo from "@/components/CompanyLogo";
import { StatPicker, StatText } from "@/components/StatEmbed";

type Member = {
  id: string;
  displayName: string;
  role: string;
  countryCode?: string | null;
};
type Post = {
  id: string;
  title: string;
  body: string;
  language: string;
  author: string;
  authorId: string | null;
  authorCountry?: string | null;
  anonymous?: boolean;
  createdAt: string;
  spaceId: string;
  likeCount?: number;
  commentCount?: number;
  liked?: boolean;
};
type Comment = {
  id: string;
  body: string;
  author: string;
  authorId: string | null;
  authorCountry?: string | null;
  anonymous?: boolean;
  createdAt: string;
};
type Feed = { items: Post[]; total: number };
type Report = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  content: string;
  postId: string;
};

async function read<T>(path: string): Promise<T> {
  const response = await fetch(`/api${path}`, { cache: "no-store" });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      message = (await response.json()).message || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
}

async function mutate<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const csrf = await read<{ token: string; headerName: string }>("/auth/csrf");
  const response = await fetch(`/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      [csrf.headerName]: csrf.token,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      message = (await response.json()).message || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
}

function defaultGuestPlaceholder(countryCode: string | null): string {
  switch (countryCode?.toUpperCase()) {
    case "KOR":
      return "ㅇㅇ";
    case "JPN":
      return "名無し";
    case "CHN":
    case "TWN":
    case "HKG":
      return "匿名";
    case "RUS":
      return "Аноним";
    case "UKR":
      return "Анонім";
    case "SAU":
    case "ARE":
    case "EGY":
      return "مجهول";
    case "DEU":
    case "AUT":
    case "CHE":
      return "Anonym";
    case "FRA":
    case "BEL":
      return "Anonyme";
    case "ESP":
    case "MEX":
    case "ARG":
      return "Anónimo";
    case "BRA":
    case "PRT":
      return "Anônimo";
    case "ITA":
      return "Anonimo";
    case "TUR":
      return "Anonim";
    case "VNM":
      return "Ẩn danh";
    case "THA":
      return "นิรนาม";
    case "IND":
      return "अनाम";
    default:
      return "Anon";
  }
}

function AuthorTag({
  name,
  countryCode,
  anonymous,
  lang,
}: {
  name: string;
  countryCode?: string | null;
  anonymous?: boolean;
  lang: Locale;
}) {
  return (
    <span className="author-badge">
      {countryCode && <CountryFlag code={countryCode} size="sm" />}
      <strong>{name}</strong>
      {countryCode && (
        <span className="author-country-tag">
          {countryName(countryCode, countryCode, lang)}
        </span>
      )}
      {anonymous && <span className="anon-tag">{dictionary(lang).anonBadge}</span>}
    </span>
  );
}

function extractStatChips(body: string, lang: Locale): string[] {
  const t = dictionary(lang);
  const matches = body.match(
    /\[\[stat:(?:country:[A-Z]{3}:(?:gdp|gdppc|ppp):\d{4}|company:[A-Za-z0-9.\-^]{1,20})\]\]/g,
  );
  if (!matches) return [];
  return matches.slice(0, 4).map((tok) => {
    const segs = tok.slice(7, -2).split(":");
    if (segs[0] === "country" && segs.length === 4) {
      const [, code, metric, year] = segs;
      const mLabel = metric === "gdppc" ? t.gdppc : metric === "ppp" ? t.ppp : t.gdp;
      return `${countryName(code, code, lang)} · ${mLabel} ${year}`;
    }
    if (segs[0] === "company" && segs.length === 2) {
      return segs[1];
    }
    return t.statCardTag;
  });
}

export default function Community({
  lang,
  initialPost,
  initialAttach,
  topCompanies = [],
  topGdp = [],
  gdpYear = new Date().getUTCFullYear(),
}: {
  lang: Locale;
  initialPost: string | null;
  initialAttach?: string | null;
  topCompanies?: Company[];
  topGdp?: Ranking[];
  gdpYear?: number;
}) {
  const t = dictionary(lang);
  const isKo = lang === "ko";
  const isJa = lang === "ja";
  const [member, setMember] = useState<Member | null>(null),
    [geoCountry, setGeoCountry] = useState<string | null>(null),
    [page, setPage] = useState(0),
    [sort, setSort] = useState<"latest" | "popular">("latest"),
    [searchQuery, setSearchQuery] = useState("");
  const [feed, setFeed] = useState<Feed>({ items: [], total: 0 }),
    [selected, setSelected] = useState<string | null>(initialPost),
    [thread, setThread] = useState<{ post: Post; comments: Comment[] } | null>(
      null,
    );
  const safeAttach =
    initialAttach &&
    /^(?:country:[A-Z]{3}:(?:gdp|gdppc|ppp):\d{4}|company:[A-Za-z0-9.\-^]{1,20})$/.test(
      initialAttach,
    )
      ? `[[stat:${initialAttach}]]\n\n`
      : "";
  const [auth, setAuth] = useState<"login" | "register" | null>(null),
    [writing, setWriting] = useState(Boolean(safeAttach)),
    [draftTitle, setDraftTitle] = useState(""),
    [draftBody, setDraftBody] = useState(safeAttach),
    [replyBody, setReplyBody] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0),
    [report, setReport] = useState<{
      targetType: string;
      targetId: string;
    } | null>(null),
    [guestDelete, setGuestDelete] = useState<{
      targetType: "post" | "comment";
      targetId: string;
    } | null>(null);
  const [blocks, setBlocks] = useState<{ id: string; displayName: string }[]>(
      [],
    ),
    [reports, setReports] = useState<Report[]>([]),
    [admin, setAdmin] = useState(false);
  const [translations, setTranslations] = useState<
    Record<string, { title?: string | null; body: string; show: boolean; provider?: string }>
  >({});
  const [translatingKey, setTranslatingKey] = useState<string | null>(null);
  const [translateError, setTranslateError] = useState<Record<string, string>>({});
  const contentTopRef = useRef<HTMLElement>(null);

  async function toggleTranslate(type: "post" | "comment", id: string) {
    const key = `${type}:${id}:${lang}`;
    const existing = translations[key];
    if (existing) {
      setTranslations((prev) => ({
        ...prev,
        [key]: { ...existing, show: !existing.show },
      }));
      return;
    }
    if (translatingKey === key) return;
    setTranslatingKey(key);
    setTranslateError((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    try {
      const data = await read<{
        title?: string | null;
        body: string;
        provider?: string;
      }>(`/${type === "post" ? "posts" : "comments"}/${encodeURIComponent(id)}/translate?target=${encodeURIComponent(lang)}`);
      setTranslations((prev) => ({
        ...prev,
        [key]: {
          title: data.title,
          body: data.body,
          show: true,
          provider: data.provider,
        },
      }));
    } catch (e) {
      setTranslateError((prev) => ({
        ...prev,
        [key]: e instanceof Error ? e.message : "Translation failed",
      }));
    } finally {
      setTranslatingKey(null);
    }
  }

  const vpnNoticeTitle = t.vpnTitle;
  const vpnNoticeBody = t.vpnBody;

  async function toggleLike(postId: string) {
    if (!member) {
      window.dispatchEvent(new Event("econorank-open-login"));
      return;
    }
    try {
      const res = await mutate<{ liked: boolean; likeCount: number }>(
        `/posts/${encodeURIComponent(postId)}/like`,
        "POST",
      );
      setFeed((prev) => ({
        ...prev,
        items: prev.items.map((p) =>
          p.id === postId
            ? { ...p, liked: res.liked, likeCount: res.likeCount }
            : p,
        ),
      }));
      setThread((prev) =>
        prev && prev.post.id === postId
          ? {
              ...prev,
              post: { ...prev.post, liked: res.liked, likeCount: res.likeCount },
            }
          : prev,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    }
  }

  useEffect(() => {
    const syncMember = () =>
      read<Member>("/auth/me")
        .then(setMember)
        .catch(() => setMember(null));
    syncMember();
    window.addEventListener("econorank-auth-change", syncMember);
    read<{ countryCode?: string | null }>("/geo")
      .then((g) => setGeoCountry(g?.countryCode ?? null))
      .catch(() => {});
    const authErr = new URLSearchParams(window.location.search).get("authError");
    if (authErr === "google_not_configured") {
      setError(
        lang === "ko"
          ? "Google 로그인이 아직 설정되지 않았습니다. (GOOGLE_CLIENT_ID / SECRET 입력 필요)"
          : "Google Sign-In is not configured yet.",
      );
    } else if (authErr === "google_failed") {
      setError(
        lang === "ko"
          ? "Google 로그인에 실패했습니다. 다시 시도해 주세요."
          : "Google Sign-In failed. Please try again.",
      );
    }
    return () =>
      window.removeEventListener("econorank-auth-change", syncMember);
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const task = selected
      ? read<{ post: Post; comments: Comment[] }>(
          `/posts/${encodeURIComponent(selected)}`,
        ).then((data) => {
          if (!cancelled) setThread(data);
        })
      : read<Feed>(
          `/posts?space=global&page=${page}&size=20&sort=${sort}`,
        ).then((data) => {
          if (!cancelled) {
            setFeed(data);
            setThread(null);
          }
        });
    task
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, sort, selected, revision, member]);

  function startTopicWith(tokens: string[], suggestedTitle = "") {
    if (selected) openPost(null);
    setWriting(true);
    if (suggestedTitle) setDraftTitle(suggestedTitle);
    const block = tokens.map((tok) => `[[stat:${tok}]]`).join("\n") + "\n\n";
    setDraftBody((prev) =>
      prev.trim() ? `${prev.trimEnd()}\n${block}` : block,
    );
    setTimeout(() => {
      contentTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 30);
  }

  const visibleFeedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return feed.items;
    return feed.items.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q),
    );
  }, [feed.items, searchQuery]);

  const quickTopics = [
    {
      label: isKo
        ? "🇰🇷 한국 vs 🇯🇵 일본 1인당 GDP"
        : isJa
          ? "🇯🇵 日本 vs 🇰🇷 韓国 1人当たりGDP"
          : "🇰🇷 Korea vs 🇯🇵 Japan GDP per capita",
      title: isKo
        ? `${gdpYear}년 한국 vs 일본 1인당 GDP 비교`
        : isJa
          ? `${gdpYear}年 日本 vs 韓国 1人当たりGDP比較`
          : `Korea vs Japan GDP per capita (${gdpYear})`,
      tokens: [`country:KOR:gdppc:${gdpYear}`, `country:JPN:gdppc:${gdpYear}`],
    },
    {
      label: isKo
        ? "📈 삼성전자 vs SK하이닉스 시총"
        : isJa
          ? "📈 Samsung vs SK Hynix 時価総額"
          : "📈 Apple vs Nvidia Market Cap",
      title: isKo
        ? "삼성전자 vs SK하이닉스 실시간 시가총액"
        : isJa
          ? "Samsung vs SK Hynix 時価総額比較"
          : "Apple vs Nvidia live market cap",
      tokens: isKo || isJa
        ? ["company:005930.KS", "company:000660.KS"]
        : ["company:AAPL", "company:NVDA"],
    },
    {
      label: isKo
        ? "🇺🇸 미국 vs 🇨🇳 중국 명목 GDP"
        : isJa
          ? "🇺🇸 米国 vs 🇨🇳 中国 名目GDP"
          : "🇺🇸 US vs 🇨🇳 China Nominal GDP",
      title: isKo
        ? `${gdpYear}년 미국 vs 중국 GDP 격차 전망`
        : isJa
          ? `${gdpYear}年 米国 vs 中国 GDP推移`
          : `US vs China Nominal GDP outlook (${gdpYear})`,
      tokens: [`country:USA:gdp:${gdpYear}`, `country:CHN:gdp:${gdpYear}`],
    },
  ];

  useEffect(() => {
    if (member) {
      read<{ id: string; displayName: string }[]>("/blocks")
        .then(setBlocks)
        .catch(() => {});
    } else setBlocks([]);
  }, [member, revision]);

  useEffect(() => {
    if (admin && member?.role === "ADMIN")
      read<Report[]>("/admin/reports")
        .then(setReports)
        .catch((e) => setError(e.message));
  }, [admin, member, revision]);

  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      setRevision((r) => r + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const onPopState = () => {
      const nextPost = new URLSearchParams(window.location.search).get("post");
      setSelected(nextPost);
      if (!nextPost) setThread(null);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function openPost(id: string | null) {
    setSelected(id);
    setThread(null);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("post", id);
    else url.searchParams.delete("post");
    window.history.pushState({ post: id }, "", url);
    contentTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function authenticate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    await run(async () => {
      const value = await mutate<Member>(`/auth/${auth}`, "POST", {
        email: data.get("email"),
        password: data.get("password"),
        ...(auth === "register"
          ? { displayName: data.get("displayName") }
          : {}),
      });
      setMember(value);
      setAuth(null);
      form.reset();
    });
  }

  function actions(type: "post" | "comment", item: Post | Comment) {
    if (item.anonymous) {
      return (
        <div className="post-actions" onClick={(e) => e.stopPropagation()}>
          <button
            disabled={busy}
            onClick={() =>
              setGuestDelete({ targetType: type, targetId: item.id })
            }
          >
            {t.delete}
          </button>
          {member && (
            <button
              onClick={() =>
                setReport({ targetType: type, targetId: item.id })
              }
            >
              {t.report}
            </button>
          )}
        </div>
      );
    }
    return (
      member && (
        <div className="post-actions" onClick={(e) => e.stopPropagation()}>
          {member.id === item.authorId ? (
            <button
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await mutate(
                    `/${type === "post" ? "posts" : "comments"}/${item.id}`,
                    "DELETE",
                  );
                  if (type === "post") openPost(null);
                })
              }
            >
              {t.delete}
            </button>
          ) : (
            <>
              <button
                onClick={() =>
                  setReport({ targetType: type, targetId: item.id })
                }
              >
                {t.report}
              </button>
              {item.authorId && (
                <button
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await mutate(`/blocks/${item.authorId}`, "POST");
                      openPost(null);
                    })
                  }
                >
                  {t.block}
                </button>
              )}
            </>
          )}
        </div>
      )
    );
  }

  return (
    <>
      <section className="community-hero">
        <div className="community-hero-copy">
          <div className="hero-badge">
            <span className="sync-dot" aria-hidden="true" />
            <span>ECONORANK COMMUNITY</span>
          </div>
          <h1>{t.discussion}</h1>
          <p className="lead">{t.discussionText}</p>
        </div>
        <div className="community-hero-topics">
          <span className="snapshot-kicker">
            {isKo
              ? "원클릭 지표 토론 시작"
              : isJa
                ? "ワンクリックで指標トーク開始"
                : "QUICK DATA TOPICS"}
          </span>
          <div className="quick-topics">
            {quickTopics.map((topic) => (
              <button
                key={topic.label}
                type="button"
                className="quick-topic-btn"
                onClick={() => startTopicWith(topic.tokens, topic.title)}
              >
                <span>{topic.label}</span>
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="community-grid">
        <section className="discussion-content" ref={contentTopRef}>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        {auth && (
          <form className="panel editor" onSubmit={authenticate}>
            <h2>{auth === "login" ? t.signIn : t.register}</h2>
            {auth === "register" && (
              <div className="vpn-notice" role="note">
                <strong>{vpnNoticeTitle}</strong>
                <p>{vpnNoticeBody}</p>
              </div>
            )}
            {auth === "register" && (
              <label>
                {t.displayName}
                <input
                  name="displayName"
                  maxLength={40}
                  required
                  autoComplete="nickname"
                />
              </label>
            )}
            <label>
              {t.email}
              <input
                type="email"
                name="email"
                maxLength={254}
                autoComplete="email"
                required
              />
            </label>
            <label>
              {t.password}
              <input
                type="password"
                name="password"
                minLength={auth === "register" ? 10 : 1}
                maxLength={64}
                autoComplete={
                  auth === "register" ? "new-password" : "current-password"
                }
                required
              />
            </label>
            {auth === "register" && <p className="muted">{t.passwordHint}</p>}
            <div className="hero-actions">
              <button className="button" disabled={busy}>
                {auth === "login" ? t.signIn : t.register}
              </button>
              <button
                type="button"
                className="small-button"
                onClick={() => setAuth(null)}
              >
                {t.cancel}
              </button>
            </div>
          </form>
        )}
        {report && (
          <form
            className="panel editor"
            onSubmit={(e) => {
              e.preventDefault();
              const reason = new FormData(e.currentTarget).get("reason");
              run(async () => {
                await mutate("/reports", "POST", { ...report, reason });
                setReport(null);
                setMessage(t.reportSent);
              });
            }}
          >
            <label>
              {t.reportReason}
              <textarea name="reason" maxLength={500} required />
            </label>
            <div className="hero-actions">
              <button className="button" disabled={busy}>
                {t.submitReport}
              </button>
              <button
                type="button"
                className="small-button"
                onClick={() => setReport(null)}
              >
                {t.cancel}
              </button>
            </div>
          </form>
        )}
        {guestDelete && (
          <form
            className="panel editor"
            onSubmit={(e) => {
              e.preventDefault();
              const guestPassword = new FormData(e.currentTarget).get(
                "guestPassword",
              );
              const { targetType, targetId } = guestDelete;
              run(async () => {
                await mutate(
                  `/guest/${targetType === "post" ? "posts" : "comments"}/${targetId}/delete`,
                  "POST",
                  { guestPassword },
                );
                setGuestDelete(null);
                if (targetType === "post") openPost(null);
              });
            }}
          >
            <h2>{t.guestDeleteTitle}</h2>
            <label>
              {t.guestDeletePrompt}
              <input
                type="password"
                name="guestPassword"
                minLength={4}
                maxLength={32}
                required
              />
            </label>
            <div className="hero-actions">
              <button className="button" disabled={busy}>
                {t.delete}
              </button>
              <button
                type="button"
                className="small-button"
                onClick={() => setGuestDelete(null)}
              >
                {t.cancel}
              </button>
            </div>
          </form>
        )}
        {admin && member?.role === "ADMIN" ? (
          <section className="panel editor">
            <h2>{t.admin}</h2>
            {reports.length === 0 ? (
              <p>{t.noReports}</p>
            ) : (
              reports.map((r) => (
                <article className="report-card" key={r.id}>
                  <span>
                    {r.targetType} · {r.status}
                  </span>
                  <p>{r.reason}</p>
                  <p className="post-body">{r.content}</p>
                  <code>{r.targetId}</code>
                  {r.postId && (
                    <button
                      className="text-button"
                      onClick={() => {
                        setAdmin(false);
                        openPost(r.postId);
                      }}
                    >
                      {t.view}
                    </button>
                  )}
                  {r.status === "OPEN" && (
                    <button
                      className="small-button"
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          await mutate("/admin/hide", "POST", {
                            targetType: r.targetType,
                            targetId: r.targetId,
                          });
                        })
                      }
                    >
                      {t.hide}
                    </button>
                  )}
                </article>
              ))
            )}
          </section>
        ) : (
          <>
            <div className="section-head">
              <h2>{t.global}</h2>
              {selected ? (
                <button className="small-button" onClick={() => openPost(null)}>
                  {t.back}
                </button>
              ) : (
                <button
                  className="button"
                  onClick={() => setWriting(!writing)}
                >
                  {t.write}
                </button>
              )}
            </div>
            {writing && !selected && (
              <form
                className="panel editor"
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  run(async () => {
                    const created = member
                      ? await mutate<{ id: string }>("/posts", "POST", {
                          spaceId: "global",
                          title: data.get("title"),
                          body: draftBody,
                          language: lang,
                        })
                      : await mutate<{ id: string }>("/guest/posts", "POST", {
                          title: data.get("title"),
                          body: draftBody,
                          language: lang,
                          guestName: data.get("guestName") || "",
                          guestPassword: data.get("guestPassword"),
                        });
                    setDraftTitle("");
                    setDraftBody("");
                    setWriting(false);
                    openPost(created.id);
                  });
                }}
              >
                {!member && (
                  <div className="guest-fields">
                    <label>
                      {t.guestNick}
                      <input
                        name="guestName"
                        maxLength={40}
                        placeholder={defaultGuestPlaceholder(geoCountry)}
                      />
                    </label>
                    <label>
                      {t.guestPass}
                      <input
                        type="password"
                        name="guestPassword"
                        minLength={4}
                        maxLength={32}
                        required
                      />
                    </label>
                  </div>
                )}
                <label>
                  {t.title}
                  <input
                    name="title"
                    maxLength={160}
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    required
                  />
                </label>
                <StatPicker
                  lang={lang}
                  onInsert={(token) =>
                    setDraftBody((prev) =>
                      prev ? `${prev.trimEnd()}\n${token}\n` : `${token}\n`,
                    )
                  }
                />
                <label>
                  {t.body}
                  <textarea
                    name="body"
                    maxLength={10000}
                    rows={8}
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                    required
                  />
                </label>
                <button className="button" disabled={busy}>
                  {t.publish}
                </button>
              </form>
            )}
            {loading ? (
              <p role="status">{t.loading}</p>
            ) : selected && thread ? (
              <>
                {(() => {
                  const pKey = `post:${thread.post.id}:${lang}`;
                  const tr = translations[pKey];
                  const showingTr = Boolean(tr?.show);
                  const trErr = translateError[pKey];
                  return (
                    <article className="panel thread">
                      <div className="post-meta post-meta-row">
                        <AuthorTag
                          name={thread.post.author}
                          countryCode={thread.post.authorCountry}
                          anonymous={thread.post.anonymous}
                          lang={lang}
                        />
                        <span>
                          · {new Date(thread.post.createdAt).toLocaleDateString(lang)}
                        </span>
                        {showingTr && (
                          <span className="translated-badge">{t.translatedTag}</span>
                        )}
                      </div>
                      <h2>{showingTr && tr?.title ? tr.title : thread.post.title}</h2>
                      <StatText
                        text={showingTr && tr ? tr.body : thread.post.body}
                        lang={lang}
                      />
                      <div className="translate-bar">
                        <button
                          type="button"
                          className={`like-btn ${thread.post.liked ? "liked" : ""}`}
                          onClick={() => toggleLike(thread.post.id)}
                          aria-pressed={Boolean(thread.post.liked)}
                        >
                          {thread.post.liked ? "♥" : "♡"}{" "}
                          <span className="mono">{thread.post.likeCount ?? 0}</span>
                        </button>
                        <button
                          type="button"
                          className="translate-btn"
                          disabled={translatingKey === pKey}
                          onClick={() => toggleTranslate("post", thread.post.id)}
                        >
                          🌐{" "}
                          {translatingKey === pKey
                            ? t.translating
                            : showingTr
                              ? t.showOriginal
                              : t.translateBtn}
                        </button>
                        {trErr && <span className="translate-error">{trErr}</span>}
                      </div>
                      {actions("post", thread.post)}
                    </article>
                  );
                })()}
                <section className="panel replies">
                  <h3>{t.reply}</h3>
                  {thread.comments.map((c) => {
                    const cKey = `comment:${c.id}:${lang}`;
                    const tr = translations[cKey];
                    const showingTr = Boolean(tr?.show);
                    const trErr = translateError[cKey];
                    return (
                      <article key={c.id}>
                        <div className="post-meta post-meta-row">
                          <AuthorTag
                            name={c.author}
                            countryCode={c.authorCountry}
                            anonymous={c.anonymous}
                            lang={lang}
                          />
                          <span>
                            · {new Date(c.createdAt).toLocaleDateString(lang)}
                          </span>
                          {showingTr && (
                            <span className="translated-badge">{t.translatedTag}</span>
                          )}
                        </div>
                        <StatText text={showingTr && tr ? tr.body : c.body} lang={lang} />
                        <div className="translate-bar">
                          <button
                            type="button"
                            className="translate-btn"
                            disabled={translatingKey === cKey}
                            onClick={() => toggleTranslate("comment", c.id)}
                          >
                            🌐{" "}
                            {translatingKey === cKey
                              ? t.translating
                              : showingTr
                                ? t.showOriginal
                                : t.translateBtn}
                          </button>
                          {trErr && <span className="translate-error">{trErr}</span>}
                        </div>
                        {actions("comment", c)}
                      </article>
                    );
                  })}
                  <p className="muted">{t.commentsLimit}</p>
                  <form
                    className="editor"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const data = new FormData(form);
                      run(async () => {
                        if (member) {
                          await mutate(`/posts/${selected}/comments`, "POST", {
                            body: replyBody,
                          });
                        } else {
                          await mutate(
                            `/guest/posts/${selected}/comments`,
                            "POST",
                            {
                              body: replyBody,
                              guestName: data.get("guestName") || "",
                              guestPassword: data.get("guestPassword"),
                            },
                          );
                        }
                        setReplyBody("");
                        form.reset();
                      });
                    }}
                  >
                    {!member && (
                      <div className="guest-fields">
                        <label>
                          {t.guestNick}
                          <input
                            name="guestName"
                            maxLength={40}
                            placeholder={defaultGuestPlaceholder(geoCountry)}
                          />
                        </label>
                        <label>
                          {t.guestPass}
                          <input
                            type="password"
                            name="guestPassword"
                            minLength={4}
                            maxLength={32}
                            required
                          />
                        </label>
                      </div>
                    )}
                    <StatPicker
                      lang={lang}
                      onInsert={(token) =>
                        setReplyBody((prev) =>
                          prev
                            ? `${prev.trimEnd()}\n${token}\n`
                            : `${token}\n`,
                        )
                      }
                    />
                    <label>
                      {t.reply}
                      <textarea
                        name="body"
                        required
                        maxLength={3000}
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                      />
                    </label>
                    <button className="button" disabled={busy}>
                      {t.send}
                    </button>
                  </form>
                </section>
              </>
            ) : (
              !selected && (
                <>
                  <div className="feed-toolbar">
                    <div className="sort-pills" role="group">
                      <button
                        type="button"
                        className={`sort-pill ${sort === "latest" ? "active" : ""}`}
                        onClick={() => {
                          setSort("latest");
                          setPage(0);
                        }}
                      >
                        {isKo ? "최신순" : isJa ? "新着順" : "Latest"}
                      </button>
                      <button
                        type="button"
                        className={`sort-pill ${sort === "popular" ? "active" : ""}`}
                        onClick={() => {
                          setSort("popular");
                          setPage(0);
                        }}
                      >
                        {isKo ? "인기순" : isJa ? "人気順" : "Popular"}
                      </button>
                    </div>
                    <input
                      type="search"
                      className="feed-search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        isKo
                          ? "제목·내용·작성자 검색..."
                          : isJa
                            ? "タイトル・本文・投稿者を検索..."
                            : "Search posts..."
                      }
                    />
                  </div>

                  <div className="post-feed">
                    {visibleFeedItems.length === 0 ? (
                      <p className="panel editor">{t.noPosts}</p>
                    ) : (
                      visibleFeedItems.map((p) => {
                        const pKey = `post:${p.id}:${lang}`;
                        const tr = translations[pKey];
                        const showingTr = Boolean(tr?.show);
                        const trErr = translateError[pKey];
                        const displayTitle = showingTr && tr?.title ? tr.title : p.title;
                        const displayBody = showingTr && tr ? tr.body : p.body;
                        const statChips = extractStatChips(p.body, lang);
                        const cleanExcerpt = displayBody
                          .replace(/\[\[stat:[^\]]+\]\]/g, "")
                          .replace(/\s+/g, " ")
                          .trim()
                          .slice(0, 180);
                        return (
                          <article
                            className="panel post-card post-card-clickable"
                            key={p.id}
                            onClick={(e) => {
                              if (window.getSelection()?.toString()) return;
                              if ((e.target as HTMLElement).closest("button, a")) return;
                              openPost(p.id);
                            }}
                          >
                            <div className="post-meta post-meta-row">
                              <AuthorTag
                                name={p.author}
                                countryCode={p.authorCountry}
                                anonymous={p.anonymous}
                                lang={lang}
                              />
                              <span>
                                · {new Date(p.createdAt).toLocaleDateString(lang)} ·{" "}
                                {p.language.toUpperCase()}
                              </span>
                              {showingTr && (
                                <span className="translated-badge">{t.translatedTag}</span>
                              )}
                            </div>
                            <h3>
                              <button
                                type="button"
                                className="post-title"
                                onClick={() => openPost(p.id)}
                              >
                                {displayTitle}
                              </button>
                            </h3>
                            {statChips.length > 0 && (
                              <div className="stat-chip-row">
                                {statChips.map((chip, idx) => (
                                  <span key={idx} className="stat-chip mono">
                                    📊 {chip}
                                  </span>
                                ))}
                              </div>
                            )}
                            {cleanExcerpt && (
                              <p className="post-excerpt">{cleanExcerpt}</p>
                            )}
                            <div
                              className="translate-bar"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className={`like-btn ${p.liked ? "liked" : ""}`}
                                onClick={() => toggleLike(p.id)}
                                aria-pressed={Boolean(p.liked)}
                              >
                                {p.liked ? "♥" : "♡"}{" "}
                                <span className="mono">{p.likeCount ?? 0}</span>
                              </button>
                              <span className="comment-count-pill mono">
                                💬 {p.commentCount ?? 0}
                              </span>
                              {p.language !== lang && (
                                <>
                                  <button
                                    type="button"
                                    className="translate-btn"
                                    disabled={translatingKey === pKey}
                                    onClick={() => toggleTranslate("post", p.id)}
                                  >
                                    🌐{" "}
                                    {translatingKey === pKey
                                      ? t.translating
                                      : showingTr
                                        ? t.showOriginal
                                        : t.translateBtn}
                                  </button>
                                  {trErr && (
                                    <span className="translate-error">{trErr}</span>
                                  )}
                                </>
                              )}
                            </div>
                            {actions("post", p)}
                          </article>
                        );
                      })
                    )}
                  </div>
                  <div className="pagination">
                    <button
                      className="small-button"
                      disabled={page === 0}
                      onClick={() => {
                        setPage((p) => p - 1);
                        contentTopRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                    >
                      ← {t.previous}
                    </button>
                    <span>
                      {page + 1} · {feed.total} {t.total}
                    </span>
                    <button
                      className="small-button"
                      disabled={(page + 1) * 20 >= feed.total}
                      onClick={() => {
                        setPage((p) => p + 1);
                        contentTopRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                    >
                      {t.next} →
                    </button>
                  </div>
                </>
              )
            )}
          </>
        )}
        </section>

        <aside className="community-sidebar">
          {topCompanies.length > 0 && (
            <section className="panel mini-board">
              <div className="mini-board-head">
                <div>
                  <p className="eyebrow">LIVE MARKET CAP</p>
                  <h3>
                    {isKo
                      ? "글로벌 시총 TOP 5"
                      : isJa
                        ? "世界時価総額 TOP 5"
                        : "Global Cap Top 5"}
                  </h3>
                </div>
                <Link href={`/${lang}/companies`} className="mini-board-more">
                  {t.all} →
                </Link>
              </div>
              <ol className="mini-board-list">
                {topCompanies.map((c) => (
                  <li key={`${c.rank}-${c.symbol}`} className="mini-board-row">
                    <div className="mini-board-left">
                      <span className="mini-rank mono">
                        {c.rank.toString().padStart(2, "0")}
                      </span>
                      <CompanyLogo symbol={c.symbol} name={c.name} size="sm" />
                      <div className="mini-board-meta">
                        <strong>{c.name}</strong>
                        <small className="mono">{amount(c.marketCap, lang)}</small>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mini-discuss-btn"
                      title={t.discussMetric}
                      onClick={() =>
                        startTopicWith([`company:${c.symbol}`], `${c.name} (${c.symbol}) `)
                      }
                    >
                      + {isKo ? "토론" : isJa ? "議論" : "Post"}
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {topGdp.length > 0 && (
            <section className="panel mini-board">
              <div className="mini-board-head">
                <div>
                  <p className="eyebrow">IMF WEO · {gdpYear}</p>
                  <h3>
                    {isKo
                      ? "세계 GDP TOP 5"
                      : isJa
                        ? "世界GDP TOP 5"
                        : "World GDP Top 5"}
                  </h3>
                </div>
                <Link href={`/${lang}`} className="mini-board-more">
                  {t.all} →
                </Link>
              </div>
              <ol className="mini-board-list">
                {topGdp.map((r) => (
                  <li key={r.code} className="mini-board-row">
                    <Link
                      href={`/${lang}/countries/${r.code}`}
                      className="mini-board-left"
                    >
                      <span className="mini-rank mono">
                        {r.rank.toString().padStart(2, "0")}
                      </span>
                      <CountryFlag code={r.code} size="sm" />
                      <div className="mini-board-meta">
                        <strong>{countryName(r.code, r.name, lang)}</strong>
                        <small className="mono">
                          {metricAmount(r.value, "gdp", lang)}
                        </small>
                      </div>
                    </Link>
                    <button
                      type="button"
                      className="mini-discuss-btn"
                      title={t.discussMetric}
                      onClick={() =>
                        startTopicWith(
                          [`country:${r.code}:gdp:${gdpYear}`],
                          `${countryName(r.code, r.name, lang)} ${gdpYear} GDP `,
                        )
                      }
                    >
                      + {isKo ? "토론" : isJa ? "議論" : "Post"}
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
