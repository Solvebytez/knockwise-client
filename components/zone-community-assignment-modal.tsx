"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, MapPin, Building2, Users } from "lucide-react";
import { toast } from "sonner";
import { apiInstance } from "@/lib/apiInstance";
import {
  Area,
  Municipality,
  Community,
  fetchAreas,
  fetchMunicipalitiesByArea,
  fetchCommunitiesByMunicipality,
  assignZoneToCommunity,
} from "@/lib/api/locationApi";
import { agentZoneApi } from "@/lib/api/agentZoneApi";

interface ZoneData {
  name: string;
  description: string;
  polygon: any;
  buildingData?: {
    addresses: string[];
    coordinates: number[][];
  };
}

interface CurrentLocation {
  areaId?: string;
  municipalityId?: string;
  communityId?: string;
  areaName?: string;
  municipalityName?: string;
  communityName?: string;
}

interface ZoneCommunityAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (
    zoneId: string,
    communityId: string,
    communityName: string
  ) => void;
  zoneData?: ZoneData; // Optional for edit mode
  mode: "create" | "edit"; // NEW: Distinguish between create and edit modes
  existingZoneId?: string; // NEW: For editing existing zones
  currentLocation?: CurrentLocation; // NEW: Current location data for edit mode
  apiType?: "admin" | "agent"; // NEW: Determine which API to use
}

export function ZoneCommunityAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  zoneData,
  mode = "create",
  existingZoneId,
  currentLocation,
  apiType = "admin", // Default to admin API
}: ZoneCommunityAssignmentModalProps) {
  // State management
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>("");
  const [selectedCommunity, setSelectedCommunity] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Data state
  const [areas, setAreas] = useState<Area[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);

  // Loading states
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(false);

  // Fetch areas on modal open
  useEffect(() => {
    if (isOpen) {
      loadAreas();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedArea("");
      setSelectedMunicipality("");
      setSelectedCommunity("");
      setMunicipalities([]);
      setCommunities([]);
    }
  }, [isOpen]);

  // Pre-populate form when in edit mode
  useEffect(() => {
    if (isOpen && mode === "edit" && currentLocation) {
      if (currentLocation.areaId) {
        setSelectedArea(currentLocation.areaId);
        // Load municipalities for the current area
        loadMunicipalities(currentLocation.areaId).then(() => {
          if (currentLocation.municipalityId) {
            setSelectedMunicipality(currentLocation.municipalityId);
            // Load communities for the current municipality
            loadCommunities(currentLocation.municipalityId).then(() => {
              if (currentLocation.communityId) {
                setSelectedCommunity(currentLocation.communityId);
              }
            });
          }
        });
      }
    }
  }, [isOpen, mode, currentLocation]);

  // Fetch areas
  const loadAreas = async () => {
    try {
      setLoadingAreas(true);
      const response = await fetchAreas();
      if (response.success) {
        setAreas(response.data);
      }
    } catch (error) {
      console.error("Error fetching areas:", error);
      toast.error("Failed to fetch areas. Please try again.");
    } finally {
      setLoadingAreas(false);
    }
  };

  // Fetch municipalities by area
  const loadMunicipalities = async (areaId: string) => {
    try {
      setLoadingMunicipalities(true);
      const response = await fetchMunicipalitiesByArea(areaId);
      if (response.success) {
        setMunicipalities(response.data);
      }
    } catch (error) {
      console.error("Error fetching municipalities:", error);
      toast.error("Failed to fetch municipalities. Please try again.");
    } finally {
      setLoadingMunicipalities(false);
    }
  };

  // Fetch communities by municipality
  const loadCommunities = async (municipalityId: string) => {
    try {
      setLoadingCommunities(true);
      const response = await fetchCommunitiesByMunicipality(municipalityId);
      if (response.success) {
        setCommunities(response.data);
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
      toast.error("Failed to fetch communities. Please try again.");
    } finally {
      setLoadingCommunities(false);
    }
  };

  // Handle area selection
  const handleAreaChange = (areaId: string) => {
    setSelectedArea(areaId);
    setSelectedMunicipality("");
    setSelectedCommunity("");
    setCommunities([]);

    if (areaId) {
      loadMunicipalities(areaId);
    } else {
      setMunicipalities([]);
    }
  };

  // Handle municipality selection
  const handleMunicipalityChange = (municipalityId: string) => {
    setSelectedMunicipality(municipalityId);
    setSelectedCommunity("");

    if (municipalityId) {
      loadCommunities(municipalityId);
    } else {
      setCommunities([]);
    }
  };

  // Handle community selection
  const handleCommunityChange = (communityId: string) => {
    setSelectedCommunity(communityId);
  };

  // Create zone and assign to community
  const handleSaveAndNext = async () => {
    if (!selectedCommunity) {
      toast.error("Please select a community to assign the zone to.");
      return;
    }

    try {
      setIsSaving(true);

      // Find the selected community details
      const community = communities.find((c) => c._id === selectedCommunity);
      if (!community) {
        throw new Error("Selected community not found");
      }

      const communityName = community.name;

      if (mode === "create") {
        // CREATE MODE: Create new zone with community assignment
        if (!zoneData) {
          throw new Error("Zone data is required for create mode");
        }

        // Ensure polygon is closed by duplicating the first coordinate at the end
        const polygonCoordinates = zoneData.polygon.map((p: any) => [
          p.lng,
          p.lat,
        ]);
        const firstCoord = polygonCoordinates[0];
        const lastCoord = polygonCoordinates[polygonCoordinates.length - 1];

        // If the polygon is not closed, close it
        if (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1]) {
          polygonCoordinates.push([firstCoord[0], firstCoord[1]]);
        }

        const createZoneData = {
          name: zoneData.name,
          description: zoneData.description,
          boundary: {
            type: "Polygon" as const,
            coordinates: [polygonCoordinates],
          },
          buildingData: zoneData.buildingData,
          communityId: selectedCommunity, // Include communityId in the request
        };

        // Use appropriate API based on apiType
        let createResponse;
        let createdZone;

        if (apiType === "agent") {
          // Use agent zone API
          createResponse = await agentZoneApi.createZone(createZoneData);
          createdZone = createResponse.data;
        } else {
          // Use admin zone API
          createResponse = await apiInstance.post(
            "/zones/create-zone",
            createZoneData
          );
          createdZone = createResponse.data.data;
        }

        console.log(`=== ${apiType.toUpperCase()} ZONE CREATION RESPONSE ===`);
        console.log("Full response:", createResponse);
        console.log("Created zone data:", createdZone);
        console.log("Zone ID:", createdZone._id);
        console.log("Zone ID type:", typeof createdZone._id);

        // Extract the actual zone ID from the response
        const actualZoneId = createdZone._id;

        if (!actualZoneId) {
          console.error("❌ No zone ID found in response data:", createdZone);
          toast.error(
            "Failed to get zone ID from server response. Please try again."
          );
          return;
        }

        toast.success(
          `Zone "${zoneData.name}" has been created and assigned to ${communityName}.`
        );

        // Call success handler with zone ID, community ID, and community name
        console.log("Calling onSuccess with:", {
          zoneId: actualZoneId,
          communityId: selectedCommunity,
          communityName: communityName,
        });
        onSuccess(actualZoneId, selectedCommunity, communityName);
      } else {
        // EDIT MODE: Update existing zone's community assignment
        if (!existingZoneId) {
          throw new Error("Existing zone ID is required for edit mode");
        }

        const updateData = {
          communityId: selectedCommunity,
        };

        const updateResponse = await apiInstance.put(
          `/zones/${existingZoneId}/location`,
          updateData
        );

        console.log("=== ZONE LOCATION UPDATE RESPONSE ===");
        console.log("Full response:", updateResponse);
        console.log("Updated zone data:", updateResponse.data);

        toast.success(`Zone has been reassigned to ${communityName}.`);

        // Call success handler with zone ID, community ID, and community name
        console.log("Calling onSuccess with:", {
          zoneId: existingZoneId,
          communityId: selectedCommunity,
          communityName: communityName,
        });
        onSuccess(existingZoneId, selectedCommunity, communityName);
      }
    } catch (error: any) {
      console.error(
        `Error ${
          mode === "create" ? "creating" : "updating"
        } zone and assigning to community:`,
        error
      );

      // Log the specific error response
      if (error.response?.data) {
        console.error("Error response data:", error.response.data);

        // Extract error message from response with robust handling
        let errorMessage =
          "Failed to create zone and assign to community. Please try again.";

        // Try to extract message from different possible locations
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (
          error.response.data.errors &&
          Array.isArray(error.response.data.errors)
        ) {
          // Handle validation errors array
          const firstError = error.response.data.errors[0];
          if (firstError && firstError.msg) {
            errorMessage = firstError.msg;
          }
        }

        // Handle specific status codes with user-friendly messages
        if (error.response.status === 409) {
          if (
            errorMessage.toLowerCase().includes("name") &&
            errorMessage.toLowerCase().includes("exists")
          ) {
            errorMessage =
              "A zone with this name already exists. Please choose a different name.";
          } else if (
            errorMessage.toLowerCase().includes("buildings") &&
            errorMessage.toLowerCase().includes("assigned")
          ) {
            // Extract the number of conflicting buildings from the error message
            const buildingMatch = errorMessage.match(
              /(\d+)\s+buildings?\s+are\s+already\s+assigned/
            );
            const buildingCount = buildingMatch ? buildingMatch[1] : "some";

            errorMessage = `${buildingCount} buildings in this area are already assigned to other territories. Please draw your zone in a different area or adjust the boundary to avoid overlapping buildings.`;
          } else if (errorMessage.toLowerCase().includes("overlaps")) {
            errorMessage =
              "This zone overlaps with existing territories. Please draw your zone in a different area.";
          }
        } else if (error.response.status === 400) {
          if (
            !errorMessage.includes("Invalid") &&
            !errorMessage.includes("check")
          ) {
            errorMessage = `Invalid data: ${errorMessage}`;
          }
        } else if (error.response.status === 404) {
          errorMessage = "Community not found. Please refresh and try again.";
        }

        console.log("Displaying error toast:", errorMessage);
        console.log("Toast function:", toast);

        try {
          toast.error(errorMessage);
          console.log("Toast called successfully");
        } catch (toastError) {
          console.error("Error calling toast:", toastError);
        }
      } else {
        console.log("No response data, showing generic error");
        toast.error(
          "Failed to create zone and assign to community. Please try again."
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Get selected area name
  const selectedAreaName =
    areas.find((a) => a._id === selectedArea)?.name || "";
  const selectedMunicipalityName =
    municipalities.find((m) => m._id === selectedMunicipality)?.name || "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="w-5 h-5 text-blue-600" />
            {mode === "create"
              ? `Assign "${zoneData?.name}" to Community`
              : "Edit Community Assignment"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Zone Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-800">
              <Building2 className="w-4 h-4" />
              <span className="font-medium">
                {mode === "create"
                  ? `Zone: ${zoneData?.name}`
                  : "Edit Zone Community Assignment"}
              </span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              {mode === "create"
                ? "Select the community where this zone is located"
                : "Select a new community for this zone"}
            </p>
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
              <strong>Note:</strong> If you get an error about buildings already
              being assigned, it means some addresses in your drawn area overlap
              with existing zones. Try drawing your zone in a different area or
              adjust the boundary.
            </div>
          </div>

          {/* Area Selection */}
          <div className="space-y-2">
            <Label htmlFor="area" className="text-sm font-medium">
              Area *
            </Label>
            <Select
              value={selectedArea}
              onValueChange={handleAreaChange}
              disabled={loadingAreas}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    loadingAreas ? "Loading areas..." : "Select an area"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area._id} value={area._id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Municipality Selection */}
          <div className="space-y-2">
            <Label htmlFor="municipality" className="text-sm font-medium">
              Municipality *
            </Label>
            <Select
              value={selectedMunicipality}
              onValueChange={handleMunicipalityChange}
              disabled={!selectedArea || loadingMunicipalities}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !selectedArea
                      ? "Select an area first"
                      : loadingMunicipalities
                      ? "Loading municipalities..."
                      : "Select a municipality"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {municipalities.map((municipality) => (
                  <SelectItem key={municipality._id} value={municipality._id}>
                    {municipality.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Community Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Community *</Label>
            {!selectedMunicipality ? (
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm">
                Select a municipality first
              </div>
            ) : loadingCommunities ? (
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading communities...
              </div>
            ) : communities.length === 0 ? (
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm">
                No communities found for this municipality
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
                <RadioGroup
                  value={selectedCommunity}
                  onValueChange={handleCommunityChange}
                  className="space-y-2"
                >
                  {communities.map((community) => (
                    <div
                      key={community._id}
                      className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                    >
                      <RadioGroupItem
                        value={community._id}
                        id={community._id}
                      />
                      <Label
                        htmlFor={community._id}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span>{community.name}</span>
                          {community.zoneIds.length > 0 && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {community.zoneIds.length} zone
                              {community.zoneIds.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          </div>

          {/* Selection Summary */}
          {selectedCommunity && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">Selected Location:</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                {selectedAreaName} → {selectedMunicipalityName} →{" "}
                {communities.find((c) => c._id === selectedCommunity)?.name}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAndNext}
              disabled={!selectedCommunity || isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : mode === "create" ? (
                "Save and Next"
              ) : (
                "Update Community"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
