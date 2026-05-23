"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { User, LoginPayload, RegisterPayload } from "@/types/auth";
import Cookies from "js-cookie";

interface AuthContextData {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedToken = sessionStorage.getItem("accessToken");
    const storedUser = sessionStorage.getItem("user");

    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setUser(JSON.parse(storedUser) as User);
    }

    setLoading(false);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const data = await authService.login(payload);
      setUser(data.user);
      setAccessToken(data.accessToken);
      Cookies.set("session", data.accessToken, { sameSite: "strict" });
      sessionStorage.setItem("user", JSON.stringify(data.user));
      router.push("/fila");
    },
    [router],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const data = await authService.register(payload);
      setUser(data.user);
      setAccessToken(data.accessToken);
      Cookies.set("session", data.accessToken, { sameSite: "strict" });
      sessionStorage.setItem("user", JSON.stringify(data.user));
      router.push("/fila");
    },
    [router],
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setAccessToken(null);
    Cookies.remove("session");
    sessionStorage.removeItem("user");
    router.push("/login");
  }, [router]);

  // no useEffect de restauração
  useEffect(() => {
    const storedToken = Cookies.get("session");
    const storedUser = sessionStorage.getItem("user");

    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setUser(JSON.parse(storedUser) as User);
    }

    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        loading,
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
