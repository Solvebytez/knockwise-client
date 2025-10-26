"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ZoneCommunityAssignmentModal } from "./zone-community-assignment-modal";
import { useToast } from "@/hooks/use-toast";

/**
 * Demo component showing how to use ZoneCommunityAssignmentModal
 * This can be used for testing or as a reference for integration
 */
export function ZoneCommunityAssignmentDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignedCommunity, setAssignedCommunity] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const { toast } = useToast();

  // Mock zone data - in real usage, this would come from props or state
  const mockZoneId = "68f390a8c3aad6720bc4c27d"; // This would be the actual zone ID
  const mockZoneName = "Test Zone 1";

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleAssignmentSuccess = (
    communityId: string,
    communityName: string
  ) => {
    setAssignedCommunity({ id: communityId, name: communityName });

    toast({
      title: "Zone Assigned Successfully",
      description: `Zone "${mockZoneName}" has been assigned to ${communityName}.`,
    });

    // In real usage, you would:
    // 1. Update the zone data in your state/context
    // 2. Navigate to the next step (team assignment)
    // 3. Refresh any relevant data
    console.log("Zone assigned to community:", { communityId, communityName });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">
          Zone Community Assignment Demo
        </h2>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900">Zone Information:</h3>
            <p className="text-sm text-gray-600">ID: {mockZoneId}</p>
            <p className="text-sm text-gray-600">Name: {mockZoneName}</p>
          </div>

          {assignedCommunity && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-900">Assignment Status:</h3>
              <p className="text-sm text-green-700">
                Zone has been assigned to:{" "}
                <strong>{assignedCommunity.name}</strong>
              </p>
              <p className="text-xs text-green-600 mt-1">
                Community ID: {assignedCommunity.id}
              </p>
            </div>
          )}

          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Open Community Assignment Modal
          </Button>
        </div>
      </div>

      {/* Integration Instructions */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">
          Integration Instructions:
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            1. Import the modal:{" "}
            <code className="bg-blue-100 px-1 rounded">
              import {`{ZoneCommunityAssignmentModal}`} from
              "@/components/zone-community-assignment-modal"
            </code>
          </p>
          <p>2. Add state for modal visibility and zone data</p>
          <p>3. Call the modal after zone creation/editing</p>
          <p>4. Handle the success callback to proceed to team assignment</p>
          <p>
            5. The modal handles all API calls and error states automatically
          </p>
        </div>
      </div>

      {/* The Modal */}
      <ZoneCommunityAssignmentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleAssignmentSuccess}
        mode="edit"
      />
    </div>
  );
}
