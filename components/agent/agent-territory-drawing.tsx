"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AgentTerritoryDrawingProps {
  isDrawingMode: boolean;
  isDetectingResidents: boolean;
  isLoadingTerritories: boolean;
  territoriesCount: number;
  showExistingTerritories: boolean;
  onToggleDrawing: () => void;
  onToggleExistingTerritories: (show: boolean) => void;
}

export function AgentTerritoryDrawing({
  isDrawingMode,
  isDetectingResidents,
  isLoadingTerritories,
  territoriesCount,
  showExistingTerritories,
  onToggleDrawing,
  onToggleExistingTerritories,
}: AgentTerritoryDrawingProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="pb-3">
        <div className="text-lg font-semibold text-gray-900">
          Territory Drawing
        </div>
      </div>

      {/* Show existing territories toggle */}
      {isLoadingTerritories ? (
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200 shadow-sm mb-6">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-5 w-5 text-orange-600 animate-spin" />
            <span className="text-sm font-semibold text-gray-800">
              Loading Existing Territories...
            </span>
          </div>
        </div>
      ) : territoriesCount > 0 ? (
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200 shadow-sm mb-6">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="showExistingTerritories"
              checked={showExistingTerritories}
              onChange={(e) => onToggleExistingTerritories(e.target.checked)}
              className="w-5 h-5 text-orange-600 bg-white border-2 border-orange-300 rounded-md focus:ring-orange-500 focus:ring-2 transition-all duration-200"
            />
            <label
              htmlFor="showExistingTerritories"
              className="text-sm font-semibold text-gray-800"
            >
              Show Existing Territories
            </label>
          </div>
          {showExistingTerritories && (
            <div className="flex items-center gap-1 text-xs text-orange-700 font-semibold bg-orange-100 px-2 py-1 rounded-full">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              Active
            </div>
          )}
        </div>
      ) : null}

      <div className="space-y-8">
        {/* Main Drawing Controls */}
        <div className="space-y-6">
          <div className="flex gap-4">
            <Button
              onClick={onToggleDrawing}
              disabled={isDetectingResidents}
              size="lg"
              className={`flex-1 font-semibold transition-all duration-200 ${
                isDetectingResidents
                  ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                  : isDrawingMode
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-lg transform hover:scale-105"
                  : "bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black shadow-lg transform hover:scale-105"
              } ${
                isDetectingResidents ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isDetectingResidents ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </div>
              ) : isDrawingMode ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  Stop Drawing
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                  Draw Territory
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
