"use client"

import { useState, forwardRef, useImperativeHandle } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  MapPin, 
  Users, 
  Building, 
  Target, 
  TrendingUp, 
  Calendar,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  UserCheck,
  Map,
  Layers,
  FileText
} from "lucide-react"
import { apiInstance } from "@/lib/apiInstance"
import { toast } from "sonner"

interface Territory {
  _id: string
  name: string
  description?: string
  boundary: {
    type: string
    coordinates: number[][][]
  }
  assignedAgentId?: {
    _id: string
    name: string
    email: string
  }
  teamId?: {
    _id: string
    name: string
  }
  currentAssignment?: {
    _id: string
    agentId?: {
      _id: string
      name: string
      email: string
    }
    teamId?: {
      _id: string
      name: string
    }
    effectiveFrom: string
    effectiveTo?: string
    status: string
  }
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT' | 'SCHEDULED'
  totalResidents?: number
  activeResidents?: number
  completionRate?: number
  averageKnocks?: number
  lastActivity?: string | null
  createdAt: string
  updatedAt: string
  // Additional suggested fields
  area?: number // in square meters
  populationDensity?: number // residents per sq km
  averageIncome?: number // median household income
  propertyValue?: number // average property value
  crimeRate?: number // crime rate per 1000 residents
  schoolRating?: number // average school rating (1-10)
  walkability?: number // walkability score (1-100)
  publicTransport?: number // public transport score (1-100)
  environmentalScore?: number // environmental quality score (1-100)
  marketPotential?: number // market potential score (1-100)
  competitionLevel?: number // competition level (1-10)
  seasonalFactors?: string[] // seasonal considerations
  specialEvents?: string[] // special events or festivals
  demographics?: {
    ageGroups: { [key: string]: number } // age distribution
    householdSize: number // average household size
    homeOwnership: number // percentage of homeowners
    educationLevel: number // average education level
  }
  performance?: {
    conversionRate?: number // lead to appointment conversion
    appointmentRate?: number // appointment success rate
    followUpRate?: number // follow-up completion rate
    customerSatisfaction?: number // satisfaction score (1-10)
    repeatBusiness?: number // percentage of repeat customers
  }
}

interface TerritoryStats {
  totalTerritories: number
  activeTerritories: number
  scheduledTerritories: number
  draftTerritories: number
  assignedTerritories: number
  unassignedTerritories: number
  totalResidents: number
  activeResidents: number
  averageCompletionRate: number
  totalArea: number
  recentActivity: number
  topPerformingTerritory?: {
    name: string
    completionRate: number
  }
  // Additional comprehensive stats
  averageMarketPotential: number
  averagePropertyValue: number
  averageIncome: number
  totalMarketValue: number
  averageWalkability: number
  averageSchoolRating: number
  averageCrimeRate: number
  averageCompetitionLevel: number
  totalConversionRate: number
  totalAppointmentRate: number
  totalCustomerSatisfaction: number
  seasonalTrends: {
    spring: number
    summer: number
    fall: number
    winter: number
  }
  demographicInsights: {
    averageAge: number
    averageHouseholdSize: number
    averageHomeOwnership: number
    averageEducationLevel: number
  }
  performanceMetrics: {
    totalKnocks: number
    totalAppointments: number
    totalConversions: number
    averageFollowUpRate: number
    repeatBusinessRate: number
  }
}

const mockTerritories: Territory[] = [
  {
    _id: '1',
    name: 'individual 2',
    description: 'Individual assignment territory',
    boundary: {
      type: 'Polygon',
      coordinates: [[[-96.797, 32.7767], [-96.787, 32.7867], [-96.807, 32.7667], [-96.797, 32.7767]]]
    },
    assignedAgentId: {
      _id: 'agent1',
      name: 'individual',
      email: 'agn@example.com'
    },
    currentAssignment: {
      _id: 'assignment1',
      agentId: {
        _id: 'agent1',
        name: 'individual',
        email: 'agn@example.com'
      },
      effectiveFrom: '2025-08-21T00:00:00.000Z',
      status: 'PENDING'
    },
    status: 'SCHEDULED',
    totalResidents: 10,
    activeResidents: 0,
    completionRate: 0,
    averageKnocks: 0,
    lastActivity: '2025-08-18T00:00:00.000Z',
    createdAt: '2025-08-18T00:00:00.000Z',
    updatedAt: '2025-08-18T00:00:00.000Z',
    // Enhanced data
    area: 850000,
    populationDensity: 3200,
    averageIncome: 85000,
    propertyValue: 450000,
    crimeRate: 2.1,
    schoolRating: 8.5,
    walkability: 85,
    publicTransport: 90,
    environmentalScore: 78,
    marketPotential: 92,
    competitionLevel: 7,
    seasonalFactors: ['Summer heat', 'Winter mild'],
    specialEvents: ['State Fair', 'Art Festival'],
    demographics: {
      ageGroups: { '18-25': 15, '26-35': 25, '36-45': 30, '46-55': 20, '55+': 10 },
      householdSize: 2.3,
      homeOwnership: 65,
      educationLevel: 8.2
    },
    performance: {
      conversionRate: 12.5,
      appointmentRate: 78,
      followUpRate: 85,
      customerSatisfaction: 8.7,
      repeatBusiness: 15
    }
  },
  {
    _id: '2',
    name: 'zone for individual',
    description: 'Individual assignment zone',
    boundary: {
      type: 'Polygon',
      coordinates: [[[-96.797, 32.8167], [-96.787, 32.8267], [-96.807, 32.8067], [-96.797, 32.8167]]]
    },
    assignedAgentId: {
      _id: 'agent2',
      name: 'individual',
      email: 'agn@example.com'
    },
    currentAssignment: {
      _id: 'assignment2',
      agentId: {
        _id: 'agent2',
        name: 'individual',
        email: 'agn@example.com'
      },
      effectiveFrom: '2025-08-19T00:00:00.000Z',
      status: 'PENDING'
    },
    status: 'SCHEDULED',
    totalResidents: 15,
    activeResidents: 0,
    completionRate: 0,
    averageKnocks: 0,
    lastActivity: '2025-08-18T00:00:00.000Z',
    createdAt: '2025-08-18T00:00:00.000Z',
    updatedAt: '2025-08-18T00:00:00.000Z'
  },
  {
    _id: '3',
    name: 'zone 2',
    description: 'Team assignment zone',
    boundary: {
      type: 'Polygon',
      coordinates: [[[-96.757, 32.7767], [-96.747, 32.7867], [-96.767, 32.7667], [-96.757, 32.7767]]]
    },
    teamId: {
      _id: 'team1',
      name: 'team 1'
    },
    currentAssignment: {
      _id: 'assignment3',
      teamId: {
        _id: 'team1',
        name: 'team 1'
      },
      effectiveFrom: '2025-08-21T00:00:00.000Z',
      status: 'PENDING'
    },
    status: 'SCHEDULED',
    totalResidents: 25,
    activeResidents: 0,
    completionRate: 0,
    averageKnocks: 0,
    lastActivity: '2025-08-18T00:00:00.000Z',
    createdAt: '2025-08-18T00:00:00.000Z',
    updatedAt: '2025-08-18T00:00:00.000Z'
  },
  {
    _id: '4',
    name: 'zone 1',
    description: 'Team assignment zone',
    boundary: {
      type: 'Polygon',
      coordinates: [[[-96.837, 32.7767], [-96.847, 32.7667], [-96.827, 32.7867], [-96.837, 32.7767]]]
    },
    teamId: {
      _id: 'team1',
      name: 'team 1'
    },
    currentAssignment: {
      _id: 'assignment4',
      teamId: {
        _id: 'team1',
        name: 'team 1'
      },
      effectiveFrom: '2025-08-20T00:00:00.000Z',
      status: 'PENDING'
    },
    status: 'SCHEDULED',
    totalResidents: 19,
    activeResidents: 0,
    completionRate: 0,
    averageKnocks: 0,
    lastActivity: '2025-08-18T00:00:00.000Z',
    createdAt: '2025-08-18T00:00:00.000Z',
    updatedAt: '2025-08-18T00:00:00.000Z'
  },
  
]

const mockStats: TerritoryStats = {
  totalTerritories: 4,
  activeTerritories: 0,
  scheduledTerritories: 4,
  draftTerritories: 0,
  assignedTerritories: 4,
  unassignedTerritories: 0,
  totalResidents: 69, // 10+15+25+19 from the territories
  activeResidents: 0, // All territories have 0 active residents
  averageCompletionRate: 0, // All territories have 0% completion
  totalArea: 1250000,
  recentActivity: 14, // Updated to match the image
  topPerformingTerritory: {
    name: 'zone 1',
    completionRate: 0 // All territories have 0% completion
  },
  // Enhanced comprehensive stats
  averageMarketPotential: 87,
  averagePropertyValue: 385000,
  averageIncome: 72000,
  totalMarketValue: 1925000,
  averageWalkability: 78,
  averageSchoolRating: 7.8,
  averageCrimeRate: 2.8,
  averageCompetitionLevel: 6.2,
  totalConversionRate: 11.2,
  totalAppointmentRate: 74.5,
  totalCustomerSatisfaction: 8.3,
  seasonalTrends: {
    spring: 85,
    summer: 72,
    fall: 88,
    winter: 79
  },
  demographicInsights: {
    averageAge: 38.5,
    averageHouseholdSize: 2.4,
    averageHomeOwnership: 68,
    averageEducationLevel: 7.9
  },
  performanceMetrics: {
    totalKnocks: 1247,
    totalAppointments: 156,
    totalConversions: 18,
    averageFollowUpRate: 82,
    repeatBusinessRate: 12.5
  }
}

const fetchTerritories = async (): Promise<Territory[]> => {
  try {
    const response = await apiInstance.get('/zones/list-all')
    return response.data.data || []
  } catch (error) {
    console.error('Error fetching territories:', error)
    return mockTerritories
  }
}

const fetchTerritoryStats = async (): Promise<TerritoryStats> => {
  try {
    const response = await apiInstance.get('/zones/overview-stats')
    return response.data.data || mockStats
  } catch (error) {
    console.error('Error fetching territory stats:', error)
    return mockStats
  }
}

// Function to calculate recent activities from territories data
const calculateRecentActivity = (territories: Territory[]): number => {
  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  
  let activityCount = 0
  
  territories.forEach(territory => {
    // Count activities based on territory updates and assignments
    const lastActivity = new Date(territory.lastActivity || territory.updatedAt)
    const createdAt = new Date(territory.createdAt)
    
    // If territory was created in last 24 hours
    if (createdAt > twentyFourHoursAgo) {
      activityCount += 1
    }
    
    // If territory had activity in last 24 hours (but not just creation)
    if (lastActivity > twentyFourHoursAgo && lastActivity.getTime() !== createdAt.getTime()) {
      activityCount += 1
    }
    
    // Only count assignments if they are ACTIVE (not scheduled for future)
    if (territory.currentAssignment?.effectiveFrom && territory.status === 'ACTIVE') {
      const assignmentCreated = new Date(territory.updatedAt) // Use territory update time as proxy
      
      // Only count if the assignment was created in the last 24 hours
      if (assignmentCreated > twentyFourHoursAgo) {
        activityCount += 1
      }
    }
  })
  
  // Don't add any base activity - show 0 if there's no real activity
  return activityCount
}

// Function to calculate dynamic stats from territories data
const calculateDynamicStats = (territories: Territory[]): TerritoryStats => {
  const totalTerritories = territories.length
  const activeTerritories = territories.filter(t => t.status === 'ACTIVE').length
  const scheduledTerritories = territories.filter(t => t.status === 'SCHEDULED').length
  const draftTerritories = territories.filter(t => t.status === 'DRAFT').length
  const assignedTerritories = territories.filter(t => t.currentAssignment).length
  const unassignedTerritories = totalTerritories - assignedTerritories
  
  const totalResidents = territories.reduce((sum, t) => sum + (t.totalResidents || 0), 0)
  const activeResidents = territories.reduce((sum, t) => sum + (t.activeResidents || 0), 0)
  
  const completionRates = territories.map(t => t.completionRate || 0).filter(rate => rate > 0)
  const averageCompletionRate = completionRates.length > 0 
    ? Math.round(completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length)
    : 0
  
  // Find top performing territory
  const topPerformingTerritory = territories.reduce((top, current) => {
    const currentRate = current.completionRate || 0
    const topRate = top?.completionRate || 0
    return currentRate > topRate ? current : top
  }, null as Territory | null)
  
  return {
    totalTerritories,
    activeTerritories,
    scheduledTerritories,
    draftTerritories,
    assignedTerritories,
    unassignedTerritories,
    totalResidents,
    activeResidents,
    averageCompletionRate,
    totalArea: 1250000,
    recentActivity: calculateRecentActivity(territories), // Calculate actual recent activities
    topPerformingTerritory: topPerformingTerritory ? {
      name: topPerformingTerritory.name,
      completionRate: topPerformingTerritory.completionRate || 0
    } : undefined,
    // Enhanced comprehensive stats
    averageMarketPotential: 87,
    averagePropertyValue: 385000,
    averageIncome: 72000,
    totalMarketValue: 1925000,
    averageWalkability: 78,
    averageSchoolRating: 7.8,
    averageCrimeRate: 2.8,
    averageCompetitionLevel: 6.2,
    totalConversionRate: 11.2,
    totalAppointmentRate: 74.5,
    totalCustomerSatisfaction: 8.3,
    seasonalTrends: {
      spring: 85,
      summer: 72,
      fall: 88,
      winter: 79
    },
    demographicInsights: {
      averageAge: 38.5,
      averageHouseholdSize: 2.4,
      averageHomeOwnership: 68,
      averageEducationLevel: 7.9
    },
    performanceMetrics: {
      totalKnocks: 1247,
      totalAppointments: 156,
      totalConversions: 18,
      averageFollowUpRate: 82,
      repeatBusinessRate: 12.5
    }
  }
}

export const TerritoryOverview = forwardRef<{ refetch: () => void }, {}>((props, ref) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [teamFilter, setTeamFilter] = useState('all')
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null)
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false)
  const [territoryToDelete, setTerritoryToDelete] = useState<Territory | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: territories = [], isLoading, error, refetch } = useQuery({
    queryKey: ['territories'],
    queryFn: fetchTerritories
  })

  // Calculate dynamic stats from territories data - this ensures cards are always up-to-date
  const dynamicStats = calculateDynamicStats(territories)
  
  const { data: apiStats } = useQuery({
    queryKey: ['territoryStats'],
    queryFn: fetchTerritoryStats,
    enabled: false // Disable this query since we're using dynamic calculation
  })
  
  // Use dynamic stats, fallback to API stats if available, then mock stats
  const stats = dynamicStats || apiStats || mockStats

  // Expose refetch function to parent component
  useImperativeHandle(ref, () => ({
    refetch: () => {
      refetch()
    }
  }))

  // Filter territories based on search and filters
  const filteredTerritories = territories.filter(territory => {
    const matchesSearch = territory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         territory.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         territory.assignedAgentId?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || territory.status === statusFilter
    const matchesTeam = teamFilter === 'all' || territory.teamId?.name === teamFilter
    return matchesSearch && matchesStatus && matchesTeam
  })

  const handleViewDetails = (territory: Territory) => {
    setSelectedTerritory(territory)
    setIsViewDetailsOpen(true)
  }

  const handleDeleteTerritory = (territory: Territory) => {
    setTerritoryToDelete(territory)
    setIsDeleteDialogOpen(true)
  }

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setTerritoryToDelete(null)
    setIsDeleting(false)
  }

  const confirmDelete = async () => {
    if (territoryToDelete) {
      setIsDeleting(true)
      try {
        const response = await apiInstance.delete(`/zones/delete/${territoryToDelete._id}`)
        
        if (response.data.success) {
          toast.success(response.data.message || 'Territory deleted successfully')
          refetch() // Refresh the territories list
          // Only close dialog and reset state after successful deletion
          setIsDeleteDialogOpen(false)
          setTerritoryToDelete(null)
        } else {
          toast.error(response.data.message || 'Failed to delete territory')
        }
      } catch (error: any) {
        console.error('Error deleting territory:', error)
        const errorMessage = error.response?.data?.message || 'Failed to delete territory'
        toast.error(errorMessage)
      } finally {
        setIsDeleting(false)
        // Don't close dialog or reset state here - only on success
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'INACTIVE':
        return 'bg-orange-100 text-orange-800'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 75) return 'text-blue-600'
    if (rate >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading territories...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Failed to load territories</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-blue-500" />
              Total Territories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalTerritories}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.activeTerritories} active, {stats.scheduledTerritories || 0} scheduled, {stats.draftTerritories || 0} draft
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Users className="w-4 h-4 mr-2 text-green-500" />
              Total Residents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalResidents}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.activeResidents} active residents
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Target className="w-4 h-4 mr-2 text-purple-500" />
              Avg Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.averageCompletionRate}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.topPerformingTerritory?.name} leads at {stats.topPerformingTerritory?.completionRate}%
            </div>
          </CardContent>
        </Card>

                 <Card className="border-gray-200 shadow-sm">
           <CardHeader className="pb-3">
             <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
               <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <div className="flex items-center cursor-help">
                       <Activity className="w-4 h-4 mr-2 text-orange-500" />
                       Recent Activity
                     </div>
                   </TooltipTrigger>
                                       <TooltipContent>
                      <p className="max-w-xs">
                        Counts territory creations, updates, and recent assignments in the last 24 hours
                      </p>
                    </TooltipContent>
                 </Tooltip>
               </TooltipProvider>
             </CardTitle>
           </CardHeader>
                     <CardContent>
             <div className="text-2xl font-bold text-gray-900">{stats.recentActivity}</div>
             <div className="text-xs text-gray-500 mt-1">
               Territory updates & assignments
             </div>
           </CardContent>
        </Card>
      </div>

      {/* Territory List */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-gray-900">Territory List</CardTitle>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mt-4 space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search territories, agents, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-40 border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  <SelectItem value="Team Alpha">Team Alpha</SelectItem>
                  <SelectItem value="Team Beta">Team Beta</SelectItem>
                  <SelectItem value="Team Gamma">Team Gamma</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="border-gray-300">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-medium text-gray-900">Territory</TableHead>
                  <TableHead className="font-medium text-gray-900">Assigned Agent</TableHead>
                  <TableHead className="font-medium text-gray-900">Team</TableHead>
                  <TableHead className="font-medium text-gray-900">Residents</TableHead>
                                     <TableHead className="font-medium text-gray-900">Performance</TableHead>
                   <TableHead className="font-medium text-gray-900">Status</TableHead>
                   <TableHead className="font-medium text-gray-900">Scheduled Date</TableHead>
                   <TableHead className="font-medium text-gray-900">Last Activity</TableHead>
                   <TableHead className="font-medium text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTerritories.map((territory) => (
                  <TableRow key={territory._id} className="border-b border-gray-200 hover:bg-gray-50 h-20">
                    <TableCell className="max-w-xs">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#42A5F5] rounded-full flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{territory.name}</p>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-sm text-gray-500 line-clamp-2 cursor-help">
                                  {territory.description || 'No description'}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{territory.description || 'No description'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </TableCell>
                                         <TableCell className="align-top">
                       {territory.currentAssignment?.agentId ? (
                         <div className="space-y-1">
                           <div className="flex items-center space-x-2">
                             <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                               <UserCheck className="w-3 h-3 text-blue-600" />
                             </div>
                             <div className="min-w-0 flex-1">
                               <p className="font-medium text-gray-900 truncate">{territory.currentAssignment.agentId.name}</p>
                               <p className="text-xs text-gray-500 truncate">{territory.currentAssignment.agentId.email}</p>
                             </div>
                           </div>
                         </div>
                       ) : (
                         <div className="flex items-center space-x-2">
                           <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                             <AlertCircle className="w-3 h-3 text-gray-400" />
                           </div>
                           <span className="text-gray-400 text-sm">Unassigned</span>
                         </div>
                       )}
                     </TableCell>
                     <TableCell className="align-top">
                       {territory.currentAssignment?.teamId ? (
                         <Badge className="text-xs bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200">
                           <Building className="w-3 h-3 mr-1" />
                           {territory.currentAssignment.teamId.name}
                         </Badge>
                       ) : (
                         <div className="flex items-center space-x-2">
                           <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                             <Users className="w-3 h-3 text-gray-400" />
                           </div>
                           <span className="text-gray-400 text-sm">No team</span>
                         </div>
                       )}
                     </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium text-gray-900">{territory.totalResidents || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Active:</span>
                          <span className="font-medium text-green-600">{territory.activeResidents || 0}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Completion:</span>
                          <span className={`font-medium ${getCompletionRateColor(territory.completionRate || 0)}`}>
                            {territory.completionRate || 0}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Avg Knocks:</span>
                          <span className="font-medium text-gray-900">{territory.averageKnocks || 0}</span>
                        </div>
                      </div>
                    </TableCell>
                                         <TableCell className="align-top">
                       <Badge className={`text-xs ${getStatusColor(territory.status)}`}>
                         {territory.status === 'ACTIVE' ? (
                           <CheckCircle className="w-3 h-3 mr-1" />
                         ) : territory.status === 'INACTIVE' ? (
                           <Clock className="w-3 h-3 mr-1" />
                         ) : territory.status === 'SCHEDULED' ? (
                           <Calendar className="w-3 h-3 mr-1" />
                         ) : (
                           <FileText className="w-3 h-3 mr-1" />
                         )}
                         {territory.status}
                       </Badge>
                     </TableCell>
                     <TableCell className="align-top">
                       <div className="text-sm text-gray-600">
                         {territory.status === 'SCHEDULED' && territory.currentAssignment?.effectiveFrom ? (
                           <div className="flex items-center space-x-1">
                             <Calendar className="w-3 h-3 text-blue-500" />
                             <span>{formatDate(territory.currentAssignment.effectiveFrom)}</span>
                           </div>
                         ) : (
                           <span className="text-gray-400">-</span>
                         )}
                       </div>
                     </TableCell>
                     <TableCell className="align-top">
                       <div className="text-sm text-gray-600">
                         {formatDate(territory.lastActivity || territory.updatedAt)}
                       </div>
                     </TableCell>
                    <TableCell className="align-top">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails(territory)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Territory
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Map className="mr-2 h-4 w-4" />
                            View on Map
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteTerritory(territory)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Territory
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Territory Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-6 h-6 bg-[#42A5F5] rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              Territory Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedTerritory && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Territory Name:</span>
                    <span className="font-medium text-gray-900">{selectedTerritory.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Description:</span>
                    <span className="font-medium text-gray-900">{selectedTerritory.description || 'No description'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={`text-xs ${getStatusColor(selectedTerritory.status)}`}>
                      {selectedTerritory.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium text-gray-900">{formatDate(selectedTerritory.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Assignment Information */}
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900">Assignment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assigned Agent:</span>
                    <span className="font-medium text-gray-900">
                      {selectedTerritory.assignedAgentId ? selectedTerritory.assignedAgentId.name : 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agent Email:</span>
                    <span className="font-medium text-gray-900">
                      {selectedTerritory.assignedAgentId ? selectedTerritory.assignedAgentId.email : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Team:</span>
                    <span className="font-medium text-gray-900">
                      {selectedTerritory.teamId ? selectedTerritory.teamId.name : 'No team assigned'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Overview */}
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900">Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">{selectedTerritory.totalResidents}</div>
                      <div className="text-xs text-gray-600">Total Residents</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">{selectedTerritory.activeResidents}</div>
                      <div className="text-xs text-gray-600">Active Residents</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className={`text-xl font-bold ${getCompletionRateColor(selectedTerritory.completionRate || 0)}`}>
                        {selectedTerritory.completionRate}%
                      </div>
                      <div className="text-xs text-gray-600">Completion Rate</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-xl font-bold text-orange-600">{selectedTerritory.averageKnocks}</div>
                      <div className="text-xs text-gray-600">Avg Knocks</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Timeline */}
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Activity className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Last activity recorded</p>
                        <p className="text-xs text-gray-500">{formatDate(selectedTerritory.lastActivity || selectedTerritory.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

             {/* Delete Confirmation Dialog */}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
         if (!open && !isDeleting) {
           handleCancelDelete()
         }
       }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              Delete Territory
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{territoryToDelete?.name}</span>? 
              This action cannot be undone and will permanently remove this territory and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
                     <AlertDialogFooter>
             <AlertDialogCancel 
               onClick={handleCancelDelete}
               disabled={isDeleting}
               className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               Cancel
             </AlertDialogCancel>
             <AlertDialogAction 
               onClick={confirmDelete} 
               disabled={isDeleting}
               className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isDeleting ? 'Deleting...' : 'Delete Territory'}
             </AlertDialogAction>
           </AlertDialogFooter>
        </AlertDialogContent>
             </AlertDialog>
     </div>
   )
 })
