"use client";

import { Territory } from "@/lib/api/agentApi";
import { TerritoryCard } from "./territory-card";

interface TerritoryListProps {
  territories: Territory[];
}

export function TerritoryList({ territories }: TerritoryListProps) {
  if (territories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Territories Assigned
        </h3>
        <p className="text-gray-600">
          You don't have any territories assigned yet. Please contact your
          administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-[#42A5F5] mb-2 tracking-tight">
          My Territories
        </h2>
        <p className="text-gray-600 text-base leading-relaxed">
          Your assigned territories and current status
        </p>
      </div>

      <div className="space-y-4">
        {territories.map((territory) => (
          <TerritoryCard key={territory._id} territory={territory} />
        ))}
      </div>
    </div>
  );
}
