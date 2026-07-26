import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Eye,
  File,
  FileCode2,
  FileJson,
  Files,
  HardDrive,
  Info,
  Link2,
  List,
  MoreVertical,
  RotateCcw,
  Scale,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import {
  AutoSubmitForm,
  CopyButton,
  FavoriteButton,
  RefreshButton,
} from "@/components/client-actions";
import { ResizableWorkspace } from "@/components/resizable-workspace";
import {
  getDocumentDetail,
  getDocuments,
  type AccessFilter,
  type DocumentFormat,
  type DocumentRecord,
  type DocumentResult,
  type StatusFilter,
} from "@/lib/documents";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Advokat",
  description: "Реестр правовых документов Казахстана",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type SortMode = "updated" | "doc_id" | "title";
type QueryValue = string | number | string[] | null;

const FILTER_FORMATS = ["html", "txt", "json", "pdf"] as const;
const PAGE_SIZES = [10, 25, 50, 100];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function all(value: string | string[] | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function isStatusFilter(value: string | undefined): value is StatusFilter {
  return value === "all" || value === "exported" || value === "failed";
}

function isAccessFilter(value: string | undefined): value is AccessFilter {
  return value === "all" || value === "free" || value === "restricted";
}

function isSortMode(value: string | undefined): value is SortMode {
  return value === "updated" || value === "doc_id" || value === "title";
}

function isFilterFormat(value: string): value is (typeof FILTER_FORMATS)[number] {
  return FILTER_FORMATS.includes(value as (typeof FILTER_FORMATS)[number]);
}

function normalizeDate(value: string | undefined) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function normalizeAnchor(value: string | undefined) {
  if (!value || !/^[A-Za-z][A-Za-z0-9_-]{0,80}$/.test(value)) return null;
  return value;
}

function pageHref(current: URLSearchParams, changes: Record<string, QueryValue>) {
  const params = new URLSearchParams(current);
  Object.entries(changes).forEach(([key, value]) => {
    params.delete(key);
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value !== null && value !== "" && value !== "all") {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function formatDateTime(value: string | null) {
  if (!value) return { date: "—", time: "" };
  const date = new Date(value);
  return {
    date: new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

function statusLabel(status: string) {
  if (status === "exported") return "exported";
  if (status === "failed") return "failed";
  if (status === "processing") return "processing";
  return status || "unknown";
}

function visibleFormats(formats: DocumentFormat[]) {
  return formats.filter((format) => FILTER_FORMATS.includes(format as never));
}

function paginationItems(page: number, totalPages: number) {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const ordered = [...pages]
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((left, right) => left - right);
  const result: Array<number | "ellipsis"> = [];
  ordered.forEach((item, index) => {
    if (index > 0 && item - ordered[index - 1] > 1) result.push("ellipsis");
    result.push(item);
  });
  return result;
}

function hiddenFilterInputs({
  query,
  status,
  formats,
  dateFrom,
  dateTo,
  limit,
  sort,
}: {
  query: string;
  status: StatusFilter;
  formats: DocumentFormat[];
  dateFrom: string | null;
  dateTo: string | null;
  limit: number;
  sort: SortMode;
}) {
  return (
    <>
      {query ? <input type="hidden" name="q" value={query} /> : null}
      {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
      {formats.map((format) => (
        <input type="hidden" name="format" value={format} key={format} />
      ))}
      {dateFrom ? <input type="hidden" name="from" value={dateFrom} /> : null}
      {dateTo ? <input type="hidden" name="to" value={dateTo} /> : null}
      {limit !== 25 ? <input type="hidden" name="limit" value={limit} /> : null}
      {sort !== "updated" ? <input type="hidden" name="sort" value={sort} /> : null}
    </>
  );
}

function FormatTag({ format }: { format: DocumentFormat }) {
  return (
    <span className={`format-tag format-${format}`}>
      {format === "meta" ? "META" : format.toUpperCase()}
    </span>
  );
}

function DocumentRow({
  document,
  active,
  current,
  source,
}: {
  document: DocumentRecord;
  active: boolean;
  current: URLSearchParams;
  source: "postgres" | "demo";
}) {
  const date = formatDateTime(document.updatedAt);
  const detailHref = pageHref(current, {
    doc: document.docId,
    panel: null,
    anchor: null,
  });

  return (
    <div className={`document-row${active ? " is-active" : ""}`}>
      <Link className="doc-id-link" href={detailHref}>
        {document.docId}
      </Link>
      <Link className="document-title" href={detailHref}>
        {document.title || "Документ без названия"}
      </Link>
      <span className={`status status-${document.status}`}>
        {statusLabel(document.status)}
      </span>
      <span className="format-list" aria-label="Форматы">
        {visibleFormats(document.formats).map((format) => (
          <FormatTag format={format} key={format} />
        ))}
      </span>
      <span className="links-count">{document.linkedCount}</span>
      <span className="updated-cell">
        <span>{date.date}</span>
        <small>{date.time}</small>
      </span>
      <span className="row-actions">
        <Link
          className="icon-button"
          href={detailHref}
          title="Открыть карточку"
          aria-label={`Открыть документ ${document.docId}`}
        >
          <Eye aria-hidden="true" size={17} />
        </Link>
        <details className="action-menu">
          <summary
            className="icon-button"
            title="Действия"
            aria-label={`Действия с документом ${document.docId}`}
          >
            <MoreVertical aria-hidden="true" size={17} />
          </summary>
          <div className="action-menu-popover">
            <a
              className={source === "demo" ? "is-disabled" : undefined}
              href={
                source === "postgres"
                  ? `/api/documents/${document.docId}/preview`
                  : "#"
              }
              target="_blank"
              rel="noreferrer"
              aria-disabled={source === "demo"}
            >
              <FileCode2 aria-hidden="true" size={15} />
              Открыть HTML
            </a>
            {visibleFormats(document.formats)
              .filter((format) => format !== "html")
              .map((format) => (
                <a
                  className={source === "demo" ? "is-disabled" : undefined}
                  href={
                    source === "postgres"
                      ? `/api/documents/${document.docId}/outputs/${format}`
                      : "#"
                  }
                  aria-disabled={source === "demo"}
                  key={format}
                >
                  <ArrowDownToLine aria-hidden="true" size={15} />
                  Скачать {format.toUpperCase()}
                </a>
              ))}
          </div>
        </details>
      </span>
    </div>
  );
}

function DetailPanel({
  detail,
  source,
  anchor,
  current,
}: {
  detail: Awaited<ReturnType<typeof getDocumentDetail>>;
  source: "postgres" | "demo";
  anchor: string | null;
  current: URLSearchParams;
}) {
  if (!detail) {
    return (
      <aside className="detail-panel empty-detail" id="detail-panel">
        <Files aria-hidden="true" size={26} />
        <strong>Документ не выбран</strong>
        <span>Откройте карточку из реестра.</span>
      </aside>
    );
  }

  const date = formatDateTime(detail.updatedAt);
  const outputs = new Map(detail.outputs.map((output) => [output.format, output]));
  const htmlHref =
    source === "postgres" ? `/api/documents/${detail.docId}/preview` : "#";

  return (
    <aside className="detail-panel" id="detail-panel">
      <div className="detail-topline">
        <Link
          className="icon-button close-detail"
          href={pageHref(current, {
            doc: null,
            panel: "closed",
            anchor: null,
          })}
          title="Закрыть карточку"
          aria-label="Закрыть карточку"
        >
          <X aria-hidden="true" size={18} />
        </Link>
      </div>

      <div className="detail-heading">
        <h2>{detail.title || "Документ без названия"}</h2>
        <FavoriteButton docId={detail.docId} />
      </div>

      <div className="detail-id">
        <span>doc_id:</span>
        <strong>{detail.docId}</strong>
        <CopyButton value={detail.docId} label="Скопировать doc_id" />
      </div>

      <dl className="detail-facts">
        <div>
          <dt><CircleCheck aria-hidden="true" size={17} />Статус:</dt>
          <dd><span className={`status status-${detail.status}`}>{statusLabel(detail.status)}</span></dd>
        </div>
        <div>
          <dt><Files aria-hidden="true" size={17} />Форматы:</dt>
          <dd className="format-list">
            {visibleFormats(detail.formats).map((format) => (
              <FormatTag format={format} key={format} />
            ))}
          </dd>
        </div>
        <div>
          <dt><List aria-hidden="true" size={17} />Параграфов:</dt>
          <dd>{detail.paragraphCount ?? "—"}</dd>
        </div>
        <div>
          <dt><Link2 aria-hidden="true" size={17} />Связи:</dt>
          <dd className="linked-docs">
            {detail.linkedDocIds.slice(0, 3).map((linkedDocId) => (
              <Link
                href={pageHref(current, {
                  doc: linkedDocId,
                  panel: null,
                  anchor: null,
                })}
                key={linkedDocId}
              >
                {linkedDocId}
              </Link>
            ))}
            {detail.linkedDocIds.length > 3 ? (
              <span>+{detail.linkedDocIds.length - 3}</span>
            ) : null}
            {detail.linkedDocIds.length === 0 ? <span>0</span> : null}
          </dd>
        </div>
        <div>
          <dt><CalendarDays aria-hidden="true" size={17} />Обновлено:</dt>
          <dd>{date.date} {date.time}</dd>
        </div>
        <div>
          <dt><File aria-hidden="true" size={17} />Файл:</dt>
          <dd className="file-value">
            <span>{detail.fileName}</span>
            <CopyButton value={detail.fileName} label="Скопировать имя файла" />
          </dd>
        </div>
        <div>
          <dt><HardDrive aria-hidden="true" size={17} />Размер:</dt>
          <dd>{detail.totalSizeLabel}</dd>
        </div>
      </dl>

      <section className="detail-actions">
        <h3>Действия</h3>
        <div className="detail-action-row">
          <a
            className={`outline-button${source === "demo" ? " is-disabled" : ""}`}
            href={htmlHref}
            target="_blank"
            rel="noreferrer"
            aria-disabled={source === "demo"}
          >
            Открыть HTML
            <ArrowUpRight aria-hidden="true" size={16} />
          </a>
          {(["txt", "json"] as const).map((format) =>
            outputs.has(format) ? (
              <a
                className={`outline-button${source === "demo" ? " is-disabled" : ""}`}
                href={
                  source === "postgres"
                    ? `/api/documents/${detail.docId}/outputs/${format}`
                    : "#"
                }
                aria-disabled={source === "demo"}
                key={format}
              >
                {format.toUpperCase()}
                <ArrowDownToLine aria-hidden="true" size={16} />
              </a>
            ) : null,
          )}
          <details className="action-menu detail-more">
            <summary className="icon-button" title="Ещё" aria-label="Другие действия">
              <MoreVertical aria-hidden="true" size={18} />
            </summary>
            <div className="action-menu-popover">
              {detail.outputs
                .filter((output) => !["html", "txt", "json"].includes(output.format))
                .map((output) => (
                  <a
                    className={source === "demo" ? "is-disabled" : undefined}
                    href={
                      source === "postgres"
                        ? `/api/documents/${detail.docId}/outputs/${output.format}`
                        : "#"
                    }
                    aria-disabled={source === "demo"}
                    key={output.format}
                  >
                    <ArrowDownToLine aria-hidden="true" size={15} />
                    Скачать {output.format.toUpperCase()}
                  </a>
                ))}
              {detail.sourceUrl ? (
                <a href={detail.sourceUrl} target="_blank" rel="noreferrer">
                  <ArrowUpRight aria-hidden="true" size={15} />
                  Открыть источник
                </a>
              ) : null}
            </div>
          </details>
        </div>
      </section>

      <section className="preview-section">
        <h3>Предпросмотр документа</h3>
        {source === "postgres" && outputs.has("html") ? (
          <iframe
            className="html-preview"
            src={`/api/documents/${detail.docId}/preview${
              anchor ? `#${encodeURIComponent(anchor)}` : ""
            }`}
            title={`Предпросмотр документа ${detail.docId}`}
            sandbox="allow-popups allow-popups-to-escape-sandbox"
          />
        ) : (
          <div className="document-preview">
            {detail.preview
              ? detail.preview
                  .split(/\n{2,}/)
                  .slice(0, 12)
                  .map((paragraph, index) => <p key={index}>{paragraph}</p>)
              : <p>Предпросмотр для этого документа недоступен.</p>}
          </div>
        )}
      </section>

      <details className="additional-details">
        <summary>
          <span>Дополнительно</span>
          <ChevronDown aria-hidden="true" size={17} />
        </summary>
        <dl>
          <div><dt>Доступ</dt><dd>{detail.isFree === false ? "Ограниченный" : "Свободный"}</dd></div>
          <div><dt>Страниц</dt><dd>{detail.pages ?? "—"}</dd></div>
          <div><dt>Связей</dt><dd>{detail.linkedCount}</dd></div>
          {detail.error ? <div><dt>Ошибка</dt><dd>{detail.error}</dd></div> : null}
        </dl>
      </details>
    </aside>
  );
}

function FilterSidebar({
  result,
  query,
  status,
  formats,
  dateFrom,
  dateTo,
  limit,
  sort,
  current,
}: {
  result: DocumentResult;
  query: string;
  status: StatusFilter;
  formats: DocumentFormat[];
  dateFrom: string | null;
  dateTo: string | null;
  limit: number;
  sort: SortMode;
  current: URLSearchParams;
}) {
  return (
    <aside className="filter-sidebar" id="filter-panel">
      <div className="sidebar-heading">
        <strong>Фильтры</strong>
        <SlidersHorizontal aria-hidden="true" size={18} />
      </div>

      <section className="filter-section">
        <div className="filter-title">
          <span>Статус</span>
          <Info aria-hidden="true" size={15} />
        </div>
        <div className="status-segmented">
          {[
            ["all", "Все"],
            ["exported", "Exported"],
            ["failed", "Failed"],
          ].map(([value, label]) => (
            <Link
              className={status === value ? "is-active" : ""}
              href={pageHref(current, {
                status: value === "all" ? null : value,
                page: null,
                doc: null,
                panel: null,
                anchor: null,
              })}
              key={value}
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <AutoSubmitForm className="filter-form" action="/" method="get">
        {query ? <input type="hidden" name="q" value={query} /> : null}
        {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
        {sort !== "updated" ? <input type="hidden" name="sort" value={sort} /> : null}

        <section className="filter-section">
          <div className="filter-title"><span>Форматы</span></div>
          <div className="format-filters">
            {FILTER_FORMATS.map((format) => (
              <label key={format}>
                <input
                  type="checkbox"
                  name="format"
                  value={format}
                  defaultChecked={formats.includes(format)}
                />
                <span>{format.toUpperCase()}</span>
                <small>{result.stats.formats[format].toLocaleString("ru-RU")}</small>
              </label>
            ))}
          </div>
        </section>

        <section className="filter-section">
          <div className="filter-title"><span>Диапазон дат обновления</span></div>
          <label className="date-field">
            <span>от</span>
            <input type="date" name="from" defaultValue={dateFrom ?? ""} />
          </label>
          <label className="date-field">
            <span>до</span>
            <input type="date" name="to" defaultValue={dateTo ?? ""} />
          </label>
        </section>

        <section className="filter-section">
          <div className="filter-title"><span>Размер страницы</span></div>
          <label className="page-size-field">
            <select name="limit" defaultValue={limit}>
              {PAGE_SIZES.map((size) => (
                <option value={size} key={size}>{size} на странице</option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" size={16} />
          </label>
        </section>
      </AutoSubmitForm>

      <Link className="reset-filters" href="/">
        <RotateCcw aria-hidden="true" size={17} />
        Сбросить фильтры
      </Link>
    </aside>
  );
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const query = (first(raw.q) ?? "").trim();
  const requestedStatus = first(raw.status);
  const requestedAccess = first(raw.access);
  const requestedLimit = toPositiveInt(first(raw.limit), 25);
  const limit = PAGE_SIZES.includes(requestedLimit) ? requestedLimit : 25;
  const page = toPositiveInt(first(raw.page), 1);
  const anchor = normalizeAnchor(first(raw.anchor));
  const dateFrom = normalizeDate(first(raw.from));
  const dateTo = normalizeDate(first(raw.to));
  const status: StatusFilter = isStatusFilter(requestedStatus) ? requestedStatus : "all";
  const access: AccessFilter = isAccessFilter(requestedAccess) ? requestedAccess : "all";
  const sort: SortMode = isSortMode(first(raw.sort)) ? first(raw.sort) as SortMode : "updated";
  const formats = all(raw.format).filter(isFilterFormat);

  const result = await getDocuments({
    query,
    page,
    status,
    access,
    formats,
    dateFrom,
    dateTo,
    sort,
    limit,
  });

  const panelClosed = first(raw.panel) === "closed";
  const defaultDocument =
    result.documents.find(
      (document) =>
        document.status === "exported" && document.formats.includes("html"),
    ) ?? result.documents[0];
  const selectedId = panelClosed
    ? null
    : first(raw.doc) ?? defaultDocument?.docId ?? null;
  const detail = selectedId ? await getDocumentDetail(selectedId, result.source) : null;

  const current = new URLSearchParams();
  if (query) current.set("q", query);
  if (status !== "all") current.set("status", status);
  if (access !== "all") current.set("access", access);
  formats.forEach((format) => current.append("format", format));
  if (dateFrom) current.set("from", dateFrom);
  if (dateTo) current.set("to", dateTo);
  if (limit !== 25) current.set("limit", String(limit));
  if (sort !== "updated") current.set("sort", sort);
  if (result.page > 1) current.set("page", String(result.page));
  if (selectedId) current.set("doc", selectedId);
  if (panelClosed) current.set("panel", "closed");
  if (anchor) current.set("anchor", anchor);

  const from = result.total === 0 ? 0 : (result.page - 1) * result.limit + 1;
  const to = Math.min(result.page * result.limit, result.total);

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <Scale aria-hidden="true" size={22} />
            <Sparkles aria-hidden="true" size={11} />
          </span>
          <strong>AI Advokat</strong>
        </Link>

        <form className="topbar-search" action="/" method="get">
          <Search aria-hidden="true" size={18} />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Поиск по названию или doc_id"
            autoComplete="off"
          />
          {hiddenFilterInputs({ query: "", status, formats, dateFrom, dateTo, limit, sort })}
        </form>

        <div className="topbar-stats">
          <span className="top-stat stat-exported">
            <CheckCircle2 aria-hidden="true" size={17} />
            <span>Экспортировано</span>
            <strong>{result.stats.exported.toLocaleString("ru-RU")}</strong>
          </span>
          <span className="top-stat stat-failed">
            <CircleAlert aria-hidden="true" size={17} />
            <span>Ошибки</span>
            <strong>{result.stats.failed.toLocaleString("ru-RU")}</strong>
          </span>
          <span className="top-stat stat-json">
            <FileJson aria-hidden="true" size={17} />
            <span>JSON</span>
            <strong>{result.stats.formats.json.toLocaleString("ru-RU")}</strong>
          </span>
        </div>
        <RefreshButton />
      </header>

      {result.source === "demo" ? (
        <div className="demo-notice">
          <CircleAlert aria-hidden="true" size={16} />
          Локальный режим: production автоматически использует Railway PostgreSQL.
        </div>
      ) : null}

      <ResizableWorkspace>
        <FilterSidebar
          result={result}
          query={query}
          status={status}
          formats={formats}
          dateFrom={dateFrom}
          dateTo={dateTo}
          limit={limit}
          sort={sort}
          current={current}
        />

        <section className="registry-panel" id="registry-panel">
          <div className="table-head">
            <Link
              href={pageHref(current, {
                sort: sort === "doc_id" ? null : "doc_id",
                page: null,
              })}
            >
              doc_id <SlidersHorizontal aria-hidden="true" size={13} />
            </Link>
            <Link
              href={pageHref(current, {
                sort: sort === "title" ? null : "title",
                page: null,
              })}
            >
              Название
            </Link>
            <span>Статус</span>
            <span>Форматы</span>
            <span>Связи</span>
            <span>Обновлено</span>
            <button className="table-settings" type="button" title="Настройки таблицы" aria-label="Настройки таблицы">
              <Settings2 aria-hidden="true" size={16} />
            </button>
          </div>

          <div className="document-table-body">
            {result.documents.length ? (
              result.documents.map((document) => (
                <DocumentRow
                  document={document}
                  active={detail?.docId === document.docId}
                  current={current}
                  source={result.source}
                  key={document.docId}
                />
              ))
            ) : (
              <div className="empty-state">
                <Search aria-hidden="true" size={24} />
                <strong>Документы не найдены</strong>
                <span>Измените запрос или параметры фильтрации.</span>
              </div>
            )}
          </div>

          <footer className="pagination">
            <span>Показано {from}–{to} из {result.total.toLocaleString("ru-RU")}</span>
            <nav aria-label="Пагинация">
              <Link
                className={`page-direction${result.page <= 1 ? " is-disabled" : ""}`}
                href={pageHref(current, {
                  page: Math.max(1, result.page - 1),
                  doc: null,
                  panel: null,
                  anchor: null,
                })}
                aria-disabled={result.page <= 1}
              >
                <ChevronLeft aria-hidden="true" size={17} />
                Назад
              </Link>
              {paginationItems(result.page, Math.max(1, result.totalPages)).map((item, index) =>
                item === "ellipsis" ? (
                  <span className="page-ellipsis" key={`ellipsis-${index}`}>…</span>
                ) : (
                  <Link
                    className={`page-number${item === result.page ? " is-active" : ""}`}
                    href={pageHref(current, {
                      page: item,
                      doc: null,
                      panel: null,
                      anchor: null,
                    })}
                    aria-current={item === result.page ? "page" : undefined}
                    key={item}
                  >
                    {item}
                  </Link>
                ),
              )}
              <Link
                className={`page-direction${result.page >= result.totalPages ? " is-disabled" : ""}`}
                href={pageHref(current, {
                  page: Math.min(result.totalPages, result.page + 1),
                  doc: null,
                  panel: null,
                  anchor: null,
                })}
                aria-disabled={result.page >= result.totalPages}
              >
                Вперёд
                <ChevronRight aria-hidden="true" size={17} />
              </Link>
            </nav>
          </footer>
        </section>

        <DetailPanel detail={detail} source={result.source} anchor={anchor} current={current} />
      </ResizableWorkspace>
    </main>
  );
}
