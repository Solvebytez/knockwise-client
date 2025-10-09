"use client";

import { MapPin, Users, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TerritorySummary } from "@/lib/api/agentApi";

interface TerritoryStatsCardsProps {
  summary: TerritorySummary;
}

export function TerritoryStatsCards({ summary }: TerritoryStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Assigned Territories Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Assigned Territories
          </CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalTerritories}</div>
          <p className="text-xs text-muted-foreground">
            {summary.activeTerritories} active
            {summary.scheduledTerritories > 0 &&
              `, ${summary.scheduledTerritories} scheduled`}
          </p>
        </CardContent>
      </Card>

      {/* Total Leads Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Houses</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalHouses}</div>
          <p className="text-xs text-muted-foreground">
            Across all territories
          </p>
        </CardContent>
      </Card>

      {/* Today's Visits Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progress</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {summary.completionPercentage}%
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.visitedHouses} visited, {summary.notVisitedHouses}{" "}
            remaining
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
