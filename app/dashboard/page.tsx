"use client";

import { MetricsOverviewIndependent } from "@/components/admin/metrics-overview-independent";
import { TeamPerformanceCardIndependent } from "@/components/admin/team-performance-card-independent";
import { TerritoryStatusCardIndependent } from "@/components/admin/territory-status-card-independent";
import { AssignmentStatusCardIndependent } from "@/components/admin/assignment-status-card-independent";
import { WorkforceManagementOverviewIndependent } from "@/components/admin/workforce-management-overview-independent";

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Key Metrics Grid - Loads independently */}
      <MetricsOverviewIndependent />

      {/* Performance Section - Loads independently */}
      <div className="grid grid-cols-1 gap-6">
        <TeamPerformanceCardIndependent />
      </div>

      {/* Unified Workforce Management Overview - Loads independently */}
      <WorkforceManagementOverviewIndependent />

      {/* Territory & Assignment Status - Load independently */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TerritoryStatusCardIndependent />
        <AssignmentStatusCardIndependent />
      </div>
    </div>
  );
}
