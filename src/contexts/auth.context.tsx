"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { User, LoginPayload, RegisterPayload } from "@/types/auth";

interface AuthContextData {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();

  const login = useCallback(
    async (payload: LoginPayload) => {
      const data = await authService.login(payload);
      setUser(data.user);
      setAccessToken(data.accessToken);
      // refresh token vai via cookie httpOnly — configurado no backend
      console.log("Token em memória:", data.accessToken);
      console.log("Usuário:", data.user);
      router.push("/dashboard");
    },
    [router],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const data = await authService.register(payload);
      setUser(data.user);
      setAccessToken(data.accessToken);
      router.push("/dashboard");
    },
    [router],
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setAccessToken(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
