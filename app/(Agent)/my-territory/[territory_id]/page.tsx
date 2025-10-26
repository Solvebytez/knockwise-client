"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TerritoryEditMap } from "@/components/territory-edit-map";
import { TerritoryEditSidebar } from "@/components/territory-edit-sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { apiInstance } from "@/lib/apiInstance";
import { agentZoneApi } from "@/lib/api/agentZoneApi";
import { toast } from "sonner";
import { ZoneCommunityAssignmentModal } from "@/components/zone-community-assignment-modal";
import { useAuthStore } from "@/store/userStore";
import { detectBuildingsForTerritoryEdit } from "@/lib/buildingDetection";

// Types
interface Territory {
  _id: string;
  name: string;
  description?: string;
  status: string;
  boundary: any;
  buildingData?: any;
  createdBy: string;
  assignedAgentId?: string;
  areaId?: {
    _id: string;
    name: string;
  };
  municipalityId?: {
    _id: string;
    name: string;
  };
  communityId?: {
    _id: string;
    name: string;
  };
}

interface ZoneLocation {
  _id: string;
  areaId?: {
    _id: string;
    name: string;
  };
  municipalityId?: {
    _id: string;
    name: string;
  };
  communityId?: {
    _id: string;
    name: string;
  };
}

function TerritoryEditContent() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const territoryId = params.territory_id as string;
  const { user } = useAuthStore();

  // State - All hooks must be called before any conditional returns
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [zoneLocation, setZoneLocation] = useState<ZoneLocation | null>(null);

  // Territory visualization state (matching admin page)
  const [showExistingTerritories, setShowExistingTerritories] = useState(true);
  const [existingTerritoriesCount, setExistingTerritoriesCount] = useState(0);
  const [focusTrigger, setFocusTrigger] = useState(0);

  // Boundary editing state
  const [isEditingBoundary, setIsEditingBoundary] = useState(false);
  const [pendingBoundary, setPendingBoundary] = useState<any>(null);
  const [isMapInitiallyLoaded, setIsMapInitiallyLoaded] = useState(false);

  // Building detection state (matching admin page structure)
  const [isDetectingBuildings, setIsDetectingBuildings] = useState(false);
  const [detectedBuildings, setDetectedBuildings] = useState<any[]>([]);

  // Authentication check
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  // Fetch territory data using agent zone API
  const {
    data: territory,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["agentZone", territoryId],
    queryFn: () => agentZoneApi.getZoneById(territoryId),
    enabled: !!territoryId,
    refetchOnWindowFocus: false,
  });

  // Fetch zone location data
  const { data: zoneLocationData, refetch: refetchZoneLocation } = useQuery({
    queryKey: ["zoneLocation", territoryId],
    queryFn: () => fetchZoneLocation(territoryId),
    enabled: !!territoryId,
    refetchOnWindowFocus: false,
    staleTime: 0,
    gcTime: 0,
  });

  // Update zoneLocation state when data changes
  useEffect(() => {
    console.log("Zone location data changed:", zoneLocationData);
    if (zoneLocationData) {
      setZoneLocation(zoneLocationData);
      console.log("Updated zoneLocation state:", zoneLocationData);
    }
  }, [zoneLocationData]);

  // Function to compare boundaries and determine if there are changes
  const hasBoundaryChanges = useCallback(() => {
    if (!pendingBoundary || !territory?.data?.boundary) {
      return false;
    }

    const originalCoords = territory.data.boundary.coordinates[0];
    const newCoords = pendingBoundary.coordinates[0];

    // Check if the number of coordinates is different
    if (originalCoords.length !== newCoords.length) {
      return true;
    }

    // Check if any coordinates are different (with some tolerance for floating point precision)
    for (let i = 0; i < originalCoords.length; i++) {
      const originalCoord = originalCoords[i];
      const newCoord = newCoords[i];

      // Check if longitude or latitude differs by more than a small threshold
      if (
        Math.abs(originalCoord[0] - newCoord[0]) > 0.000001 ||
        Math.abs(originalCoord[1] - newCoord[1]) > 0.000001
      ) {
        return true;
      }
    }

    return false;
  }, [pendingBoundary, territory?.data?.boundary]);

  // Fetch zone location function
  const fetchZoneLocation = async (
    zoneId: string
  ): Promise<ZoneLocation | null> => {
    try {
      const response = await apiInstance.get(`/agent-zones/${zoneId}/location`);
      console.log("Zone location fetch response:", response.data);

      const locationData = response.data.data;
      if (!locationData) return null;

      // Transform backend response to match frontend interface
      const transformedData: ZoneLocation = {
        _id: locationData.zone.id,
        areaId: locationData.area
          ? {
              _id: locationData.area.id,
              name: locationData.area.name,
            }
          : undefined,
        municipalityId: locationData.municipality
          ? {
              _id: locationData.municipality.id,
              name: locationData.municipality.name,
            }
          : undefined,
        communityId: locationData.community
          ? {
              _id: locationData.community.id,
              name: locationData.community.name,
            }
          : undefined,
      };

      console.log("Transformed location data:", transformedData);
      return transformedData;
    } catch (error) {
      console.error("Error fetching zone location:", error);
      return null;
    }
  };

  // Update zone mutation
  const updateZoneMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      agentZoneApi.updateZone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agentZone", territoryId] });
      queryClient.invalidateQueries({ queryKey: ["agentZones"] });
      toast.success("Territory updated successfully");

      // Redirect to My Territories page after successful update
      setTimeout(() => {
        router.push("/my-territories");
      }, 1500); // Small delay to show success message
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update territory"
      );
    },
  });

  // Check if current user is the creator of this zone
  const isOwner = territory?.data?.createdBy === user?._id;

  // Use the utility function for building detection
  const detectBuildingsInPolygon = useCallback(async (boundary: any) => {
    return await detectBuildingsForTerritoryEdit(boundary);
  }, []);

  // Handler functions
  const handleEditCommunity = () => {
    if (!isOwner) {
      toast.error("You can only edit territories you created");
      return;
    }
    setIsCommunityModalOpen(true);
  };

  const handleCommunityUpdateSuccess = async (
    zoneId: string,
    communityId: string,
    communityName: string
  ) => {
    setIsCommunityModalOpen(false);
    try {
      console.log("🔄 Starting community update success handler...");
      await queryClient.invalidateQueries({
        queryKey: ["zoneLocation", territoryId],
      });
      console.log("✅ Query cache invalidated");
      const freshData = await refetchZoneLocation();
      console.log("✅ Fresh data refetched:", freshData.data);
      if (freshData.data && Object.keys(freshData.data).length > 0) {
        setZoneLocation(freshData.data);
        console.log("✅ Zone location state updated:", freshData.data);
      }
      toast.success(`Community updated to ${communityName}`);
    } catch (error) {
      console.error("❌ Error refetching zone location:", error);
      toast.success(`Community updated to ${communityName}`);
    }
  };

  const handleUpdate = (updateData: any) => {
    if (!isOwner) {
      toast.error("You can only edit territories you created");
      return;
    }

    // Check if this is only a name/description change (no assignment changes)
    const isOnlyNameDescriptionChange =
      !updateData.assignedAgentId &&
      !updateData.teamId &&
      !updateData.effectiveFrom &&
      !updateData.removeAssignment &&
      (updateData.name || updateData.description) &&
      !pendingBoundary;

    if (isOnlyNameDescriptionChange) {
      console.log("Processing name/description update");
      // Add flag to indicate this is a name/description only update
      updateData.isNameDescriptionUpdateOnly = true;
    } else if (
      updateData.boundary &&
      !updateData.assignedAgentId &&
      !updateData.teamId &&
      !updateData.effectiveFrom &&
      !updateData.removeAssignment
    ) {
      console.log("Processing boundary update only");
      // Add flag to indicate this is a boundary only update
      updateData.isBoundaryUpdateOnly = true;
    }

    updateZoneMutation.mutate({ id: territoryId, data: updateData });
  };

  const handleBack = () => {
    router.push("/my-territories");
  };

  // Boundary editing handlers
  const handleEditBoundary = () => {
    setIsEditingBoundary(true);
    // This will be handled by the map component to enable drawing mode
  };

  const handleBoundaryUpdate = async (newBoundary: any) => {
    setPendingBoundary(newBoundary);

    // Trigger building detection when boundary is updated
    if (newBoundary) {
      console.log("Boundary updated, triggering building detection...");
      setIsDetectingBuildings(true);

      try {
        const detectedBuildings = await detectBuildingsInPolygon(newBoundary);
        console.log(`Detected ${detectedBuildings.length} buildings`);
        setDetectedBuildings(detectedBuildings);
      } catch (error) {
        console.error("Error detecting buildings:", error);
        toast.error("Failed to detect buildings in the new boundary");
      } finally {
        setIsDetectingBuildings(false);
      }
    }
  };

  const handleUpdateTerritory = (updateData: any) => {
    console.log("handleUpdateTerritory called with:", updateData);
    console.log("Pending boundary:", pendingBoundary);
    console.log("Current territory:", territory);

    // Check if this is only a name/description change (no assignment changes)
    const isOnlyNameDescriptionChange =
      !updateData.assignedAgentId &&
      !updateData.teamId &&
      !updateData.effectiveFrom &&
      !updateData.removeAssignment &&
      (updateData.name || updateData.description) &&
      !pendingBoundary;

    if (pendingBoundary) {
      console.log("Processing boundary update");
      // Add flag to indicate this is a boundary only update
      updateData.boundary = pendingBoundary;
      updateData.isBoundaryUpdateOnly = true;

      // Include building data if detected
      if (detectedBuildings && detectedBuildings.length > 0) {
        updateData.buildingData = {
          addresses: detectedBuildings.map((building: any) => building.address),
          coordinates: detectedBuildings.map(
            (building: any) => building.coordinates
          ),
        };
        console.log(
          "Including building data in update:",
          updateData.buildingData
        );
      }
    } else if (isOnlyNameDescriptionChange) {
      console.log("Processing name/description update");
      // Add flag to indicate this is a name/description only update
      updateData.isNameDescriptionUpdateOnly = true;
    }

    handleUpdate(updateData);
  };

  const handleApplyDrawnBoundary = () => {
    if (pendingBoundary) {
      handleUpdate({ boundary: pendingBoundary });
      setPendingBoundary(null);
      setIsEditingBoundary(false);
    }
  };

  const handleCancelDrawing = () => {
    console.log("Canceling boundary drawing...");
    setPendingBoundary(null);
    setIsEditingBoundary(false);
  };

  // Don't render anything if user is not authenticated
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#42A5F5] mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading territory...</p>
        </div>
      </div>
    );
  }

  if (error || !territory?.data) {
    console.error("Territory fetch error:", error);
    console.error("Territory data:", territory);
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            Territory not found or access denied
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Error: {error?.message || "Unknown error"}
          </p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Territories
          </Button>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            You can only edit territories you created
          </p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Territories
          </Button>
        </div>
      </div>
    );
  }

  const territoryData = territory.data;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Territory: {territoryData.name}
            </h1>
            <p className="text-gray-600 mt-1">
              Modify territory details and settings
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Territories
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Map Section */}
        <div className="flex-1">
          <TerritoryEditMap
            territory={territoryData}
            showExistingTerritories={showExistingTerritories}
            onToggleExistingTerritories={setShowExistingTerritories}
            onExistingTerritoriesCountChange={setExistingTerritoriesCount}
            focusTrigger={focusTrigger}
            isEditingBoundary={isEditingBoundary}
            onBoundaryUpdate={handleBoundaryUpdate}
            onApplyDrawnBoundary={handleApplyDrawnBoundary}
            onCancelDrawing={handleCancelDrawing}
            overlapCheckEndpoint="/agent-zones/check-overlap"
          />
        </div>

        {/* Right Sidebar */}
        <TerritoryEditSidebar
          territory={territoryData}
          agents={[]} // Agents don't need assignment functionality
          teams={[]} // Agents don't need team assignment
          onUpdate={handleUpdate}
          isUpdating={updateZoneMutation.isPending}
          showExistingTerritories={showExistingTerritories}
          onToggleExistingTerritories={setShowExistingTerritories}
          existingTerritoriesCount={existingTerritoriesCount}
          onFocusTerritory={() => setFocusTrigger((prev) => prev + 1)}
          onEditBoundary={handleEditBoundary}
          onBoundaryUpdate={handleBoundaryUpdate}
          isDetectingBuildings={isDetectingBuildings}
          detectedBuildings={detectedBuildings}
          onUpdateTerritory={handleUpdateTerritory}
          hasBoundaryChanges={hasBoundaryChanges()}
          hasAnyChanges={hasBoundaryChanges()}
          zoneLocation={zoneLocation}
          onEditCommunity={handleEditCommunity}
          hideAssignmentSection={false} // Allow reassignment for territories created by agent
          hideAssignmentTypeOptions={true} // Hide assignment type options - agents can only self-assign
        />
      </div>

      {/* Community Assignment Modal */}
      <ZoneCommunityAssignmentModal
        isOpen={isCommunityModalOpen}
        onClose={() => setIsCommunityModalOpen(false)}
        onSuccess={handleCommunityUpdateSuccess}
        mode="edit"
        existingZoneId={territoryId}
        apiType="agent"
        currentLocation={
          zoneLocation
            ? {
                areaId: zoneLocation.areaId?._id,
                municipalityId: zoneLocation.municipalityId?._id,
                communityId: zoneLocation.communityId?._id,
                areaName: zoneLocation.areaId?.name,
                municipalityName: zoneLocation.municipalityId?.name,
                communityName: zoneLocation.communityId?.name,
              }
            : undefined
        }
      />
    </div>
  );
}

export default function AgentTerritoryEditPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#42A5F5] mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading...</p>
          </div>
        </div>
      }
    >
      <TerritoryEditContent />
    </Suspense>
  );
}
