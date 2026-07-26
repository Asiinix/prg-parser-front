import { load } from "cheerio";

function safeAnchor(value: string | undefined) {
  if (!value || !/^[A-Za-z][A-Za-z0-9_-]{0,80}$/.test(value)) return null;
  return value;
}

function linkAnchor(href: string, subId: string | undefined) {
  if (subId && subId !== "0") return safeAnchor(`SUB${subId}`);
  const hash = href.includes("#") ? href.split("#").pop() : undefined;
  return safeAnchor(hash);
}

export function prepareDocumentHtml(html: string, currentDocId: string) {
  const $ = load(html);

  $("script, iframe, object, embed, form, base, meta[http-equiv='refresh']").remove();

  $("*").each((_, element) => {
    if (!("attribs" in element)) return;
    Object.keys(element.attribs).forEach((attribute) => {
      if (attribute.toLowerCase().startsWith("on")) {
        $(element).removeAttr(attribute);
      }
    });
  });

  $("[name]").each((_, element) => {
    const name = safeAnchor($(element).attr("name"));
    if (name && !$(element).attr("id")) {
      $(element).attr("id", name);
    }
  });

  $("a").each((_, element) => {
    const link = $(element);
    const href = link.attr("href") ?? "";
    const targetDocId = link.attr("doc-id");
    const anchor = linkAnchor(href, link.attr("sub-id"));

    if (/^\s*(javascript|data):/i.test(href)) {
      link.removeAttr("href");
      link.removeAttr("target");
      return;
    }

    if (!targetDocId) {
      if (/^https?:\/\//i.test(href)) {
        link.attr("target", "_blank");
        link.attr("rel", "noreferrer noopener");
      }
      return;
    }

    if (targetDocId === currentDocId) {
      link.attr("href", anchor ? `#${anchor}` : "#ContentStart");
      link.removeAttr("target");
      link.removeAttr("rel");
    } else {
      const params = new URLSearchParams({ doc: targetDocId });
      if (anchor) params.set("anchor", anchor);
      link.attr("href", `/?${params.toString()}`);
      link.attr("target", "_blank");
      link.attr("rel", "noreferrer noopener");
    }

    link.attr("data-ai-advokat-link", "document");
  });

  $("head").append(`
    <style data-ai-advokat-preview>
      :root { color-scheme: light; }
      html { scroll-behavior: smooth; background: #ffffff; }
      body {
        min-width: 0 !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 18px 20px 36px !important;
        overflow-wrap: anywhere;
        color: #1a211e;
        background: #ffffff !important;
        font-size: 14px;
        line-height: 1.55;
      }
      a { color: #0b7043 !important; text-decoration-thickness: 1px; }
      a:hover { color: #111916 !important; }
      [name], [id^="SUB"] { scroll-margin-top: 18px; }
      table { max-width: 100% !important; }
      img { max-width: 100% !important; height: auto !important; }
    </style>
  `);

  return $.html();
}
