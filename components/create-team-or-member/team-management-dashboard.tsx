"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  UserX, 
  Target, 
  MapPin, 
  Building,
  Activity,
  BarChart3,
  Filter,
  Download,
  RefreshCw
} from "lucide-react"
import { apiInstance } from "@/lib/apiInstance"
import { CreateMemberForm } from "./create-member-form"
import { CreateTeamForm } from "./create-team-form"

interface TeamStats {
  totalTeams: number
  totalMembers: number
  activeMembers: number
  inactiveMembers: number
  assignedMembers: number
  unassignedMembers: number
  inactiveTeams: number
  totalZones: number
  averagePerformance: number
  topPerformingTeam: {
    name: string
    performance: number
  }
  recentActivity: {
    newMembers: number
    completedTasks: number
    activeSessions: number
  }
}

interface TeamPerformance {
  teamId: string
  teamName: string
  memberCount: number
  averageKnocks: number
  completionRate: number
  zoneCoverage: number
}

const fetchTeamStats = async (): Promise<TeamStats> => {
  try {
    const response = await apiInstance.get('/teams/stats')
    return response.data.data
  } catch (error) {
    console.error('Error fetching team stats:', error)
    // Return empty data structure on error
    return {
      totalTeams: 0,
      totalMembers: 0,
      activeMembers: 0,
      inactiveMembers: 0,
      assignedMembers: 0,
      unassignedMembers: 0,
      inactiveTeams: 0,
      totalZones: 0,
      averagePerformance: 0,
      topPerformingTeam: {
        name: "N/A",
        performance: 0
      },
      recentActivity: {
        newMembers: 0,
        completedTasks: 0,
        activeSessions: 0
      }
    }
  }
}

const fetchTeamPerformance = async (): Promise<TeamPerformance[]> => {
  try {
    const response = await apiInstance.get('/teams/performance')
    return response.data.data
  } catch (error) {
    console.error('Error fetching team performance:', error)
    // Return empty array on error
    return []
  }
}

export function TeamManagementDashboard() {
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false)
  
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['team-stats'],
    queryFn: fetchTeamStats
  })

  const { data: performance, isLoading: performanceLoading, refetch: refetchPerformance } = useQuery({
    queryKey: ['team-performance'],
    queryFn: fetchTeamPerformance
  })

  const handleRefresh = () => {
    refetchStats()
    refetchPerformance()
  }

  const handleAddMemberSuccess = () => {
    setIsAddMemberDialogOpen(false)
    // Refresh the dashboard data after adding a member
    handleRefresh()
  }

  const handleCreateTeamSuccess = () => {
    setIsCreateTeamDialogOpen(false)
    // Refresh the dashboard data after creating a team
    handleRefresh()
  }

  const mainStats = [
    {
      title: "Total Teams",
      value: stats?.totalTeams || 0,
      icon: Building,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: `${stats?.totalTeams || 0} teams created`
    },
    {
      title: "Total Members",
      value: stats?.totalMembers || 0,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: `${stats?.recentActivity?.newMembers || 0} new this month`
    },
    {
      title: "Assigned Members",
      value: stats?.assignedMembers || 0,
      icon: UserPlus,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: `${stats?.assignedMembers || 0} have zones`
    },
    {
      title: "Unassigned Members",
      value: stats?.unassignedMembers || 0,
      icon: UserX,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "No zones assigned"
    }
  ]

  const activityStats = [
    {
      title: "New Members",
      value: stats?.recentActivity?.newMembers || 0,
      icon: UserPlus,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Completed Tasks",
      value: stats?.recentActivity?.completedTasks || 0,
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Active Sessions",
      value: stats?.recentActivity?.activeSessions || 0,
      icon: Activity,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 border-l-4 border-[#42A5F5] pl-4">Team Overview Dashboard</h2>
          <p className="text-sm text-gray-500 mt-2 italic">Monitor and manage your sales teams performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" className="border-gray-300">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="border-gray-300">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-gray-300"
            onClick={handleRefresh}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-900">Quick Actions</CardTitle>
          <p className="text-sm text-gray-600">Common team management tasks</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-auto p-4 flex flex-col items-center space-y-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-blue-200">
                  <UserPlus className="w-6 h-6" />
                  <span className="text-sm font-medium">Add New Member</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-gray-900">
                    Add New Team Member
                  </DialogTitle>
                </DialogHeader>
                <CreateMemberForm onSuccess={handleAddMemberSuccess} />
              </DialogContent>
            </Dialog>
            <Dialog open={isCreateTeamDialogOpen} onOpenChange={setIsCreateTeamDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-auto p-4 flex flex-col items-center space-y-2 bg-green-50 hover:bg-green-100 text-green-700 border-2 border-green-200">
                  <Building className="w-6 h-6" />
                  <span className="text-sm font-medium">Create Team</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold text-gray-900">
                    Create New Team
                  </DialogTitle>
                </DialogHeader>
                <CreateTeamForm onSuccess={handleCreateTeamSuccess} />
              </DialogContent>
            </Dialog>
            <Button className="h-auto p-4 flex flex-col items-center space-y-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border-2 border-purple-200">
              <MapPin className="w-6 h-6" />
              <span className="text-sm font-medium">Assign Zones</span>
            </Button>
          </div>
        </CardContent>
      </Card>

             {/* Main Stats Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {statsLoading ? (
           // Skeleton loading state for stats cards
           [...Array(4)].map((_, index) => (
             <Card key={index} className="border-gray-200 shadow-sm">
               <CardContent className="p-6">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center">
                     <div className="animate-pulse">
                       <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                     </div>
                     <div className="ml-4 space-y-2">
                       <div className="animate-pulse">
                         <div className="h-4 bg-gray-200 rounded w-20"></div>
                       </div>
                       <div className="animate-pulse">
                         <div className="h-8 bg-gray-200 rounded w-12"></div>
                       </div>
                     </div>
                   </div>
                 </div>
                 <div className="mt-4">
                   <div className="animate-pulse">
                     <div className="h-3 bg-gray-200 rounded w-24"></div>
                   </div>
                 </div>
               </CardContent>
             </Card>
           ))
         ) : (
           mainStats.map((stat, index) => (
             <Card key={index} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
               <CardContent className="p-6">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center">
                     <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                       <stat.icon className={`w-6 h-6 ${stat.color}`} />
                     </div>
                     <div className="ml-4">
                       <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                       <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                     </div>
                   </div>
                 </div>
                 <div className="mt-4">
                   <p className="text-xs text-gray-500">{stat.change}</p>
                 </div>
               </CardContent>
             </Card>
           ))
         )}
       </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Average Performance */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-[#42A5F5]" />
              Average Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-center space-y-4">
                <div className="animate-pulse">
                  <div className="h-12 bg-gray-200 rounded w-20 mx-auto mb-2"></div>
                </div>
                <div className="animate-pulse">
                  <div className="h-2 bg-gray-200 rounded w-full mb-4"></div>
                </div>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-4xl font-bold text-[#42A5F5] mb-2">
                  {stats?.averagePerformance || 0}%
                </div>
                <Progress value={stats?.averagePerformance || 0} className="h-2 mb-4" />
                <p className="text-sm text-gray-600">
                  Across all teams this month
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Team */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Top Performing Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-center space-y-4">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
                </div>
                <div className="animate-pulse">
                  <div className="h-10 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                </div>
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-20 mx-auto"></div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {stats?.topPerformingTeam.name || 'N/A'}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stats?.topPerformingTeam.performance || 0}%
                </div>
                <Badge className="bg-green-100 text-green-800">
                  Best Performance
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-orange-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="animate-pulse">
                        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                      </div>
                      <div className="ml-3 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-8"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {activityStats.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                        <activity.icon className={`w-4 h-4 ${activity.color}`} />
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {activity.title}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {activity.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Table */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-900">Team Performance Overview</CardTitle>
          <p className="text-sm text-gray-600">Detailed performance metrics for each team</p>
        </CardHeader>
        <CardContent>
          {performanceLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : performance && performance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Team Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Members</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Avg Knocks</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Completion Rate</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Zone Coverage</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((team) => (
                    <tr key={team.teamId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{team.teamName}</td>
                      <td className="py-3 px-4 text-gray-600">{team.memberCount}</td>
                      <td className="py-3 px-4 text-gray-600">{team.averageKnocks}</td>
                      <td className="py-3 px-4 text-gray-600">{team.completionRate}%</td>
                      <td className="py-3 px-4 text-gray-600">{team.zoneCoverage} zones</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Progress 
                            value={team.completionRate} 
                            className="h-2 w-20 mr-2" 
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {team.completionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Building className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No teams found. Create your first team to see performance data.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
