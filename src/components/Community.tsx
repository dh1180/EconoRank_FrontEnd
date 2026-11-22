"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { countryName } from "@/lib/geography";
import { dictionary, type Locale } from "@/lib/i18n";
import CountryFlag from "@/components/CountryFlag";
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

export default function Community({
  lang,
  initialPost,
  initialAttach,
}: {
  lang: Locale;
  initialPost: string | null;
  initialAttach?: string | null;
}) {
  const t = dictionary(lang);
  const [member, setMember] = useState<Member | null>(null),
    [geoCountry, setGeoCountry] = useState<string | null>(null),
    [page, setPage] = useState(0);
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
  const contentTopRef = useRef<HTMLElement>(null);

  const vpnNoticeTitle = t.vpnTitle;
  const vpnNoticeBody = t.vpnBody;

  useEffect(() => {
    read<Member>("/auth/me")
      .then(setMember)
      .catch(() => setMember(null));
    read<{ countryCode?: string | null }>("/geo")
      .then((g) => setGeoCountry(g?.countryCode ?? null))
      .catch(() => {});
  }, []);

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
      : read<Feed>(`/posts?space=global&page=${page}&size=20`).then((data) => {
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
  }, [page, selected, revision, member]);

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
    <div className="community-layout">
      <aside>
        <section className="panel account-panel">
          <div className="account-header">
            {member && (
              <span className="avatar-badge" aria-hidden="true">
                {member.displayName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div>
              <h2>{member ? member.displayName : t.account}</h2>
              {member?.countryCode && (
                <span className="member-country-pill">
                  <CountryFlag code={member.countryCode} size="sm" />
                  <span>
                    {countryName(member.countryCode, member.countryCode, lang)}
                  </span>
                </span>
              )}
            </div>
          </div>
          {member ? (
            <>
              <button
                className="small-button"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await mutate("/auth/logout", "POST");
                    setMember(null);
                    setAdmin(false);
                  })
                }
              >
                {t.signOut}
              </button>
              {member.role === "ADMIN" && (
                <button
                  className="small-button"
                  onClick={() => setAdmin(!admin)}
                >
                  {t.admin}
                </button>
              )}
            </>
          ) : (
            <div className="stack">
              <button className="button" onClick={() => setAuth("login")}>
                {t.signIn}
              </button>
              <button
                className="small-button"
                onClick={() => setAuth("register")}
              >
                {t.register}
              </button>
              <p className="muted">{t.loginNeeded}</p>
            </div>
          )}
        </section>

        <section className="panel account-panel">
          <div className="vpn-notice" role="note">
            <strong>{vpnNoticeTitle}</strong>
            <p>{vpnNoticeBody}</p>
          </div>
          <p className="guidelines" style={{ marginTop: 14, marginBottom: 0 }}>
            {t.guidelines}
          </p>
        </section>

        {blocks.length > 0 && (
          <section className="panel account-panel">
            <h3>{t.blocked}</h3>
            {blocks.map((b) => (
              <p key={b.id}>
                {b.displayName}{" "}
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await mutate(`/blocks/${b.id}`, "DELETE");
                    })
                  }
                >
                  {t.unblock}
                </button>
              </p>
            ))}
          </section>
        )}
      </aside>

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
              <h2>{selected ? t.reply : t.global}</h2>
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
                  <input name="title" maxLength={160} required />
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
                  </div>
                  <h2>{thread.post.title}</h2>
                  <StatText text={thread.post.body} lang={lang} />
                  {actions("post", thread.post)}
                </article>
                <section className="panel replies">
                  <h3>{t.reply}</h3>
                  {thread.comments.map((c) => (
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
                      </div>
                      <StatText text={c.body} lang={lang} />
                      {actions("comment", c)}
                    </article>
                  ))}
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
                  <div className="post-feed">
                    {feed.items.length === 0 ? (
                      <p className="panel editor">{t.noPosts}</p>
                    ) : (
                      feed.items.map((p) => (
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
                          </div>
                          <h3>
                            <button
                              type="button"
                              className="post-title"
                              onClick={() => openPost(p.id)}
                            >
                              {p.title}
                            </button>
                          </h3>
                          <p className="post-excerpt">
                            {p.body
                              .replace(/\[\[stat:[^\]]+\]\]/g, t.statCardTag)
                              .slice(0, 180)}
                          </p>
                          {actions("post", p)}
                        </article>
                      ))
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
    </div>
  );
}
