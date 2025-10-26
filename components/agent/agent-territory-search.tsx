"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface AgentTerritorySearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
}

export function AgentTerritorySearch({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}: AgentTerritorySearchProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="pb-3">
        <div className="text-lg font-semibold text-gray-900">
          Territory Search
        </div>
      </div>
      <div className="space-y-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search area to draw territory"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                onSearchSubmit();
              }
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
