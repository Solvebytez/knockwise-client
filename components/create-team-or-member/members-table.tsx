"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Eye, ChevronLeft, ChevronRight, X, User, Mail, Phone, MapPin, Shield, Calendar, Users, Building, Edit, Trash2 } from "lucide-react"
import { apiInstance } from "@/lib/apiInstance"
import { toast } from "sonner"
import { useTabContext } from "./tab-context"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Member {
  _id: string
  name: string
  email: string
  contactNumber?: string
  username?: string
  role: 'SUPERADMIN' | 'SUBADMIN' | 'AGENT'
  status: 'ACTIVE' | 'INACTIVE'
  assignmentStatus?: 'ASSIGNED' | 'UNASSIGNED'
  primaryTeamId?: {
    _id: string
    name: string
  }
  primaryZoneId?: {
    _id: string
    name: string
  }
  teamZoneInfo?: {
    _id: string
    name: string
  }
  allAssignedZones?: Array<{
    _id: string
    name: string
    isPrimary: boolean
  }>
  teamIds: string[]
  zoneIds: string[]
  createdBy?: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
  knockedToday?: number
  password?: string // For display in modal
}

interface DetailedMember extends Member {
  teams?: Array<{
    _id: string
    name: string
  }>
  zones?: Array<{
    _id: string
    name: string
  }>
}

// Mock data removed - using real API data only

const fetchMembers = async (): Promise<Member[]> => {
  try {
    const response = await apiInstance.get('/users/my-created-agents')
    console.log('API Response:', response.data)
    return response.data.data || []
  } catch (error) {
    console.error('Error fetching members:', error)
    // Return empty array instead of mock data to show real status
    return []
  }
}

const deleteMember = async (id: string): Promise<void> => {
  try {
    await apiInstance.delete(`/users/delete/${id}`)
  } catch (error) {
    console.error('Error deleting member:', error)
    throw error
  }
}

const updateMember = async ({ id, data }: { id: string; data: Partial<Member> }): Promise<Member> => {
  try {
    const response = await apiInstance.put(`/users/update/${id}`, data)
    return response.data.data
  } catch (error) {
    console.error('Error updating member:', error)
    throw error
  }
}

export function MembersTable() {
  const { activeTab, setActiveTab } = useTabContext()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [territoryFilter, setTerritoryFilter] = useState('all')
  const [teamFilter, setTeamFilter] = useState('all')
  const [combinedStatusFilter, setCombinedStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedMember, setSelectedMember] = useState<DetailedMember | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const itemsPerPage = 10

  const { data: members = [], isLoading, error } = useQuery({
    queryKey: ['members'],
    queryFn: fetchMembers
  })

  // Fetch detailed member information
  const fetchDetailedMember = async (memberId: string): Promise<DetailedMember> => {
    try {
      const response = await apiInstance.get(`/users/get-detailed-agent/${memberId}`)
      return response.data.data
    } catch (error) {
      console.error('Error fetching detailed member:', error)
      throw error
    }
  }

  const { data: detailedMember, isLoading: detailedLoading, error: detailedError } = useQuery({
    queryKey: ['detailed-member', selectedMember?._id],
    queryFn: () => fetchDetailedMember(selectedMember!._id),
    enabled: !!selectedMember?._id && isModalOpen,
    retry: 1,
  })

  const deleteMemberMutation = useMutation({
    mutationFn: deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      toast.success('Member deleted successfully')
      // Close modal only on success
      setIsDeleteDialogOpen(false)
      setMemberToDelete(null)
    },
    onError: () => {
      toast.error('Failed to delete member')
      // Keep modal open on error so user can try again
    }
  })

  const updateMemberMutation = useMutation({
    mutationFn: updateMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      toast.success('Member updated successfully')
      // Close modal only on success
      setIsEditModalOpen(false)
      setEditingMember(null)
      setEditFormData({
        name: '',
        email: '',
        contactNumber: '',
        username: '',
        password: '',
        confirmPassword: ''
      })
      setShowPassword(false)
      setShowConfirmPassword(false)
    },
    onError: () => {
      toast.error('Failed to update member')
      // Keep modal open on error so user can try again
    }
  })

  const handleDeleteMember = (member: Member) => {
    setMemberToDelete(member)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (memberToDelete) {
      deleteMemberMutation.mutate(memberToDelete._id)
    }
  }

  const cancelDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only allow canceling if not currently deleting
    if (!deleteMemberMutation.isPending) {
      setIsDeleteDialogOpen(false)
      setMemberToDelete(null)
    }
  }

  const handleEditMember = (member: Member) => {
    setEditingMember(member)
    setEditFormData({
      name: member.name,
      email: member.email,
      contactNumber: member.contactNumber || '',
      username: member.username || '',
      password: '',
      confirmPassword: ''
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateMember = () => {
    if (editingMember) {
      // Validate passwords if password is being changed
      if (editFormData.password && editFormData.password !== editFormData.confirmPassword) {
        toast.error('Passwords do not match')
        return
      }

      // Prepare update data - only include password if it's provided
      const updateData: Partial<Member> = {
        name: editFormData.name,
        email: editFormData.email,
        contactNumber: editFormData.contactNumber,
        username: editFormData.username
      }

      // Only include password if it's provided
      if (editFormData.password) {
        updateData.password = editFormData.password
      }

      updateMemberMutation.mutate({
        id: editingMember._id,
        data: updateData
      })
    }
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditingMember(null)
    setEditFormData({
      name: '',
      email: '',
      contactNumber: '',
      username: '',
      password: '',
      confirmPassword: ''
    })
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setEditFormData({
      ...editFormData,
      password: password,
      confirmPassword: password
    })
  }

  const handleViewMember = (member: Member) => {
    setSelectedMember(member as DetailedMember)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedMember(null)
  }

  // Filter members based on search and filters
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTerritory = territoryFilter === 'all' || member.primaryZoneId?.name === territoryFilter
    const matchesTeam = teamFilter === 'all' || member.primaryTeamId?.name === teamFilter
    
    // Combined status filter logic
    let matchesCombinedStatus = true
    if (combinedStatusFilter !== 'all') {
      if (combinedStatusFilter === 'ACTIVE' || combinedStatusFilter === 'INACTIVE') {
        matchesCombinedStatus = member.status === combinedStatusFilter
      } else if (combinedStatusFilter === 'ASSIGNED' || combinedStatusFilter === 'UNASSIGNED') {
        matchesCombinedStatus = member.assignmentStatus === combinedStatusFilter
      }
    }
    
    return matchesSearch && matchesTerritory && matchesTeam && matchesCombinedStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage)

  if (isLoading) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Loading members...</div>
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
            <div className="text-red-500">Failed to load members</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl text-gray-900">Sales Rep Management</CardTitle>
          <p className="text-gray-600 text-sm">Manage, monitor, and analyze sales rep activity across all clients.</p>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20"
                />
              </div>
                             <Select value={territoryFilter} onValueChange={setTerritoryFilter}>
                 <SelectTrigger className="w-40 border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20">
                   <SelectValue placeholder="All Territories" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Territories</SelectItem>
                   {Array.from(new Set(members.map(member => member.primaryZoneId?.name).filter(Boolean))).map(zoneName => (
                     <SelectItem key={zoneName} value={zoneName!}>
                       {zoneName}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               <Select value={teamFilter} onValueChange={setTeamFilter}>
                 <SelectTrigger className="w-40 border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20">
                   <SelectValue placeholder="All Teams" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Teams</SelectItem>
                   {Array.from(new Set(members.map(member => member.primaryTeamId?.name).filter(Boolean))).map(teamName => (
                     <SelectItem key={teamName} value={teamName!}>
                       {teamName}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               <Select value={combinedStatusFilter} onValueChange={setCombinedStatusFilter}>
                 <SelectTrigger className="w-40 border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20">
                   <SelectValue placeholder="All Status" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Status</SelectItem>
                   <SelectItem value="ACTIVE">Active</SelectItem>
                   <SelectItem value="INACTIVE">Inactive</SelectItem>
                   <SelectItem value="ASSIGNED">Assigned</SelectItem>
                   <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                 </SelectContent>
               </Select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#42A5F5] text-white">
                  <th className="text-left py-3 px-4 font-medium">Member</th>
                  <th className="text-left py-3 px-4 font-medium">Contact</th>
                  <th className="text-left py-3 px-4 font-medium">Team & Zone</th>
                  <th className="text-left py-3 px-4 font-medium">Performance</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.map((member) => (
                  <tr key={member._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#42A5F5] rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs px-2 py-0">
                              <Shield className="w-3 h-3 mr-1" />
                              {member.role}
                            </Badge>
                            {member.username && (
                              <span className="text-xs text-gray-400">@{member.username}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {member.email}
                        </div>
                        {member.contactNumber && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {member.contactNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Building className="w-4 h-4 mr-2 text-blue-500" />
                          <span className="font-medium text-gray-900">
                            {member.primaryTeamId?.name || (member.teamInfo && member.teamInfo.length > 0 ? member.teamInfo[0].name : 'Unassigned')}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <MapPin className="w-4 h-4 mr-2 text-green-500" />
                          <span className="text-gray-600">
                            {member.allAssignedZones && member.allAssignedZones.length > 0 
                              ? member.allAssignedZones.map((zone: any, index: number) => (
                                  <span key={zone._id} className={`${index > 0 ? 'ml-1' : ''} ${zone.isPrimary ? 'font-semibold' : ''}`}>
                                    {zone.name}{index < (member.allAssignedZones?.length || 0) - 1 ? ', ' : ''}
                                  </span>
                                ))
                              : member.primaryZoneId?.name || member.teamZoneInfo?.name || 'Unassigned'
                            }
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Today:</span>
                          <span className="font-medium text-gray-900">{member.knockedToday || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            member.status === 'ACTIVE' ? 'bg-green-500' : 'bg-orange-500'
                          }`}></div>
                          <Badge className={`text-xs ${
                            member.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {member.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            member.assignmentStatus === 'ASSIGNED' ? 'bg-blue-500' : 'bg-gray-400'
                          }`}></div>
                          <Badge className={`text-xs ${
                            member.assignmentStatus === 'ASSIGNED' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {member.assignmentStatus === 'ASSIGNED' ? 'Assigned' : 'Unassigned'}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm"
                          className="bg-yellow-500 hover:bg-yellow-600 text-white border-0 shadow-md font-medium p-2"
                          onClick={() => handleViewMember(member)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="border-blue-500 text-blue-600 hover:bg-blue-50 font-medium p-2"
                          onClick={() => handleEditMember(member)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50 font-medium p-2"
                          onClick={() => handleDeleteMember(member)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-6 space-x-2">
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
          )}
        </CardContent>
      </Card>

      {/* Detailed Member Information Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] 2xl:w-[70vw] max-w-6xl h-[90vh] overflow-hidden p-0">
          <DialogHeader className="border-b border-gray-200 p-4 sm:p-6 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-semibold text-gray-900">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#42A5F5] rounded-full flex items-center justify-center">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <div>Team Member Details</div>
                <div className="text-xs sm:text-sm font-normal text-gray-500 mt-1">
                  Complete information about {detailedMember?.name || 'this member'}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {detailedLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#42A5F5] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <div className="text-gray-500">Loading member details...</div>
              </div>
            </div>
          ) : detailedError ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-red-600 font-medium mb-2">Failed to load member details</div>
              <div className="text-gray-500 text-sm mb-4">Please check your connection and try again</div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-[#42A5F5] text-[#42A5F5] hover:bg-[#42A5F5] hover:text-white"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['detailed-member', selectedMember?._id] })}
              >
                Try Again
              </Button>
            </div>
          ) : detailedMember ? (
            <div className="h-full overflow-y-auto p-3 sm:p-4 md:p-6">
              <div className="space-y-4 sm:space-y-6">
                {/* Basic Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-xl border border-blue-100">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-1 block">Full Name</label>
                        <p className="text-gray-900 font-semibold text-lg">{detailedMember.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-1 block">Email Address</label>
                        <p className="text-gray-900 flex items-center gap-2 break-all">
                          <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          {detailedMember.email}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-1 block">Phone Number</label>
                        <p className="text-gray-900 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {detailedMember.contactNumber || 'Not provided'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-1 block">Username</label>
                        <p className="text-gray-900">{detailedMember.username || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-1 block">Role</label>
                        <Badge className="bg-blue-100 text-blue-800 px-3 py-1 text-sm font-medium">
                          <Shield className="w-3 h-3 mr-1" />
                          {detailedMember.role}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-1 block">Status</label>
                        <Badge className={`px-3 py-1 text-sm font-medium ${
                          detailedMember.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            detailedMember.status === 'ACTIVE' ? 'bg-green-500' : 'bg-orange-500'
                          }`}></div>
                          {detailedMember.status === 'ACTIVE' ? 'Active' : 'Trial'}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-1 block">Assignment Status</label>
                        <Badge className={`px-3 py-1 text-sm font-medium ${
                          detailedMember.assignmentStatus === 'ASSIGNED' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            detailedMember.assignmentStatus === 'ASSIGNED' ? 'bg-blue-500' : 'bg-gray-400'
                          }`}></div>
                          {detailedMember.assignmentStatus === 'ASSIGNED' ? 'Assigned' : 'Unassigned'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password Information */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-3 sm:p-4 rounded-xl border border-amber-100">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                      <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    Password Information
                  </h3>
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Account Password</label>
                    <div className="bg-white p-3 rounded-lg border-2 border-amber-200 shadow-sm">
                      <p className="text-gray-900 font-mono text-sm tracking-wider break-all">
                        {detailedMember.password || 'Password not available'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <Shield className="w-3 h-3 flex-shrink-0" />
                      This is the password used to create the account. User should change it on first login.
                    </p>
                  </div>
                </div>

                {/* Team Assignments */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 sm:p-4 rounded-xl border border-purple-100">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    Team Assignments
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1 block">Primary Team</label>
                      <p className="text-gray-900 font-medium">
                        {detailedMember.primaryTeamId?.name || 'No primary team assigned'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-2 block">All Assigned Teams</label>
                      {detailedMember.teams && detailedMember.teams.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {detailedMember.teams.map((team) => (
                            <Badge key={team._id} variant="outline" className="bg-purple-100 text-purple-700 border-purple-300 px-2 py-1 text-xs">
                              {team.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No teams assigned</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Zone Assignments */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:p-4 rounded-xl border border-green-100">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    Zone Assignments
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1 block">Primary Zone</label>
                      <p className="text-gray-900 font-medium">
                        {detailedMember.primaryZoneId?.name || 'No primary zone assigned'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-2 block">All Assigned Zones</label>
                      {detailedMember.zones && detailedMember.zones.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {detailedMember.zones.map((zone) => (
                            <Badge key={zone._id} variant="outline" className="bg-green-100 text-green-700 border-green-300 px-2 py-1 text-xs">
                              {zone.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No zones assigned</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Activity Information */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-3 sm:p-4 rounded-xl border border-indigo-100">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    Activity Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-white p-3 rounded-lg border border-indigo-200">
                      <label className="text-sm font-medium text-gray-600 mb-1 block">Knocked Today</label>
                      <p className="text-gray-900 font-bold text-xl text-indigo-600">{detailedMember.knockedToday || 0}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-indigo-200">
                      <label className="text-sm font-medium text-gray-600 mb-1 block">Account Created</label>
                      <p className="text-gray-900 font-medium text-sm">
                        {new Date(detailedMember.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Created By Information */}
                {detailedMember.createdBy ? (
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-3 sm:p-4 rounded-xl border border-gray-200">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                        <Building className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                      Created By
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <label className="text-sm font-medium text-gray-600 mb-1 block">Admin Name</label>
                        <p className="text-gray-900 font-medium">{detailedMember.createdBy.name}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <label className="text-sm font-medium text-gray-600 mb-1 block">Admin Email</label>
                        <p className="text-gray-900 font-medium break-all">{detailedMember.createdBy.email}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                        <Building className="w-4 h-4 text-white" />
                      </div>
                      Created By
                    </h3>
                    <div className="text-center py-4">
                      <p className="text-gray-500 italic">No creator information available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-gray-400" />
              </div>
              <div className="text-gray-500">No member data available</div>
            </div>
          )}
          
          <style jsx>{`
            div::-webkit-scrollbar {
              width: 6px;
            }
            div::-webkit-scrollbar-track {
              background: #F7FAFC;
              border-radius: 3px;
            }
            div::-webkit-scrollbar-thumb {
              background: #CBD5E0;
              border-radius: 3px;
            }
            div::-webkit-scrollbar-thumb:hover {
              background: #A0AEC0;
            }
          `}</style>
        </DialogContent>
      </Dialog>

      {/* Edit Member Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={closeEditModal}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] 2xl:w-[70vw] max-w-2xl">
          <DialogHeader className="border-b border-gray-200 p-4 sm:p-6">
            <DialogTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-semibold text-gray-900">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <div>Edit Team Member</div>
                <div className="text-xs sm:text-sm font-normal text-gray-500 mt-1">
                  Update member information
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
                <Input
                  id="name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  placeholder="Enter email address"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
                <Input
                  id="username"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <Label htmlFor="contactNumber" className="text-sm font-medium text-gray-700">Contact Number</Label>
                <Input
                  id="contactNumber"
                  value={editFormData.contactNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, contactNumber: e.target.value })}
                  className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  placeholder="Enter contact number"
                />
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">Change Password (Optional)</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generatePassword}
                  className="border-green-500 text-green-600 hover:bg-green-50 text-xs px-3 py-1"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  Generate Password
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={editFormData.password}
                      onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-100"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <Eye className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={editFormData.confirmPassword}
                      onChange={(e) => setEditFormData({ ...editFormData, confirmPassword: e.target.value })}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-100"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Eye className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                    </button>
                  </div>
                </div>
              </div>
              {editFormData.password && editFormData.password !== editFormData.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Leave password fields empty if you don't want to change the password. Use "Generate Password" to create a secure random password.
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 p-4 sm:p-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={closeEditModal}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMember}
              disabled={updateMemberMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {updateMemberMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </>
              ) : (
                'Update Member'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              Delete Team Member
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{memberToDelete?.name}</span>? 
              This action cannot be undone and will permanently remove this member from your team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={cancelDelete} 
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={deleteMemberMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={deleteMemberMutation.isPending}
            >
              {deleteMemberMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Deleting...
                </>
              ) : (
                'Delete Member'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}