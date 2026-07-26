import { getDatabase, type DocumentFormat } from "@/lib/documents";

export const dynamic = "force-dynamic";

const allowedFormats = new Set<DocumentFormat>([
  "html",
  "txt",
  "json",
  "pdf",
  "meta",
]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ docId: string; format: string }> },
) {
  const { docId, format } = await context.params;
  if (!allowedFormats.has(format as DocumentFormat)) {
    return Response.json({ error: "Unsupported format" }, { status: 400 });
  }

  const sql = getDatabase();
  if (!sql) {
    return Response.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503 },
    );
  }

  const rows = await sql<
    Array<{
      content: Uint8Array;
      content_type: string;
      encoding: string | null;
    }>
  >`
    SELECT content, content_type, encoding
    FROM document_outputs
    WHERE doc_id = ${docId} AND format = ${format}
    LIMIT 1
  `;
  const output = rows[0];
  if (!output) {
    return Response.json({ error: "Output not found" }, { status: 404 });
  }

  const extension = format === "meta" ? "json" : format;
  const contentType = output.encoding
    ? `${output.content_type}; charset=${output.encoding}`
    : output.content_type;

  return new Response(output.content as BodyInit, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${docId}.${extension}"`,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
