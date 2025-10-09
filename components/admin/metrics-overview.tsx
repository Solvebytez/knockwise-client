"use client";

import { Users, UserCheck, MapPin, Users2, Target, Map } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { useRouter } from "next/navigation";

interface MetricsOverviewProps {
  systemAnalytics: {
    totalUsers: number;
    totalTeams: number;
    totalZones: number;
    activeAgents: number;
  } | null;
  territoryStats: {
    totalTerritories: number;
    activeTerritories: number;
    assignedTerritories: number;
    unassignedTerritories: number;
  };
}

export function MetricsOverview({
  systemAnalytics,
  territoryStats,
}: MetricsOverviewProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {systemAnalytics && (
        <>
          <MetricCard
            icon={Users}
            value={systemAnalytics.totalUsers.toString()}
            title="Total Users"
            subtitle="Across all roles"
            buttonText="View Users"
            changeText="+5% this month"
            onClick={() => router.push("/users")}
          />
          <MetricCard
            icon={UserCheck}
            value={systemAnalytics.activeAgents.toString()}
            title="Active Agents"
            subtitle="Currently working"
            buttonText="View Agents"
            changeText="+12 this week"
            onClick={() => router.push("/agents")}
          />
          <MetricCard
            icon={Users2}
            value={systemAnalytics.totalTeams.toString()}
            title="Total Teams"
            subtitle="Organized groups"
            buttonText="View Teams"
            changeText="+1 new team"
            onClick={() => router.push("/teams")}
          />
        </>
      )}
      <MetricCard
        icon={MapPin}
        value={territoryStats.activeTerritories.toString()}
        title="Active Territories"
        subtitle="Mapped & assigned"
        buttonText="View Territories"
        changeText="+3 new this week"
        onClick={() => router.push("/territory-map")}
      />
      {!systemAnalytics && (
        <>
          <MetricCard
            icon={Map}
            value={territoryStats.totalTerritories.toString()}
            title="Total Territories"
            subtitle="All territories"
            buttonText="View All"
            changeText="All time"
            onClick={() => router.push("/territory-map")}
          />
          <MetricCard
            icon={MapPin}
            value={territoryStats.unassignedTerritories.toString()}
            title="Unassigned Territories"
            subtitle="Need assignment"
            buttonText="Assign Now"
            changeText="Awaiting assignment"
            onClick={() => router.push("/territory-map")}
          />
        </>
      )}
    </div>
  );
}
