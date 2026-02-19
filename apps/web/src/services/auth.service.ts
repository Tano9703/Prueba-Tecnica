import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/types";

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  user: User;
}

export const authService = {
  login(payload: LoginPayload) {
    return apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  me() {
    return apiFetch<User>("/auth/me");
  },
};
