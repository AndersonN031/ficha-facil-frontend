import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/login", "/register"];

const roleRoutes: Record<string, string> = {
  PATIENT: "/fila",
  RECEPTIONIST: "/recepcionista",
  DOCTOR: "/medico",
};

function decodeJwtPayload(token: string): { role?: string } | null {
  try {
    const payload = token.split(".")[1];
    
    const decoded = atob(payload);
    return JSON.parse(decoded) as { role?: string };
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isPublicRoute) return NextResponse.next();

  const token = request.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = decodeJwtPayload(token);
  const role = payload?.role;

  if (!role || !roleRoutes[role]) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const allowedRoute = roleRoutes[role];

  // redireciona para a rota correta se o usuário tentar acessar rota de outro role
  const isAccessingWrongRoute = Object.values(roleRoutes).some(
    (route) => pathname.startsWith(route) && route !== allowedRoute,
  );

  if (isAccessingWrongRoute) {
    return NextResponse.redirect(new URL(allowedRoute, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
