"use client";

import {
  Check,
  Copy,
  LogOut,
  RefreshCw,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type FormHTMLAttributes,
  type ReactNode,
  useRef,
  useState,
  useTransition,
} from "react";

export function AutoSubmitForm({
  children,
  ...props
}: FormHTMLAttributes<HTMLFormElement> & { children: ReactNode }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      {...props}
      ref={formRef}
      onChange={() => formRef.current?.requestSubmit()}
    >
      {children}
    </form>
  );
}

export function CopyButton({
  value,
  label,
  className = "icon-button",
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      className={className}
      type="button"
      onClick={copyValue}
      title={copied ? "Скопировано" : label}
      aria-label={copied ? "Скопировано" : label}
    >
      {copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
    </button>
  );
}

export function FavoriteButton({ docId }: { docId: string }) {
  const [favorite, setFavorite] = useState(false);
  const storageKey = `ai-advokat:favorite:${docId}`;

  function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    window.localStorage.setItem(storageKey, String(next));
  }

  return (
    <button
      className={`icon-button favorite-button${favorite ? " is-active" : ""}`}
      type="button"
      onClick={toggleFavorite}
      title={favorite ? "Убрать из избранного" : "Добавить в избранное"}
      aria-label={favorite ? "Убрать из избранного" : "Добавить в избранное"}
      aria-pressed={favorite}
    >
      <Star aria-hidden="true" fill={favorite ? "currentColor" : "none"} size={20} />
    </button>
  );
}

export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="topbar-refresh"
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      title="Обновить данные"
      aria-label="Обновить данные"
      disabled={pending}
    >
      <RefreshCw aria-hidden="true" className={pending ? "is-spinning" : ""} size={18} />
    </button>
  );
}

export function LogoutButton() {
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.replace("/login");
    }
  }

  return (
    <button
      className="topbar-logout"
      type="button"
      onClick={logout}
      title="Sign out"
      aria-label="Sign out"
      disabled={pending}
    >
      <LogOut aria-hidden="true" size={18} />
    </button>
  );
}
