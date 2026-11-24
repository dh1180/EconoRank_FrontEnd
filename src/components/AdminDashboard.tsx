"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";

type MemberInfo = {
  id: string;
  displayName: string;
  role: string;
  countryCode?: string | null;
};

type Overview = {
  membersTotal: number;
  adminsTotal: number;
  postsVisible: number;
  postsHidden: number;
  commentsVisible: number;
  commentsHidden: number;
  likesTotal: number;
  reportsOpen: number;
  translationsCached: number;
  translationProvider: string;
  companiesCount: number;
  companiesUpdatedAt: string | null;
};

type AdminPost = {
  id: string;
  title: string;
  body: string;
  language: string;
  status: string;
  createdAt: string;
  author: string;
  countryCode: string | null;
  anonymous: boolean;
  likeCount: number;
  commentCount: number;
};

type AdminComment = {
  id: string;
  postId: string;
  postTitle: string;
  body: string;
  status: string;
  createdAt: string;
  author: string;
  countryCode: string | null;
  anonymous: boolean;
};

type AdminMember = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  countryCode: string | null;
  createdAt: string;
  postCount: number;
  commentCount: number;
};

type AdminReport = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
  content: string | null;
  postId: string | null;
};

type Tab = "posts" | "comments" | "members" | "reports";

async function csrfHeaders(): Promise<Record<string, string>> {
  const res = await fetch("/api/auth/csrf", { cache: "no-store" });
  if (!res.ok) return {};
  const data = (await res.json()) as { token: string; headerName: string };
  return { [data.headerName]: data.token };
}

function fmtDate(iso: string | null | undefined, lang: Locale) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(lang === "ko" ? "ko-KR" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16);
  }
}

export default function AdminDashboard({ lang }: { lang: Locale }) {
  const ko = lang === "ko";
  const [me, setMe] = useState<MemberInfo | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [postFilter, setPostFilter] = useState("ALL");
  const [postQuery, setPostQuery] = useState("");
  const [commentFilter, setCommentFilter] = useState("ALL");
  const [memberQuery, setMemberQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    const res = await fetch("/api/admin/overview", { cache: "no-store" });
    if (res.ok) setOverview((await res.json()) as Overview);
  }, []);

  const loadPosts = useCallback(async () => {
    const params = new URLSearchParams({ status: postFilter, q: postQuery, limit: "80" });
    const res = await fetch(`/api/admin/posts?${params}`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { items: AdminPost[] };
      setPosts(data.items || []);
    }
  }, [postFilter, postQuery]);

  const loadComments = useCallback(async () => {
    const params = new URLSearchParams({ status: commentFilter, limit: "80" });
    const res = await fetch(`/api/admin/comments?${params}`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { items: AdminComment[] };
      setComments(data.items || []);
    }
  }, [commentFilter]);

  const loadMembers = useCallback(async () => {
    const params = new URLSearchParams({ q: memberQuery, limit: "100" });
    const res = await fetch(`/api/admin/members?${params}`, { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as { items: AdminMember[] };
      setMembers(data.items || []);
    }
  }, [memberQuery]);

  const loadReports = useCallback(async () => {
    const res = await fetch("/api/admin/reports?page=0", { cache: "no-store" });
    if (res.ok) {
      setReports((await res.json()) as AdminReport[]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) setMe((await res.json()) as MemberInfo);
        else setMe(null);
      } catch {
        setMe(null);
      } finally {
        setAuthLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (me?.role !== "ADMIN") return;
    loadOverview();
  }, [me, loadOverview]);

  useEffect(() => {
    if (me?.role !== "ADMIN") return;
    if (tab === "posts") loadPosts();
    else if (tab === "comments") loadComments();
    else if (tab === "members") loadMembers();
    else if (tab === "reports") loadReports();
  }, [me, tab, loadPosts, loadComments, loadMembers, loadReports]);

  async function runAction(
    fn: () => Promise<Response>,
    successMsg: string,
    after: () => Promise<void>,
  ) {
    setBusy(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fn();
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        setError(err.message || (ko ? "요청 처리에 실패했습니다." : "Request failed."));
        return;
      }
      setNotice(successMsg);
      await Promise.all([loadOverview(), after()]);
    } finally {
      setBusy(false);
    }
  }

  async function togglePostStatus(p: AdminPost) {
    const next = p.status === "VISIBLE" ? "HIDDEN" : "VISIBLE";
    await runAction(
      async () =>
        fetch(`/api/admin/posts/${encodeURIComponent(p.id)}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...(await csrfHeaders()) },
          body: JSON.stringify({ status: next }),
        }),
      next === "HIDDEN"
        ? ko
          ? "게시글을 숨김 처리했습니다."
          : "Post hidden."
        : ko
          ? "게시글을 다시 공개했습니다."
          : "Post restored.",
      loadPosts,
    );
  }

  async function removePost(p: AdminPost) {
    if (
      !window.confirm(
        ko
          ? `"${p.title}" 게시글과 댓글·좋아요를 영구 삭제할까요?`
          : `Permanently delete "${p.title}" and its comments?`,
      )
    )
      return;
    await runAction(
      async () =>
        fetch(`/api/admin/posts/${encodeURIComponent(p.id)}`, {
          method: "DELETE",
          headers: await csrfHeaders(),
        }),
      ko ? "게시글을 영구 삭제했습니다." : "Post permanently deleted.",
      loadPosts,
    );
  }

  async function toggleCommentStatus(c: AdminComment) {
    const next = c.status === "VISIBLE" ? "HIDDEN" : "VISIBLE";
    await runAction(
      async () =>
        fetch(`/api/admin/comments/${encodeURIComponent(c.id)}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...(await csrfHeaders()) },
          body: JSON.stringify({ status: next }),
        }),
      next === "HIDDEN"
        ? ko
          ? "댓글을 숨김 처리했습니다."
          : "Comment hidden."
        : ko
          ? "댓글을 다시 공개했습니다."
          : "Comment restored.",
      loadComments,
    );
  }

  async function toggleMemberRole(m: AdminMember) {
    const next = m.role === "ADMIN" ? "USER" : "ADMIN";
    if (
      !window.confirm(
        ko
          ? `${m.displayName} (${m.email}) 권한을 ${next}로 변경할까요?`
          : `Change ${m.displayName} (${m.email}) role to ${next}?`,
      )
    )
      return;
    await runAction(
      async () =>
        fetch(`/api/admin/members/${encodeURIComponent(m.id)}/role`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...(await csrfHeaders()) },
          body: JSON.stringify({ role: next }),
        }),
      ko ? `권한을 ${next}로 변경했습니다.` : `Role updated to ${next}.`,
      loadMembers,
    );
  }

  async function resolveReport(r: AdminReport, status: "RESOLVED" | "DISMISSED") {
    await runAction(
      async () =>
        fetch(`/api/admin/reports/${encodeURIComponent(r.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...(await csrfHeaders()) },
          body: JSON.stringify({ status }),
        }),
      ko ? "신고 상태를 업데이트했습니다." : "Report updated.",
      loadReports,
    );
  }

  async function refreshCompanies() {
    await runAction(
      async () =>
        fetch("/api/admin/refresh/companies", {
          method: "POST",
          headers: await csrfHeaders(),
        }),
      ko ? "글로벌 기업 시총 데이터를 최신화했습니다." : "Company market cap snapshot refreshed.",
      async () => {},
    );
  }

  async function clearTranslations() {
    if (
      !window.confirm(
        ko
          ? "DB에 캐시된 번역 데이터를 모두 초기화할까요?"
          : "Clear all cached translations in the database?",
      )
    )
      return;
    await runAction(
      async () =>
        fetch("/api/admin/translations/cache", {
          method: "DELETE",
          headers: await csrfHeaders(),
        }),
      ko ? "번역 캐시를 초기화했습니다." : "Translation cache cleared.",
      async () => {},
    );
  }

  if (!authLoaded) {
    return (
      <section className="admin-shell">
        <div className="panel" style={{ padding: "2rem", textAlign: "center" }}>
          {ko ? "권한을 확인하는 중..." : "Checking administrator session..."}
        </div>
      </section>
    );
  }

  if (!me || me.role !== "ADMIN") {
    return (
      <section className="admin-shell">
        <div className="panel admin-denied">
          <p className="eyebrow">ECONORANK ADMIN</p>
          <h1>{ko ? "관리자 권한이 필요합니다" : "Administrator access required"}</h1>
          <p className="muted">
            {ko
              ? "이 페이지는 지정된 관리자 계정으로 로그인한 경우에만 접근할 수 있습니다."
              : "Sign in with an authorized administrator account to view this page."}
          </p>
          <div className="admin-denied-actions">
            {!me && (
              <button
                type="button"
                className="btn primary"
                onClick={() => window.dispatchEvent(new Event("econorank-open-login"))}
              >
                {ko ? "로그인" : "Sign in"}
              </button>
            )}
            <Link href={`/${lang}`} className="btn">
              {ko ? "홈으로 돌아가기" : "Back to Home"}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-shell">
      <div className="admin-hero">
        <div>
          <p className="eyebrow" style={{ color: "#7dd3b0" }}>
            ECONORANK ADMIN CONSOLE
          </p>
          <h1>{ko ? "관리자 대시보드" : "Admin Dashboard"}</h1>
          <p className="admin-hero-sub">
            {ko
              ? `${me.displayName}님으로 로그인됨 · 번역 엔진: ${overview?.translationProvider || "—"}`
              : `Signed in as ${me.displayName} · Translation: ${overview?.translationProvider || "—"}`}
          </p>
        </div>
        <div className="admin-hero-actions">
          <button type="button" className="btn" disabled={busy} onClick={refreshCompanies}>
            {ko ? "기업 시총 즉시 갱신" : "Refresh Companies"}
          </button>
          <button type="button" className="btn" disabled={busy} onClick={clearTranslations}>
            {ko ? "번역 캐시 초기화" : "Clear Translation Cache"}
          </button>
        </div>
      </div>

      {notice && <div className="admin-alert ok">{notice}</div>}
      {error && <div className="admin-alert err">{error}</div>}

      {overview && (
        <div className="admin-kpi-grid">
          <div className="panel admin-kpi">
            <span>{ko ? "전체 회원" : "Members"}</span>
            <strong>{overview.membersTotal.toLocaleString()}</strong>
            <small>
              {ko ? `관리자 ${overview.adminsTotal}명` : `${overview.adminsTotal} admins`}
            </small>
          </div>
          <div className="panel admin-kpi">
            <span>{ko ? "게시글" : "Posts"}</span>
            <strong>{overview.postsVisible.toLocaleString()}</strong>
            <small>
              {ko ? `숨김 ${overview.postsHidden}건` : `${overview.postsHidden} hidden`}
            </small>
          </div>
          <div className="panel admin-kpi">
            <span>{ko ? "댓글 · 좋아요" : "Comments & Likes"}</span>
            <strong>{overview.commentsVisible.toLocaleString()}</strong>
            <small>
              {ko
                ? `좋아요 ${overview.likesTotal} · 숨김 ${overview.commentsHidden}`
                : `${overview.likesTotal} likes · ${overview.commentsHidden} hidden`}
            </small>
          </div>
          <div className="panel admin-kpi">
            <span>{ko ? "미처리 신고" : "Open Reports"}</span>
            <strong className={overview.reportsOpen > 0 ? "warn" : ""}>
              {overview.reportsOpen.toLocaleString()}
            </strong>
            <small>
              {ko
                ? `번역 캐시 ${overview.translationsCached}건`
                : `${overview.translationsCached} cached translations`}
            </small>
          </div>
          <div className="panel admin-kpi">
            <span>{ko ? "기업 시총 스냅샷" : "Companies Loaded"}</span>
            <strong>{overview.companiesCount.toLocaleString()}</strong>
            <small>{fmtDate(overview.companiesUpdatedAt, lang)}</small>
          </div>
        </div>
      )}

      <div className="admin-tabs" role="tablist">
        {(
          [
            ["posts", ko ? "게시글 관리" : "Posts"],
            ["comments", ko ? "댓글 관리" : "Comments"],
            ["members", ko ? "회원 관리" : "Members"],
            ["reports", ko ? "신고 관리" : "Reports"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`admin-tab ${tab === key ? "active" : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "posts" && (
        <div className="panel admin-panel">
          <div className="admin-toolbar">
            <div className="admin-filter-group">
              {(["ALL", "VISIBLE", "HIDDEN"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`pill ${postFilter === st ? "active" : ""}`}
                  onClick={() => setPostFilter(st)}
                >
                  {st === "ALL"
                    ? ko
                      ? "전체"
                      : "All"
                    : st === "VISIBLE"
                      ? ko
                        ? "공개"
                        : "Visible"
                      : ko
                        ? "숨김"
                        : "Hidden"}
                </button>
              ))}
            </div>
            <input
              type="search"
              className="admin-search"
              value={postQuery}
              onChange={(e) => setPostQuery(e.target.value)}
              placeholder={ko ? "제목·내용·작성자 검색..." : "Search title, body, author..."}
            />
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{ko ? "상태" : "Status"}</th>
                  <th>{ko ? "제목" : "Title"}</th>
                  <th>{ko ? "작성자" : "Author"}</th>
                  <th>{ko ? "반응" : "Stats"}</th>
                  <th>{ko ? "작성일" : "Created"}</th>
                  <th>{ko ? "관리" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="muted" style={{ textAlign: "center", padding: "2rem" }}>
                      {ko ? "조건에 맞는 게시글이 없습니다." : "No posts found."}
                    </td>
                  </tr>
                ) : (
                  posts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className={`admin-badge ${p.status === "VISIBLE" ? "ok" : "muted"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/${lang}/community/${p.id}`}
                          className="admin-link"
                          target="_blank"
                        >
                          {p.title}
                        </Link>
                      </td>
                      <td>
                        {p.author} {p.anonymous ? (ko ? "(익명)" : "(Guest)") : ""}
                        {p.countryCode ? ` · ${p.countryCode}` : ""}
                      </td>
                      <td>
                        ♥ {p.likeCount} · 💬 {p.commentCount}
                      </td>
                      <td>{fmtDate(p.createdAt, lang)}</td>
                      <td className="admin-row-actions">
                        <button
                          type="button"
                          className="btn small"
                          disabled={busy}
                          onClick={() => togglePostStatus(p)}
                        >
                          {p.status === "VISIBLE"
                            ? ko
                              ? "숨김"
                              : "Hide"
                            : ko
                              ? "복구"
                              : "Restore"}
                        </button>
                        <button
                          type="button"
                          className="btn small danger"
                          disabled={busy}
                          onClick={() => removePost(p)}
                        >
                          {ko ? "삭제" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "comments" && (
        <div className="panel admin-panel">
          <div className="admin-toolbar">
            <div className="admin-filter-group">
              {(["ALL", "VISIBLE", "HIDDEN"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`pill ${commentFilter === st ? "active" : ""}`}
                  onClick={() => setCommentFilter(st)}
                >
                  {st === "ALL"
                    ? ko
                      ? "전체"
                      : "All"
                    : st === "VISIBLE"
                      ? ko
                        ? "공개"
                        : "Visible"
                      : ko
                        ? "숨김"
                        : "Hidden"}
                </button>
              ))}
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{ko ? "상태" : "Status"}</th>
                  <th>{ko ? "댓글 내용" : "Comment"}</th>
                  <th>{ko ? "원글" : "Post"}</th>
                  <th>{ko ? "작성자" : "Author"}</th>
                  <th>{ko ? "작성일" : "Created"}</th>
                  <th>{ko ? "관리" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {comments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="muted" style={{ textAlign: "center", padding: "2rem" }}>
                      {ko ? "댓글이 없습니다." : "No comments found."}
                    </td>
                  </tr>
                ) : (
                  comments.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span className={`admin-badge ${c.status === "VISIBLE" ? "ok" : "muted"}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="admin-clip">{c.body}</td>
                      <td>
                        <Link
                          href={`/${lang}/community/${c.postId}`}
                          className="admin-link"
                          target="_blank"
                        >
                          {c.postTitle}
                        </Link>
                      </td>
                      <td>
                        {c.author} {c.anonymous ? (ko ? "(익명)" : "(Guest)") : ""}
                      </td>
                      <td>{fmtDate(c.createdAt, lang)}</td>
                      <td className="admin-row-actions">
                        <button
                          type="button"
                          className="btn small"
                          disabled={busy}
                          onClick={() => toggleCommentStatus(c)}
                        >
                          {c.status === "VISIBLE"
                            ? ko
                              ? "숨김"
                              : "Hide"
                            : ko
                              ? "복구"
                              : "Restore"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "members" && (
        <div className="panel admin-panel">
          <div className="admin-toolbar">
            <input
              type="search"
              className="admin-search"
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              placeholder={ko ? "이메일·닉네임 검색..." : "Search email or nickname..."}
            />
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{ko ? "권한" : "Role"}</th>
                  <th>{ko ? "닉네임" : "Nickname"}</th>
                  <th>{ko ? "이메일" : "Email"}</th>
                  <th>{ko ? "국가" : "Country"}</th>
                  <th>{ko ? "활동" : "Activity"}</th>
                  <th>{ko ? "가입일" : "Joined"}</th>
                  <th>{ko ? "관리" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <span className={`admin-badge ${m.role === "ADMIN" ? "admin" : "muted"}`}>
                        {m.role}
                      </span>
                    </td>
                    <td>{m.displayName}</td>
                    <td>{m.email}</td>
                    <td>{m.countryCode || "—"}</td>
                    <td>
                      {ko
                        ? `글 ${m.postCount} · 댓글 ${m.commentCount}`
                        : `${m.postCount} posts · ${m.commentCount} comments`}
                    </td>
                    <td>{fmtDate(m.createdAt, lang)}</td>
                    <td className="admin-row-actions">
                      <button
                        type="button"
                        className="btn small"
                        disabled={busy || m.id === me.id}
                        onClick={() => toggleMemberRole(m)}
                      >
                        {m.role === "ADMIN"
                          ? ko
                            ? "일반 회원으로"
                            : "Demote"
                          : ko
                            ? "관리자 지정"
                            : "Make Admin"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "reports" && (
        <div className="panel admin-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{ko ? "상태" : "Status"}</th>
                  <th>{ko ? "유형" : "Type"}</th>
                  <th>{ko ? "신고 사유" : "Reason"}</th>
                  <th>{ko ? "대상 내용" : "Target"}</th>
                  <th>{ko ? "접수일" : "Reported"}</th>
                  <th>{ko ? "처리" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="muted" style={{ textAlign: "center", padding: "2rem" }}>
                      {ko ? "접수된 신고가 없습니다." : "No reports found."}
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span className={`admin-badge ${r.status === "OPEN" ? "warn" : "ok"}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>{r.targetType}</td>
                      <td>{r.reason}</td>
                      <td className="admin-clip">
                        {r.postId ? (
                          <Link
                            href={`/${lang}/community/${r.postId}`}
                            className="admin-link"
                            target="_blank"
                          >
                            {r.content || r.targetId}
                          </Link>
                        ) : (
                          r.content || r.targetId
                        )}
                      </td>
                      <td>{fmtDate(r.createdAt, lang)}</td>
                      <td className="admin-row-actions">
                        <button
                          type="button"
                          className="btn small"
                          disabled={busy || r.status === "RESOLVED"}
                          onClick={() => resolveReport(r, "RESOLVED")}
                        >
                          {ko ? "처리 완료" : "Resolve"}
                        </button>
                        <button
                          type="button"
                          className="btn small"
                          disabled={busy || r.status === "DISMISSED"}
                          onClick={() => resolveReport(r, "DISMISSED")}
                        >
                          {ko ? "기각" : "Dismiss"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
