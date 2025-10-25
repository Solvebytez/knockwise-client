"use client";

import { useAuthStore } from "@/store/userStore";
import { DashboardNavigation } from "./dashboard-navigation";
import { AgentNavigation } from "./agent-navigation";

export function RoleAwareNavigation() {
  const { user, isLoading } = useAuthStore();
  const userRole = user?.role;

  // Show loading state while user data is being fetched
  if (isLoading) {
    return (
      <nav className="border-b border-gray-200 bg-white">
        <div className="px-4">
          <div className="flex space-x-8">
            <div className="py-4 px-1 border-b-2 border-transparent">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="py-4 px-1 border-b-2 border-transparent">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="py-4 px-1 border-b-2 border-transparent">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // If user is an AGENT, show agent navigation
  if (userRole === "AGENT") {
    return <AgentNavigation />;
  }

  // For SUPERADMIN and SUBADMIN, show dashboard navigation
  return <DashboardNavigation />;
}
