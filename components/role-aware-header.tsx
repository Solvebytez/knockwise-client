"use client"

import { useAuthStore } from "@/store/userStore"
import { DashboardHeader } from "./dashboard-header"
import { AgentHeader } from "./agent-header"

export function RoleAwareHeader() {
  const { user } = useAuthStore()
  const userRole = user?.role

  // If user is an AGENT, show agent header
  if (userRole === 'AGENT') {
    return <AgentHeader />
  }

  // For SUPERADMIN and SUBADMIN, show dashboard header
  return <DashboardHeader />
}
