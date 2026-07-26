import { getDatabase } from "@/lib/documents";
import { prepareDocumentHtml } from "@/lib/html-preview";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ docId: string }> },
) {
  const { docId } = await context.params;
  const sql = getDatabase();
  if (!sql) {
    return Response.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 },
    );
  }

  const rows = await sql<Array<{ content: Uint8Array; encoding: string | null }>>`
    SELECT content, encoding
    FROM document_outputs
    WHERE doc_id = ${docId} AND format = 'html'
    LIMIT 1
  `;
  const output = rows[0];
  if (!output) {
    return new Response("HTML preview is not available", { status: 404 });
  }

  const html = new TextDecoder(output.encoding ?? "utf-8").decode(output.content);
  const preparedHtml = prepareDocumentHtml(html, docId);

  return new Response(preparedHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, max-age=300",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; img-src data: https:; sandbox allow-popups allow-popups-to-escape-sandbox",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
    },
  });
}
