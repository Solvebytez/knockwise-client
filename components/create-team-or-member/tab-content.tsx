"use client";

import { CreateMemberForm } from "./create-member-form";
import { MembersTable } from "./members-table";
import { QuickStats } from "./quick-stats";
import { TeamManagementDashboard } from "./team-management-dashboard";
import { useTabContext } from "./tab-context";

export function TabContent() {
  const { activeTab } = useTabContext()

  if (activeTab === "create") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CreateMemberForm />
          <QuickStats />
        </div>
        <MembersTable />
      </div>
    )
  }

  if (activeTab === "manage") {
    return (
      <div className="space-y-6">
        {/* Manage Tab Header */}
        <div>
          <h2 className="text-3xl font-bold text-[#42A5F5] mb-2">Team Management</h2>
          <p className="text-lg text-gray-700 font-medium">Comprehensive team management and analytics</p>
        </div>

        {/* Unified Dashboard with Members Table */}
        <TeamManagementDashboard />
      </div>
    )
  }

  return null
}
