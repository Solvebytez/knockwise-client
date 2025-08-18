"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Download, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Users,
  MapPin,
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  Mail,
  Shield,
  Building
} from "lucide-react"
import { apiInstance } from "@/lib/apiInstance"
import { toast } from "sonner"
import { EditTeamForm } from "./edit-team-form"
import { CreateTeamForm } from "./create-team-form"
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

interface Team {
  _id: string
  name: string
  description?: string
  superadminId: string
  leaderId: {
    _id: string
    name: string
    email: string
  }
  agentIds: Array<{
    _id: string
    name: string
    email: string
    status: 'ACTIVE' | 'INACTIVE'
  }>
  createdAt: string
  updatedAt: string
  performance?: {
    totalMembers: number
    activeMembers: number
    averageKnocks: number
    completionRate: number
    zoneCoverage: number
    zoneAssignments?: Array<{
      zoneName: string
      status: string
    }>
  }
}

const mockTeams: Team[] = [
  {
    _id: '1',
    name: 'Team Alpha',
    description: 'High-performing sales team',
    superadminId: 'admin1',
    leaderId: { _id: 'leader1', name: 'Riya Mehta', email: 'riya@zenith.com' },
    agentIds: [
      { _id: 'agent1', name: 'Aman Shah', email: 'aman@axis.com', status: 'ACTIVE' },
      { _id: 'agent2', name: 'Rohit Gupta', email: 'rohit@bluewave.in', status: 'ACTIVE' },
      { _id: 'agent3', name: 'Snehal Verma', email: 'snehal@dwellrise.com', status: 'INACTIVE' }
    ],
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    performance: {
      totalMembers: 3,
      activeMembers: 2,
      averageKnocks: 85,
      completionRate: 92,
      zoneCoverage: 4
    }
  },
  {
    _id: '2',
    name: 'Team Beta',
    description: 'New territory expansion team',
    superadminId: 'admin1',
    leaderId: { _id: 'leader2', name: 'Gourav Sharma', email: 'gourav@zenith.com' },
    agentIds: [
      { _id: 'agent4', name: 'Priya Singh', email: 'priya@axis.com', status: 'ACTIVE' },
      { _id: 'agent5', name: 'Vikram Patel', email: 'vikram@bluewave.in', status: 'ACTIVE' }
    ],
    createdAt: '2024-01-10',
    updatedAt: '2024-01-18',
    performance: {
      totalMembers: 2,
      activeMembers: 2,
      averageKnocks: 72,
      completionRate: 88,
      zoneCoverage: 3
    }
  },
  {
    _id: '3',
    name: 'Team Gamma',
    description: 'Premium client focus team',
    superadminId: 'admin1',
    leaderId: { _id: 'leader3', name: 'Neha Kumar', email: 'neha@dwellrise.com' },
    agentIds: [
      { _id: 'agent6', name: 'Arjun Reddy', email: 'arjun@zenith.com', status: 'ACTIVE' },
      { _id: 'agent7', name: 'Zara Khan', email: 'zara@axis.com', status: 'ACTIVE' },
      { _id: 'agent8', name: 'Raj Malhotra', email: 'raj@bluewave.in', status: 'ACTIVE' }
    ],
    createdAt: '2024-01-20',
    updatedAt: '2024-01-22',
    performance: {
      totalMembers: 3,
      activeMembers: 3,
      averageKnocks: 68,
      completionRate: 85,
      zoneCoverage: 5
    }
  }
]

const fetchTeams = async (): Promise<Team[]> => {
  try {
    const response = await apiInstance.get('/teams')
    return response.data.data || []
  } catch (error) {
    console.error('Error fetching teams:', error)
    return mockTeams
  }
}

const fetchTeamDetails = async (teamId: string): Promise<Team> => {
  try {
    const response = await apiInstance.get(`/teams/${teamId}`)
    return response.data.data
  } catch (error) {
    console.error('Error fetching team details:', error)
    throw error
  }
}

const deleteTeam = async (id: string): Promise<void> => {
  try {
    await apiInstance.delete(`/teams/${id}`)
  } catch (error) {
    console.error('Error deleting team:', error)
    throw error
  }
}

export function TeamMembersTable() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false)
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false)
  const itemsPerPage = 10

  // Query for fetching specific team details
  const { data: detailedTeam, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['team-details', selectedTeam?._id],
    queryFn: () => fetchTeamDetails(selectedTeam!._id),
    enabled: !!selectedTeam && isViewDetailsOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: teams = [], isLoading, error, refetch } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams
  })

  const deleteTeamMutation = useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast.success('Team deleted successfully')
      setIsDeleteDialogOpen(false)
      setTeamToDelete(null)
    },
    onError: () => {
      toast.error('Failed to delete team')
    }
  })

  // Filter teams based on search and filters
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.leaderId.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && (team.performance?.activeMembers || 0) > 0) ||
                         (statusFilter === 'inactive' && (team.performance?.activeMembers || 0) === 0)
    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTeams = filteredTeams.slice(startIndex, startIndex + itemsPerPage)

  const handleViewTeamDetails = (team: Team) => {
    setSelectedTeam(team)
    setIsViewDetailsOpen(true)
  }

  const handleDeleteTeam = (team: Team) => {
    setTeamToDelete(team)
    setIsDeleteDialogOpen(true)
  }

  const handleEditTeam = (team: Team) => {
    setTeamToEdit(team)
    setIsEditDialogOpen(true)
  }

  const handleCreateTeamSuccess = () => {
    setIsCreateTeamDialogOpen(false)
    queryClient.invalidateQueries({ queryKey: ['teams'] })
    queryClient.invalidateQueries({ queryKey: ['teamStats'] })
    queryClient.invalidateQueries({ queryKey: ['teamPerformance'] })
  }

  const confirmDelete = () => {
    if (teamToDelete) {
      deleteTeamMutation.mutate(teamToDelete._id)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Loading teams...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-red-500">Failed to load teams</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-gray-900">Team Management</CardTitle>
              <p className="text-gray-600 text-sm mt-1">Manage and monitor your teams performance</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-gray-300"
                onClick={() => refetch()}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by team name, description, or leader"
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
                  <SelectItem value="active">Active Teams</SelectItem>
                  <SelectItem value="inactive">Inactive Teams</SelectItem>
                </SelectContent>
              </Select>
            </div>
                         <div className="flex items-center space-x-2">
               <Button 
                 size="sm" 
                 className="bg-[#42A5F5] hover:bg-[#357ABD] text-white border-0 shadow-sm"
                 onClick={() => setIsCreateTeamDialogOpen(true)}
               >
                 <Building className="w-4 h-4 mr-2" />
                 Create Team
               </Button>
               <Button variant="outline" size="sm" className="border-gray-300">
                 <Download className="w-4 h-4 mr-2" />
                 Export
               </Button>
             </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#42A5F5] text-white">
                  <th className="text-left py-3 px-4 font-medium">Team</th>
                  <th className="text-left py-3 px-4 font-medium">Leader</th>
                  <th className="text-left py-3 px-4 font-medium">Members</th>
                  <th className="text-left py-3 px-4 font-medium">Performance</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Created</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTeams.map((team) => (
                  <tr key={team._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#42A5F5] rounded-full flex items-center justify-center">
                          <Building className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{team.name}</p>
                          <p className="text-sm text-gray-500">{team.description || 'No description'}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              <Users className="w-3 h-3 mr-1" />
                              Team
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Shield className="w-4 h-4 mr-2 text-blue-500" />
                          <span className="font-medium text-gray-900">{team.leaderId.name}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {team.leaderId.email}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium text-gray-900">{team.performance?.totalMembers || team.agentIds.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Active:</span>
                          <span className="font-medium text-green-600">{team.performance?.activeMembers || team.agentIds.filter(agent => agent.status === 'ACTIVE').length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Inactive:</span>
                          <span className="font-medium text-orange-600">{team.agentIds.filter(agent => agent.status === 'INACTIVE').length}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Avg Knocks:</span>
                          <span className="font-medium text-gray-900">{team.performance?.averageKnocks || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Completion:</span>
                          <span className="font-medium text-green-600">{team.performance?.completionRate || 0}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Zones:</span>
                          <span className="font-medium text-blue-600">{team.performance?.zoneCoverage || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          (team.performance?.activeMembers || 0) > 0 ? 'bg-green-500' : 'bg-orange-500'
                        }`}></div>
                        <Badge className={`text-xs ${
                          (team.performance?.activeMembers || 0) > 0
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {(team.performance?.activeMembers || 0) > 0 ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600">
                        {formatDate(team.createdAt)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Updated {formatDate(team.updatedAt)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewTeamDetails(team)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Team Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditTeam(team)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Team
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteTeam(team)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTeams.length)} of {filteredTeams.length} teams
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="border-gray-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page 
                      ? "bg-[#42A5F5] text-white" 
                      : "border-gray-300 text-gray-600"
                    }
                  >
                    {page}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="border-gray-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Team Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                     <DialogHeader>
             <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
               <div className="w-6 h-6 bg-[#42A5F5] rounded-full flex items-center justify-center">
                 <Building className="w-4 h-4 text-white" />
               </div>
               Team Details
             </DialogTitle>
           </DialogHeader>
          
          {selectedTeam && (
            <div className="space-y-6">
              {isLoadingDetails ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-gray-500">Loading team details...</div>
                </div>
              ) : detailedTeam ? (
                <>
                                     {/* Team Basic Information */}
                                        <Card className="border-gray-200">
                       <CardHeader className="pb-3">
                         <CardTitle className="text-base font-semibold text-gray-900">Basic Information</CardTitle>
                       </CardHeader>
                     <CardContent className="space-y-3">
                       <div className="flex justify-between">
                         <span className="text-gray-600">Team Name:</span>
                         <span className="font-medium text-gray-900">{detailedTeam.name}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Description:</span>
                         <span className="font-medium text-gray-900">{detailedTeam.description || 'No description'}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Created:</span>
                         <span className="font-medium text-gray-900">{formatDate(detailedTeam.createdAt)}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Last Updated:</span>
                         <span className="font-medium text-gray-900">{formatDate(detailedTeam.updatedAt)}</span>
                       </div>
                     </CardContent>
                   </Card>

                   {/* Team Leader */}
                                        <Card className="border-gray-200">
                       <CardHeader className="pb-3">
                         <CardTitle className="text-base font-semibold text-gray-900">Team Leader</CardTitle>
                       </CardHeader>
                     <CardContent className="space-y-3">
                                                <div className="flex items-center space-x-3">
                           <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                             <Shield className="w-4 h-4 text-blue-600" />
                           </div>
                         <div>
                           <p className="font-medium text-gray-900">{detailedTeam.leaderId.name}</p>
                           <p className="text-sm text-gray-500">{detailedTeam.leaderId.email}</p>
                         </div>
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
                           <div className="text-xl font-bold text-green-600">{detailedTeam.performance?.totalMembers || detailedTeam.agentIds.length}</div>
                           <div className="text-xs text-gray-600">Total Members</div>
                         </div>
                         <div className="text-center p-4 bg-blue-50 rounded-lg">
                           <div className="text-xl font-bold text-blue-600">{detailedTeam.performance?.activeMembers || detailedTeam.agentIds.filter(agent => agent.status === 'ACTIVE').length}</div>
                           <div className="text-xs text-gray-600">Active Members</div>
                         </div>
                         <div className="text-center p-4 bg-purple-50 rounded-lg">
                           <div className="text-xl font-bold text-purple-600">{detailedTeam.performance?.averageKnocks || 0}</div>
                           <div className="text-xs text-gray-600">Avg Knocks</div>
                         </div>
                         <div className="text-center p-4 bg-orange-50 rounded-lg">
                           <div className="text-xl font-bold text-orange-600">{detailedTeam.performance?.completionRate || 0}%</div>
                           <div className="text-xs text-gray-600">Completion Rate</div>
                         </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Team Members */}
                                     <Card className="border-gray-200">
                     <CardHeader className="pb-3">
                       <CardTitle className="text-base font-semibold text-gray-900">Team Members ({detailedTeam.agentIds.length})</CardTitle>
                     </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {detailedTeam.agentIds.map((agent) => (
                          <div key={agent._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-[#42A5F5] rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {agent.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{agent.name}</p>
                                <p className="text-sm text-gray-500">{agent.email}</p>
                              </div>
                            </div>
                            <Badge className={`text-xs ${
                              agent.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {agent.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Zone Coverage */}
                                     <Card className="border-gray-200">
                     <CardHeader className="pb-3">
                       <CardTitle className="text-base font-semibold text-gray-900">Zone Coverage</CardTitle>
                     </CardHeader>
                    <CardContent>
                                             <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                           <MapPin className="w-5 h-5 text-purple-600" />
                         </div>
                                                 <div>
                           <div className="text-xl font-bold text-gray-900">{detailedTeam.performance?.zoneCoverage || 0}</div>
                           <div className="text-xs text-gray-600">Zones Covered</div>
                         </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Zone Assignments */}
                  {detailedTeam.performance?.zoneAssignments && detailedTeam.performance.zoneAssignments.length > 0 && (
                                         <Card className="border-gray-200">
                       <CardHeader className="pb-3">
                         <CardTitle className="text-base font-semibold text-gray-900">Zone Assignments</CardTitle>
                       </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {detailedTeam.performance.zoneAssignments.map((assignment, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-gray-900">{assignment.zoneName}</span>
                              <Badge className={`text-xs ${
                                assignment.status === 'ACTIVE' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {assignment.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <div className="text-red-500">Failed to load team details</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Team Dialog */}
      <Dialog open={isCreateTeamDialogOpen} onOpenChange={setIsCreateTeamDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-6 h-6 bg-[#42A5F5] rounded-full flex items-center justify-center">
                <Building className="w-4 h-4 text-white" />
              </div>
              Create New Team
            </DialogTitle>
          </DialogHeader>
          
          <CreateTeamForm onSuccess={handleCreateTeamSuccess} />
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-6 h-6 bg-[#42A5F5] rounded-full flex items-center justify-center">
                <Edit className="w-4 h-4 text-white" />
              </div>
              Edit Team
            </DialogTitle>
          </DialogHeader>
          
          {teamToEdit && (
            <EditTeamForm
              team={teamToEdit}
              onSuccess={() => {
                setIsEditDialogOpen(false)
                setTeamToEdit(null)
              }}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setTeamToEdit(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              Delete Team
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{teamToDelete?.name}</span>? 
              This action cannot be undone and will permanently remove this team and all its assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={deleteTeamMutation.isPending}
            >
              {deleteTeamMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete Team'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
