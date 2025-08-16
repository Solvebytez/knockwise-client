"use client";



import { CreateMemberForm } from "./create-member-form";
import { MembersTable } from "./members-table";
import { QuickStats } from "./quick-stats";
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
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Team</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Team management features are coming soon. For now, you can view and manage your team members from the "Create New Member" tab.
        </p>
      </div>
    )
  }

  return null
}
