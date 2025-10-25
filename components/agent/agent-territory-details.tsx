"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface AgentTerritoryDetailsProps {
  territoryName: string;
  territoryDescription: string;
  buildingsCount: number;
  residentsCount: number;
  isSaving: boolean;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function AgentTerritoryDetails({
  territoryName,
  territoryDescription,
  buildingsCount,
  residentsCount,
  isSaving,
  onNameChange,
  onDescriptionChange,
  onSave,
  onCancel,
}: AgentTerritoryDetailsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="pb-3">
        <div className="text-lg font-semibold text-gray-900">
          Territory Details
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="territoryName">Territory Name *</Label>
          <Input
            id="territoryName"
            value={territoryName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter territory name"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="territoryDescription">Description</Label>
          <Input
            id="territoryDescription"
            value={territoryDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Enter territory description (optional)"
            className="mt-1"
          />
        </div>

        {/* Territory Stats */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">
            Territory Statistics
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Buildings</span>
              <span className="font-semibold text-gray-900">{buildingsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Residents</span>
              <span className="font-semibold text-gray-900">{residentsCount}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onSave}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Territory"
            )}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
