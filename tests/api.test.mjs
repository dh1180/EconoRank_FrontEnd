import test from "node:test";
import assert from "node:assert/strict";
import {
  integer,
  metricOf,
  comparisonCodes,
  amount,
  api,
} from "../src/lib/api.ts";
test("untrusted URL filters cannot create invalid API requests", () => {
  assert.equal(integer("-1", 0, 0, 10000), 0);
  assert.equal(integer("Infinity", 2024, 1960, 2100), 2024);
  assert.equal(integer("2024.1", 2024, 1960, 2100), 2024);
  assert.equal(metricOf("gdp&size=999"), "gdp");
  assert.deepEqual(
    comparisonCodes(["USA", "USA", "KOR", "<script>", "us", ""]),
    ["USA", "KOR"],
  );
});
test("missing values remain distinct from zero in both languages", () => {
  for (const locale of ["en", "ko"]) {
    assert.equal(amount(undefined, locale), "—");
    assert.notEqual(amount(0, locale), "—");
    assert.notEqual(amount(1_000_000_000_000, locale), "—");
  }
});
test("API failures are explicit and do not substitute fabricated data", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response("{}", { status: 503 });
    await assert.rejects(api("/rankings"), /503/);
  } finally {
    globalThis.fetch = original;
  }
});
