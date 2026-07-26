"use client";

import {
  Children,
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { GripVertical } from "lucide-react";

type PanelSide = "filter" | "detail";

type PanelWidths = {
  filter: number;
  detail: number;
};

type DragState = {
  side: PanelSide;
  pointerId: number;
  startX: number;
  startWidths: PanelWidths;
  handle: HTMLButtonElement;
};

const STORAGE_KEY = "ai-advokat:workspace-widths";
const DEFAULT_WIDTHS: PanelWidths = { filter: 240, detail: 390 };
const FILTER_RANGE = { min: 190, max: 380 };
const DETAIL_RANGE = { min: 300, max: 1050 };
const HANDLE_SPACE = 24;
const MIN_REGISTRY_WIDTH = 320;
const PREFERRED_REGISTRY_WIDTH = 420;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function fitWidths(
  containerWidth: number,
  requested: PanelWidths,
  changed: PanelSide | "both",
): PanelWidths {
  let filter = clamp(requested.filter, FILTER_RANGE.min, FILTER_RANGE.max);
  let detail = clamp(requested.detail, DETAIL_RANGE.min, DETAIL_RANGE.max);
  const usableWidth = Math.max(0, containerWidth - HANDLE_SPACE);
  const registryMinimum = Math.min(
    PREFERRED_REGISTRY_WIDTH,
    Math.max(MIN_REGISTRY_WIDTH, usableWidth * 0.4),
  );
  const sidePanelsMaximum = usableWidth - registryMinimum;

  if (filter + detail <= sidePanelsMaximum) return { filter, detail };

  if (changed === "filter") {
    filter = clamp(
      sidePanelsMaximum - detail,
      FILTER_RANGE.min,
      FILTER_RANGE.max,
    );
  } else if (changed === "detail") {
    detail = clamp(
      sidePanelsMaximum - filter,
      DETAIL_RANGE.min,
      DETAIL_RANGE.max,
    );
  } else {
    let overflow = filter + detail - sidePanelsMaximum;
    const detailReduction = Math.min(overflow, detail - DETAIL_RANGE.min);
    detail -= detailReduction;
    overflow -= detailReduction;
    filter -= Math.min(overflow, filter - FILTER_RANGE.min);
  }

  return { filter, detail };
}

export function ResizableWorkspace({ children }: { children: ReactNode }) {
  const panels = Children.toArray(children);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const filterHandleRef = useRef<HTMLButtonElement>(null);
  const detailHandleRef = useRef<HTMLButtonElement>(null);
  const widthsRef = useRef<PanelWidths>(DEFAULT_WIDTHS);
  const dragRef = useRef<DragState | null>(null);

  const applyWidths = useCallback(
    (requested: PanelWidths, changed: PanelSide | "both" = "both") => {
      const workspace = workspaceRef.current;
      if (!workspace) return widthsRef.current;

      const fitted = fitWidths(workspace.clientWidth, requested, changed);
      widthsRef.current = fitted;
      workspace.style.setProperty("--filter-panel-width", `${fitted.filter}px`);
      workspace.style.setProperty("--detail-panel-width", `${fitted.detail}px`);
      filterHandleRef.current?.setAttribute(
        "aria-valuenow",
        String(Math.round(fitted.filter)),
      );
      detailHandleRef.current?.setAttribute(
        "aria-valuenow",
        String(Math.round(fitted.detail)),
      );
      return fitted;
    },
    [],
  );

  const saveWidths = useCallback(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(widthsRef.current),
      );
    } catch {
      // Resizing remains available when browser storage is disabled.
    }
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<PanelWidths>;
        applyWidths(
          {
            filter: Number(parsed.filter) || DEFAULT_WIDTHS.filter,
            detail: Number(parsed.detail) || DEFAULT_WIDTHS.detail,
          },
          "both",
        );
      } else {
        applyWidths(DEFAULT_WIDTHS, "both");
      }
    } catch {
      applyWidths(DEFAULT_WIDTHS, "both");
    }

    const handleResize = () => applyWidths(widthsRef.current, "both");
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [applyWidths]);

  function startResize(
    side: PanelSide,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      side,
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidths: { ...widthsRef.current },
      handle: event.currentTarget,
    };
    workspaceRef.current?.classList.add("is-resizing");
    document.body.classList.add("workspace-resize-active");
  }

  function resize(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const delta = event.clientX - drag.startX;
    applyWidths(
      {
        filter:
          drag.side === "filter"
            ? drag.startWidths.filter + delta
            : drag.startWidths.filter,
        detail:
          drag.side === "detail"
            ? drag.startWidths.detail - delta
            : drag.startWidths.detail,
      },
      drag.side,
    );
  }

  function finishResize(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.handle.hasPointerCapture(event.pointerId)) {
      drag.handle.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    workspaceRef.current?.classList.remove("is-resizing");
    document.body.classList.remove("workspace-resize-active");
    saveWidths();
  }

  function resizeWithKeyboard(
    side: PanelSide,
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) {
    const step = event.shiftKey ? 40 : 16;
    const current = widthsRef.current;
    let requested: PanelWidths | null = null;

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const direction = event.key === "ArrowRight" ? 1 : -1;
      requested =
        side === "filter"
          ? { ...current, filter: current.filter + direction * step }
          : { ...current, detail: current.detail - direction * step };
    } else if (event.key === "Home") {
      requested =
        side === "filter"
          ? { ...current, filter: FILTER_RANGE.min }
          : { ...current, detail: DETAIL_RANGE.min };
    } else if (event.key === "End") {
      requested =
        side === "filter"
          ? { ...current, filter: FILTER_RANGE.max }
          : { ...current, detail: DETAIL_RANGE.max };
    }

    if (!requested) return;
    event.preventDefault();
    applyWidths(requested, side);
    saveWidths();
  }

  function resetWidths() {
    applyWidths(DEFAULT_WIDTHS, "both");
    saveWidths();
  }

  const sharedHandleProps = {
    type: "button" as const,
    onPointerMove: resize,
    onPointerUp: finishResize,
    onPointerCancel: finishResize,
    onDoubleClick: resetWidths,
  };

  return (
    <div className="workspace-grid" ref={workspaceRef}>
      {panels[0]}
      <button
        {...sharedHandleProps}
        className="workspace-resizer workspace-resizer-filter"
        ref={filterHandleRef}
        role="separator"
        aria-orientation="vertical"
        aria-label="Изменить ширину панели фильтров"
        aria-controls="filter-panel registry-panel"
        aria-valuemin={FILTER_RANGE.min}
        aria-valuemax={FILTER_RANGE.max}
        aria-valuenow={DEFAULT_WIDTHS.filter}
        title="Потяните, чтобы изменить ширину. Двойной клик — сбросить"
        onKeyDown={(event) => resizeWithKeyboard("filter", event)}
        onPointerDown={(event) => startResize("filter", event)}
      >
        <GripVertical aria-hidden="true" size={14} />
      </button>
      {panels[1]}
      <button
        {...sharedHandleProps}
        className="workspace-resizer workspace-resizer-detail"
        ref={detailHandleRef}
        role="separator"
        aria-orientation="vertical"
        aria-label="Изменить ширину карточки документа"
        aria-controls="registry-panel detail-panel"
        aria-valuemin={DETAIL_RANGE.min}
        aria-valuemax={DETAIL_RANGE.max}
        aria-valuenow={DEFAULT_WIDTHS.detail}
        title="Потяните, чтобы изменить ширину. Двойной клик — сбросить"
        onKeyDown={(event) => resizeWithKeyboard("detail", event)}
        onPointerDown={(event) => startResize("detail", event)}
      >
        <GripVertical aria-hidden="true" size={14} />
      </button>
      {panels[2]}
    </div>
  );
}
