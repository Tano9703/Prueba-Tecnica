const TOKEN_COOKIE = "auth_token";

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.split("=")[1] ?? "") : null;
}

export function setAuthToken(token: string, remember: boolean) {
  if (typeof document === "undefined") return;
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8;
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getAuthToken() {
  return getCookie(TOKEN_COOKIE);
}

export function clearAuthToken() {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
