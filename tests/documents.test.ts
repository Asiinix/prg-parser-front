import assert from "node:assert/strict";
import test from "node:test";
import { getDocuments, type StatusFilter } from "../lib/documents";

function demoQuery(status: StatusFilter) {
  return getDocuments({
    query: "",
    page: 1,
    status,
    access: "all",
    formats: [],
    dateFrom: null,
    dateTo: null,
    sort: "updated",
    limit: 25,
  });
}

test("format facets follow the active status while global stats stay stable", async () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;

  try {
    const [all, exported, failed] = await Promise.all([
      demoQuery("all"),
      demoQuery("exported"),
      demoQuery("failed"),
    ]);

    assert.equal(all.stats.formats.html, 10);
    assert.equal(exported.stats.formats.html, 10);
    assert.equal(failed.stats.formats.html, 10);
    assert.equal(all.facets.formats.html, 10);
    assert.equal(exported.facets.formats.html, 10);
    assert.equal(failed.facets.formats.html, 0);
    assert.equal(exported.total, 10);
    assert.equal(failed.total, 2);
  } finally {
    if (previousDatabaseUrl) {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
  }
});
