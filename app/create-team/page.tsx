import { TabNavigation } from "@/components/create-team-or-member/tab-navigation"
import { TabProvider } from "@/components/create-team-or-member/tab-context"
import { TabContent } from "@/components/create-team-or-member/tab-content"

export default function CreateTeamPage() {
  return (
    <TabProvider>
      <div className="h-screen flex flex-col">
        <div className="px-6 py-4 bg-white border-b">
          <h1 className="text-2xl font-bold text-gray-900">Create Team/Member</h1>
          <p className="text-gray-600 mt-1">Manage your sales team and add new members</p>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <TabNavigation />
            <TabContent />
          </div>
        </div>
      </div>
    </TabProvider>
  )
}
