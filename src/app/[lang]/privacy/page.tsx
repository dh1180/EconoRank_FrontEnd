import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const loc = isLocale(lang) ? lang : "en";
  return buildPageMetadata({
    lang: loc,
    path: "/privacy",
    title:
      loc === "ko"
        ? "개인정보처리방침"
        : loc === "ja"
          ? "プライバシーポリシー"
          : "Privacy Policy",
    description:
      loc === "ko"
        ? "EconoRank의 개인정보 수집·이용, Google 로그인, Google Analytics, Google AdSense 쿠키 정책 안내"
        : "EconoRank Privacy Policy covering Google Sign-In, IP country detection, Google Analytics, and Google AdSense cookies.",
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const isKo = lang === "ko";
  const isJa = lang === "ja";

  return (
    <article className="panel legal-doc">
      <p className="eyebrow">ECONORANK · LEGAL</p>
      <h1>
        {isKo
          ? "개인정보처리방침"
          : isJa
            ? "プライバシーポリシー"
            : "Privacy Policy"}
      </h1>
      <p className="muted">
        {isKo
          ? "최종 업데이트: 2026년 11월 24일"
          : isJa
            ? "最終更新日: 2026年11月24日"
            : "Last updated: November 24, 2026"}
      </p>

      {isKo ? (
        <>
          <section>
            <h2>1. 수집하는 개인정보 및 수집 방법</h2>
            <p>
              EconoRank(이하 &quot;서비스&quot;, https://econorank.com)는 별도의 회원가입 없이도 모든 국가 경제 지표 및 글로벌 기업 시가총액 순위를 열람할 수 있습니다. 커뮤니티 기능을 이용할 때 다음의 최소한의 정보를 처리합니다.
            </p>
            <ul>
              <li>
                <strong>Google 로그인(OAuth 2.0)</strong>: Google 계정 고유 식별자(sub), 이메일 주소, 표시 이름(프로필명).
              </li>
              <li>
                <strong>접속 국가 판별</strong>: 최초 가입 시 또는 익명 글·댓글 작성 시 접속 IP 또는 엣지 헤더를 통해 ISO 국가 코드(예: KOR, JPN, USA)를 판별해 국기 표시 및 언어 자동 설정에 활용합니다. 원본 IP 주소는 게시글에 공개되지 않으며 영구 저장하지 않습니다.
              </li>
              <li>
                <strong>익명 작성 시</strong>: 선택 입력한 닉네임과 본인 삭제용 비밀번호(BCrypt 단방향 해시 저장).
              </li>
            </ul>
          </section>

          <section>
            <h2>2. 개인정보의 이용 목적 및 보유 기간</h2>
            <ul>
              <li>커뮤니티 회원 식별, 작성자 국기 표시, 신고·차단 및 악성 스팸 방지.</li>
              <li>회원 탈퇴 또는 삭제 요청 시 관련 계정 정보는 지체 없이 파기합니다.</li>
            </ul>
          </section>

          <section>
            <h2>3. 쿠키, Google Analytics 및 Google AdSense 광고</h2>
            <p>
              본 서비스는 이용 환경 개선 및 무료 운영을 위해 쿠키와 제3자 도구를 사용합니다.
            </p>
            <ul>
              <li>
                <strong>기능 쿠키</strong>: 언어 선택(<code>econorank_lang</code>), 다크모드 설정, 로그인 세션 유지(<code>JSESSIONID</code>).
              </li>
              <li>
                <strong>Google Analytics 4 (GA4)</strong>: 방문 통계 및 페이지 이용 행태 분석을 위해 익명화된 사용 데이터를 수집합니다.
              </li>
              <li>
                <strong>Google AdSense</strong>: Google을 포함한 제3자 광고 사업자는 쿠키를 사용하여 사용자의 이전 방문 기록을 기반으로 맞춤형 광고를 게재할 수 있습니다. 사용자는{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noreferrer"
                >
                  Google 광고 설정
                </a>{" "}
                또는{" "}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noreferrer"
                >
                  aboutads.info
                </a>
                에서 맞춤형 광고를 언제든 해제할 수 있습니다.
              </li>
            </ul>
          </section>

          <section>
            <h2>4. 이용자 권리 및 문의처</h2>
            <p>
              개인정보 열람·정정·삭제 또는 계정 삭제를 원하시는 경우 아래 이메일로 연락해 주시면 신속히 처리하겠습니다.
            </p>
            <p>
              <strong>문의 이메일</strong>: mjdh1936@gmail.com
            </p>
          </section>
        </>
      ) : (
        <>
          <section>
            <h2>1. Information We Collect</h2>
            <p>
              EconoRank (https://econorank.com) allows you to browse global economic rankings and company market capitalizations without creating an account. When you use community features, we process only the minimum necessary information:
            </p>
            <ul>
              <li>
                <strong>Google Sign-In (OAuth 2.0)</strong>: Google account identifier (sub), email address, and display name.
              </li>
              <li>
                <strong>Country Detection</strong>: At sign-up or when posting anonymously, we resolve your ISO country code (e.g. USA, KOR, JPN) from edge headers or IP geolocation to display a country flag and set your default language. Raw IP addresses are not displayed publicly or stored with posts.
              </li>
              <li>
                <strong>Anonymous Posts &amp; Comments</strong>: Optional nickname and a BCrypt-hashed deletion password.
              </li>
            </ul>
          </section>

          <section>
            <h2>2. How We Use Information</h2>
            <ul>
              <li>To authenticate members, display country badges, enable report/block moderation, and prevent abuse.</li>
              <li>You may request deletion of your account and personal data at any time.</li>
            </ul>
          </section>

          <section>
            <h2>3. Cookies, Google Analytics, and Google AdSense</h2>
            <ul>
              <li>
                <strong>Essential Cookies</strong>: Language preference (<code>econorank_lang</code>), theme preference, and HTTP-only session cookies.
              </li>
              <li>
                <strong>Google Analytics 4</strong>: Aggregated traffic and usage analytics to improve site performance.
              </li>
              <li>
                <strong>Google AdSense</strong>: Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to this website or other websites. You may opt out of personalized advertising at{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noreferrer"
                >
                  Google Ads Settings
                </a>{" "}
                or{" "}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noreferrer"
                >
                  aboutads.info
                </a>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2>4. Contact</h2>
            <p>
              For privacy inquiries or data deletion requests, please contact:{" "}
              <strong>mjdh1936@gmail.com</strong>
            </p>
          </section>
        </>
      )}
    </article>
  );
}
