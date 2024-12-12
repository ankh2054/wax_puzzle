import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cipher Quest - Coming Soon",
  description: "A game about outsmarting AI chatbots",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
        <link rel="icon" type="image/png" href="/img/favicon.png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
