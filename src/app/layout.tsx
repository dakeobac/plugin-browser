import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BuildProvider } from "@/components/BuildProvider";
import { BuildStatusWidget } from "@/components/BuildStatusWidget";
import { QueryProvider } from "@/components/QueryProvider";
import { NotificationProvider } from "@/components/NotificationProvider";
import { NotificationToast } from "@/components/NotificationToast";
import { NavDropdown } from "@/components/NavDropdown";
import { NavLink } from "@/components/NavLink";
import { RuntimeBadge } from "@/components/RuntimeBadge";
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
  title: "Engram",
  description: "Agent workbench for Claude Code",
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
        <QueryProvider>
          <BuildProvider>
            <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
              <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
                <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                    <span className="text-lg font-bold bg-gradient-to-br from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      &#x25C8;
                    </span>
                  </div>
                  <h1 className="text-lg font-semibold text-foreground">
                    Engram
                  </h1>
                  <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    v0.1
                  </span>
                </Link>
                <nav className="ml-auto flex items-center gap-4">
                  <NavLink href="/">
                    Dashboard
                  </NavLink>
                  <NavDropdown
                    label="Workbench"
                    items={[
                      { href: "/agents", label: "Agents" },
                      { href: "/agent", label: "Chat" },
                      { href: "/teams", label: "Teams" },
                      { href: "/workflows", label: "Workflows" },
                    ]}
                  />
                  <NavDropdown
                    label="Marketplace"
                    items={[
                      { href: "/plugins", label: "Browse" },
                      { href: "/discover", label: "Discover" },
                      { href: "/ecosystem", label: "Ecosystem" },
                      { href: "/connectors", label: "Connectors" },
                    ]}
                  />
                  <NavLink href="/observatory">
                    Observatory
                  </NavLink>
                  <RuntimeBadge />
                  <ThemeToggle />
                </nav>
              </div>
            </header>
            <NotificationProvider>
              <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
              <NotificationToast />
            </NotificationProvider>
            <BuildStatusWidget />
          </BuildProvider>
        </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
