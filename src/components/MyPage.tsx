"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { countryName } from "@/lib/geography";
import { dictionary, type Locale } from "@/lib/i18n";
import CountryFlag from "@/components/CountryFlag";

type Member = {
  id: string;
  displayName: string;
  role: string;
  countryCode?: string | null;
};
type MyPost = {
  id: string;
  title: string;
  body: string;
  language: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
};
type MyComment = {
  id: string;
  postId: string;
  postTitle: string;
  body: string;
  createdAt: string;
};
type LikedPost = {
  id: string;
  title: string;
  body: string;
  language: string;
  author: string;
  authorCountry?: string | null;
  createdAt: string;
  likeCount: number;
};

async function read<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function mutate<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const csrf = await read<{ token: string; headerName: string }>("/auth/csrf");
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      [csrf.headerName]: csrf.token,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      msg = (await res.json()).message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export default function MyPage({ lang }: { lang: Locale }) {
  const t = dictionary(lang);
  const isKo = lang === "ko";
  const isJa = lang === "ja";

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"posts" | "comments" | "likes">("posts");
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [comments, setComments] = useState<MyComment[]>([]);
  const [likes, setLikes] = useState<LikedPost[]>([]);
  const [blocks, setBlocks] = useState<{ id: string; displayName: string }[]>(
    [],
  );
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function loadAll() {
    setLoading(true);
    try {
      const m = await read<Member>("/auth/me");
      setMember(m);
      setNickname(m.displayName);
      const [p, c, l, b] = await Promise.all([
        read<MyPost[]>("/me/posts").catch(() => []),
        read<MyComment[]>("/me/comments").catch(() => []),
        read<LikedPost[]>("/me/likes").catch(() => []),
        read<{ id: string; displayName: string }[]>("/blocks").catch(() => []),
      ]);
      setPosts(p);
      setComments(c);
      setLikes(l);
      setBlocks(b);
    } catch {
      setMember(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    const onAuthChange = () => loadAll();
    window.addEventListener("econorank-auth-change", onAuthChange);
    return () =>
      window.removeEventListener("econorank-auth-change", onAuthChange);
  }, []);

  async function saveNickname(e: FormEvent) {
    e.preventDefault();
    if (saving || !nickname.trim()) return;
    setSaving(true);
    setNotice("");
    setError("");
    try {
      const updated = await mutate<Member>("/auth/me", "PATCH", {
        displayName: nickname.trim(),
      });
      setMember(updated);
      setNickname(updated.displayName);
      setNotice(
        isKo
          ? "닉네임이 변경되었습니다."
          : isJa
            ? "ニックネームを変更しました。"
            : "Nickname updated.",
      );
      window.dispatchEvent(new Event("econorank-auth-change"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function unblock(id: string) {
    try {
      await mutate(`/blocks/${id}`, "DELETE");
      setBlocks((prev) => prev.filter((b) => b.id !== id));
    } catch {}
  }

  const pageTitle = t.myPage;

  if (loading) {
    return (
      <section className="mypage-wrap">
        <p className="notice">{t.loading}</p>
      </section>
    );
  }

  if (!member) {
    return (
      <section className="mypage-wrap">
        <div className="panel mypage-login-card">
          <p className="eyebrow">ECONORANK · ACCOUNT</p>
          <h1>{pageTitle}</h1>
          <p className="muted">
            {isKo
              ? "Google 계정으로 로그인하면 닉네임 변경, 내가 쓴 글·댓글, 좋아요 누른 글을 한곳에서 관리할 수 있습니다."
              : isJa
                ? "Googleでログインすると、ニックネーム変更・投稿・コメント・いいねした投稿を管理できます。"
                : "Sign in with Google to customize your nickname and manage your posts, comments, and liked discussions."}
          </p>
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
              {isKo
                ? "Google로 계속하기"
                : isJa
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
      </section>
    );
  }

  return (
    <section className="mypage-wrap">
      <div className="page-heading" style={{ paddingTop: 8 }}>
        <p className="eyebrow">ECONORANK · ACCOUNT</p>
        <h1>{pageTitle}</h1>
      </div>

      <div className="panel mypage-profile">
        <div className="mypage-profile-head">
          <span className="avatar-badge mypage-avatar" aria-hidden="true">
            {member.displayName.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <h2>{member.displayName}</h2>
            {member.countryCode && (
              <span className="member-country-pill">
                <CountryFlag code={member.countryCode} size="sm" />
                <span>
                  {countryName(member.countryCode, member.countryCode, lang)}
                </span>
              </span>
            )}
          </div>
        </div>

        <form className="mypage-nick-form" onSubmit={saveNickname}>
          <label>
            {t.editNickname}
            <div className="mypage-nick-row">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={40}
                required
              />
              <button className="button" disabled={saving}>
                {t.save}
              </button>
            </div>
          </label>
        </form>

        {notice && <p className="notice">{notice}</p>}
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}

        <div className="vpn-notice" role="note">
          <strong>{t.vpnTitle}</strong>
          <p>{t.vpnBody}</p>
        </div>
      </div>

      <div className="panel mypage-activity">
        <div className="tabs-bar" style={{ paddingTop: 18 }}>
          <div className="tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "posts"}
              className={`tab-btn ${tab === "posts" ? "active" : ""}`}
              onClick={() => setTab("posts")}
            >
              {`${t.myPostsTab} (${posts.length})`}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "comments"}
              className={`tab-btn ${tab === "comments" ? "active" : ""}`}
              onClick={() => setTab("comments")}
            >
              {`${t.myCommentsTab} (${comments.length})`}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "likes"}
              className={`tab-btn ${tab === "likes" ? "active" : ""}`}
              onClick={() => setTab("likes")}
            >
              {`${t.likedPostsTab} (${likes.length})`}
            </button>
          </div>
        </div>

        <div className="mypage-list">
          {tab === "posts" &&
            (posts.length === 0 ? (
              <p className="muted mypage-empty">
                {isKo
                  ? "아직 작성한 게시글이 없습니다."
                  : isJa
                    ? "まだ投稿がありません。"
                    : "You haven't written any posts yet."}
              </p>
            ) : (
              posts.map((p) => (
                <Link
                  key={p.id}
                  href={`/${lang}/community?post=${p.id}`}
                  className="mypage-item"
                >
                  <div className="mypage-item-top">
                    <strong>{p.title}</strong>
                    <span className="muted mono">
                      ♥ {p.likeCount} · 💬 {p.commentCount} ·{" "}
                      {new Date(p.createdAt).toLocaleDateString(lang)}
                    </span>
                  </div>
                  <p className="post-excerpt">
                    {p.body
                      .replace(/\[\[stat:[^\]]+\]\]/g, t.statCardTag)
                      .slice(0, 140)}
                  </p>
                </Link>
              ))
            ))}

          {tab === "comments" &&
            (comments.length === 0 ? (
              <p className="muted mypage-empty">
                {isKo
                  ? "아직 작성한 댓글이 없습니다."
                  : isJa
                    ? "まだコメントがありません。"
                    : "You haven't written any comments yet."}
              </p>
            ) : (
              comments.map((c) => (
                <Link
                  key={c.id}
                  href={`/${lang}/community?post=${c.postId}`}
                  className="mypage-item"
                >
                  <div className="mypage-item-top">
                    <span className="mypage-comment-post">{c.postTitle}</span>
                    <span className="muted mono">
                      {new Date(c.createdAt).toLocaleDateString(lang)}
                    </span>
                  </div>
                  <p className="post-excerpt">
                    {c.body
                      .replace(/\[\[stat:[^\]]+\]\]/g, t.statCardTag)
                      .slice(0, 160)}
                  </p>
                </Link>
              ))
            ))}

          {tab === "likes" &&
            (likes.length === 0 ? (
              <p className="muted mypage-empty">
                {isKo
                  ? "아직 좋아요를 누른 글이 없습니다."
                  : isJa
                    ? "まだいいねした投稿がありません。"
                    : "You haven't liked any posts yet."}
              </p>
            ) : (
              likes.map((p) => (
                <Link
                  key={p.id}
                  href={`/${lang}/community?post=${p.id}`}
                  className="mypage-item"
                >
                  <div className="mypage-item-top">
                    <strong>{p.title}</strong>
                    <span className="muted mono">
                      ♥ {p.likeCount} ·{" "}
                      {new Date(p.createdAt).toLocaleDateString(lang)}
                    </span>
                  </div>
                  <div className="post-meta post-meta-row" style={{ margin: 0 }}>
                    {p.authorCountry && (
                      <CountryFlag code={p.authorCountry} size="sm" />
                    )}
                    <span>{p.author}</span>
                  </div>
                </Link>
              ))
            ))}
        </div>
      </div>

      {blocks.length > 0 && (
        <div className="panel mypage-profile">
          <h3>{t.blocked}</h3>
          <div className="stack">
            {blocks.map((b) => (
              <p key={b.id} style={{ margin: 0 }}>
                {b.displayName}{" "}
                <button
                  type="button"
                  className="text-button"
                  onClick={() => unblock(b.id)}
                >
                  {t.unblock}
                </button>
              </p>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
