import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Visualizador de Artistas",
  description: "Colombian music bands · members · instruments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-hidden antialiased">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
