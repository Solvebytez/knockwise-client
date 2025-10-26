import { useQuery } from "@tanstack/react-query";
import { adminDashboardApi } from "@/lib/api/admin-dashboard";
import { useAuthStore } from "@/store/userStore";

// Custom hook for system analytics (SUPERADMIN only)
export const useSystemAnalytics = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ["admin", "system-analytics"],
    queryFn: adminDashboardApi.getSystemAnalytics,
    enabled: user?.role === "SUPERADMIN", // Only fetch for SUPERADMIN
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};

// Custom hook for team overview
export const useTeamOverview = () => {
  return useQuery({
    queryKey: ["admin", "team-overview"],
    queryFn: adminDashboardApi.getTeamOverview,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};

// Custom hook for territory stats
export const useTerritoryStats = () => {
  return useQuery({
    queryKey: ["admin", "territory-stats"],
    queryFn: adminDashboardApi.getTerritoryOverviewStats,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};

// Custom hook for team performance
export const useTeamPerformance = () => {
  return useQuery({
    queryKey: ["admin", "team-performance"],
    queryFn: adminDashboardApi.getTeamPerformance,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};

// Custom hook for today's activity
export const useTodayActivity = () => {
  return useQuery({
    queryKey: ["admin", "today-activity"],
    queryFn: adminDashboardApi.getTodayActivity,
    staleTime: 2 * 60 * 1000, // 2 minutes (more frequent for real-time data)
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

// Custom hook for recent additions
export const useRecentAdditions = (limit: number = 5) => {
  return useQuery({
    queryKey: ["admin", "recent-additions", limit],
    queryFn: () => adminDashboardApi.getRecentAdditions(limit),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};

// Custom hook for assignment status
export const useAssignmentStatus = () => {
  return useQuery({
    queryKey: ["admin", "assignment-status"],
    queryFn: adminDashboardApi.getAssignmentStatus,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};

// Custom hook for team statistics
export const useTeamStats = () => {
  return useQuery({
    queryKey: ["admin", "team-stats"],
    queryFn: adminDashboardApi.getTeamStats,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};

// Custom hook for user management statistics
export const useUserManagementStats = () => {
  return useQuery({
    queryKey: ["admin", "user-management-stats"],
    queryFn: adminDashboardApi.getUserManagementStats,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });
};

// Combined hook for all dashboard data
export const useAdminDashboard = () => {
  const systemAnalytics = useSystemAnalytics();
  const teamOverview = useTeamOverview();
  const territoryStats = useTerritoryStats();
  const teamPerformance = useTeamPerformance();
  const todayActivity = useTodayActivity();
  const recentAdditions = useRecentAdditions(5);
  const assignmentStatus = useAssignmentStatus();
  const teamStats = useTeamStats();
  const userManagementStats = useUserManagementStats();

  return {
    systemAnalytics,
    teamOverview,
    territoryStats,
    teamPerformance,
    todayActivity,
    recentAdditions,
    assignmentStatus,
    teamStats,
    userManagementStats,
    isLoading:
      teamOverview.isLoading ||
      territoryStats.isLoading ||
      teamPerformance.isLoading ||
      todayActivity.isLoading ||
      recentAdditions.isLoading ||
      assignmentStatus.isLoading ||
      teamStats.isLoading ||
      userManagementStats.isLoading,
    isError:
      teamOverview.isError ||
      territoryStats.isError ||
      teamPerformance.isError ||
      todayActivity.isError ||
      recentAdditions.isError ||
      assignmentStatus.isError ||
      teamStats.isError ||
      userManagementStats.isError,
    error:
      teamOverview.error ||
      territoryStats.error ||
      teamPerformance.error ||
      todayActivity.error ||
      recentAdditions.error ||
      assignmentStatus.error ||
      teamStats.error ||
      userManagementStats.error,
  };
};
