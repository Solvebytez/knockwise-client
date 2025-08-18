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

const searchTeamMembers = async (query: string): Promise<TeamMember[]> => {
  try {
    const url = `/users/my-created-agents?search=${encodeURIComponent(query)}&limit=20`
    const response = await apiInstance.get(url)
    return response.data.data
  } catch (error) {
    console.error('Error searching team members:', error)
    throw error
  }
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['teamStats'] })
      queryClient.invalidateQueries({ queryKey: ['teamPerformance'] })
      toast.success('Team updated successfully')
      onSuccess?.()
    },
    onError: (error: any) => {
      console.error("Error updating team:", error.response?.data || error.message)
      toast.error(`Failed to update team: ${error.response?.data?.message || error.message}`)
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
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{member.status}</Badge>
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
          {updateTeamMutation.isPending ? "Updating Team..." : "Update Team"}
        </Button>
      </div>
    </form>
  )
}
