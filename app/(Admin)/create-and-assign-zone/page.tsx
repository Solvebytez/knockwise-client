"use client";

import { TerritoryMap } from "@/components/territory-map";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreateAndAssignZonePage() {
  const router = useRouter();

  const handleBackToOverview = () => {
    router.push("/territory-map");
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="px-6 py-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create & Assign Territory
            </h1>
            <p className="text-gray-600 mt-1">
              Draw territories on the map and assign them to sales
              representatives
            </p>
          </div>
          <div className="flex items-center space-x-3">
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
    </div>
  );
}
