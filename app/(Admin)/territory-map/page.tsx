"use client"

import { useState, useRef } from "react"
import { TerritoryOverview } from "@/components/territory-overview"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TerritoryMapPage() {
  const territoryOverviewRef = useRef<{ refetch: () => void } | null>(null)
  const router = useRouter()

  const handleRefresh = () => {
    if (territoryOverviewRef.current?.refetch) {
      territoryOverviewRef.current.refetch()
    }
  }

  const handleCreateTerritory = () => {
    router.push('/create-and-assign-zone')
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="px-6 py-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Territory Management
            </h1>
            <p className="text-gray-600 mt-1">
              Overview and management of all territories
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-gray-300"
              onClick={handleRefresh}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              size="sm" 
              className="bg-[#42A5F5] hover:bg-[#357ABD] text-white border-0 shadow-sm"
              onClick={handleCreateTerritory}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Territory & Assign
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6 bg-gray-50">
          <TerritoryOverview ref={territoryOverviewRef} />
        </div>
      </div>
    </div>
  )
}
