import assert from "node:assert/strict";
import test from "node:test";
import { load } from "cheerio";
import { prepareDocumentHtml } from "../lib/html-preview";

const sourceHtml = `
  <html>
    <head></head>
    <body onload="alert('no')">
      <a href="document.html#SUB100" doc-id="1" sub-id="100">Текущий раздел</a>
      <a href="../2/document.html#SUB200" doc-id="2" sub-id="200">Другой документ</a>
      <p><a name="SUB100"></a>Раздел 100</p>
      <script>alert("no")</script>
    </body>
  </html>
`;

test("keeps same-document links inside the preview", () => {
  const $ = load(prepareDocumentHtml(sourceHtml, "1"));
  const link = $("a").filter((_, element) => $(element).text() === "Текущий раздел");

  assert.equal(link.attr("href"), "#SUB100");
  assert.equal(link.attr("target"), undefined);
  assert.equal($("#SUB100").length, 1);
});

test("opens linked documents in a new tab at the referenced anchor", () => {
  const $ = load(prepareDocumentHtml(sourceHtml, "1"));
  const link = $("a").filter((_, element) => $(element).text() === "Другой документ");

  assert.equal(link.attr("href"), "/?doc=2&anchor=SUB200");
  assert.equal(link.attr("target"), "_blank");
  assert.equal(link.attr("rel"), "noreferrer noopener");
});

test("removes executable markup from stored HTML", () => {
  const $ = load(prepareDocumentHtml(sourceHtml, "1"));

  assert.equal($("script").length, 0);
  assert.equal($("body").attr("onload"), undefined);
});
