import test from "node:test";
import assert from "node:assert/strict";
import { countryName, regionName } from "../src/lib/geography.ts";
test("Korean display names cover countries, special economies and regions", () => {
  assert.equal(countryName("KOR", "Korea, Rep.", "ko"), "대한민국");
  assert.equal(countryName("USA", "United States", "ko"), "미국");
  assert.equal(countryName("CHN", "China", "ko"), "중국");
  assert.equal(countryName("JPN", "Japan", "ko"), "일본");
  assert.equal(countryName("CHI", "Channel Islands", "ko"), "채널 제도");
  assert.equal(regionName("East Asia & Pacific", "ko"), "동아시아·태평양");
  assert.equal(
    regionName("Latin America & Caribbean ", "ko"),
    "라틴아메리카·카리브해",
  );
});
test("English display preserves publisher names", () => {
  assert.equal(countryName("KOR", "Korea, Rep.", "en"), "Korea, Rep.");
});
test("World languages localize country names via Intl.DisplayNames", () => {
  assert.notEqual(countryName("USA", "United States", "ja"), "United States");
  assert.notEqual(countryName("KOR", "Korea, Rep.", "ja"), "Korea, Rep.");
  assert.notEqual(countryName("DEU", "Germany", "fr"), "Germany");
  assert.notEqual(countryName("JPN", "Japan", "ar"), "Japan");
});
