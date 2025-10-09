"use client";

import {
  MetricsOverview,
  TeamPerformanceCard,
  TerritoryStatusCard,
  AssignmentStatusCard,
  WorkforceManagementOverview,
  DashboardLoadingSkeleton,
  DashboardErrorState,
} from "@/components/admin";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import { useAuthStore } from "@/store/userStore";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const {
    systemAnalytics,
    teamOverview,
    territoryStats,
    teamPerformance,
    assignmentStatus,
    teamStats,
    userManagementStats,
    isLoading,
    isError,
    error,
  } = useAdminDashboard();

  // Show loading state
  if (isLoading) {
    return <DashboardLoadingSkeleton />;
  }

  // Show error state
  if (isError) {
    return (
      <DashboardErrorState
        error={error as Error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Key Metrics Grid */}
      <MetricsOverview
        systemAnalytics={
          user?.role === "SUPERADMIN"
            ? systemAnalytics.data || {
                totalUsers: 0,
                totalTeams: 0,
                totalZones: 0,
                activeAgents: 0,
              }
            : null
        }
        territoryStats={
          territoryStats.data || {
            totalTerritories: 0,
            activeTerritories: 0,
            assignedTerritories: 0,
            unassignedTerritories: 0,
            totalResidents: 0,
            activeResidents: 0,
            averageCompletionRate: 0,
            recentActivity: 0,
            topPerformingTerritory: undefined,
          }
        }
      />

      {/* Performance Section */}
      <div className="grid grid-cols-1 gap-6">
        <TeamPerformanceCard teamPerformance={teamPerformance.data || []} />
      </div>

      {/* Unified Workforce Management Overview */}
      <WorkforceManagementOverview
        teamStats={teamStats.data || null}
        userStats={userManagementStats.data || null}
      />

      {/* Territory & Assignment Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TerritoryStatusCard
          territoryStats={
            territoryStats.data || {
              totalTerritories: 0,
              activeTerritories: 0,
              assignedTerritories: 0,
              unassignedTerritories: 0,
              totalResidents: 0,
              activeResidents: 0,
              averageCompletionRate: 0,
              recentActivity: 0,
              topPerformingTerritory: undefined,
            }
          }
        />
        <AssignmentStatusCard
          assignmentStatus={
            assignmentStatus.data || {
              activeAssignments: 0,
              scheduledAssignments: 0,
              completedThisWeek: 0,
              pendingApproval: 0,
              overdueAssignments: 0,
            }
          }
        />
      </div>
    </div>
  );
}
