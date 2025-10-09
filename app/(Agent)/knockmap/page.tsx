"use client";

import { MapPin } from "lucide-react";
import { useMyTerritories } from "@/lib/api/agentApi";
import { TerritoryStatsCards } from "@/components/agent/my-territories/territory-stats-cards";
import { TerritoryList } from "@/components/agent/my-territories/territory-list";

export default function KnockMapPage() {
  const { data, isLoading, error } = useMyTerritories();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg border-2 border-[#42A5F5]/20 shadow-sm p-6 lg:p-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-[#42A5F5]/10 rounded-full">
                <MapPin className="h-8 w-8 text-[#42A5F5]" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                My Territories
              </h1>
              <p className="text-gray-600 mt-2 text-base leading-relaxed">
                View and manage your assigned territories and leads
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#42A5F5] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading territories...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg border-2 border-[#42A5F5]/20 shadow-sm p-6 lg:p-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-[#42A5F5]/10 rounded-full">
                <MapPin className="h-8 w-8 text-[#42A5F5]" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                My Territories
              </h1>
              <p className="text-gray-600 mt-2 text-base leading-relaxed">
                View and manage your assigned territories and leads
              </p>
            </div>
          </div>
        </div>

        {/* Error State */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Error Loading Territories
            </h3>
            <p className="text-red-600 mb-4">
              {error.message || "Failed to load territories. Please try again."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white rounded-lg border-2 border-[#42A5F5]/20 shadow-sm p-6 lg:p-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-[#42A5F5]/10 rounded-full">
                <MapPin className="h-8 w-8 text-[#42A5F5]" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                My Territories
              </h1>
              <p className="text-gray-600 mt-2 text-base leading-relaxed">
                No data available
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { territories, summary } = data.data;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg border-2 border-[#42A5F5]/20 shadow-sm p-6 lg:p-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-[#42A5F5]/10 rounded-full">
              <MapPin className="h-8 w-8 text-[#42A5F5]" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
              My Territories
            </h1>
            <p className="text-gray-600 mt-2 text-base leading-relaxed">
              View and manage your assigned territories and leads
            </p>
          </div>
        </div>
      </div>

      {/* Territory Stats Cards */}
      <TerritoryStatsCards summary={summary} />

      {/* Territory List */}
      <TerritoryList territories={territories} />
    </div>
  );
}
