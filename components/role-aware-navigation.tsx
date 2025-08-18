"use client"

import { useAuthStore } from "@/store/userStore"
import { DashboardNavigation } from "./dashboard-navigation"
import { AgentNavigation } from "./agent-navigation"

export function RoleAwareNavigation() {
  const { user } = useAuthStore()
  const userRole = user?.role

  // If user is an AGENT, show agent navigation
  if (userRole === 'AGENT') {
    return <AgentNavigation />
  }

  // For SUPERADMIN and SUBADMIN, show dashboard navigation
  return <DashboardNavigation />
}
