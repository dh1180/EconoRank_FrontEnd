import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAlternates,
  buildPageMetadata,
  serializeJsonLd,
  SEO_LOCALES,
} from "../src/lib/seo.ts";

test("buildAlternates emits canonical, x-default, and all popular locales", () => {
  const alt = buildAlternates("ko", "/companies");
  assert.equal(alt.canonical, "/ko/companies");
  assert.equal(alt.languages?.["x-default"], "/en/companies");
  assert.equal(alt.languages?.ko, "/ko/companies");
  assert.equal(alt.languages?.ja, "/ja/companies");
  assert.ok(SEO_LOCALES.length >= 10);
});

test("buildPageMetadata creates OpenGraph and Twitter cards with EconoRank branding", () => {
  const meta = buildPageMetadata({
    lang: "ko",
    path: "/countries/KOR",
    title: "대한민국 (KOR) · 국가 경제 현황",
    description: "대한민국 GDP 및 1인당 GDP 추이",
  });
  assert.equal(meta.openGraph?.siteName, "EconoRank");
  assert.equal(meta.twitter?.card, "summary_large_image");
  assert.equal(meta.alternates?.canonical, "/ko/countries/KOR");
});

test("serializeJsonLd escapes closing script angle brackets safely", () => {
  const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
  assert.ok(!out.includes("</script>"));
  assert.ok(out.includes("\\u003c/script>"));
});
