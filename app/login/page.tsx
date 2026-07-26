import type { Metadata } from "next";
import { Scale, Sparkles } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to AI Advokat",
};

type LoginSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

function safeNextPath(value: string | string[] | undefined) {
  const path = Array.isArray(value) ? value[0] : value;
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: LoginSearchParams;
}) {
  const params = await searchParams;

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-brand">
          <span className="brand-mark">
            <Scale aria-hidden="true" size={24} />
            <Sparkles aria-hidden="true" size={11} />
          </span>
          <strong>AI Advokat</strong>
        </div>
        <header className="login-heading">
          <h1>Sign in</h1>
          <p>Enter your account details to continue.</p>
        </header>
        <LoginForm nextPath={safeNextPath(params.next)} />
        <small className="login-access-note">Authorized access only</small>
      </section>
    </main>
  );
}
