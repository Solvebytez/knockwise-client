"use client";

import { MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTerritoryStats } from "@/hooks/use-admin-dashboard";
import { TerritoryStatusSkeleton } from "./skeleton-loading";

interface TerritoryStats {
  totalTerritories: number;
  activeTerritories: number;
  assignedTerritories: number;
  unassignedTerritories: number;
  totalResidents: number;
  activeResidents: number;
  averageCompletionRate: number;
  recentActivity?: number;
  topPerformingTerritory?: {
    name: string;
    completionRate: number;
  };
}

export function TerritoryStatusCardIndependent() {
  const territoryStats = useTerritoryStats();

  if (territoryStats.isLoading) {
    return <TerritoryStatusSkeleton />;
  }

  if (territoryStats.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            Territory Status
          </CardTitle>
          <CardDescription>Overview of territory assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">Failed to load territory status</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = territoryStats.data || {
    totalTerritories: 0,
    activeTerritories: 0,
    assignedTerritories: 0,
    unassignedTerritories: 0,
    totalResidents: 0,
    activeResidents: 0,
    averageCompletionRate: 0,
    recentActivity: 0,
    topPerformingTerritory: undefined,
  };

  const assignmentRate = Math.round(
    (data.assignedTerritories / data.totalTerritories) * 100
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-500" />
          Territory Status
        </CardTitle>
        <CardDescription>Overview of territory assignments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {data.totalTerritories}
            </div>
            <div className="text-sm text-gray-600">Total Territories</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {data.assignedTerritories}
            </div>
            <div className="text-sm text-gray-600">Assigned</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Assignment Rate</span>
            <span className="font-medium">{assignmentRate}%</span>
          </div>
          <Progress value={assignmentRate} className="h-2" />
        </div>
        <div className="pt-2 border-t space-y-3">
          <div className="flex justify-between text-sm">
            <span>Total Residents</span>
            <span className="font-medium">{data.totalResidents}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Active Residents</span>
            <span className="font-medium">
              {data.activeResidents}
            </span>
          </div>

          {/* Average Completion Rate */}
          <div className="flex justify-between text-sm">
            <span>Avg Completion</span>
            <span className="font-medium">
              {data.averageCompletionRate}%
            </span>
          </div>

          {/* Top Performing Territory */}
          {data.topPerformingTerritory && (
            <div className="text-sm">
              <span className="text-gray-600">
                {data.topPerformingTerritory.name} leads at{" "}
                {data.topPerformingTerritory.completionRate}%
              </span>
            </div>
          )}

          {/* Recent Activity */}
          {data.recentActivity !== undefined && (
            <div className="flex justify-between text-sm">
              <span>Recent Activity</span>
              <span className="font-medium">
                {data.recentActivity}
              </span>
            </div>
          )}
          {data.recentActivity !== undefined && (
            <div className="text-xs text-gray-500">
              Territory updates & assignments
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
