"use client";

import { Users, UserCheck, MapPin, Users2, Target, Map } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { useRouter } from "next/navigation";
import {
  useSystemAnalytics,
  useTerritoryStats,
} from "@/hooks/use-admin-dashboard";
import { useAuthStore } from "@/store/userStore";
import { MetricCardSkeleton } from "./skeleton-loading";

export function MetricsOverviewIndependent() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Independent hooks for each data source
  const systemAnalytics = useSystemAnalytics();
  const territoryStats = useTerritoryStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* System Analytics Cards - Only for SUPERADMIN */}
      {user?.role === "SUPERADMIN" && (
        <>
          {systemAnalytics.isLoading ? (
            <MetricCardSkeleton />
          ) : systemAnalytics.isError ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">
                  Failed to load system analytics
                </p>
              </div>
            </div>
          ) : (
            <>
              <MetricCard
                icon={Users}
                value={systemAnalytics.data?.totalUsers?.toString() || "0"}
                title="Total Users"
                subtitle="Across all roles"
                buttonText="View Users"
                changeText="+5% this month"
                onClick={() => router.push("/users")}
              />
              <MetricCard
                icon={UserCheck}
                value={systemAnalytics.data?.activeAgents?.toString() || "0"}
                title="Active Agents"
                subtitle="Currently working"
                buttonText="View Agents"
                changeText="+12 this week"
                onClick={() => router.push("/agents")}
              />
              <MetricCard
                icon={Users2}
                value={systemAnalytics.data?.totalTeams?.toString() || "0"}
                title="Total Teams"
                subtitle="Organized groups"
                buttonText="View Teams"
                changeText="+1 new team"
                onClick={() => router.push("/teams")}
              />
            </>
          )}
        </>
      )}

      {/* Territory Stats Cards */}
      {territoryStats.isLoading ? (
        <MetricCardSkeleton />
      ) : territoryStats.isError ? (
        <div className="col-span-1 md:col-span-2 lg:col-span-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">
              Failed to load territory statistics
            </p>
          </div>
        </div>
      ) : (
        <>
          <MetricCard
            icon={MapPin}
            value={territoryStats.data?.activeTerritories?.toString() || "0"}
            title="Active Territories"
            subtitle="Mapped & assigned"
            buttonText="View Territories"
            changeText="+3 new this week"
            onClick={() => router.push("/territory-map")}
          />
          {user?.role !== "SUPERADMIN" && (
            <>
              <MetricCard
                icon={Map}
                value={territoryStats.data?.totalTerritories?.toString() || "0"}
                title="Total Territories"
                subtitle="All territories"
                buttonText="View All"
                changeText="All time"
                onClick={() => router.push("/territory-map")}
              />
              <MetricCard
                icon={MapPin}
                value={
                  territoryStats.data?.unassignedTerritories?.toString() || "0"
                }
                title="Unassigned Territories"
                subtitle="Need assignment"
                buttonText="Assign Now"
                changeText="Awaiting assignment"
                onClick={() => router.push("/territory-map")}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
