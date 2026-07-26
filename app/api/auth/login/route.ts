import { NextResponse } from "next/server";
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
  verifyCredentials,
} from "@/lib/auth";

type LoginPayload = {
  username?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  let payload: LoginPayload;
  try {
    payload = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 },
    );
  }

  if (
    typeof payload.username !== "string" ||
    typeof payload.password !== "string"
  ) {
    return NextResponse.json(
      { error: "Enter your username and password." },
      { status: 400 },
    );
  }

  const user = verifyCredentials(payload.username, payload.password);
  if (!user) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    user: { displayName: user.displayName },
  });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(user.username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
  return response;
}
