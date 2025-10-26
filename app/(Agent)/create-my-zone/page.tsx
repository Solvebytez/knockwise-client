"use client";

import { AgentTerritoryMap } from "@/components/agent-territory-map";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreateMyZonePage() {
  const router = useRouter();

  const handleBackToAgent = () => {
    router.push("/agent");
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="px-6 py-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create My Territory
            </h1>
            <p className="text-gray-600 mt-1">
              Draw your territory on the map and assign it to yourself
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToAgent}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <AgentTerritoryMap />
      </div>
    </div>
  );
}
