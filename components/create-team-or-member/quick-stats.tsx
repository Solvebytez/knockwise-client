"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, UserCheck, UserX, TrendingUp } from "lucide-react"
import { apiInstance } from "@/lib/apiInstance"

interface TeamOverview {
  totalAgents: number
  activeAgents: number
  inactiveAgents: number
  agentsThisMonth: number
}

interface RecentAgent {
  _id: string
  name: string
  email: string
  status: 'ACTIVE' | 'INACTIVE'
  primaryZoneId?: {
    _id: string
    name: string
  }
  createdAt: string
}

const fetchTeamOverview = async (): Promise<TeamOverview> => {
  try {
    const response = await apiInstance.get('/users/team-overview')
    return response.data.data
  } catch (error) {
    console.error('Error fetching team overview:', error)
    // Fallback data
    return {
      totalAgents: 0,
      activeAgents: 0,
      inactiveAgents: 0,
      agentsThisMonth: 0
    }
  }
}

const fetchRecentAdditions = async (): Promise<RecentAgent[]> => {
  try {
    const response = await apiInstance.get('/users/recent-additions?limit=3')
    return response.data.data || []
  } catch (error) {
    console.error('Error fetching recent additions:', error)
    // Fallback data
    return []
  }
}

export function QuickStats() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['team-overview'],
    queryFn: fetchTeamOverview
  })

  const { data: recentAgents, isLoading: recentLoading } = useQuery({
    queryKey: ['recent-additions'],
    queryFn: fetchRecentAdditions
  })

  const stats = [
    {
      title: "Total Agents",
      value: overview?.totalAgents || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Active Agents",
      value: overview?.activeAgents || 0,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Inactive Agents",
      value: overview?.inactiveAgents || 0,
      icon: UserX,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "This Month",
      value: overview?.agentsThisMonth || 0,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Team Overview Stats */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-900">Member Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {overviewLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center p-4 rounded-lg border border-gray-200">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Additions */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-900 flex items-center">
            <UserPlus className="w-5 h-5 mr-2 text-[#42A5F5]" />
            Recent Additions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : recentAgents && recentAgents.length > 0 ? (
            <div className="space-y-3">
              {recentAgents.map((agent) => (
                <div key={agent._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#42A5F5] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {agent.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                      <p className="text-xs text-gray-500">{agent.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={agent.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className={agent.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    >
                      {agent.status}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatDate(agent.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No recent additions</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
