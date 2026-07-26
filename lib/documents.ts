import postgres from "postgres";

export type StatusFilter = "all" | "exported" | "failed";
export type AccessFilter = "all" | "free" | "restricted";
export type DocumentFormat = "html" | "txt" | "json" | "pdf" | "meta";

export type DocumentRecord = {
  docId: string;
  title: string;
  sourceUrl: string | null;
  status: string;
  isFree: boolean | null;
  pages: number | null;
  formats: DocumentFormat[];
  linkedCount: number;
  updatedAt: string | null;
};

export type DocumentOutput = {
  format: DocumentFormat;
  contentType: string;
  sizeBytes: number;
  sizeLabel: string;
};

export type DocumentDetail = DocumentRecord & {
  error: string | null;
  preview: string | null;
  outputs: DocumentOutput[];
  linkedDocIds: string[];
  paragraphCount: number | null;
  totalSizeBytes: number;
  totalSizeLabel: string;
  fileName: string;
};

type DocumentQuery = {
  query: string;
  page: number;
  status: StatusFilter;
  access: AccessFilter;
  formats: DocumentFormat[];
  dateFrom: string | null;
  dateTo: string | null;
  sort: "updated" | "doc_id" | "title";
  limit: number;
};

export type DocumentResult = {
  documents: DocumentRecord[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  stats: {
    total: number;
    exported: number;
    failed: number;
    formats: Record<"html" | "txt" | "json" | "pdf", number>;
  };
  source: "postgres" | "demo";
};

type RawDocument = {
  doc_id: string;
  title: string | null;
  source_url: string | null;
  status: string;
  is_free: boolean | null;
  pages: number | null;
  formats: string | null;
  linked_count: number | string | null;
  updated_at: Date | string | null;
};

const DEMO_DOCUMENTS: DocumentRecord[] = [
  {
    docId: "1005029",
    title:
      "Конституция Республики Казахстан (принята на республиканском референдуме 30 августа 1995 года)",
    sourceUrl: null,
    status: "exported",
    isFree: true,
    pages: 4,
    formats: ["html", "txt", "json"],
    linkedCount: 18,
    updatedAt: "2026-07-25T13:16:58+00:00",
  },
  {
    docId: "32192970",
    title:
      "Нормативное постановление Конституционного Суда Республики Казахстан от 7 июля 2026 года № 89-НП",
    sourceUrl: null,
    status: "exported",
    isFree: true,
    pages: 1,
    formats: ["html", "txt", "json"],
    linkedCount: 6,
    updatedAt: "2026-07-25T13:16:54+00:00",
  },
  {
    docId: "39608462",
    title:
      "Закон Республики Казахстан от 19 мая 2026 года № 290-VIII «О государственной службе Республики Казахстан»",
    sourceUrl: null,
    status: "exported",
    isFree: true,
    pages: 9,
    formats: ["html", "txt", "json"],
    linkedCount: 12,
    updatedAt: "2026-07-25T13:16:52+00:00",
  },
  {
    docId: "33478302",
    title:
      "Закон Республики Казахстан от 18 ноября 2015 года № 410-V «О противодействии коррупции»",
    sourceUrl: null,
    status: "exported",
    isFree: true,
    pages: 4,
    formats: ["html", "txt", "json"],
    linkedCount: 0,
    updatedAt: "2026-07-25T13:16:49+00:00",
  },
  {
    docId: "1009732",
    title:
      "Конституционный закон Республики Казахстан от 2 ноября 1995 года № 2592 «О всенародном референдуме»",
    sourceUrl: null,
    status: "exported",
    isFree: true,
    pages: 2,
    formats: ["html", "txt", "json"],
    linkedCount: 24,
    updatedAt: "2026-07-25T13:16:46+00:00",
  },
  {
    docId: "36271780",
    title:
      "Закон Республики Казахстан от 25 мая 2020 года № 333-VI «О порядке организации и проведения мирных собраний»",
    sourceUrl: null,
    status: "exported",
    isFree: true,
    pages: 2,
    formats: ["html", "txt", "json"],
    linkedCount: 31,
    updatedAt: "2026-07-25T13:16:45+00:00",
  },
  {
    docId: "30118747",
    title: "Закон Республики Казахстан от 27 июля 2007 года № 319-III «Об образовании»",
    sourceUrl: null,
    status: "exported",
    isFree: true,
    pages: 14,
    formats: ["html", "txt", "json"],
    linkedCount: 27,
    updatedAt: "2026-07-25T13:16:43+00:00",
  },
  {
    docId: "34464437",
    title:
      "Кодекс Республики Казахстан от 7 июля 2020 года № 360-VI «О здоровье народа и системе здравоохранения»",
    sourceUrl: null,
    status: "exported",
    isFree: true,
    pages: 26,
    formats: ["html", "txt", "json"],
    linkedCount: 8,
    updatedAt: "2026-07-25T13:16:34+00:00",
  },
  {
    docId: "32932361",
    title: "Закон Республики Казахстан от 16 ноября 2015 года № 402-V «О благотворительности»",
    sourceUrl: null,
    status: "exported",
    isFree: true,
    pages: 2,
    formats: ["html", "txt", "json"],
    linkedCount: 5,
    updatedAt: "2026-07-25T13:16:18+00:00",
  },
  {
    docId: "34802272",
    title: "Закон Республики Казахстан от 30 декабря 2016 года № 42-VI «О волонтерской деятельности»",
    sourceUrl: null,
    status: "exported",
    isFree: true,
    pages: 1,
    formats: ["html", "txt", "json"],
    linkedCount: 2,
    updatedAt: "2026-07-25T13:16:17+00:00",
  },
  {
    docId: "38034309",
    title: "",
    sourceUrl: null,
    status: "failed",
    isFree: null,
    pages: null,
    formats: [],
    linkedCount: 0,
    updatedAt: "2026-07-25T13:16:56+00:00",
  },
  {
    docId: "38948444",
    title: "",
    sourceUrl: null,
    status: "failed",
    isFree: null,
    pages: null,
    formats: [],
    linkedCount: 0,
    updatedAt: "2026-07-25T13:16:55+00:00",
  },
];

const DEMO_PREVIEW =
  "Настоящий документ представлен в демонстрационном режиме AI Advokat.\n\n" +
  "После подключения DATABASE_URL серверная часть Next.js получает текст, метаданные и доступные форматы непосредственно из PostgreSQL в Railway.\n\n" +
  "Данные подключения не передаются в браузер и остаются внутри production-окружения.";

let sqlClient: ReturnType<typeof postgres> | null = null;

export function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  if (!sqlClient) {
    sqlClient = postgres(databaseUrl, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }
  return sqlClient;
}

function normalizeFormats(value: string | null): DocumentFormat[] {
  if (!value) return [];
  const allowed = new Set<DocumentFormat>(["html", "txt", "json", "pdf", "meta"]);
  return value
    .split(",")
    .map((format) => format.trim().toLowerCase())
    .filter((format): format is DocumentFormat =>
      allowed.has(format as DocumentFormat),
    );
}

function normalizeDocument(row: RawDocument): DocumentRecord {
  return {
    docId: String(row.doc_id),
    title: row.title ?? "",
    sourceUrl: row.source_url,
    status: row.status,
    isFree: row.is_free,
    pages: row.pages,
    formats: normalizeFormats(row.formats),
    linkedCount: Number(row.linked_count ?? 0),
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : row.updated_at,
  };
}

function demoDocuments(input: DocumentQuery): DocumentResult {
  const needle = input.query.toLocaleLowerCase("ru");
  const filtered = DEMO_DOCUMENTS.filter((document) => {
    const matchesQuery =
      !needle ||
      document.title.toLocaleLowerCase("ru").includes(needle) ||
      document.docId.includes(needle);
    const matchesStatus =
      input.status === "all" || document.status === input.status;
    const matchesAccess =
      input.access === "all" ||
      (input.access === "free" && document.isFree === true) ||
      (input.access === "restricted" && document.isFree === false);
    const matchesFormats = input.formats.every((format) =>
      document.formats.includes(format),
    );
    const updatedTime = document.updatedAt
      ? new Date(document.updatedAt).getTime()
      : 0;
    const matchesDateFrom =
      !input.dateFrom ||
      updatedTime >= new Date(`${input.dateFrom}T00:00:00`).getTime();
    const matchesDateTo =
      !input.dateTo ||
      updatedTime < new Date(`${input.dateTo}T23:59:59.999`).getTime();
    return (
      matchesQuery &&
      matchesStatus &&
      matchesAccess &&
      matchesFormats &&
      matchesDateFrom &&
      matchesDateTo
    );
  });
  filtered.sort((left, right) => {
    if (input.sort === "doc_id") {
      return left.docId.localeCompare(right.docId, "ru", { numeric: true });
    }
    if (input.sort === "title") {
      return left.title.localeCompare(right.title, "ru");
    }
    return (
      new Date(right.updatedAt ?? 0).getTime() -
      new Date(left.updatedAt ?? 0).getTime()
    );
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / input.limit));
  const page = Math.min(input.page, totalPages);
  const offset = (page - 1) * input.limit;
  return {
    documents: filtered.slice(offset, offset + input.limit),
    page,
    limit: input.limit,
    total: filtered.length,
    totalPages,
    stats: {
      total: DEMO_DOCUMENTS.length,
      exported: DEMO_DOCUMENTS.filter((item) => item.status === "exported").length,
      failed: DEMO_DOCUMENTS.filter((item) => item.status === "failed").length,
      formats: {
        html: DEMO_DOCUMENTS.filter((item) => item.formats.includes("html")).length,
        txt: DEMO_DOCUMENTS.filter((item) => item.formats.includes("txt")).length,
        json: DEMO_DOCUMENTS.filter((item) => item.formats.includes("json")).length,
        pdf: DEMO_DOCUMENTS.filter((item) => item.formats.includes("pdf")).length,
      },
    },
    source: "demo",
  };
}

export async function getDocuments(input: DocumentQuery): Promise<DocumentResult> {
  const sql = getDatabase();
  if (!sql) return demoDocuments(input);

  const searchCondition = input.query
    ? sql`(
        COALESCE(d.title, '') ILIKE ${`%${input.query}%`}
        OR d.doc_id ILIKE ${`%${input.query}%`}
      )`
    : sql`TRUE`;
  const statusCondition =
    input.status === "all" ? sql`TRUE` : sql`d.status = ${input.status}`;
  const accessCondition =
    input.access === "all"
      ? sql`TRUE`
      : input.access === "free"
        ? sql`d.is_free IS TRUE`
        : sql`d.is_free IS FALSE`;
  const formatsCondition = input.formats.length
    ? sql`NOT EXISTS (
        SELECT 1
        FROM unnest(${sql.array(input.formats)}::text[]) AS wanted(format)
        WHERE NOT EXISTS (
          SELECT 1
          FROM document_outputs AS filtered_output
          WHERE filtered_output.doc_id = d.doc_id
            AND filtered_output.format = wanted.format
        )
      )`
    : sql`TRUE`;
  const dateFromCondition = input.dateFrom
    ? sql`d.updated_at >= ${input.dateFrom}::date`
    : sql`TRUE`;
  const dateToCondition = input.dateTo
    ? sql`d.updated_at < (${input.dateTo}::date + INTERVAL '1 day')`
    : sql`TRUE`;
  const where = sql`
    ${searchCondition}
    AND ${statusCondition}
    AND ${accessCondition}
    AND ${formatsCondition}
    AND ${dateFromCondition}
    AND ${dateToCondition}
  `;
  const orderBy =
    input.sort === "doc_id"
      ? sql`d.doc_id::numeric ASC`
      : input.sort === "title"
        ? sql`COALESCE(d.title, '') ASC, d.doc_id DESC`
        : sql`d.updated_at DESC, d.doc_id DESC`;
  const offset = (input.page - 1) * input.limit;

  try {
    const [rows, countRows, statsRows] = await Promise.all([
      sql<RawDocument[]>`
        SELECT
          d.doc_id,
          d.title,
          d.source_url,
          d.status,
          d.is_free,
          d.pages,
          d.formats,
          d.updated_at,
          (
            SELECT COUNT(*)::int
            FROM document_links AS link_count
            WHERE link_count.doc_id = d.doc_id
          ) AS linked_count
        FROM documents AS d
        WHERE ${where}
        ORDER BY ${orderBy}
        LIMIT ${input.limit}
        OFFSET ${offset}
      `,
      sql<Array<{ total: number }>>`
        SELECT COUNT(*)::int AS total
        FROM documents AS d
        WHERE ${where}
      `,
      sql<
        Array<{
          total: number;
          exported: number;
          failed: number;
          html: number;
          txt: number;
          json: number;
          pdf: number;
        }>
      >`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'exported')::int AS exported,
          COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
          COUNT(*) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM document_outputs
              WHERE document_outputs.doc_id = documents.doc_id
                AND document_outputs.format = 'html'
            )
          )::int AS html,
          COUNT(*) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM document_outputs
              WHERE document_outputs.doc_id = documents.doc_id
                AND document_outputs.format = 'txt'
            )
          )::int AS txt,
          COUNT(*) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM document_outputs
              WHERE document_outputs.doc_id = documents.doc_id
                AND document_outputs.format = 'json'
            )
          )::int AS json,
          COUNT(*) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM document_outputs
              WHERE document_outputs.doc_id = documents.doc_id
                AND document_outputs.format = 'pdf'
            )
          )::int AS pdf
        FROM documents
      `,
    ]);
    const total = Number(countRows[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / input.limit));
    return {
      documents: rows.map(normalizeDocument),
      page: Math.min(input.page, totalPages),
      limit: input.limit,
      total,
      totalPages,
      stats: {
        total: Number(statsRows[0]?.total ?? 0),
        exported: Number(statsRows[0]?.exported ?? 0),
        failed: Number(statsRows[0]?.failed ?? 0),
        formats: {
          html: Number(statsRows[0]?.html ?? 0),
          txt: Number(statsRows[0]?.txt ?? 0),
          json: Number(statsRows[0]?.json ?? 0),
          pdf: Number(statsRows[0]?.pdf ?? 0),
        },
      },
      source: "postgres",
    };
  } catch (error) {
    console.error("PostgreSQL document query failed", error);
    return demoDocuments(input);
  }
}

function humanFileSize(bytes: number) {
  if (!bytes) return "0 Б";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export async function getDocumentDetail(
  docId: string,
  source: "postgres" | "demo",
): Promise<DocumentDetail | null> {
  if (source === "demo") {
    const document = DEMO_DOCUMENTS.find((item) => item.docId === docId);
    if (!document) return null;
    return {
      ...document,
      error: document.status === "failed" ? "Документ не был экспортирован" : null,
      preview: document.status === "exported" ? DEMO_PREVIEW : null,
      outputs: document.formats.map((format) => ({
        format,
        contentType:
          format === "html"
            ? "text/html"
            : format === "json"
              ? "application/json"
              : "text/plain",
        sizeBytes: 0,
        sizeLabel: "Демо",
      })),
      linkedDocIds: [],
      paragraphCount: document.pages ? document.pages * 24 : null,
      totalSizeBytes: 0,
      totalSizeLabel: "Демо",
      fileName: `${document.docId}.html`,
    };
  }

  const sql = getDatabase();
  if (!sql) return null;

  const rows = await sql<
    Array<
      RawDocument & {
        error: string | null;
        preview: string | null;
        outputs: Array<{
          format: DocumentFormat;
          content_type: string;
          size_bytes: number;
        }> | null;
        linked_doc_ids: string[] | null;
        paragraph_count: number | string | null;
        total_size_bytes: number | string | null;
      }
    >
  >`
    SELECT
      d.doc_id,
      d.title,
      d.source_url,
      d.status,
      d.is_free,
      d.pages,
      d.formats,
      d.updated_at,
      d.error,
      (
        SELECT LEFT(convert_from(output.content, 'UTF8'), 10000)
        FROM document_outputs AS output
        WHERE output.doc_id = d.doc_id AND output.format = 'txt'
        LIMIT 1
      ) AS preview,
      (
        SELECT json_agg(
          json_build_object(
            'format', output.format,
            'content_type', output.content_type,
            'size_bytes', output.size_bytes
          )
          ORDER BY output.format
        )
        FROM document_outputs AS output
        WHERE output.doc_id = d.doc_id
      ) AS outputs,
      (
        SELECT array_agg(linked_doc_id ORDER BY position)
        FROM document_links
        WHERE document_links.doc_id = d.doc_id
      ) AS linked_doc_ids,
      (
        SELECT
          CASE
            WHEN convert_from(meta_output.content, 'UTF8')::jsonb ? 'paragraphs'
            THEN (
              convert_from(meta_output.content, 'UTF8')::jsonb ->> 'paragraphs'
            )::int
            ELSE NULL
          END
        FROM document_outputs AS meta_output
        WHERE meta_output.doc_id = d.doc_id
          AND meta_output.format = 'meta'
        LIMIT 1
      ) AS paragraph_count,
      (
        SELECT COALESCE(SUM(size_bytes), 0)
        FROM document_outputs AS sized_output
        WHERE sized_output.doc_id = d.doc_id
      ) AS total_size_bytes,
      (
        SELECT COUNT(*)::int
        FROM document_links AS link_count
        WHERE link_count.doc_id = d.doc_id
      ) AS linked_count
    FROM documents AS d
    WHERE d.doc_id = ${docId}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  const totalSizeBytes = Number(row.total_size_bytes ?? 0);

  return {
    ...normalizeDocument(row),
    error: row.error,
    preview: row.preview,
    outputs: (row.outputs ?? []).map((output) => ({
      format: output.format,
      contentType: output.content_type,
      sizeBytes: Number(output.size_bytes),
      sizeLabel: humanFileSize(Number(output.size_bytes)),
    })),
    linkedDocIds: row.linked_doc_ids ?? [],
    paragraphCount:
      row.paragraph_count === null ? null : Number(row.paragraph_count),
    totalSizeBytes,
    totalSizeLabel: humanFileSize(totalSizeBytes),
    fileName: `${docId}.html`,
  };
}
