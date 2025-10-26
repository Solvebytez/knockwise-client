"use client";

import {
  Users,
  UserCheck,
  UserX,
  Building,
  Activity,
  UserPlus,
  Target,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useTeamStats,
  useUserManagementStats,
} from "@/hooks/use-admin-dashboard";
import { WorkforceManagementSkeleton } from "./skeleton-loading";

export function WorkforceManagementOverviewIndependent() {
  const router = useRouter();

  // Independent hooks for team stats and user stats
  const teamStats = useTeamStats();
  const userStats = useUserManagementStats();

  if (teamStats.isLoading || userStats.isLoading) {
    return <WorkforceManagementSkeleton />;
  }

  if (teamStats.isError || userStats.isError) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">
            Failed to load workforce management data
          </p>
        </div>
      </div>
    );
  }

  const teamData = teamStats.data || {
    totalTeams: 0,
    totalMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    assignedMembers: 0,
    unassignedMembers: 0,
    totalZones: 0,
    recentActivity: {
      newMembers: 0,
      completedTasks: 0,
      activeSessions: 0,
    },
    agentsWithIndividualOnlyAssignments: 0,
  };

  const userData = userStats.data || {
    totalAgents: 0,
    agentsWithTeams: 0,
    agentsWithoutTeams: 0,
    agentsWithIndividualOnlyAssignments: 0,
    agentsWithNoAssignments: 0,
    agentsWithTeamAssignments: 0,
    agentsWithBothAssignments: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Workforce Management Overview
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/teams")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Manage Teams
          </button>
          <button
            onClick={() => router.push("/agents")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Manage Agents
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Teams</p>
              <p className="text-2xl font-bold text-gray-900">
                {teamData.totalTeams}
              </p>
            </div>
            <Building className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-4">
            <span className="text-xs text-gray-500">
              {teamData.totalMembers} total members
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Members
              </p>
              <p className="text-2xl font-bold text-green-600">
                {teamData.activeMembers}
              </p>
            </div>
            <UserCheck className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-4">
            <span className="text-xs text-gray-500">
              {teamData.inactiveMembers} inactive
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Assigned Members
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {teamData.assignedMembers}
              </p>
            </div>
            <Target className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-4">
            <span className="text-xs text-gray-500">
              {teamData.unassignedMembers} unassigned
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Statistics */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Team Statistics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Teams</span>
              <span className="font-medium">{teamData.totalTeams}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Members</span>
              <span className="font-medium">{teamData.totalMembers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Members</span>
              <span className="font-medium text-green-600">
                {teamData.activeMembers}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Assigned Members</span>
              <span className="font-medium text-blue-600">
                {teamData.assignedMembers}
              </span>
            </div>
          </div>
        </div>

        {/* Agent Statistics */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Agent Statistics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Agents</span>
              <span className="font-medium">{userData.totalAgents}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">With Teams</span>
              <span className="font-medium text-green-600">
                {userData.agentsWithTeams}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Without Teams</span>
              <span className="font-medium text-orange-600">
                {userData.agentsWithoutTeams}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Individual Only</span>
              <span className="font-medium text-blue-600">
                {userData.agentsWithIndividualOnlyAssignments}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <UserPlus className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">New Members</p>
              <p className="text-lg font-semibold">
                {teamData.recentActivity.newMembers}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Completed Tasks</p>
              <p className="text-lg font-semibold">
                {teamData.recentActivity.completedTasks}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">Active Sessions</p>
              <p className="text-lg font-semibold">
                {teamData.recentActivity.activeSessions}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
