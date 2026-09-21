/**
 * src/app/layout.tsx
 * Root Layout — aplica a TODAS las páginas.
 * Incluye: Header (con logout), Main y Footer.
 *
 * Para páginas de auth (/login) el Header no muestra
 * el botón de logout (la sesión no existe aún).
 */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | Expense Tracker",
    default: "Personal Expense Tracker",
  },
  description: "Automatiza el registro de tus gastos desde correos bancarios",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
