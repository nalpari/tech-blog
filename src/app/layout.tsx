import type { Metadata } from "next";
import { JetBrains_Mono, IBM_Plex_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "techlog",
    template: "%s — techlog",
  },
  description:
    "where engineers share professional knowledge and technical insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/earlyaccess/nanumpenscript.css"
        />
      </head>
      <body
        className={`${jetbrainsMono.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <Header />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
