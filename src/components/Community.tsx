"use client";
import { useEffect, useState, type FormEvent } from "react";
import { countryName } from "@/lib/geography";
import { dictionary, type Locale } from "@/lib/i18n";
import type { Country } from "@/lib/api";
type Member = { id: string; displayName: string; role: string };
type Post = {
  id: string;
  title: string;
  body: string;
  language: string;
  author: string;
  authorId: string;
  createdAt: string;
  spaceId: string;
};
type Comment = {
  id: string;
  body: string;
  author: string;
  authorId: string;
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
export default function Community({
  lang,
  countries,
  initialSpace,
  initialPost,
}: {
  lang: Locale;
  countries: Country[];
  initialSpace: string;
  initialPost: string | null;
}) {
  const t = dictionary(lang);
  const [member, setMember] = useState<Member | null>(null),
    [space, setSpace] = useState(initialSpace),
    [page, setPage] = useState(0);
  const [feed, setFeed] = useState<Feed>({ items: [], total: 0 }),
    [selected, setSelected] = useState<string | null>(initialPost),
    [thread, setThread] = useState<{ post: Post; comments: Comment[] } | null>(
      null,
    );
  const [auth, setAuth] = useState<"login" | "register" | null>(null),
    [writing, setWriting] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0),
    [report, setReport] = useState<{
      targetType: string;
      targetId: string;
    } | null>(null);
  const [blocks, setBlocks] = useState<{ id: string; displayName: string }[]>(
      [],
    ),
    [reports, setReports] = useState<Report[]>([]),
    [admin, setAdmin] = useState(false);
  useEffect(() => {
    read<Member>("/auth/me")
      .then(setMember)
      .catch(() => setMember(null));
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
      : read<Feed>(
          `/posts?space=${encodeURIComponent(space)}&page=${page}&size=20`,
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
  }, [space, page, selected, revision, member]);
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
  function openPost(id: string | null) {
    setSelected(id);
    setThread(null);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("post", id);
    else url.searchParams.delete("post");
    window.history.replaceState(null, "", url);
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
    return (
      member && (
        <div className="post-actions">
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
          <h2>{member ? member.displayName : t.account}</h2>
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
          <label htmlFor="space">{t.space}</label>
          <select
            id="space"
            value={space}
            onChange={(e) => {
              setSpace(e.target.value);
              setPage(0);
              openPost(null);
              setWriting(false);
              const url = new URL(window.location.href);
              url.searchParams.set("space", e.target.value);
              window.history.replaceState(null, "", url);
            }}
          >
            <option value="global">{t.global}</option>
            {countries.map((c) => (
              <option key={c.code} value={`country-${c.code}`}>
                {countryName(c.code, c.name, lang)}
              </option>
            ))}
          </select>
          <p className="guidelines">{t.guidelines}</p>
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
      <section className="discussion-content">
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
              <h2>
                {selected
                  ? t.reply
                  : space === "global"
                    ? t.global
                    : countryName(
                        space.replace("country-", ""),
                        countries.find((c) => `country-${c.code}` === space)
                          ?.name || space,
                        lang,
                      )}
              </h2>
              {selected ? (
                <button className="small-button" onClick={() => openPost(null)}>
                  {t.back}
                </button>
              ) : (
                member && (
                  <button
                    className="button"
                    onClick={() => setWriting(!writing)}
                  >
                    {t.write}
                  </button>
                )
              )}
            </div>
            {writing && !selected && member && (
              <form
                className="panel editor"
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  run(async () => {
                    const created = await mutate<{ id: string }>(
                      "/posts",
                      "POST",
                      {
                        spaceId: space,
                        title: data.get("title"),
                        body: data.get("body"),
                        language: lang,
                      },
                    );
                    setWriting(false);
                    openPost(created.id);
                  });
                }}
              >
                <label>
                  {t.title}
                  <input name="title" maxLength={160} required />
                </label>
                <label>
                  {t.body}
                  <textarea name="body" maxLength={10000} rows={8} required />
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
                  <p className="post-meta">
                    {thread.post.author} ·{" "}
                    {new Date(thread.post.createdAt).toLocaleDateString(lang)}
                  </p>
                  <h2>{thread.post.title}</h2>
                  <p className="post-body">{thread.post.body}</p>
                  {actions("post", thread.post)}
                </article>
                <section className="panel replies">
                  <h3>{t.reply}</h3>
                  {thread.comments.map((c) => (
                    <article key={c.id}>
                      <p className="post-meta">
                        {c.author} ·{" "}
                        {new Date(c.createdAt).toLocaleDateString(lang)}
                      </p>
                      <p className="post-body">{c.body}</p>
                      {actions("comment", c)}
                    </article>
                  ))}
                  <p className="muted">{t.commentsLimit}</p>
                  {member && (
                    <form
                      className="editor"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const body = new FormData(form).get("body");
                        run(async () => {
                          await mutate(`/posts/${selected}/comments`, "POST", {
                            body,
                          });
                          form.reset();
                        });
                      }}
                    >
                      <label>
                        {t.reply}
                        <textarea name="body" required maxLength={3000} />
                      </label>
                      <button className="button" disabled={busy}>
                        {t.send}
                      </button>
                    </form>
                  )}
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
                        <article className="panel post-card" key={p.id}>
                          <p className="post-meta">
                            {p.author} ·{" "}
                            {new Date(p.createdAt).toLocaleDateString(lang)} ·{" "}
                            {p.language.toUpperCase()}
                          </p>
                          <h3>
                            <button
                              className="post-title"
                              onClick={() => openPost(p.id)}
                            >
                              {p.title}
                            </button>
                          </h3>
                          <p className="post-excerpt">{p.body.slice(0, 180)}</p>
                          {actions("post", p)}
                        </article>
                      ))
                    )}
                  </div>
                  <div className="pagination">
                    <button
                      className="small-button"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      {t.previous}
                    </button>
                    <span>
                      {page + 1} · {feed.total} {t.total}
                    </span>
                    <button
                      className="small-button"
                      disabled={(page + 1) * 20 >= feed.total}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      {t.next}
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
