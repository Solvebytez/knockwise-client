"use client"

import { UserPlus, Users } from "lucide-react"
import { useTabContext } from "./tab-context"

export function TabNavigation() {
  const { activeTab, setActiveTab } = useTabContext()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-1">
      <div className="flex space-x-1">
        <button
          onClick={() => setActiveTab("create")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "create"
              ? "bg-[#42A5F5] text-white"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <UserPlus className="w-4 h-4 inline mr-2" />
          Create New Member
        </button>
        <button
          onClick={() => setActiveTab("manage")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "manage"
              ? "bg-[#42A5F5] text-white"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Manage Team
        </button>
      </div>
    </div>
  )
}
