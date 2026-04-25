import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mesa de Estudos",
  description: "Plataforma de estudos para sua aprovação.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
