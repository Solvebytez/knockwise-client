"use client"

import { useState } from "react"
import { TerritoryMap } from "@/components/territory-map"
import { ManuallyAssignTerritoryModal } from "@/components/manually-assign-territory-modal"
import { Button } from "@/components/ui/button"
import { FileText, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function CreateAndAssignZonePage() {
  const [showManuallyAssignForm, setShowManuallyAssignForm] = useState(false)
  const router = useRouter()

  const handleBackToOverview = () => {
    router.push('/territory-map')
  }

  const handleTerritorySaved = (territoryData: any) => {
    console.log("Territory saved successfully:", territoryData)
    setShowManuallyAssignForm(false)
    
    // You can add additional logic here, such as:
    // - Refreshing the territory list
    // - Showing success message
    // - Redirecting to the territory details page
    
    toast.success(`Territory "${territoryData.name}" has been created and saved successfully!`)
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="px-6 py-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create & Assign Territory
            </h1>
            <p className="text-gray-600 mt-1">
              Draw territories on the map and assign them to sales representatives
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              size="sm"
              className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-sm"
              onClick={() => setShowManuallyAssignForm(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Manually Assign Territory
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-gray-300"
              onClick={handleBackToOverview}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Overview
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <TerritoryMap />
      </div>

      {/* Manually Assign Territory Modal */}
      <ManuallyAssignTerritoryModal
        isOpen={showManuallyAssignForm}
        onClose={() => setShowManuallyAssignForm(false)}
        onTerritorySaved={handleTerritorySaved}
      />
    </div>
  )
}
