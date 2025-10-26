"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Edit,
  Trash2,
  Eye,
  Search,
  Plus,
  Calendar,
  Users,
  Building2,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiInstance } from "@/lib/apiInstance";
import { agentZoneApi } from "@/lib/api/agentZoneApi";
import { toast } from "sonner";
import { useAuthStore } from "@/store/userStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AgentTerritory {
  _id: string;
  name: string;
  description: string;
  status: string;
  createdBy: string; // Add createdBy field for ownership check
  assignmentType: string;
  isScheduled: boolean;
  isPrimary: boolean;
  teamName?: string;
  teamId?: string;
  scheduledDate?: string;
  statistics: {
    totalHouses: number;
    visitedCount: number; // API returns visitedCount, not visitedToday
    notVisitedCount: number; // API returns notVisitedCount, not notVisited
    interestedCount: number; // API returns interestedCount, not interested
    notInterestedCount: number; // API returns notInterestedCount, not notInterested
    completionPercentage: number;
  };
  boundary?: any;
  buildingData?: {
    totalBuildings: number;
    residentialHomes: number;
    addresses: string[];
  };
  createdAt: string;
  updatedAt: string;
  lastActivity?: string;
  totalResidents: number;
  areaId?: {
    _id: string;
    name: string;
    type: string;
  };
  municipalityId?: {
    _id: string;
    name: string;
    type: string;
  };
  communityId?: {
    _id: string;
    name: string;
    type: string;
  };
  activeResidents: number;
  completionRate: number;
  averageKnocks: number;
}

export default function MyTerritoriesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteZoneId, setDeleteZoneId] = useState<string | null>(null);

  // Fetch agent's territories (all assigned territories)
  const {
    data: territoriesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["myTerritories"],
    queryFn: async () => {
      const response = await apiInstance.get("/users/my-territories");
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  // Delete zone mutation (only for zones created by the agent)
  const deleteZoneMutation = useMutation({
    mutationFn: (zoneId: string) => agentZoneApi.deleteZone(zoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTerritories"] });
      toast.success("Territory deleted successfully");
      setDeleteZoneId(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to delete territory"
      );
    },
  });

  // Ensure territories is always an array
  // The API returns { success: true, data: { territories: [...], summary: {...} } }
  const territories: AgentTerritory[] = Array.isArray(
    territoriesData?.data?.territories
  )
    ? territoriesData.data.territories
    : [];

  // Helper function to check if current agent is the creator of a territory
  const isTerritoryCreatedByAgent = (territory: AgentTerritory): boolean => {
    return territory.createdBy === user?._id;
  };

  const formatLocationHierarchy = (territory: AgentTerritory) => {
    const parts = [];
    if (territory.areaId?.name) parts.push(territory.areaId.name);
    if (territory.municipalityId?.name)
      parts.push(territory.municipalityId.name);
    if (territory.communityId?.name) parts.push(territory.communityId.name);
    return parts.length > 0 ? parts.join(" > ") : "No location assigned";
  };

  // Filter territories based on search term
  const filteredTerritories = territories.filter(
    (territory) =>
      territory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      territory.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditZone = (zoneId: string) => {
    router.push(`/my-territory/${zoneId}`);
  };

  const handleViewZone = (zoneId: string) => {
    router.push(`/agent-map-view/${zoneId}`);
  };

  const handleDeleteZone = (zoneId: string) => {
    deleteZoneMutation.mutate(zoneId);
  };

  const handleCreateZone = () => {
    router.push("/create-my-zone");
  };

  const handleBackToDashboard = () => {
    router.push("/agent");
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="px-6 py-4 bg-white border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                My Territories
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your created territories
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToDashboard}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#42A5F5] mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading your territories...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col">
        <div className="px-6 py-4 bg-white border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                My Territories
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your created territories
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToDashboard}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600">Failed to load territories</p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Territories</h1>
            <p className="text-gray-600 mt-1">
              Manage your assigned territories ({territories.length} total)
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToDashboard}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button
              size="sm"
              onClick={handleCreateZone}
              className="bg-[#42A5F5] hover:bg-[#357ABD] text-white border-0 shadow-sm flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Territory
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6 bg-gray-50">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search territories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20"
              />
            </div>
          </div>

          {/* Territories Grid */}
          {filteredTerritories.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm
                  ? "No territories found"
                  : "No territories created yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Create your first territory to get started"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={handleCreateZone}
                  className="bg-[#42A5F5] hover:bg-[#357ABD] text-white border-0 shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Territory
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTerritories.map((territory) => (
                <Card
                  key={territory._id}
                  className="border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-gray-900 mb-1">
                          {territory.name}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600">
                          {territory.description || "No description"}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant={
                            territory.status === "ACTIVE"
                              ? "default"
                              : "secondary"
                          }
                          className={`text-xs ${
                            territory.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {territory.status}
                        </Badge>
                        {territory.isPrimary && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-blue-50 text-blue-700"
                          >
                            Primary
                          </Badge>
                        )}
                        {territory.isScheduled && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-yellow-50 text-yellow-700"
                          >
                            Scheduled
                          </Badge>
                        )}
                        {isTerritoryCreatedByAgent(territory) && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-purple-50 text-purple-700"
                          >
                            Created by You
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Territory Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <Building2 className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <div className="text-lg font-semibold text-blue-900">
                          {territory.statistics.totalHouses}
                        </div>
                        <div className="text-xs text-blue-700">
                          Total Houses
                        </div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
                        <div className="text-lg font-semibold text-green-900">
                          {territory.statistics.visitedCount}
                        </div>
                        <div className="text-xs text-green-700">Visited</div>
                      </div>
                    </div>

                    {/* Assignment Info */}
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3" />
                        <span className="font-medium">Assignment:</span>
                      </div>
                      <div className="space-y-2">
                        {isTerritoryCreatedByAgent(territory) ? (
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
                              Type: individual (My self)
                            </Badge>
                          </div>
                        ) : territory.assignmentType === "team" &&
                          territory.teamName ? (
                          <div className="flex flex-col gap-2">
                            <Badge
                              variant="outline"
                              className="text-xs bg-green-50 text-green-700 border-green-200"
                            >
                              Type: team
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs bg-green-50 text-green-700 border-green-200"
                            >
                              Team: {territory.teamName}
                            </Badge>
                            {territory.scheduledDate && (
                              <div className="text-xs text-gray-500">
                                Scheduled:{" "}
                                {new Date(
                                  territory.scheduledDate
                                ).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="pl-4 space-y-1">
                            <div>Type: {territory.assignmentType}</div>
                            {territory.teamName && (
                              <div>Team: {territory.teamName}</div>
                            )}
                            {territory.scheduledDate && (
                              <div>
                                Scheduled:{" "}
                                {new Date(
                                  territory.scheduledDate
                                ).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Location Hierarchy */}
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-1 mb-1">
                        <MapPin className="w-3 h-3" />
                        <span className="font-medium">Location:</span>
                      </div>
                      <div className="pl-4">
                        <div className="text-xs text-gray-500">
                          {formatLocationHierarchy(territory)}
                        </div>
                      </div>
                    </div>

                    {/* Status Breakdown */}
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Not Visited:</span>
                        <span className="font-medium">
                          {territory.statistics.notVisitedCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Interested:</span>
                        <span className="font-medium text-green-600">
                          {territory.statistics.interestedCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Not Interested:</span>
                        <span className="font-medium text-red-600">
                          {territory.statistics.notInterestedCount}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewZone(territory._id)}
                        className="flex-1 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                      {/* Only show edit button for territories created by the agent */}
                      {isTerritoryCreatedByAgent(territory) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditZone(territory._id)}
                          className="flex-1 flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                      )}
                      {/* Only show delete button for territories created by the agent */}
                      {isTerritoryCreatedByAgent(territory) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Territory
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "
                                {territory.name}"? This action cannot be undone.
                                All associated data will be permanently removed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteZone(territory._id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
