import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";
const TOKEN_COOKIE = "auth_token";

type RequireAuthOptions = {
  redirectTo?: string;
};

async function hasValidSession(token: string) {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function requireAuth(options: RequireAuthOptions = {}) {
  const { redirectTo = "/login" } = options;
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;

  if (!token) {
    redirect(redirectTo);
  }

  const sessionIsValid = await hasValidSession(token);
  if (!sessionIsValid) {
    redirect(redirectTo);
  }

  return token;
}
