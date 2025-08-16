import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Providers } from "@/components/providers"
import { AuthCleanup } from "@/components/auth-cleanup"
import "./globals.css"
import QueryProvider from "./queryProvider"

export const metadata: Metadata = {
  title: "KnockWise",
  description: "KnockWise Authentication System",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <QueryProvider>
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <Providers>
          <AuthCleanup />
          {children}
        </Providers>
      </body>
    </html>
    </QueryProvider>
  )
}
