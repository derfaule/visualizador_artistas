import type { Metadata } from "next";
import "./globals.css";

// Load saint-cocho's shared design tokens at runtime so style
// changes in that repo apply here without redeploying.
const THEME_URL = "https://derfaule.github.io/saint-cocho/theme.css";

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
      <head>
        <link rel="stylesheet" href={THEME_URL} />
      </head>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
