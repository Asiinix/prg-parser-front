export const SESSION_COOKIE = "ai_advokat_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

type SessionPayload = {
  sub: string;
  exp: number;
};

const USERS = new Map([
  ["ASIIN", { password: "12345", displayName: "Asiin" }],
  ["ANDREY", { password: "12345", displayName: "Andrey" }],
]);

function authSecret() {
  return (
    process.env.AUTH_SECRET ??
    "ai-advokat-local-access-2026-change-this-for-stronger-security"
  );
}

function base64UrlEncode(value: string | Uint8Array) {
  const binary =
    typeof value === "string"
      ? value
      : Array.from(value, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  return atob(padded);
}

function decodeBytes(value: string) {
  return Uint8Array.from(base64UrlDecode(value), (character) =>
    character.charCodeAt(0),
  );
}

async function hmacKey(usage: KeyUsage[]) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(authSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usage,
  );
}

export function verifyCredentials(username: string, password: string) {
  const normalizedUsername = username.trim().toUpperCase();
  const user = USERS.get(normalizedUsername);
  if (!user || user.password !== password) return null;
  return {
    username: normalizedUsername,
    displayName: user.displayName,
  };
}

export async function createSessionToken(username: string) {
  const payload: SessionPayload = {
    sub: username,
    exp: Date.now() + SESSION_DURATION_SECONDS * 1000,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(["sign"]),
    new TextEncoder().encode(encodedPayload),
  );
  return `${encodedPayload}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return null;
  const [encodedPayload, encodedSignature, extra] = token.split(".");
  if (!encodedPayload || !encodedSignature || extra) return null;

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(["verify"]),
      decodeBytes(encodedSignature),
      new TextEncoder().encode(encodedPayload),
    );
    if (!valid) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    if (
      typeof payload.sub !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp <= Date.now() ||
      !USERS.has(payload.sub)
    ) {
      return null;
    }
    return {
      username: payload.sub,
      displayName: USERS.get(payload.sub)?.displayName ?? payload.sub,
    };
  } catch {
    return null;
  }
}
