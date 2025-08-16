"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardNavigation } from "@/components/dashboard-navigation"

export default function RoutesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardNavigation />
      <main>
        {children}
      </main>
    </div>
  )
}
