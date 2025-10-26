import { apiInstance } from "@/lib/apiInstance";

// Types for API responses
export interface SystemAnalytics {
  totalUsers: number;
  totalTeams: number;
  totalZones: number;
  activeAgents: number;
}

export interface TerritoryStats {
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

export interface TeamPerformance {
  teamName: string;
  completionRate: number;
  avgKnocks: number;
  memberCount: number;
}

export interface TodayActivity {
  totalVisits: number;
  appointmentsSet: number;
  callbacks: number;
  notInterested: number;
  noAnswer: number;
  leads: number;
}

export interface RecentAgent {
  _id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
  primaryZoneId?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export interface AssignmentStatus {
  activeAssignments: number;
  scheduledAssignments: number;
  completedThisWeek: number;
  pendingApproval: number;
  overdueAssignments: number;
}

export interface TeamStats {
  totalTeams: number;
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  assignedMembers: number;
  unassignedMembers: number;
  inactiveTeams: number;
  totalZones: number;
  averagePerformance: number;
  topPerformingTeam: {
    name: string;
    performance: number;
  };
  recentActivity: {
    newMembers: number;
    completedTasks: number;
    activeSessions: number;
  };
  agentsWithTeamAssignments: number;
  agentsWithIndividualOnlyAssignments: number;
}

export interface UserManagementStats {
  totalAgents: number;
  activeAgents: number;
  inactiveAgents: number;
  assignedAgents: number;
  unassignedAgents: number;
  agentsThisMonth: number;
  agentsWithTeams: number;
  agentsWithoutTeams: number;
}

// API Service Functions
export const adminDashboardApi = {
  // Get system analytics (Superadmin only)
  getSystemAnalytics: async (): Promise<SystemAnalytics> => {
    const response = await apiInstance.get("/users/system-analytics");
    return response.data.data;
  },

  // Get team overview for current admin
  getTeamOverview: async (): Promise<{
    totalAgents: number;
    activeAgents: number;
    inactiveAgents: number;
    agentsThisMonth: number;
    assignedAgents: number;
    unassignedAgents: number;
    totalZones: number;
  }> => {
    const response = await apiInstance.get("/users/team-overview");
    return response.data.data;
  },

  // Get territory overview stats
  getTerritoryOverviewStats: async (): Promise<TerritoryStats> => {
    // Use the same data source as territory-map for consistency
    const response = await apiInstance.get("/zones/list-all?showAll=true");
    const territories = response.data.data || [];

    // Calculate dynamic stats from territories data (same as territory-map)
    const totalTerritories = territories.length;
    const activeTerritories = territories.filter(
      (t) => t.status === "ACTIVE"
    ).length;
    const scheduledTerritories = territories.filter(
      (t) => t.status === "SCHEDULED"
    ).length;
    const draftTerritories = territories.filter(
      (t) => t.status === "DRAFT"
    ).length;
    const completedTerritories = territories.filter(
      (t) => t.status === "COMPLETED"
    ).length;
    const assignedTerritories = territories.filter(
      (t) => t.currentAssignment
    ).length;
    const unassignedTerritories = totalTerritories - assignedTerritories;

    const totalResidents = territories.reduce(
      (sum, t) => sum + (t.totalResidents || 0),
      0
    );
    const activeResidents = territories.reduce(
      (sum, t) => sum + (t.activeResidents || 0),
      0
    );

    const completionRates = territories
      .map((t) => t.completionRate || 0)
      .filter((rate) => rate > 0);
    const averageCompletionRate =
      completionRates.length > 0
        ? Math.round(
            completionRates.reduce((sum, rate) => sum + rate, 0) /
              completionRates.length
          )
        : 0;

    // Find top performing territory
    const topPerformingTerritory = territories.reduce((top, current) => {
      const currentRate = current.completionRate || 0;
      const topRate = top?.completionRate || 0;
      return currentRate > topRate ? current : top;
    }, null as any);

    // Calculate recent activity (territories updated in last 24 hours)
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentActivity = territories.filter((territory) => {
      const lastActivity = new Date(
        territory.lastActivity || territory.updatedAt
      );
      return lastActivity >= twentyFourHoursAgo;
    }).length;

    return {
      totalTerritories,
      activeTerritories,
      scheduledTerritories,
      draftTerritories,
      completedTerritories,
      assignedTerritories,
      unassignedTerritories,
      totalResidents,
      activeResidents,
      averageCompletionRate,
      recentActivity,
      topPerformingTerritory: topPerformingTerritory
        ? {
            name: topPerformingTerritory.name,
            completionRate: topPerformingTerritory.completionRate || 0,
          }
        : undefined,
    };
  },

  // Get team performance data
  getTeamPerformance: async (): Promise<TeamPerformance[]> => {
    const response = await apiInstance.get("/teams/performance");
    return response.data.data;
  },

  // Get activity statistics
  getActivityStatistics: async (params?: {
    startDate?: string;
    endDate?: string;
    agentId?: string;
    zoneId?: string;
    teamId?: string;
  }): Promise<TodayActivity> => {
    const response = await apiInstance.get("/activities/statistics", {
      params,
    });
    return response.data.data;
  },

  // Get recent additions
  getRecentAdditions: async (limit: number = 5): Promise<RecentAgent[]> => {
    const response = await apiInstance.get("/users/recent-additions", {
      params: { limit },
    });
    return response.data.data;
  },

  // Get assignment status (custom endpoint we'll need to create)
  getAssignmentStatus: async (): Promise<AssignmentStatus> => {
    const response = await apiInstance.get("/assignments/status");
    return response.data.data;
  },

  // Get today's activity summary
  getTodayActivity: async (): Promise<TodayActivity> => {
    const today = new Date().toISOString().split("T")[0];
    const response = await apiInstance.get("/activities/statistics", {
      params: {
        startDate: today,
        endDate: today,
      },
    });
    return response.data.data;
  },

  // Get team statistics
  getTeamStats: async (): Promise<TeamStats> => {
    const response = await apiInstance.get("/teams/stats");
    return response.data.data;
  },

  // Get user management statistics
  getUserManagementStats: async (): Promise<UserManagementStats> => {
    // Get team stats which now includes correct assignment-based data
    const teamStatsResponse = await apiInstance.get("/teams/stats");
    const teamStats = teamStatsResponse.data.data;

    // Get agent data for additional stats
    const response = await apiInstance.get("/users/my-created-agents", {
      params: { status: "all", includeTeamInfo: true, limit: 1000 },
    });

    const agents = response.data.data || [];

    // Calculate basic stats from the agents data
    const totalAgents = agents.length;
    const activeAgents = agents.filter(
      (agent: any) => agent.status === "ACTIVE"
    ).length;
    const inactiveAgents = agents.filter(
      (agent: any) => agent.status === "INACTIVE"
    ).length;
    const assignedAgents = agents.filter(
      (agent: any) => agent.assignmentStatus === "ASSIGNED"
    ).length;
    const unassignedAgents = agents.filter(
      (agent: any) => agent.assignmentStatus === "UNASSIGNED"
    ).length;

    // Calculate agents added this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const agentsThisMonth = agents.filter(
      (agent: any) => new Date(agent.createdAt) >= thisMonth
    ).length;

    const result = {
      totalAgents,
      activeAgents,
      inactiveAgents,
      assignedAgents,
      unassignedAgents,
      agentsThisMonth,
      agentsWithTeams: teamStats.agentsWithTeamAssignments,
      agentsWithoutTeams: teamStats.agentsWithIndividualOnlyAssignments,
    };

    return result;
  },
};
