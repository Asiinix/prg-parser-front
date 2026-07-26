"use client";

import { LockKeyhole, LogIn, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Unable to sign in.");
        return;
      }
      window.location.replace(nextPath);
    } catch {
      setError("Unable to reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <label>
        <span>Username</span>
        <span className="login-field">
          <UserRound aria-hidden="true" size={18} />
          <input
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="characters"
            autoFocus
            required
          />
        </span>
      </label>
      <label>
        <span>Password</span>
        <span className="login-field">
          <LockKeyhole aria-hidden="true" size={18} />
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </span>
      </label>
      <div className="login-error" role="alert" aria-live="polite">
        {error}
      </div>
      <button className="login-submit" type="submit" disabled={pending}>
        <LogIn aria-hidden="true" size={18} />
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
