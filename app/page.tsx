import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Database,
  Download,
  FileCode2,
  FileJson,
  FileText,
  FolderArchive,
  Search,
} from "lucide-react";
import {
  getDocumentDetail,
  getDocuments,
  type AccessFilter,
  type DocumentFormat,
  type DocumentRecord,
  type StatusFilter,
} from "@/lib/documents";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PRG Архив",
  description: "Каталог правовых документов из базы PRG Parser",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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

function pageHref(
  current: Record<string, string>,
  changes: Record<string, string | number | null>,
) {
  const params = new URLSearchParams(current);
  Object.entries(changes).forEach(([key, value]) => {
    if (value === null || value === "" || value === "all") {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  if (status === "exported") return "Готов";
  if (status === "failed") return "Ошибка";
  if (status === "processing") return "В работе";
  return status || "Неизвестно";
}

function formatIcon(format: DocumentFormat) {
  if (format === "html") return FileCode2;
  if (format === "json" || format === "meta") return FileJson;
  return FileText;
}

function DocumentRow({
  document,
  active,
  href,
}: {
  document: DocumentRecord;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      className={`document-row${active ? " is-active" : ""}`}
      href={href}
      aria-current={active ? "true" : undefined}
    >
      <span className="document-main">
        <span className="document-title">
          {document.title || "Документ без названия"}
        </span>
        <span className="document-id">ID {document.docId}</span>
      </span>
      <span className={`status status-${document.status}`}>
        {statusLabel(document.status)}
      </span>
      <span className="cell-muted">{document.pages ?? "—"}</span>
      <span className="format-list" aria-label="Форматы">
        {document.formats.slice(0, 3).map((format) => (
          <span className="format-tag" key={format}>
            {format.toUpperCase()}
          </span>
        ))}
      </span>
      <span className="cell-muted">{formatDate(document.updatedAt)}</span>
      <ChevronRight aria-hidden="true" size={17} />
    </Link>
  );
}

function DetailPanel({
  detail,
  source,
}: {
  detail: Awaited<ReturnType<typeof getDocumentDetail>>;
  source: "postgres" | "demo";
}) {
  if (!detail) {
    return (
      <aside className="detail-panel empty-detail">
        <FolderArchive aria-hidden="true" size={25} />
        <p>Выберите документ из списка</p>
      </aside>
    );
  }

  return (
    <aside className="detail-panel">
      <div className="detail-header">
        <div>
          <span className="eyebrow">Документ · {detail.docId}</span>
          <h2>{detail.title || "Документ без названия"}</h2>
        </div>
        {detail.sourceUrl ? (
          <a
            className="icon-button"
            href={detail.sourceUrl}
            target="_blank"
            rel="noreferrer"
            title="Открыть источник"
            aria-label="Открыть источник"
          >
            <ArrowUpRight aria-hidden="true" size={18} />
          </a>
        ) : null}
      </div>

      <div className="detail-meta">
        <span className={`status status-${detail.status}`}>
          {statusLabel(detail.status)}
        </span>
        <span>{detail.pages ? `${detail.pages} стр.` : "Без страниц"}</span>
        <span>{detail.isFree === false ? "Ограничен" : "Свободный"}</span>
      </div>

      <section className="output-section">
        <h3>Файлы</h3>
        <div className="output-list">
          {detail.outputs.map((output) => {
            const Icon = formatIcon(output.format);
            const href =
              source === "postgres"
                ? `/api/documents/${detail.docId}/outputs/${output.format}`
                : "#";
            return (
              <a
                className={`output-link${source === "demo" ? " is-disabled" : ""}`}
                href={href}
                key={output.format}
                aria-disabled={source === "demo"}
                title={
                  source === "demo"
                    ? "Скачивание доступно после подключения базы"
                    : `Скачать ${output.format.toUpperCase()}`
                }
              >
                <Icon aria-hidden="true" size={18} />
                <span>
                  <strong>{output.format.toUpperCase()}</strong>
                  <small>{output.sizeLabel}</small>
                </span>
                <Download aria-hidden="true" size={16} />
              </a>
            );
          })}
        </div>
      </section>

      <section className="preview-section">
        <div className="section-heading">
          <h3>Фрагмент текста</h3>
          <span>{formatDate(detail.updatedAt)}</span>
        </div>
        <div className="document-preview">
          {detail.preview
            ? detail.preview
                .split(/\n{2,}/)
                .slice(0, 8)
                .map((paragraph, index) => <p key={index}>{paragraph}</p>)
            : <p>Текстовый файл пока не сохранён.</p>}
        </div>
      </section>
    </aside>
  );
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const query = (first(raw.q) ?? "").trim();
  const page = toPositiveInt(first(raw.page), 1);
  const requestedStatus = first(raw.status);
  const requestedAccess = first(raw.access);
  const status: StatusFilter = isStatusFilter(requestedStatus)
    ? requestedStatus
    : "all";
  const access: AccessFilter = isAccessFilter(requestedAccess)
    ? requestedAccess
    : "all";

  const result = await getDocuments({ query, page, status, access, limit: 10 });
  const selectedId = first(raw.doc) ?? result.documents[0]?.docId ?? null;
  const detail = selectedId
    ? await getDocumentDetail(selectedId, result.source)
    : null;
  const currentParams: Record<string, string> = {};
  if (query) currentParams.q = query;
  if (status !== "all") currentParams.status = status;
  if (access !== "all") currentParams.access = access;
  if (page > 1) currentParams.page = String(page);
  if (selectedId) currentParams.doc = selectedId;

  const from = result.total === 0 ? 0 : (result.page - 1) * result.limit + 1;
  const to = Math.min(result.page * result.limit, result.total);

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <FolderArchive aria-hidden="true" size={20} />
          </span>
          <span>
            <strong>PRG Архив</strong>
            <small>Правовые документы</small>
          </span>
        </Link>
        <div className="connection-pill">
          <Database aria-hidden="true" size={15} />
          <span>{result.source === "postgres" ? "PostgreSQL · Railway" : "Локальный демо-режим"}</span>
          <i aria-hidden="true" />
        </div>
      </header>

      <section className="workspace">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">База документов</span>
            <h1>Каталог PRG Parser</h1>
          </div>
          <span className="result-count">{result.total.toLocaleString("ru-RU")} документов</span>
        </div>

        {result.source === "demo" ? (
          <div className="notice">
            <CircleAlert aria-hidden="true" size={18} />
            <span>
              Показаны локальные данные. В Railway интерфейс автоматически использует
              переменную <code>DATABASE_URL</code>.
            </span>
          </div>
        ) : null}

        <form className="search-row" action="/" method="get">
          <label className="search-field">
            <Search aria-hidden="true" size={19} />
            <span className="sr-only">Поиск документов</span>
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Название или ID документа"
              autoComplete="off"
            />
          </label>
          <label className="select-field">
            <span className="sr-only">Доступ</span>
            <select name="access" defaultValue={access}>
              <option value="all">Любой доступ</option>
              <option value="free">Свободные</option>
              <option value="restricted">Ограниченные</option>
            </select>
          </label>
          {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
          <button className="primary-button" type="submit">
            <Search aria-hidden="true" size={17} />
            <span>Найти</span>
          </button>
        </form>

        <div className="status-tabs" aria-label="Статус документов">
          {[
            ["all", "Все", result.stats.total],
            ["exported", "Готовые", result.stats.exported],
            ["failed", "Ошибки", result.stats.failed],
          ].map(([value, label, count]) => (
            <Link
              className={status === value ? "is-active" : ""}
              href={pageHref(currentParams, {
                status: value === "all" ? null : String(value),
                page: null,
                doc: null,
              })}
              key={String(value)}
            >
              <span>{String(label)}</span>
              <small>{Number(count).toLocaleString("ru-RU")}</small>
            </Link>
          ))}
        </div>

        <div className="content-grid">
          <section className="list-panel">
            <div className="table-head" aria-hidden="true">
              <span>Документ</span>
              <span>Статус</span>
              <span>Стр.</span>
              <span>Форматы</span>
              <span>Обновлён</span>
              <span />
            </div>

            <div className="document-list">
              {result.documents.length ? (
                result.documents.map((document) => (
                  <DocumentRow
                    document={document}
                    active={detail?.docId === document.docId}
                    href={pageHref(currentParams, { doc: document.docId })}
                    key={document.docId}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <Search aria-hidden="true" size={23} />
                  <strong>Документы не найдены</strong>
                  <span>Измените запрос или фильтры.</span>
                </div>
              )}
            </div>

            <footer className="pagination">
              <span>
                {from}–{to} из {result.total.toLocaleString("ru-RU")}
              </span>
              <nav aria-label="Пагинация">
                <Link
                  className={result.page <= 1 ? "is-disabled" : ""}
                  href={pageHref(currentParams, {
                    page: Math.max(1, result.page - 1),
                    doc: null,
                  })}
                  aria-disabled={result.page <= 1}
                  title="Предыдущая страница"
                >
                  <ChevronLeft aria-hidden="true" size={18} />
                </Link>
                <strong>
                  {result.page} / {Math.max(1, result.totalPages)}
                </strong>
                <Link
                  className={result.page >= result.totalPages ? "is-disabled" : ""}
                  href={pageHref(currentParams, {
                    page: Math.min(result.totalPages, result.page + 1),
                    doc: null,
                  })}
                  aria-disabled={result.page >= result.totalPages}
                  title="Следующая страница"
                >
                  <ChevronRight aria-hidden="true" size={18} />
                </Link>
              </nav>
            </footer>
          </section>

          <DetailPanel detail={detail} source={result.source} />
        </div>
      </section>
    </main>
  );
}
