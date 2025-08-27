"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Search, X, UserPlus, Users } from "lucide-react"
import { apiInstance } from "@/lib/apiInstance"
import { toast } from "sonner"

interface TeamMember {
  _id: string
  name: string
  email: string
  status: string
  assignmentStatus?: string
  teamMemberships?: Array<{
    teamId: string
    teamName: string
    teamStatus: string
    teamAssignmentStatus: string
    isPrimary: boolean
  }>
  assignmentSummary?: {
    totalActiveZones: number
    totalScheduledZones: number
    hasActiveAssignments: boolean
    hasScheduledAssignments: boolean
    individualZones: string[]
    teamZones: string[]
    scheduledZones: string[]
    currentAssignmentStatus: string
    assignmentDetails: {
      hasIndividualAssignments: boolean
      hasTeamAssignments: boolean
      hasScheduledIndividualAssignments: boolean
      hasScheduledTeamAssignments: boolean
      totalAssignments: number
      isFullyAssigned: boolean
      isPartiallyAssigned: boolean
      isOnlyScheduled: boolean
    }
  }
}

interface Team {
  _id: string
  name: string
  description?: string
  leaderId: {
    _id: string
    name: string
    email: string
  }
  agentIds: Array<{
    _id: string
    name: string
    email: string
    status: string
  }>
}

interface EditTeamFormProps {
  team: Team
  onSuccess?: () => void
  onCancel?: () => void
}

export function EditTeamForm({ team, onSuccess, onCancel }: EditTeamFormProps) {
  const queryClient = useQueryClient()
  const [teamName, setTeamName] = useState(team.name)
  const [description, setDescription] = useState(team.description || "")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>(
    team.agentIds.map(agent => ({
      _id: agent._id,
      name: agent.name,
      email: agent.email,
      status: agent.status
    }))
  )
  const [showSearchResults, setShowSearchResults] = useState(false)

  const searchTeamMembers = async (query: string): Promise<TeamMember[]> => {
    try {
      // Enhanced search with team membership information
      // Exclude current team members from search results and only show active agents
      const url = `/users/my-created-agents?search=${encodeURIComponent(query)}&limit=20&includeTeamInfo=true&excludeTeamId=${team._id}&status=ACTIVE`
      const response = await apiInstance.get(url)
      return response.data.data
    } catch (error) {
      console.error('Error searching team members:', error)
      throw error
    }
  }

  const { data: searchResults, isLoading: isLoadingSearch } = useQuery<TeamMember[]>({
    queryKey: ['teamMembersSearch', searchQuery],
    queryFn: () => searchTeamMembers(searchQuery),
    enabled: searchQuery.length > 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const updateTeamMutation = useMutation({
    mutationFn: async (updatedTeam: { 
      name: string
      description: string
      memberIds: string[]
    }) => {
      const response = await apiInstance.put(`/teams/${team._id}`, updatedTeam)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['teamStats'] })
      queryClient.invalidateQueries({ queryKey: ['teamPerformance'] })
      queryClient.invalidateQueries({ queryKey: ['myCreatedAgents'] }) // Refresh agent data to show updated zone assignments
      
      // Show success message with details
      const message = data?.message || 'Team updated successfully';
      toast.success(message);
      
      onSuccess?.()
    },
    onError: (error: any) => {
      console.error("Error updating team:", error.response?.data || error.message)
      
      // Handle different types of errors with specific messages
      if (error.response?.data?.message) {
        // Backend business logic errors
        toast.error(error.response.data.message);
      } else if (error.response?.status === 409) {
        // Conflict errors (team name already exists)
        toast.error('Team name already exists. Please use a different name.');
      } else if (error.response?.status === 401) {
        // Authentication errors
        toast.error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        // Permission errors
        toast.error('You do not have permission to update this team.');
      } else if (error.response?.status >= 500) {
        // Server errors
        toast.error('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        // Network errors
        toast.error('Network error. Please check your connection and try again.');
      } else {
        // Generic error
        toast.error('Failed to update team. Please try again.');
      }
    },
  })

  const handleSelectMember = (member: TeamMember) => {
    if (!selectedMembers.some(m => m._id === member._id)) {
      setSelectedMembers([...selectedMembers, member])
      setSearchQuery("")
      setShowSearchResults(false)
    }
  }

  const handleRemoveMember = (memberId: string) => {
    setSelectedMembers(selectedMembers.filter(m => m._id !== memberId))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamName.trim() || selectedMembers.length === 0) {
      toast.error("Team name and at least one member are required.")
      return
    }

    // Check if any changes were made
    const originalMemberIds = team.agentIds.map(agent => agent._id);
    const newMemberIds = selectedMembers.map(m => m._id);
    const hasMemberChanges = originalMemberIds.length !== newMemberIds.length || 
      originalMemberIds.some(id => !newMemberIds.includes(id)) ||
      newMemberIds.some(id => !originalMemberIds.includes(id));
    
    const hasNameChange = teamName !== team.name;
    const hasDescriptionChange = description !== (team.description || '');
    
    if (!hasMemberChanges && !hasNameChange && !hasDescriptionChange) {
      toast.info("No changes detected. The team is already up to date.")
      return
    }
    
    updateTeamMutation.mutate({
      name: teamName,
      description: description,
      memberIds: selectedMembers.map(m => m._id),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="teamName" className="text-gray-700 font-medium">Team Name</Label>
          <Input
            id="teamName"
            placeholder="Enter team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="mt-1 border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20"
            required
          />
        </div>
        <div>
          <Label htmlFor="description" className="text-gray-700 font-medium">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Brief description of the team"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20"
            rows={3}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="teamMembers" className="text-gray-700 font-medium">Team Members</Label>
        <div className="relative mt-1">
          {/* Search Input */}
          <div className="relative">
            <Input
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 100)}
              className="border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20 pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchQuery.length > 1 && (
            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
              {isLoadingSearch ? (
                <div className="p-4 text-center text-gray-500">Searching...</div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-3 hover:bg-gray-100 cursor-pointer"
                    onMouseDown={() => handleSelectMember(member)}
                  >
                                         <div className="flex-1">
                       <p className="font-medium text-gray-900">{member.name}</p>
                       <p className="text-sm text-gray-500">{member.email}</p>
                       
                       {/* Assignment Status Badge */}
                       {member.assignmentSummary && (
                         <div className="mt-1">
                           <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                             member.assignmentSummary.currentAssignmentStatus === 'ASSIGNED'
                               ? 'bg-green-100 text-green-800'
                               : 'bg-gray-100 text-gray-600'
                           }`}>
                             {member.assignmentSummary.currentAssignmentStatus === 'ASSIGNED' ? '✓ Assigned' : '○ Unassigned'}
                           </span>
                           
                           {/* Detailed Assignment Status */}
                           {member.assignmentSummary.assignmentDetails && (
                             <div className="mt-1 space-y-1">
                               {member.assignmentSummary.assignmentDetails.isFullyAssigned && (
                                 <p className="text-xs text-green-600 font-medium">
                                   ✓ Fully assigned ({member.assignmentSummary.assignmentDetails.totalAssignments} total)
                                 </p>
                               )}
                               {member.assignmentSummary.assignmentDetails.isPartiallyAssigned && (
                                 <p className="text-xs text-yellow-600 font-medium">
                                   ⚠ Partially assigned ({member.assignmentSummary.assignmentDetails.totalAssignments} total)
                                 </p>
                               )}
                               {member.assignmentSummary.assignmentDetails.isOnlyScheduled && (
                                 <p className="text-xs text-purple-600 font-medium">
                                   📅 Scheduled only ({member.assignmentSummary.totalScheduledZones} scheduled)
                                 </p>
                               )}
                               
                               {/* Assignment Breakdown */}
                               <div className="text-xs text-gray-600">
                                 {member.assignmentSummary.assignmentDetails.hasIndividualAssignments && (
                                   <span className="inline-block mr-2">
                                     👤 {member.assignmentSummary.totalActiveZones - member.assignmentSummary.teamZones.length} individual
                                   </span>
                                 )}
                                 {member.assignmentSummary.assignmentDetails.hasTeamAssignments && (
                                   <span className="inline-block mr-2">
                                     👥 {member.assignmentSummary.teamZones.length} team
                                   </span>
                                 )}
                                 {member.assignmentSummary.assignmentDetails.hasScheduledIndividualAssignments && (
                                   <span className="inline-block mr-2">
                                     📅 {member.assignmentSummary.totalScheduledZones} scheduled
                                   </span>
                                 )}
                               </div>
                             </div>
                           )}
                         </div>
                       )}
                       
                       {/* Team Membership Information */}
                       {member.teamMemberships && member.teamMemberships.length > 0 && (
                         <div className="mt-1">
                           <div className="flex flex-wrap gap-1">
                             {member.teamMemberships.map((team) => (
                               <span
                                 key={team.teamId}
                                 className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                   team.isPrimary
                                     ? 'bg-blue-100 text-blue-800'
                                     : 'bg-gray-100 text-gray-700'
                                 }`}
                               >
                                 {team.teamName}
                                 {team.isPrimary && (
                                   <span className="ml-1 text-blue-600">★</span>
                                 )}
                               </span>
                             ))}
                           </div>
                           <p className="text-xs text-amber-600 mt-1">
                             Already in {member.teamMemberships.length} team(s)
                           </p>
                         </div>
                       )}
                     </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Badge variant="secondary" className="text-xs">{member.status}</Badge>
                      <UserPlus className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">No members found.</div>
              )}
            </div>
          )}
        </div>

        {/* Selected Members */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Current Members ({selectedMembers.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedMembers.map((member) => (
              <Badge
                key={member._id}
                variant="default"
                className="bg-[#42A5F5] text-white px-3 py-1 rounded-full flex items-center gap-1"
              >
                {member.name}
                <button
                  type="button"
                  onClick={() => handleRemoveMember(member._id)}
                  className="ml-1 text-white hover:text-gray-200 focus:outline-none"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          {selectedMembers.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">No members selected. Add members to the team.</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Button>
                 <Button
           type="submit"
           className="bg-[#42A5F5] hover:bg-[#357ABD] text-white py-2 px-4 rounded-md transition-colors"
           disabled={updateTeamMutation.isPending}
         >
           {updateTeamMutation.isPending ? (
             <>
               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
               Updating Team...
             </>
           ) : (
             "Update Team"
           )}
         </Button>
      </div>
    </form>
  )
}
