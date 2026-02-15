import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BuildProvider } from "@/components/BuildProvider";
import { BuildStatusWidget } from "@/components/BuildStatusWidget";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plugin Factory",
  description: "Browse, analyze, and create Claude Code plugins",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <BuildProvider>
            <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
              <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
                <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                    <svg
                      className="h-4 w-4 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <h1 className="text-lg font-semibold text-foreground">
                    Plugin Factory
                  </h1>
                </Link>
                <nav className="ml-auto flex items-center gap-4">
                  <Link
                    href="/plugins"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Plugins
                  </Link>
                  <Link
                    href="/discover"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Discover
                  </Link>
                  <Link
                    href="/agent"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Agent
                  </Link>
                  <Link
                    href="/wiki"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Wiki
                  </Link>
                  <Link
                    href="/github"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    GitHub
                  </Link>
                  <ThemeToggle />
                </nav>
              </div>
            </header>
            <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
            <BuildStatusWidget />
          </BuildProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
