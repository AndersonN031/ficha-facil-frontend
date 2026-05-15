import { api } from "@/lib/api";
import { AuthResponse, LoginPayload, RegisterPayload } from "@/types/auth";

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    return data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },
};
