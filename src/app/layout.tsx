import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/auth.context";
import "./globals.css";

export const metadata: Metadata = {
  title: "FilaSaúde",
  description: "Sistema de fila virtual para postos de saúde",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
