import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barbería App",
  description: "Agenda y reservas para barberías",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-zinc-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
