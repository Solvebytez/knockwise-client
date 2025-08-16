"use client"

import { TerritoryMap } from "@/components/territory-map"

export default function TerritoryMapPage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="px-6 py-4 bg-white border-b">
        <h1 className="text-2xl font-bold text-gray-900">Create & Assign Territory</h1>
        <p className="text-gray-600 mt-1">Draw territories on the map and assign them to sales representatives</p>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <TerritoryMap />
      </div>
    </div>
  )
}
