"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TerritoryEditMap } from "@/components/territory-edit-map";
import { TerritoryEditSidebar } from "@/components/territory-edit-sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { apiInstance } from "@/lib/apiInstance";
import {
  updateTerritoryBasic,
  updateTerritoryBoundary,
  updateTerritoryResidents,
  updateTerritoryUnified,
} from "@/lib/territoryApi";
import { toast } from "sonner";
import { ZoneCommunityAssignmentModal } from "@/components/zone-community-assignment-modal";
import { detectBuildingsInPolygon } from "@/lib/buildingDetection";

// Types
interface Territory {
  _id: string;
  name: string;
  description?: string;
  status: string;
  boundary: any;
  currentAssignment?: {
    _id: string;
    agentId?: { _id: string; name: string; email: string };
    teamId?: { _id: string; name: string };
    effectiveFrom: string;
    effectiveTo?: string;
    status: string;
  };
}

interface Agent {
  _id: string;
  name: string;
  email: string;
  status: string;
  assignmentStatus?: string;
  teamMemberships?: Array<{
    teamId: string;
    teamName: string;
    teamStatus: string;
    teamAssignmentStatus: string;
    isPrimary: boolean;
  }>;
  assignmentSummary?: {
    totalActiveZones: number;
    totalScheduledZones: number;
    hasActiveAssignments: boolean;
    hasScheduledAssignments: boolean;
    individualZones: string[];
    teamZones: string[];
    scheduledZones: string[];
    currentAssignmentStatus: string;
    assignmentDetails: {
      hasIndividualAssignments: boolean;
      hasTeamAssignments: boolean;
      hasScheduledIndividualAssignments: boolean;
      hasScheduledTeamAssignments: boolean;
      totalAssignments: number;
      isFullyAssigned: boolean;
      isPartiallyAssigned: boolean;
      isOnlyScheduled: boolean;
    };
  };
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  leaderId?: {
    _id: string;
    name: string;
    email: string;
  };
  agentIds?: Array<{
    _id: string;
    name: string;
    email: string;
    status: string;
  }>;
  status?: string;
  performance?: {
    totalMembers: number;
    activeMembers: number;
    averageKnocks: number;
    completionRate: number;
    zoneCoverage: number;
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

// API functions
const fetchTerritory = async (id: string): Promise<Territory> => {
  try {
    const response = await apiInstance.get(`/zones/get-by-id/${id}`);
    console.log("Territory fetch response:", response.data);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching territory:", error);
    throw error;
  }
};

const fetchAgents = async (): Promise<Agent[]> => {
  // Enhanced search with team membership and assignment information
  const response = await apiInstance.get(
    "/users/my-created-agents?includeTeamInfo=true"
  );
  return response.data.data;
};

const fetchTeams = async (): Promise<Team[]> => {
  // Enhanced teams with member count and assignment information
  const response = await apiInstance.get("/teams");
  return response.data.data;
};

const fetchZoneLocation = async (
  zoneId: string
): Promise<ZoneLocation | null> => {
  try {
    const response = await apiInstance.get(`/zones/${zoneId}/location`);
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
    // Return null if no location data exists (zone not assigned to any community)
    return null;
  }
};

// Legacy update function (kept for backward compatibility)
const updateTerritory = async ({ id, data }: { id: string; data: any }) => {
  console.log("Sending legacy update data:", { id, data });
  const response = await apiInstance.put(`/zones/update/${id}`, data);
  console.log("Legacy update response:", response.data);
  return response.data.data;
};

function TerritoryEditContent() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const territoryId = params.territory_id as string;
  const [showExistingTerritories, setShowExistingTerritories] = useState(true);
  const [existingTerritoriesCount, setExistingTerritoriesCount] = useState(0);
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [isEditingBoundary, setIsEditingBoundary] = useState(false);
  const [isDetectingBuildings, setIsDetectingBuildings] = useState(false);
  const [detectedBuildings, setDetectedBuildings] = useState<any[]>([]);
  const [pendingBoundary, setPendingBoundary] = useState<any>(null);
  const [isMapInitiallyLoaded, setIsMapInitiallyLoaded] = useState(false);

  // Community assignment modal state
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [zoneLocation, setZoneLocation] = useState<ZoneLocation | null>(null);

  // Queries
  const {
    data: territory,
    isLoading: territoryLoading,
    refetch: refetchTerritory,
  } = useQuery({
    queryKey: ["territory", territoryId],
    queryFn: () => fetchTerritory(territoryId),
    enabled: !!territoryId,
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: true, // Refetch when component mounts
  });

  // Function to compare boundaries and determine if there are changes
  const hasBoundaryChanges = useCallback(() => {
    if (!pendingBoundary || !territory?.boundary) {
      return false;
    }

    const originalCoords = territory.boundary.coordinates[0];
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
  }, [pendingBoundary, territory?.boundary]);

  // Function to check if there are any meaningful changes (boundary, name, or description)
  const hasAnyChanges = useCallback(() => {
    // Check for boundary changes
    if (hasBoundaryChanges()) {
      return true;
    }

    // Note: Name and description changes will be checked in the sidebar component
    // since those are managed there
    return false;
  }, [hasBoundaryChanges]);

  // Debug: Log territory data changes
  useEffect(() => {
    console.log("Territory data updated:", territory);
  }, [territory]);

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });

  // Query for zone location data
  const { data: zoneLocationData, refetch: refetchZoneLocation } = useQuery({
    queryKey: ["zoneLocation", territoryId],
    queryFn: () => fetchZoneLocation(territoryId),
    enabled: !!territoryId,
    refetchOnWindowFocus: false,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    cacheTime: 0, // Don't cache the data to ensure fresh fetches
  });

  // Update zoneLocation state when data changes
  useEffect(() => {
    console.log("Zone location data changed:", zoneLocationData);
    if (zoneLocationData) {
      setZoneLocation(zoneLocationData);
      console.log("Updated zoneLocation state:", zoneLocationData);
    }
  }, [zoneLocationData]);

  // Mutation
  // Legacy mutation (for backward compatibility)
  const updateMutation = useMutation({
    mutationFn: updateTerritory,
    onSuccess: (data) => {
      toast.success("Territory updated successfully!");
      console.log("Update successful, new data:", data);

      // Update the cache directly with the new data
      queryClient.setQueryData(["territory", territoryId], data);

      // Also invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["territory", territoryId] });
      queryClient.invalidateQueries({ queryKey: ["territories"] });

      // Refetch territory data to ensure UI is updated
      refetchTerritory();

      // Reset states after successful update
      setPendingBoundary(null);
      setDetectedBuildings([]);
      setIsEditingBoundary(false);
    },
    onError: (error: any) => {
      console.error("Update error:", error.response?.data);
      toast.error(
        error.response?.data?.message || "Failed to update territory"
      );
    },
  });

  // Specific update mutations
  const updateBasicMutation = useMutation({
    mutationFn: updateTerritoryBasic,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["territory", territoryId] });

      // Snapshot the previous value
      const previousTerritory = queryClient.getQueryData([
        "territory",
        territoryId,
      ]);

      // Optimistically update to the new value while preserving status
      queryClient.setQueryData(["territory", territoryId], (old: any) => {
        console.log("Optimistic update - old data:", old);
        const updated = {
          ...old,
          name:
            variables.data.name !== undefined ? variables.data.name : old.name,
          description:
            variables.data.description !== undefined
              ? variables.data.description
              : old.description,
          // Explicitly preserve the current status
          status: old.status,
        };
        console.log("Optimistic update - new data:", updated);
        return updated;
      });

      // Return a context object with the snapshotted value
      return { previousTerritory };
    },
    onSuccess: (data) => {
      toast.success("Territory basic information updated successfully!");
      console.log("Basic update successful, new data:", data);

      // Update the cache with the actual response data from backend
      queryClient.setQueryData(["territory", territoryId], (old: any) => {
        const updated = {
          ...data,
          // Use the actual status from backend response, not cached status
          status: data.status,
        };
        console.log("Success update - final data:", updated);
        return updated;
      });

      // Force refresh to ensure UI shows correct status from backend
      queryClient.invalidateQueries({ queryKey: ["territory", territoryId] });
      queryClient.invalidateQueries({ queryKey: ["territories"] });

      // Refetch immediately to ensure data consistency
      refetchTerritory();
    },
    onError: (error: any, variables, context) => {
      console.error("Basic update error:", error.response?.data);
      toast.error(
        error.response?.data?.message ||
          "Failed to update territory basic information"
      );

      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTerritory) {
        queryClient.setQueryData(
          ["territory", territoryId],
          context.previousTerritory
        );
      }
    },
  });

  const updateBoundaryMutation = useMutation({
    mutationFn: updateTerritoryUnified,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["territory", territoryId] });

      // Snapshot the previous value
      const previousTerritory = queryClient.getQueryData([
        "territory",
        territoryId,
      ]);

      // Optimistically update to the new value while preserving status
      queryClient.setQueryData(["territory", territoryId], (old: any) => {
        console.log("Boundary optimistic update - old data:", old);
        const updated = {
          ...old,
          boundary: variables.data.boundary,
          buildingData: variables.data.buildingData,
          // Preserve the current status
          status: old.status,
        };
        console.log("Boundary optimistic update - new data:", updated);
        return updated;
      });

      // Return a context object with the snapshotted value
      return { previousTerritory };
    },
    onSuccess: (data) => {
      toast.success("Territory boundary and residents updated successfully!");
      console.log("Boundary update successful, new data:", data);

      // Update the cache with the actual response data from backend
      queryClient.setQueryData(["territory", territoryId], (old: any) => {
        const updated = {
          ...data,
          // Use the actual status from backend response, not cached status
          status: data.status,
        };
        console.log("Boundary success update - final data:", updated);
        return updated;
      });

      // Force refresh to ensure UI shows correct status from backend
      queryClient.invalidateQueries({ queryKey: ["territory", territoryId] });
      queryClient.invalidateQueries({ queryKey: ["territories"] });

      // Refetch immediately to ensure data consistency
      refetchTerritory();

      // Reset states after successful update
      setPendingBoundary(null);
      setDetectedBuildings([]);
      setIsEditingBoundary(false);
    },
    onError: (error: any, variables, context) => {
      console.error("Boundary update error:", error.response?.data);
      toast.error(
        error.response?.data?.message || "Failed to update territory boundary"
      );

      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTerritory) {
        queryClient.setQueryData(
          ["territory", territoryId],
          context.previousTerritory
        );
      }
    },
  });

  const updateResidentsMutation = useMutation({
    mutationFn: updateTerritoryResidents,
    onSuccess: (data) => {
      toast.success("Territory residents updated successfully!");
      console.log("Residents update successful, new data:", data);

      // Also invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["territory", territoryId] });
      queryClient.invalidateQueries({ queryKey: ["territories"] });

      // Refetch territory data to ensure UI is updated
      refetchTerritory();
    },
    onError: (error: any) => {
      console.error("Residents update error:", error.response?.data);
      toast.error(
        error.response?.data?.message || "Failed to update territory residents"
      );
    },
  });

  const handleUpdate = (updateData: any) => {
    // Check if this is only a name/description change (no assignment changes)
    const isOnlyNameDescriptionChange =
      !updateData.assignedAgentId &&
      !updateData.teamId &&
      !updateData.effectiveFrom &&
      !updateData.removeAssignment &&
      (updateData.name || updateData.description) &&
      !pendingBoundary;

    if (isOnlyNameDescriptionChange) {
      console.log("Processing name/description update with unified API");

      // Use the unified API for basic updates
      const basicUpdateData = {
        name: updateData.name,
        description: updateData.description,
      };

      console.log("Sending basic update with data:", basicUpdateData);
      updateBasicMutation.mutate({ id: territoryId, data: basicUpdateData });
    } else {
      // For ALL assignment changes (including date changes), use the legacy API since it handles assignment logic
      console.log("Processing assignment update with legacy API");
      updateMutation.mutate({ id: territoryId, data: updateData });
    }
  };

  const handleFocusTerritory = () => {
    setFocusTrigger((prev) => prev + 1);
  };

  const handleEditBoundary = () => {
    setIsEditingBoundary(true);
    // This will be handled by the map component to enable drawing mode
  };

  // Community assignment handlers
  const handleEditCommunity = () => {
    setIsCommunityModalOpen(true);
  };

  const handleCommunityUpdateSuccess = async (
    zoneId: string,
    communityId: string,
    communityName: string
  ) => {
    // Close modal first
    setIsCommunityModalOpen(false);

    // Invalidate and refetch zone location data to get updated information
    try {
      console.log("🔄 Starting community update success handler...");

      // First invalidate the query cache to ensure fresh data
      await queryClient.invalidateQueries({
        queryKey: ["zoneLocation", territoryId],
      });
      console.log("✅ Query cache invalidated");

      // Then refetch the data
      const freshData = await refetchZoneLocation();
      console.log("✅ Fresh data refetched:", freshData.data);

      // Force update the state immediately
      if (freshData.data) {
        setZoneLocation(freshData.data);
        console.log("✅ Zone location state updated:", freshData.data);
      }

      toast.success(`Community updated to ${communityName}`);
    } catch (error) {
      console.error("❌ Error refetching zone location:", error);
      toast.success(`Community updated to ${communityName}`);
    }
  };

  // Use the utility function for building detection
  const detectBuildingsInPolygonLocal = useCallback(async (polygon: any) => {
    return await detectBuildingsInPolygon(polygon);
  }, []);

  const handleBoundaryUpdate = async (newBoundary: any) => {
    if (newBoundary === null) {
      // Cancel the edit
      setIsEditingBoundary(false);
      setPendingBoundary(null);
      setDetectedBuildings([]);
      return;
    }

    console.log("Starting building detection for new boundary:", newBoundary);

    // Store the pending boundary and start building detection
    setPendingBoundary(newBoundary);
    setIsDetectingBuildings(true);

    try {
      // Create a temporary polygon for building detection
      const tempPolygon = new window.google.maps.Polygon({
        paths: newBoundary.coordinates[0].map((coord: number[]) => ({
          lat: coord[1],
          lng: coord[0],
        })),
      });

      console.log("Created temporary polygon for building detection");

      // Detect buildings in the new boundary
      const detectedResidents = await detectBuildingsInPolygonLocal(
        tempPolygon
      );
      setDetectedBuildings(detectedResidents);

      console.log(
        `Successfully detected ${detectedResidents.length} buildings in new boundary`
      );

      // Show success message
      toast.success(
        `Detected ${detectedResidents.length} buildings in the new boundary`
      );
    } catch (error) {
      console.error("Error detecting buildings:", error);
      toast.error("Failed to detect buildings in the new boundary");
      setDetectedBuildings([]);
    } finally {
      setIsDetectingBuildings(false);
    }
  };

  const handleUpdateTerritory = (updateData: any) => {
    console.log("handleUpdateTerritory called with:", updateData);
    console.log("Pending boundary:", pendingBoundary);
    console.log("Detected buildings:", detectedBuildings);
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
      console.log("Processing boundary update with new specific API");

      // Use the specific boundary update API
      const boundaryUpdateData = {
        boundary: pendingBoundary,
        buildingData: {
          totalBuildings: detectedBuildings.length,
          residentialHomes: detectedBuildings.length,
          addresses: detectedBuildings.map((building) => building.address),
          coordinates: detectedBuildings.map((building) => [
            building.lng,
            building.lat,
          ]),
        },
      };

      console.log("Sending boundary update with data:", boundaryUpdateData);

      // Use unified API to update both boundary and residents synchronously
      const unifiedUpdateData = {
        updateType: "all" as const,
        boundary: pendingBoundary,
        buildingData: {
          totalBuildings: detectedBuildings.length,
          residentialHomes: detectedBuildings.length,
          addresses: detectedBuildings.map((building) => building.address),
          coordinates: detectedBuildings.map((building) => [
            building.lng,
            building.lat,
          ]),
        },
        residents: detectedBuildings.map((building) => ({
          name: building.name,
          address: building.address,
          lat: building.lat,
          lng: building.lng,
          status: building.status,
          phone: building.phone || "",
          email: building.email || "",
          notes: building.notes || "",
        })),
      };

      console.log("Sending unified update with data:", unifiedUpdateData);
      updateBoundaryMutation.mutate({
        id: territoryId,
        data: unifiedUpdateData,
      });

      // Reset states after update
      setPendingBoundary(null);
      setDetectedBuildings([]);
      setIsEditingBoundary(false); // Exit drawing mode after successful update
    } else if (isOnlyNameDescriptionChange) {
      console.log("Processing name/description update with new specific API");

      // Use the specific basic update API
      const basicUpdateData = {
        name: updateData.name,
        description: updateData.description,
      };

      console.log("Sending basic update with data:", basicUpdateData);
      updateBasicMutation.mutate({ id: territoryId, data: basicUpdateData });
    } else {
      console.log("Processing assignment update with legacy API");
      // For assignment changes, use the legacy API since it handles assignment logic
      const regularUpdateData = {
        ...updateData,
        // Only preserve assignment if not explicitly changing it
        ...(territory?.currentAssignment?.agentId?._id &&
          !updateData.assignedAgentId && {
            assignedAgentId: territory.currentAssignment.agentId._id,
          }),
        ...(territory?.currentAssignment?.teamId?._id &&
          !updateData.teamId && {
            teamId: territory.currentAssignment.teamId._id,
          }),
        // Preserve status only if not explicitly changing assignment
        ...(!updateData.assignedAgentId &&
          !updateData.teamId &&
          !updateData.effectiveFrom && {
            status: territory?.status || "DRAFT",
          }),
      };
      console.log("Sending assignment update with data:", regularUpdateData);
      updateMutation.mutate({ id: territoryId, data: regularUpdateData });
    }
  };

  // Auto-focus on territory when it loads
  useEffect(() => {
    if (territory && territory.boundary?.coordinates) {
      // Small delay to ensure map is loaded
      const timer = setTimeout(() => {
        setFocusTrigger((prev) => prev + 1);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [territory]);

  if (territoryLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading territory...</p>
        </div>
      </div>
    );
  }

  if (!territory) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Territory not found</p>
          <Button
            onClick={() => router.push("/territory-map")}
            className="mt-4"
          >
            Back to Overview
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Territory</h1>
            <p className="text-gray-600 mt-1">
              Update territory information and assignments
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/territory-map")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Overview
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Map Section */}
        <div className="flex-1">
          <TerritoryEditMap
            territory={territory}
            showExistingTerritories={showExistingTerritories}
            onToggleExistingTerritories={setShowExistingTerritories}
            onExistingTerritoriesCountChange={setExistingTerritoriesCount}
            focusTrigger={focusTrigger}
            isEditingBoundary={isEditingBoundary}
            onBoundaryUpdate={handleBoundaryUpdate}
            onApplyDrawnBoundary={() => {}}
          />
        </div>

        {/* Right Sidebar */}
        <TerritoryEditSidebar
          territory={territory}
          agents={agents}
          teams={teams}
          onUpdate={handleUpdate}
          isUpdating={
            updateMutation.isPending ||
            updateBasicMutation.isPending ||
            updateBoundaryMutation.isPending ||
            updateResidentsMutation.isPending
          }
          showExistingTerritories={showExistingTerritories}
          onToggleExistingTerritories={setShowExistingTerritories}
          existingTerritoriesCount={existingTerritoriesCount}
          onFocusTerritory={handleFocusTerritory}
          onEditBoundary={handleEditBoundary}
          onBoundaryUpdate={handleBoundaryUpdate}
          isDetectingBuildings={isDetectingBuildings}
          detectedBuildings={detectedBuildings}
          onUpdateTerritory={handleUpdateTerritory}
          hasBoundaryChanges={hasBoundaryChanges()}
          hasAnyChanges={hasAnyChanges()}
          zoneLocation={zoneLocation}
          onEditCommunity={handleEditCommunity}
        />
      </div>

      {/* Community Assignment Modal */}
      <ZoneCommunityAssignmentModal
        isOpen={isCommunityModalOpen}
        onClose={() => setIsCommunityModalOpen(false)}
        onSuccess={handleCommunityUpdateSuccess}
        mode="edit"
        existingZoneId={territoryId}
        apiType="admin"
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

export default function TerritoryEditPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <TerritoryEditContent />
    </Suspense>
  );
}
