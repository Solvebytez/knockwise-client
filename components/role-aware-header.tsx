"use client";

import { useAuthStore } from "@/store/userStore";
import { DashboardHeader } from "./dashboard-header";
import { AgentHeader } from "./agent-header";

export function RoleAwareHeader() {
  const { user, isLoading } = useAuthStore();
  const userRole = user?.role;

  // Show loading state while user data is being fetched
  if (isLoading) {
    return (
      <header className="bg-white border-b border-gray-200/60 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-12 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  // If user is an AGENT, show agent header
  if (userRole === "AGENT") {
    return <AgentHeader />;
  }

  // For SUPERADMIN and SUBADMIN, show dashboard header
  return <DashboardHeader />;
}
