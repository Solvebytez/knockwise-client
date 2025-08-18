import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardNavigation } from "@/components/dashboard-navigation"

export default function CreateAndAssignZoneLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen bg-white">
      <DashboardHeader />
      <DashboardNavigation />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
