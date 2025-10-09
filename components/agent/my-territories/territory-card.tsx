"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Users,
  Calendar,
  Clock,
  MoreHorizontal,
  Eye,
  Map as MapIcon,
  Activity,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Territory } from "@/lib/api/agentApi";
import { apiInstance } from "@/lib/apiInstance";
import { toast } from "sonner";

interface TerritoryCardProps {
  territory: Territory;
}

export function TerritoryCard({ territory }: TerritoryCardProps) {
  const router = useRouter();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [showTeamMembers, setShowTeamMembers] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Determine color based on completion percentage
  const getStatusColor = () => {
    if (territory.statistics.completionPercentage >= 70) return "bg-green-100";
    if (territory.statistics.completionPercentage >= 40) return "bg-blue-100";
    return "bg-orange-100";
  };

  const getIconColor = () => {
    if (territory.statistics.completionPercentage >= 70)
      return "text-green-600";
    if (territory.statistics.completionPercentage >= 40) return "text-blue-600";
    return "text-orange-600";
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get completion rate color
  const getCompletionRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 75) return "text-blue-600";
    if (rate >= 60) return "text-orange-600";
    return "text-red-600";
  };

  // Handle see members API call
  const handleSeeMembers = async () => {
    console.log("🔍 Agent Quick View - Territory data:", {
      teamId: territory.teamId,
      teamName: territory.teamName,
      assignmentType: territory.assignmentType,
    });

    if (!territory.teamId) {
      console.warn("⚠️ No teamId available for fetching members");
      return;
    }

    setIsLoadingMembers(true);
    try {
      console.log(`📡 Fetching team members for teamId: ${territory.teamId}`);
      const response = await apiInstance.get(`/teams/${territory.teamId}`);
      console.log("✅ Team members response:", response.data);

      if (response.data.success && response.data.data.agentIds) {
        setTeamMembers(response.data.data.agentIds);
        console.log(
          `👥 Loaded ${response.data.data.agentIds.length} team members`
        );
      }
    } catch (error) {
      console.error("❌ Error fetching team members:", error);
      toast.error("Failed to load team members");
    } finally {
      setIsLoadingMembers(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className={`p-2 ${getStatusColor()} rounded-lg`}>
            <MapPin className={`h-5 w-5 ${getIconColor()}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{territory.name}</h3>
              {territory.isPrimary && (
                <Badge variant="default" className="bg-blue-600 text-white">
                  Primary
                </Badge>
              )}
              {territory.isScheduled && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-800"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Scheduled
                </Badge>
              )}
            </div>

            <p className="text-sm text-gray-600 mt-1">
              {territory.statistics.totalHouses} houses •{" "}
              {territory.statistics.visitedCount} visited today
            </p>

            {/* Assignment type and team info */}
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-xs text-gray-500 flex items-center">
                {territory.assignmentType === "team" ? (
                  <>
                    <Users className="w-3 h-3 mr-1" />
                    Team: {territory.teamName}
                  </>
                ) : (
                  <>
                    <MapPin className="w-3 h-3 mr-1" />
                    Individual Assignment
                  </>
                )}
              </span>

              {territory.isScheduled && territory.scheduledDate && (
                <span className="text-xs text-gray-500 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Starts: {formatDate(territory.scheduledDate)}
                </span>
              )}
            </div>

            {/* Progress bar */}
            {!territory.isScheduled && territory.statistics.totalHouses > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{territory.statistics.completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${territory.statistics.completionPercentage}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {territory.isScheduled ? (
            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
              Pending
            </Badge>
          ) : (
            <Badge variant="default" className="bg-green-100 text-green-800">
              Active
            </Badge>
          )}

          {/* Three-dot dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsQuickViewOpen(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Quick View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/agent-map-view/${territory._id}`)}
              >
                <MapIcon className="mr-2 h-4 w-4" />
                Map View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick View Dialog */}
      <Dialog
        open={isQuickViewOpen}
        onOpenChange={(open) => {
          setIsQuickViewOpen(open);
          if (open) {
            console.log("🔍 Opening Quick View for territory:", territory);
          }
          if (!open) {
            setShowTeamMembers(false);
            setTeamMembers([]);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-6 h-6 bg-[#42A5F5] rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              Territory Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Territory Name:</span>
                  <span className="font-medium text-gray-900">
                    {territory.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Description:</span>
                  <span className="font-medium text-gray-900">
                    {territory.description || "No description"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge
                    className={`text-xs ${getStatusBadgeColor(
                      territory.status
                    )}`}
                  >
                    {territory.status}
                  </Badge>
                </div>
                {territory.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(territory.createdAt)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignment Information */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Assignment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Assigned Agent:</span>
                  <span className="font-medium text-gray-900">
                    {territory.assignmentType === "team"
                      ? "Team Assignment"
                      : "Individual Assignment"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Agent Email:</span>
                  <span className="font-medium text-gray-900">
                    {territory.assignmentType === "team"
                      ? "Team Assignment"
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Team:</span>
                  <span className="font-medium text-gray-900">
                    {territory.teamName || "No team assigned"}
                  </span>
                </div>

                {/* See Members Button - Only show if there's a team assignment */}
                {territory.teamId && (
                  <div className="pt-3 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!showTeamMembers) {
                          handleSeeMembers();
                        }
                        setShowTeamMembers(!showTeamMembers);
                      }}
                      className="w-full"
                      disabled={isLoadingMembers}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {isLoadingMembers
                        ? "Loading..."
                        : showTeamMembers
                        ? "Hide Members"
                        : "See Members"}
                    </Button>
                  </div>
                )}

                {/* Team Members List - Expandable */}
                {showTeamMembers && (
                  <div className="pt-3 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Team Members
                    </h4>
                    {isLoadingMembers ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="text-gray-500">Loading members...</div>
                      </div>
                    ) : teamMembers.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {teamMembers.map((member: any, index: number) => (
                          <div
                            key={member._id || index}
                            className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg"
                          >
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <UserCheck className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {member.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {member.email}
                              </p>
                            </div>
                            <Badge
                              className={`text-xs ${
                                member.assignmentStatus === "ASSIGNED"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-gray-100 text-gray-800 border-gray-200"
                              }`}
                            >
                              {member.assignmentStatus || "UNASSIGNED"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No members found in this team
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-600">
                      {territory.totalResidents ||
                        territory.statistics.totalHouses}
                    </div>
                    <div className="text-xs text-gray-600">Total Residents</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">
                      {territory.activeResidents || 0}
                    </div>
                    <div className="text-xs text-gray-600">
                      Active Residents
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div
                      className={`text-xl font-bold ${getCompletionRateColor(
                        territory.completionRate ||
                          territory.statistics.completionPercentage
                      )}`}
                    >
                      {territory.completionRate ||
                        territory.statistics.completionPercentage}
                      %
                    </div>
                    <div className="text-xs text-gray-600">Completion Rate</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-xl font-bold text-orange-600">
                      {territory.averageKnocks || 0}
                    </div>
                    <div className="text-xs text-gray-600">Avg Knocks</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Last activity recorded
                      </p>
                      <p className="text-xs text-gray-500">
                        {territory.lastActivity || territory.updatedAt
                          ? formatDate(
                              territory.lastActivity || territory.updatedAt!
                            )
                          : "No activity recorded"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
