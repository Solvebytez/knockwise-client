"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  Calendar, 
  BarChart3,
  PieChart,
  Activity,
  Award,
  Clock,
  MapPin,
  Building,
  Filter,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react"
import { apiInstance } from "@/lib/apiInstance"
import { useState } from "react"

interface AnalyticsData {
  overview: {
    totalKnocks: number
    totalLeads: number
    conversionRate: number
    averageResponseTime: number
    activeMembers: number
    totalTeams: number
  }
  performance: {
    daily: Array<{ date: string; knocks: number; leads: number }>
    weekly: Array<{ week: string; knocks: number; leads: number; conversion: number }>
    monthly: Array<{ month: string; knocks: number; leads: number; conversion: number }>
  }
  teamStats: Array<{
    teamId: string
    teamName: string
    memberCount: number
    totalKnocks: number
    totalLeads: number
    conversionRate: number
    averageKnocksPerMember: number
    trend: 'up' | 'down' | 'stable'
    trendPercentage: number
  }>
  topPerformers: Array<{
    memberId: string
    memberName: string
    teamName: string
    knocks: number
    leads: number
    conversionRate: number
    rating: number
  }>
  zonePerformance: Array<{
    zoneId: string
    zoneName: string
    totalKnocks: number
    totalLeads: number
    conversionRate: number
    memberCount: number
  }>
}

const fetchAnalytics = async (period: string = 'week'): Promise<AnalyticsData> => {
  try {
    const response = await apiInstance.get(`/analytics/team-performance?period=${period}`)
    return response.data.data
  } catch (error) {
    console.error('Error fetching analytics:', error)
    // Fallback data
    return {
      overview: {
        totalKnocks: 1247,
        totalLeads: 89,
        conversionRate: 7.1,
        averageResponseTime: 2.3,
        activeMembers: 22,
        totalTeams: 4
      },
      performance: {
        daily: [
          { date: '2024-01-15', knocks: 45, leads: 3 },
          { date: '2024-01-16', knocks: 52, leads: 4 },
          { date: '2024-01-17', knocks: 38, leads: 2 },
          { date: '2024-01-18', knocks: 61, leads: 5 },
          { date: '2024-01-19', knocks: 49, leads: 3 },
          { date: '2024-01-20', knocks: 55, leads: 4 },
          { date: '2024-01-21', knocks: 42, leads: 3 }
        ],
        weekly: [
          { week: 'Week 1', knocks: 320, leads: 22, conversion: 6.9 },
          { week: 'Week 2', knocks: 345, leads: 25, conversion: 7.2 },
          { week: 'Week 3', knocks: 382, leads: 28, conversion: 7.3 },
          { week: 'Week 4', knocks: 400, leads: 30, conversion: 7.5 }
        ],
        monthly: [
          { month: 'Oct', knocks: 1200, leads: 85, conversion: 7.1 },
          { month: 'Nov', knocks: 1350, leads: 95, conversion: 7.0 },
          { month: 'Dec', knocks: 1420, leads: 102, conversion: 7.2 },
          { month: 'Jan', knocks: 1247, leads: 89, conversion: 7.1 }
        ]
      },
      teamStats: [
        {
          teamId: '1',
          teamName: 'Team Alpha',
          memberCount: 6,
          totalKnocks: 320,
          totalLeads: 24,
          conversionRate: 7.5,
          averageKnocksPerMember: 53.3,
          trend: 'up',
          trendPercentage: 12.5
        },
        {
          teamId: '2',
          teamName: 'Team Beta',
          memberCount: 5,
          totalKnocks: 285,
          totalLeads: 20,
          conversionRate: 7.0,
          averageKnocksPerMember: 57.0,
          trend: 'up',
          trendPercentage: 8.2
        },
        {
          teamId: '3',
          teamName: 'Team Gamma',
          memberCount: 7,
          totalKnocks: 398,
          totalLeads: 28,
          conversionRate: 7.0,
          averageKnocksPerMember: 56.9,
          trend: 'down',
          trendPercentage: 3.1
        },
        {
          teamId: '4',
          teamName: 'Team Delta',
          memberCount: 4,
          totalKnocks: 244,
          totalLeads: 17,
          conversionRate: 7.0,
          averageKnocksPerMember: 61.0,
          trend: 'stable',
          trendPercentage: 0
        }
      ],
      topPerformers: [
        {
          memberId: '1',
          memberName: 'Rohit Gupta',
          teamName: 'Team Gamma',
          knocks: 85,
          leads: 7,
          conversionRate: 8.2,
          rating: 4.8
        },
        {
          memberId: '2',
          memberName: 'Snehal Verma',
          teamName: 'Team Delta',
          knocks: 78,
          leads: 6,
          conversionRate: 7.7,
          rating: 4.6
        },
        {
          memberId: '3',
          memberName: 'Gourav Sharma',
          teamName: 'Team Beta',
          knocks: 72,
          leads: 5,
          conversionRate: 6.9,
          rating: 4.5
        },
        {
          memberId: '4',
          memberName: 'Riya Mehta',
          teamName: 'Team Alpha',
          knocks: 68,
          leads: 5,
          conversionRate: 7.4,
          rating: 4.4
        },
        {
          memberId: '5',
          memberName: 'Aman Shah',
          teamName: 'Team Beta',
          knocks: 65,
          leads: 4,
          conversionRate: 6.2,
          rating: 4.3
        }
      ],
      zonePerformance: [
        {
          zoneId: '1',
          zoneName: 'Janipur East',
          totalKnocks: 320,
          totalLeads: 24,
          conversionRate: 7.5,
          memberCount: 6
        },
        {
          zoneId: '2',
          zoneName: 'Gandhi Nagar',
          totalKnocks: 285,
          totalLeads: 20,
          conversionRate: 7.0,
          memberCount: 5
        },
        {
          zoneId: '3',
          zoneName: 'Satwari',
          totalKnocks: 398,
          totalLeads: 28,
          conversionRate: 7.0,
          memberCount: 7
        },
        {
          zoneId: '4',
          zoneName: 'Shiv Nagar',
          totalKnocks: 244,
          totalLeads: 17,
          conversionRate: 7.0,
          memberCount: 4
        }
      ]
    }
  }
}

export function TeamAnalytics() {
  const [period, setPeriod] = useState('week')
  
  const { data: analytics, isLoading, error, refetch } = useQuery({
    queryKey: ['team-analytics', period],
    queryFn: () => fetchAnalytics(period)
  })

  const handleRefresh = () => {
    refetch()
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="w-4 h-4 text-green-600" />
      case 'down':
        return <ArrowDownRight className="w-4 h-4 text-red-600" />
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'stable':
        return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">Loading analytics...</div>
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-red-500">Failed to load analytics</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Analytics</h2>
          <p className="text-gray-600 mt-1">Comprehensive performance insights and metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32 border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-gray-300"
            onClick={handleRefresh}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="border-gray-300">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Knocks</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalKnocks}</p>
                <p className="text-xs text-green-600 mt-1">+12.5% from last period</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalLeads}</p>
                <p className="text-xs text-green-600 mt-1">+8.2% from last period</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.conversionRate}%</p>
                <p className="text-xs text-green-600 mt-1">+0.3% from last period</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.averageResponseTime}h</p>
                <p className="text-xs text-red-600 mt-1">+0.2h from last period</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-900">Team Performance Overview</CardTitle>
          <p className="text-sm text-gray-600">Detailed performance metrics for each team</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Team</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Members</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Total Knocks</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Leads</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Conversion</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Avg/Member</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Trend</th>
                </tr>
              </thead>
              <tbody>
                {analytics.teamStats.map((team) => (
                  <tr key={team.teamId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-[#42A5F5] rounded-lg flex items-center justify-center mr-3">
                          <Building className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium text-gray-900">{team.teamName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{team.memberCount}</td>
                    <td className="py-3 px-4 text-gray-600">{team.totalKnocks}</td>
                    <td className="py-3 px-4 text-gray-600">{team.totalLeads}</td>
                    <td className="py-3 px-4 text-gray-600">{team.conversionRate}%</td>
                    <td className="py-3 px-4 text-gray-600">{team.averageKnocksPerMember}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(team.trend)}
                        <span className={`text-sm font-medium ${getTrendColor(team.trend)}`}>
                          {team.trendPercentage > 0 ? '+' : ''}{team.trendPercentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-900 flex items-center">
            <Award className="w-5 h-5 mr-2 text-yellow-600" />
            Top Performers
          </CardTitle>
          <p className="text-sm text-gray-600">Best performing team members this period</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topPerformers.map((performer, index) => (
              <div key={performer.memberId} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{performer.memberName}</p>
                    <p className="text-sm text-gray-500">{performer.teamName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Knocks</p>
                    <p className="font-bold text-gray-900">{performer.knocks}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Leads</p>
                    <p className="font-bold text-gray-900">{performer.leads}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Rate</p>
                    <p className="font-bold text-green-600">{performer.conversionRate}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Rating</p>
                    <div className="flex items-center">
                      <span className="font-bold text-gray-900">{performer.rating}</span>
                      <span className="text-yellow-500 ml-1">★</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Zone Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              Zone Performance
            </CardTitle>
            <p className="text-sm text-gray-600">Performance metrics by zone</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.zonePerformance.map((zone) => (
                <div key={zone.zoneId} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{zone.zoneName}</p>
                      <p className="text-sm text-gray-500">{zone.memberCount} members</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{zone.totalKnocks}</p>
                    <p className="text-sm text-gray-600">{zone.conversionRate}% conversion</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Trends */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
              Performance Trends
            </CardTitle>
            <p className="text-sm text-gray-600">Weekly performance comparison</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.performance.weekly.map((week, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{week.week}</span>
                    <span className="text-sm text-gray-600">{week.conversion}% conversion</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(week.knocks / 500) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">{week.knocks}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-900 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-purple-600" />
            Quick Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Best Performing Team</h3>
              <p className="text-2xl font-bold text-blue-600">Team Alpha</p>
              <p className="text-sm text-gray-600">7.5% conversion rate</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Top Performer</h3>
              <p className="text-2xl font-bold text-green-600">Rohit Gupta</p>
              <p className="text-sm text-gray-600">85 knocks, 8.2% conversion</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Best Zone</h3>
              <p className="text-2xl font-bold text-purple-600">Janipur East</p>
              <p className="text-sm text-gray-600">7.5% conversion rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
