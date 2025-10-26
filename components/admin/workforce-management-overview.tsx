"use client";

import {
  Users,
  UserCheck,
  UserX,
  Building,
  MapPin,
  Activity,
  UserPlus,
  Target,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface WorkforceManagementOverviewProps {
  teamStats: {
    totalTeams: number;
    totalMembers: number;
    activeMembers: number;
    inactiveMembers: number;
    assignedMembers: number;
    unassignedMembers: number;
    totalZones: number;
    recentActivity: {
      newMembers: number;
      completedTasks: number;
      activeSessions: number;
    };
    agentsWithIndividualOnlyAssignments: number;
  } | null;
  userStats: {
    totalAgents: number;
  } | null;
}

export function WorkforceManagementOverview({
  teamStats,
  userStats,
}: WorkforceManagementOverviewProps) {
  const router = useRouter();

  if (!teamStats || !userStats) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Calculate independent agents (agents not in any team)
  const independentAgents = teamStats?.agentsWithIndividualOnlyAssignments || 0;
  const totalAgents = userStats?.totalAgents || 0;

  // Calculate zone assignments
  const assignedZones = teamStats?.totalZones || 0; // This needs backend adjustment to show only assigned zones
  const unassignedZones = 0; // This needs backend to provide unassigned count

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Workforce Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Overview of your teams, members and zone assignments
          </p>
        </div>
        <button
          onClick={() => router.push("/create-team")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          Manage Workforce →
        </button>
      </div>

      {/* Simple Metric Cards - Similar to Manage Team Tab */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Teams */}
        <div
          className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push("/create-team")}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-50">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Teams
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {teamStats?.totalTeams || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500">
                {teamStats?.totalTeams || 0} teams created
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Total Members */}
        <div
          className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push("/create-team")}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-50">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Members
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {teamStats?.totalMembers || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500">
                {teamStats?.recentActivity?.newMembers || 0} new this month
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Assigned Members */}
        <div
          className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push("/create-team")}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-50">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Assigned Members
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {teamStats?.assignedMembers || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500">
                {teamStats?.assignedMembers || 0} have zones
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Unassigned Members */}
        <div
          className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push("/create-team")}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-orange-50">
                  <UserX className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Unassigned Members
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {teamStats?.unassignedMembers || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500">No zones assigned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Independent Agents Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <UserCheck className="w-5 h-5 mr-2 text-purple-600" />
              Independent Agents
            </h3>
          </div>
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {independentAgents}
            </div>
            <p className="text-sm text-gray-600">
              Agents working without team assignment
            </p>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Team Members</span>
                <span className="font-semibold text-gray-900">
                  {teamStats?.totalMembers || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Independent</span>
                <span className="font-semibold text-purple-600">
                  {independentAgents}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Total Agents</span>
                <span className="font-semibold text-blue-600">
                  {totalAgents}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Zone Assignments Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              Zone Assignments
            </h3>
          </div>
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {teamStats?.totalZones || 0}
            </div>
            <p className="text-sm text-gray-600">Total zones managed</p>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Active Zones</span>
                <span className="font-semibold text-green-600">
                  {teamStats?.totalZones || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Team Zones</span>
                <span className="font-semibold text-blue-600">
                  {teamStats?.totalZones || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Individual Zones</span>
                <span className="font-semibold text-purple-600">
                  {independentAgents > 0 ? independentAgents : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-orange-600" />
            Recent Activity
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-100">
                <UserPlus className="w-4 h-4 text-green-600" />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                New Members
              </span>
            </div>
            <span className="text-lg font-bold text-gray-900">
              {teamStats?.recentActivity?.newMembers || 0}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                Active Sessions
              </span>
            </div>
            <span className="text-lg font-bold text-gray-900">
              {teamStats?.recentActivity?.activeSessions || 0}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-purple-100">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                Completed Tasks
              </span>
            </div>
            <span className="text-lg font-bold text-gray-900">
              {teamStats?.recentActivity?.completedTasks || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
