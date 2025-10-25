"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Edit, Eye, EyeOff, MapPin, X } from "lucide-react";
import { toast } from "sonner";

interface Territory {
  _id: string;
  name: string;
  description?: string;
  status: string;
  boundary: any;
  createdAt?: string;
  totalResidents?: number;
  activeResidents?: number;
  buildingData?: {
    totalBuildings?: number;
    residentialHomes?: number;
    addresses?: string[];
    coordinates?: number[][];
    houseNumbers?: {
      odd: number[];
      even: number[];
    };
  };
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

interface TerritoryEditSidebarProps {
  territory: Territory | null;
  agents: Agent[];
  teams: Team[];
  onUpdate: (data: any) => void;
  isUpdating: boolean;
  showExistingTerritories: boolean;
  onToggleExistingTerritories: (show: boolean) => void;
  existingTerritoriesCount: number;
  onFocusTerritory: () => void;
  onEditBoundary?: () => void;
  onBoundaryUpdate?: (newBoundary: any) => void;
  isDetectingBuildings?: boolean;
  detectedBuildings?: any[];
  onUpdateTerritory?: (data: any) => void;
  hasBoundaryChanges?: boolean;
  hasAnyChanges?: boolean;
  zoneLocation?: ZoneLocation | null;
  onEditCommunity?: () => void;
  hideAssignmentSection?: boolean; // New prop to hide assignment section for agents
  hideAssignmentTypeOptions?: boolean; // Hide assignment type options (for agents - only show date)
}

export function TerritoryEditSidebar({
  territory,
  agents,
  teams,
  onUpdate,
  isUpdating,
  showExistingTerritories,
  onToggleExistingTerritories,
  existingTerritoriesCount,
  onFocusTerritory,
  onEditBoundary,
  onBoundaryUpdate,
  isDetectingBuildings,
  detectedBuildings,
  onUpdateTerritory,
  hasBoundaryChanges = false,
  hasAnyChanges = false,
  zoneLocation,
  onEditCommunity,
  hideAssignmentSection = false,
  hideAssignmentTypeOptions = false,
}: TerritoryEditSidebarProps) {
  // State
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isEditTerritoryOpen, setIsEditTerritoryOpen] = useState(false);
  const [territoryName, setTerritoryName] = useState("");
  const [territoryDescription, setTerritoryDescription] = useState("");
  const [assignmentType, setAssignmentType] = useState<
    "none" | "individual" | "team"
  >("none");
  const [assignedRep, setAssignedRep] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [assignedDate, setAssignedDate] = useState("");
  // Search states for display
  const [agentSearchText, setAgentSearchText] = useState("");
  const [teamSearchText, setTeamSearchText] = useState("");
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);

  // Function to check if there are any changes (name, description, boundary, or assignment)
  const hasChanges = () => {
    // Check for boundary changes
    if (hasBoundaryChanges) {
      return true;
    }

    // Check for name changes
    if (territoryName.trim() !== (territory?.name || "")) {
      return true;
    }

    // Check for description changes
    if (territoryDescription.trim() !== (territory?.description || "")) {
      return true;
    }

    // Check for assignment changes
    const currentAssignment = territory?.currentAssignment;
    if (
      assignmentType === "none" &&
      (currentAssignment?.agentId || currentAssignment?.teamId)
    ) {
      return true;
    }
    if (
      assignmentType === "individual" &&
      assignedRep &&
      currentAssignment?.agentId?._id !== assignedRep
    ) {
      return true;
    }
    if (
      assignmentType === "team" &&
      selectedTeam &&
      currentAssignment?.teamId?._id !== selectedTeam
    ) {
      return true;
    }

    // Check for assignment date changes
    if (assignedDate) {
      const currentDate = currentAssignment?.effectiveFrom
        ? new Date(currentAssignment.effectiveFrom).toISOString().split("T")[0]
        : "";
      if (assignedDate !== currentDate) {
        return true;
      }
    }

    return false;
  };

  // Initialize form data when territory loads
  useEffect(() => {
    if (territory) {
      setTerritoryName(territory.name || "");
      setTerritoryDescription(territory.description || "");

      // Set assignment data
      if (territory.currentAssignment?.agentId) {
        setAssignmentType("individual");
        setAssignedRep(territory.currentAssignment.agentId._id);
        setAgentSearchText(
          `${territory.currentAssignment.agentId.name} (${territory.currentAssignment.agentId.email})`
        );
        setTeamSearchText(""); // Clear team search
      } else if (territory.currentAssignment?.teamId) {
        setAssignmentType("team");
        setSelectedTeam(territory.currentAssignment.teamId._id);
        setTeamSearchText(territory.currentAssignment.teamId.name);
        setAgentSearchText(""); // Clear agent search
      } else {
        setAssignmentType("none");
        setAgentSearchText(""); // Clear both searches
        setTeamSearchText("");
      }

      // Set effective date if available
      if (territory.currentAssignment?.effectiveFrom) {
        const date = new Date(territory.currentAssignment.effectiveFrom);
        setAssignedDate(date.toISOString().split("T")[0]);
      }
    }
  }, [territory]);

  // Filter available agents and teams based on current assignment
  useEffect(() => {
    if (territory) {
      // For agents, exclude the currently assigned agent to this territory
      const filteredAgents = agents.filter((agent) => {
        if (territory.currentAssignment?.agentId?._id === agent._id) {
          return true; // Include current assignment
        }
        return true; // Show all agents for now
      });
      setAvailableAgents(filteredAgents);

      // For teams, exclude the currently assigned team to this territory
      const filteredTeams = teams.filter((team) => {
        if (territory.currentAssignment?.teamId?._id === team._id) {
          return true; // Include current assignment
        }
        return true; // Show all teams for now
      });
      setAvailableTeams(filteredTeams);
    }
  }, [agents, teams, territory]);

  const handleAssignmentTypeChange = (
    value: "none" | "individual" | "team"
  ) => {
    setAssignmentType(value);
    // Clear search inputs and selections when switching
    setAgentSearchText("");
    setTeamSearchText("");
    setAssignedRep("");
    setSelectedTeam("");
  };

  const handleEditTerritoryClick = () => {
    console.log("handleEditTerritoryClick called, current state:", {
      isEditTerritoryOpen,
      isEditFormOpen,
    });
    setIsEditTerritoryOpen(!isEditTerritoryOpen);
    // Close assignment form if open
    if (isEditFormOpen) {
      setIsEditFormOpen(false);
    }
    console.log("After state change:", {
      isEditTerritoryOpen: !isEditTerritoryOpen,
      isEditFormOpen: false,
    });
  };

  const handleReassignClick = () => {
    setIsEditFormOpen(!isEditFormOpen);
    // Close territory edit form if open
    if (isEditTerritoryOpen) {
      setIsEditTerritoryOpen(false);
    }
  };

  const handleEditBoundary = () => {
    // This will trigger map drawing mode
    if (onEditBoundary) {
      onEditBoundary();
    }
    // Keep the territory edit form open while drawing
    // Only close the assignment form if it's open
    if (isEditFormOpen) {
      setIsEditFormOpen(false);
    }
  };

  const handleUpdateTerritory = () => {
    console.log("handleUpdateTerritory called in sidebar");

    // Since building detection happens immediately when drawing is complete,
    // we just need to update the territory with the current data
    if (onUpdateTerritory) {
      const updateData = {
        name: territoryName.trim(),
        description: territoryDescription.trim(),
      };
      console.log("Calling onUpdateTerritory with data:", updateData);
      onUpdateTerritory(updateData);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updateData: any = {
      name: territoryName.trim(),
      description: territoryDescription.trim(),
    };

    // Check if this is a date-only change
    const currentAssignment = territory?.currentAssignment;
    const isDateOnlyChange = hideAssignmentTypeOptions
      ? // For agents: date-only change if only date is provided and no other fields changed
        territoryName.trim() === territory?.name &&
        territoryDescription.trim() === (territory?.description || "") &&
        assignedDate &&
        territory?.currentAssignment?.agentId // Check if zone has an assigned agent
      : // For admins: original logic
        territoryName.trim() === territory?.name &&
        territoryDescription.trim() === (territory?.description || "") &&
        assignedDate &&
        currentAssignment &&
        ((assignmentType === "individual" &&
          assignedRep === currentAssignment.agentId?._id) ||
          (assignmentType === "team" &&
            selectedTeam === currentAssignment.teamId?._id));

    // Add assignment data based on type
    if (hideAssignmentTypeOptions) {
      // For agents: automatically assign to current user (self-assignment)
      if (assignedDate) {
        updateData.assignedAgentId = territory?.currentAssignment?.agentId?._id;
        updateData.effectiveFrom = new Date(assignedDate).toISOString();
      }
    } else if (assignmentType === "none") {
      // Remove all assignments - will set status to DRAFT
      updateData.removeAssignment = true;
    } else if (assignmentType === "individual" && assignedRep) {
      updateData.assignedAgentId = assignedRep;
      if (assignedDate) {
        updateData.effectiveFrom = new Date(assignedDate).toISOString();
      }
    } else if (assignmentType === "team" && selectedTeam) {
      updateData.teamId = selectedTeam;
      if (assignedDate) {
        updateData.effectiveFrom = new Date(assignedDate).toISOString();
      }
    }

    // Add flag for date-only changes
    if (isDateOnlyChange) {
      updateData.isDateOnlyChange = true;
      console.log("🎯 DETECTED: Date-only change");
    }

    console.log("Submitting update data:", updateData);
    onUpdate(updateData);
  };

  if (!territory) {
    return (
      <div className="w-96 bg-white border-l border-gray-200 shadow-lg flex flex-col h-full">
        <div className="p-6 flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">Loading territory...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white border-l border-gray-200 shadow-lg flex flex-col h-screen">
      <div className="p-6 flex-1 flex flex-col overflow-hidden">
        {/* Territory Information - Hidden when forms are open */}
        {!isEditTerritoryOpen && !isEditFormOpen && (
          <div
            className="flex-1 overflow-y-auto"
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Territory: {territory.name}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    variant={
                      territory.status === "ACTIVE"
                        ? "default"
                        : territory.status === "SCHEDULED"
                        ? "secondary"
                        : territory.status === "COMPLETED"
                        ? "default"
                        : "outline"
                    }
                    className={
                      territory.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : territory.status === "SCHEDULED"
                        ? "bg-yellow-100 text-yellow-800"
                        : territory.status === "COMPLETED"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {territory.status}
                  </Badge>
                </div>

                {territory.description && (
                  <p className="text-sm text-blue-700 mb-3">
                    {territory.description}
                  </p>
                )}

                {/* Current Assignment Details */}
                {territory.currentAssignment && (
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>
                      <strong>Assignment:</strong>{" "}
                      {territory.currentAssignment.agentId
                        ? `${territory.currentAssignment.agentId.name} (${territory.currentAssignment.agentId.email})`
                        : territory.currentAssignment.teamId
                        ? `Team: ${territory.currentAssignment.teamId.name}`
                        : "None"}
                    </p>
                    <p>
                      <strong>Effective From:</strong>{" "}
                      {new Date(
                        territory.currentAssignment.effectiveFrom
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Territory Context */}
                <div className="text-xs text-blue-600 mt-2 pt-2 border-t border-blue-200">
                  <p>
                    💡 <strong>Tip:</strong> Other territories are shown in
                    orange on the map
                  </p>
                </div>
              </div>

              {/* Existing Territories Toggle */}
              {existingTerritoriesCount > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showExistingTerritories"
                        checked={showExistingTerritories}
                        onChange={(e) =>
                          onToggleExistingTerritories(e.target.checked)
                        }
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        disabled={isUpdating}
                      />
                      <label
                        htmlFor="showExistingTerritories"
                        className="text-sm font-medium text-gray-700"
                      >
                        Show Other Territories
                      </label>
                    </div>
                    <div className="flex items-center space-x-1">
                      {showExistingTerritories ? (
                        <Eye className="w-4 h-4 text-gray-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {existingTerritoriesCount} other territories available
                  </p>
                </div>
              )}

              {/* Focus Territory Button */}
              <Button
                onClick={onFocusTerritory}
                variant="outline"
                className="w-full mt-4 border-blue-500 text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-2"
                disabled={isUpdating}
              >
                <MapPin className="h-4 w-4" />
                Focus on Territory
              </Button>

              {/* Community Assignment Section */}
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Community Assignment
                  </h3>
                </div>

                <div className="space-y-2">
                  {zoneLocation ? (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-800">
                        <div>
                          <strong>Area:</strong>{" "}
                          {zoneLocation.areaId?.name || "Not specified"}
                        </div>
                        <div>
                          <strong>Municipality:</strong>{" "}
                          {zoneLocation.municipalityId?.name || "Not specified"}
                        </div>
                        <div>
                          <strong>Community:</strong>{" "}
                          {zoneLocation.communityId?.name || "Not specified"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-600">
                        No community assigned
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={onEditCommunity}
                    variant="outline"
                    className="w-full"
                    disabled={isUpdating}
                  >
                    {zoneLocation ? "Edit Community" : "Assign Community"}
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4">
                <Button
                  onClick={handleEditTerritoryClick}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-black flex items-center justify-center gap-2"
                  disabled={isUpdating}
                >
                  <Edit className="h-4 w-4" />
                  Edit Territory
                </Button>

                {!hideAssignmentSection && (
                  <Button
                    onClick={handleReassignClick}
                    className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                    disabled={isUpdating}
                  >
                    <Edit className="h-4 w-4" />
                    Want to Reassign
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Territory Form */}
        {isEditTerritoryOpen && (
          <div className="flex-1 flex flex-col min-h-0">
            <div
              className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400"
              onWheel={(e) => e.stopPropagation()}
            >
              <div className="space-y-6 pr-2 pb-32">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Edit Territory Details
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsEditTerritoryOpen(false)}
                      className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                      title="Hide form"
                    >
                      <EyeOff className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-blue-800">
                      Territory Information
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Update territory name, description, and boundary
                    </div>
                  </div>
                </div>

                {/* Territory Name */}
                <div className="space-y-3">
                  <Label
                    htmlFor="editTerritoryName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Territory Name
                  </Label>
                  <Input
                    id="editTerritoryName"
                    type="text"
                    value={territoryName}
                    onChange={(e) => setTerritoryName(e.target.value)}
                    placeholder="Enter territory name..."
                    className="h-12 text-base"
                    disabled={isUpdating}
                  />
                </div>

                {/* Territory Description */}
                <div className="space-y-3">
                  <Label
                    htmlFor="editTerritoryDescription"
                    className="text-sm font-medium text-gray-700"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="editTerritoryDescription"
                    value={territoryDescription}
                    onChange={(e) => setTerritoryDescription(e.target.value)}
                    placeholder="Enter territory description..."
                    className="min-h-24 resize-none"
                    disabled={isUpdating}
                  />
                </div>

                {/* Territory Details Display */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Current Territory Details
                  </Label>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium text-gray-900">
                        {territory?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span
                        className={`font-medium ${
                          territory?.status === "ACTIVE"
                            ? "text-green-600"
                            : territory?.status === "SCHEDULED"
                            ? "text-yellow-600"
                            : territory?.status === "COMPLETED"
                            ? "text-purple-600"
                            : "text-orange-600"
                        }`}
                      >
                        {territory?.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Residents:</span>
                      <span className="font-medium text-blue-600">
                        {territory?.totalResidents ||
                          territory?.buildingData?.totalBuildings ||
                          territory?.buildingData?.residentialHomes ||
                          0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium text-gray-900">
                        {territory?.createdAt
                          ? new Date(territory.createdAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Boundary:</span>
                      <span className="font-medium text-gray-900">
                        Polygon Area
                      </span>
                    </div>
                  </div>
                </div>

                {/* Building Detection Status */}
                {isDetectingBuildings && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">
                      Building Detection
                    </Label>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm font-medium text-blue-800">
                          Detecting buildings and residents...
                        </span>
                      </div>
                      <div className="text-xs text-blue-600">
                        Analyzing the new boundary area to identify residential
                        buildings
                      </div>
                    </div>
                  </div>
                )}

                {/* Detected Buildings Display */}
                {detectedBuildings && detectedBuildings.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">
                      Newly Detected Buildings ({detectedBuildings.length})
                    </Label>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-green-800 mb-2">
                        Buildings detected in new boundary
                      </div>
                      <div
                        className="space-y-1 max-h-48 overflow-y-auto"
                        style={{
                          scrollbarWidth: "thin",
                          scrollbarColor: "#9CA3AF #F3F4F6",
                        }}
                      >
                        {detectedBuildings.map((building, index) => (
                          <div
                            key={index}
                            className="text-xs text-green-700 flex justify-between items-start py-1"
                          >
                            <span className="flex-1 pr-2">
                              {building.buildingNumber && (
                                <span className="font-medium text-green-800">
                                  #{building.buildingNumber}
                                </span>
                              )}{" "}
                              {building.address || `Building ${index + 1}`}
                            </span>
                            <span className="text-green-600 flex-shrink-0">
                              ✓
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Boundary Button */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Boundary Management
                  </Label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-blue-800 mb-2">
                      Edit Territory Boundary
                    </div>
                    <div className="text-xs text-blue-600 mb-3">
                      Click to enable drawing mode on the map. Draw a new
                      polygon to update the boundary and automatically detect
                      residents.
                    </div>
                    <Button
                      type="button"
                      onClick={handleEditBoundary}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-10"
                      disabled={isUpdating}
                    >
                      Edit Boundary on Map
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium h-12"
                    onClick={handleUpdateTerritory}
                    disabled={
                      isDetectingBuildings || isUpdating || !hasChanges()
                    }
                  >
                    {isUpdating ? "Updating..." : "Update Territory"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12"
                    onClick={() => setIsEditTerritoryOpen(false)}
                    disabled={isDetectingBuildings || isUpdating}
                  >
                    Cancel
                  </Button>
                </div>
                {!hasChanges() && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    No changes detected. Make changes to name, description, or
                    boundary to enable update.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {isEditFormOpen && !hideAssignmentSection && (
          <div className="flex-1 flex flex-col min-h-0">
            <form
              onSubmit={handleSubmit}
              className="flex-1 flex flex-col min-h-0"
            >
              <div
                className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400"
                style={{ minHeight: "600px" }}
                onWheel={(e) => e.stopPropagation()}
              >
                <div className="space-y-6 pr-2 pb-32">
                  {/* Header */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Territory Assignment
                      </h2>
                      <button
                        type="button"
                        onClick={() => setIsEditFormOpen(false)}
                        className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                        title="Hide form"
                      >
                        <EyeOff className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Success Message */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-green-800">
                        Territory Saved as {territory?.status || "Draft"}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        You can assign it now or leave it for later assignment
                      </div>
                    </div>
                  </div>

                  {/* Territory Details - Moved to top */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">
                      Territory Details
                    </Label>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium text-gray-900">
                          {territory?.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span
                          className={`font-medium ${
                            territory?.status === "ACTIVE"
                              ? "text-green-600"
                              : territory?.status === "SCHEDULED"
                              ? "text-yellow-600"
                              : territory?.status === "COMPLETED"
                              ? "text-purple-600"
                              : "text-orange-600"
                          }`}
                        >
                          {territory?.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Residents:</span>
                        <span className="font-medium text-blue-600">
                          {territory?.totalResidents ||
                            territory?.buildingData?.totalBuildings ||
                            territory?.buildingData?.residentialHomes ||
                            0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium text-gray-900">
                          {territory?.createdAt
                            ? new Date(territory.createdAt).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assignment Type - Hidden for agents */}
                  {!hideAssignmentTypeOptions && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">
                        Assignment Type
                      </Label>
                      <RadioGroup
                        value={assignmentType}
                        onValueChange={handleAssignmentTypeChange}
                        disabled={isUpdating}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="none"
                              id="none-edit"
                              className="border-2"
                            />
                            <Label
                              htmlFor="none-edit"
                              className="text-sm font-medium flex items-center gap-2"
                            >
                              <span className="text-lg">❌</span>
                              Not Assign
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="team"
                              id="team-edit"
                              className="border-2"
                            />
                            <Label
                              htmlFor="team-edit"
                              className="text-sm font-medium flex items-center gap-2"
                            >
                              <span className="text-lg">👥</span>
                              Team
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="individual"
                              id="individual-edit"
                              className="border-2"
                            />
                            <Label
                              htmlFor="individual-edit"
                              className="text-sm font-medium flex items-center gap-2"
                            >
                              <span className="text-lg">👤</span>
                              Individual
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {/* Team Selection */}
                  {!hideAssignmentTypeOptions && assignmentType === "team" && (
                    <div className="space-y-3">
                      <Label
                        htmlFor="teamSearch"
                        className="text-sm font-medium text-gray-700"
                      >
                        Search Team
                      </Label>
                      <Input
                        id="teamSearch"
                        type="text"
                        value={teamSearchText}
                        onChange={(e) => setTeamSearchText(e.target.value)}
                        placeholder="Search for team name..."
                        className="h-12 text-base"
                        disabled={isUpdating}
                      />
                      {/* Show matching teams */}
                      {teamSearchText &&
                        (() => {
                          const matchingTeams = availableTeams.filter(
                            (team) =>
                              team.name
                                .toLowerCase()
                                .includes(teamSearchText.toLowerCase()) &&
                              team._id !== selectedTeam // Exclude currently selected team
                          );
                          return (
                            matchingTeams.length > 0 && (
                              <div
                                className="mt-2 space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 bg-white"
                                style={{
                                  scrollbarWidth: "thin",
                                  scrollbarColor: "#9CA3AF #F3F4F6",
                                }}
                              >
                                {matchingTeams.map((team) => (
                                  <div
                                    key={team._id}
                                    className="p-3 hover:bg-gray-100 rounded cursor-pointer"
                                    onClick={() => {
                                      setSelectedTeam(team._id);
                                      setTeamSearchText(team.name);
                                    }}
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-900">
                                        {team.name}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {team.agentIds?.length || 0} members
                                      </p>

                                      {/* Assignment Status Badge */}
                                      <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                                          (team.performance?.zoneCoverage ??
                                            0) > 0
                                            ? "bg-green-100 text-green-800"
                                            : "bg-gray-100 text-gray-600"
                                        }`}
                                      >
                                        {(team.performance?.zoneCoverage ?? 0) >
                                        0
                                          ? "✓ Assigned"
                                          : "○ Unassigned"}
                                      </span>

                                      {/* Current Zone Coverage */}
                                      {(team.performance?.zoneCoverage ?? 0) >
                                        0 && (
                                        <div className="mt-1">
                                          <p className="text-xs text-blue-600">
                                            🗺️ Currently assigned to{" "}
                                            {team.performance?.zoneCoverage ??
                                              0}{" "}
                                            zone(s)
                                          </p>
                                        </div>
                                      )}

                                      {/* Team Leader */}
                                      {team.leaderId && (
                                        <p className="text-xs text-gray-600 mt-1">
                                          👑 Leader: {team.leaderId.name}
                                        </p>
                                      )}

                                      {/* Team Status */}
                                      {team.status && (
                                        <p className="text-xs text-gray-600">
                                          Status: {team.status}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          );
                        })()}

                      {/* Show selected team with remove button */}
                      {selectedTeam &&
                        (() => {
                          const selectedTeamData = availableTeams.find(
                            (team) => team._id === selectedTeam
                          );
                          return (
                            selectedTeamData && (
                              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                                <span className="text-sm font-medium text-green-800">
                                  {selectedTeamData.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTeam("");
                                    setTeamSearchText("");
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )
                          );
                        })()}
                    </div>
                  )}

                  {/* Individual Agent Selection */}
                  {!hideAssignmentTypeOptions &&
                    assignmentType === "individual" && (
                      <div className="space-y-3">
                        <Label
                          htmlFor="agentSearch"
                          className="text-sm font-medium text-gray-700"
                        >
                          Search Agent
                        </Label>
                        <Input
                          id="agentSearch"
                          type="text"
                          value={agentSearchText}
                          onChange={(e) => setAgentSearchText(e.target.value)}
                          placeholder="Search for agent name or email..."
                          className="h-12 text-base"
                          disabled={isUpdating}
                        />
                        {/* Show matching agents */}
                        {agentSearchText &&
                          (() => {
                            const matchingAgents = availableAgents.filter(
                              (agent) =>
                                (agent.name
                                  .toLowerCase()
                                  .includes(agentSearchText.toLowerCase()) ||
                                  agent.email
                                    .toLowerCase()
                                    .includes(agentSearchText.toLowerCase())) &&
                                agent._id !== assignedRep // Exclude currently selected agent
                            );
                            return (
                              matchingAgents.length > 0 && (
                                <div
                                  className="mt-2 space-y-1 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-2 bg-white"
                                  style={{
                                    scrollbarWidth: "thin",
                                    scrollbarColor: "#9CA3AF #F3F4F6",
                                  }}
                                >
                                  {matchingAgents.map((agent) => (
                                    <div
                                      key={agent._id}
                                      className="flex items-center justify-between p-3 hover:bg-gray-100 rounded cursor-pointer"
                                      onClick={() => {
                                        setAssignedRep(agent._id);
                                        setAgentSearchText(
                                          `${agent.name} (${agent.email})`
                                        );
                                      }}
                                    >
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900">
                                          {agent.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          {agent.email}
                                        </p>

                                        {/* Assignment Status Badge */}
                                        {agent.assignmentSummary && (
                                          <div className="mt-1">
                                            <span
                                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                agent.assignmentSummary
                                                  .currentAssignmentStatus ===
                                                "ASSIGNED"
                                                  ? "bg-green-100 text-green-800"
                                                  : "bg-gray-100 text-gray-600"
                                              }`}
                                            >
                                              {agent.assignmentSummary
                                                .currentAssignmentStatus ===
                                              "ASSIGNED"
                                                ? "✓ Assigned"
                                                : "○ Unassigned"}
                                            </span>

                                            {/* Detailed Assignment Status */}
                                            {agent.assignmentSummary
                                              .assignmentDetails && (
                                              <div className="mt-1 space-y-1">
                                                {agent.assignmentSummary
                                                  .assignmentDetails
                                                  .isFullyAssigned && (
                                                  <p className="text-xs text-green-600 font-medium">
                                                    ✓ Fully assigned (
                                                    {
                                                      agent.assignmentSummary
                                                        .assignmentDetails
                                                        .totalAssignments
                                                    }{" "}
                                                    total)
                                                  </p>
                                                )}
                                                {agent.assignmentSummary
                                                  .assignmentDetails
                                                  .isPartiallyAssigned && (
                                                  <p className="text-xs text-yellow-600 font-medium">
                                                    ⚠ Partially assigned (
                                                    {
                                                      agent.assignmentSummary
                                                        .assignmentDetails
                                                        .totalAssignments
                                                    }{" "}
                                                    total)
                                                  </p>
                                                )}
                                                {agent.assignmentSummary
                                                  .assignmentDetails
                                                  .isOnlyScheduled && (
                                                  <p className="text-xs text-purple-600 font-medium">
                                                    📅 Scheduled only (
                                                    {
                                                      agent.assignmentSummary
                                                        .totalScheduledZones
                                                    }{" "}
                                                    scheduled)
                                                  </p>
                                                )}

                                                {/* Assignment Breakdown */}
                                                <div className="text-xs text-gray-600">
                                                  {agent.assignmentSummary
                                                    .assignmentDetails
                                                    .hasIndividualAssignments && (
                                                    <span className="inline-block mr-2">
                                                      👤{" "}
                                                      {
                                                        agent.assignmentSummary
                                                          .individualZones
                                                          .length
                                                      }{" "}
                                                      individual
                                                    </span>
                                                  )}
                                                  {agent.assignmentSummary
                                                    .assignmentDetails
                                                    .hasTeamAssignments && (
                                                    <span className="inline-block mr-2">
                                                      👥{" "}
                                                      {
                                                        agent.assignmentSummary
                                                          .teamZones.length
                                                      }{" "}
                                                      team
                                                    </span>
                                                  )}
                                                  {agent.assignmentSummary
                                                    .assignmentDetails
                                                    .hasScheduledIndividualAssignments && (
                                                    <span className="inline-block mr-2">
                                                      📅{" "}
                                                      {
                                                        agent.assignmentSummary
                                                          .totalScheduledZones
                                                      }{" "}
                                                      scheduled
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Team Membership Information */}
                                        {agent.teamMemberships &&
                                          agent.teamMemberships.length > 0 && (
                                            <div className="mt-1">
                                              <div className="flex flex-wrap gap-1">
                                                {agent.teamMemberships.map(
                                                  (team) => (
                                                    <span
                                                      key={team.teamId}
                                                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        team.isPrimary
                                                          ? "bg-blue-100 text-blue-800"
                                                          : "bg-gray-100 text-gray-700"
                                                      }`}
                                                    >
                                                      {team.teamName}
                                                      {team.isPrimary && (
                                                        <span className="ml-1 text-blue-600">
                                                          ★
                                                        </span>
                                                      )}
                                                    </span>
                                                  )
                                                )}
                                              </div>
                                              <p className="text-xs text-amber-600 mt-1">
                                                Already in{" "}
                                                {agent.teamMemberships.length}{" "}
                                                team(s)
                                              </p>
                                            </div>
                                          )}
                                      </div>
                                      <div className="flex items-center gap-2 ml-2">
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {agent.status}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )
                            );
                          })()}

                        {/* Show selected agent with remove button */}
                        {assignedRep &&
                          (() => {
                            const selectedAgentData = availableAgents.find(
                              (agent) => agent._id === assignedRep
                            );
                            return (
                              selectedAgentData && (
                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                                  <span className="text-sm font-medium text-green-800">
                                    {selectedAgentData.name} (
                                    {selectedAgentData.email})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAssignedRep("");
                                      setAgentSearchText("");
                                    }}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              )
                            );
                          })()}
                      </div>
                    )}

                  {/* Assignment Date */}
                  {hideAssignmentTypeOptions ||
                  assignmentType === "individual" ||
                  assignmentType === "team" ? (
                    <div className="space-y-3">
                      <Label
                        htmlFor="assignedDate"
                        className="text-sm font-medium text-gray-700"
                      >
                        Assignment Date
                      </Label>
                      <div className="relative">
                        <Input
                          id="assignedDate"
                          type="date"
                          value={assignedDate}
                          onChange={(e) => setAssignedDate(e.target.value)}
                          className="h-12 text-base pr-10"
                          placeholder="dd-mm-yyyy"
                          disabled={isUpdating}
                        />
                        {/* Custom calendar icon */}
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-400"
                          >
                            <rect
                              x="3"
                              y="4"
                              width="18"
                              height="18"
                              rx="2"
                              ry="2"
                            ></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-medium h-12"
                      disabled={
                        isUpdating || !territoryName.trim() || !hasChanges()
                      }
                    >
                      {isUpdating ? "Updating..." : "Update Assignment"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-12"
                      onClick={() => setIsEditFormOpen(false)}
                      disabled={isUpdating}
                    >
                      Skip for Now
                    </Button>
                  </div>
                  {!hasChanges() && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      No changes detected. Make changes to name, description,
                      boundary, or assignment to enable update.
                    </p>
                  )}

                  {/* Extra spacing to ensure scrollbar appears */}
                  <div className="h-8"></div>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
      <style jsx global>{`
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px !important;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f3f4f6 !important;
          border-radius: 3px !important;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #9ca3af !important;
          border-radius: 3px !important;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #6b7280 !important;
        }

        /* Force scrollbar to show */
        .overflow-y-auto {
          overflow-y: scroll !important;
        }
      `}</style>
    </div>
  );
}
