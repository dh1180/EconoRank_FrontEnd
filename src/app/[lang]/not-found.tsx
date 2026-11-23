import Link from "next/link";
export default function NotFound() {
  return (
    <section className="page-heading">
      <h1>404</h1>
      <p>Page not found / 페이지를 찾을 수 없습니다.</p>
      <Link href="/en">EconoRank</Link>
    </section>
  );
}
