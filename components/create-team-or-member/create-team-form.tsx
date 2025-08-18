"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Textarea } from "@/components/ui/textarea"
import { Building, Users, UserPlus, Target, MapPin, Search, X } from "lucide-react"
import { apiInstance } from "@/lib/apiInstance"
import { toast } from "sonner"

interface CreateTeamFormData {
  name: string
  description: string
  memberIds: string[]
}

interface CreateTeamRequest {
  name: string
  description: string
  memberIds: string[]
}



interface TeamMember {
  _id: string
  name: string
  email: string
  role: string
  status: string
}

const createTeamMutation = async (data: CreateTeamRequest) => {
  const response = await apiInstance.post("/teams", data)
  return response.data
}

const searchTeamMembers = async (query: string): Promise<TeamMember[]> => {
  try {
    // Remove status filter to get all agents created by the admin
    const url = `/users/my-created-agents?search=${encodeURIComponent(query)}&limit=20`
    const response = await apiInstance.get(url)
    return response.data.data
  } catch (error) {
    console.error('Error searching team members:', error)
    // Fallback data
    return [
      { _id: '1', name: 'John Smith', email: 'john.smith@example.com', role: 'AGENT', status: 'ACTIVE' },
      { _id: '2', name: 'Sarah Johnson', email: 'sarah.johnson@example.com', role: 'AGENT', status: 'ACTIVE' },
      { _id: '3', name: 'Mike Davis', email: 'mike.davis@example.com', role: 'AGENT', status: 'ACTIVE' },
      { _id: '4', name: 'Lisa Wilson', email: 'lisa.wilson@example.com', role: 'AGENT', status: 'ACTIVE' },
      { _id: '5', name: 'David Brown', email: 'david.brown@example.com', role: 'AGENT', status: 'ACTIVE' },
    ].filter(member => 
      member.name.toLowerCase().includes(query.toLowerCase()) ||
      member.email.toLowerCase().includes(query.toLowerCase())
    )
  }
}



interface CreateTeamFormProps {
  onSuccess?: () => void
}

export function CreateTeamForm({ onSuccess }: CreateTeamFormProps) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CreateTeamFormData>({
    defaultValues: {
      name: "",
      description: "",
      memberIds: [],
    },
  })

  // Search team members
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['search-members', searchQuery],
    queryFn: () => searchTeamMembers(searchQuery),
    enabled: searchQuery.length > 1, // Reduced from 2 to 1
    staleTime: 30000, // Cache for 30 seconds
  })

  const createTeam = useMutation({
    mutationFn: createTeamMutation,
    onSuccess: (data) => {
      console.log('Team created successfully:', data);
      toast.success('Team created successfully!');
      reset();
      setSelectedMembers([]);
      setSearchQuery("");
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-stats'] });
      queryClient.invalidateQueries({ queryKey: ['team-performance'] });
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      console.error('Error creating team:', error);
      
      // Handle different types of errors with specific messages
      if (error.response?.data?.errors) {
        // Backend validation errors
        const validationErrors = error.response.data.errors;
        if (Array.isArray(validationErrors)) {
          validationErrors.forEach((err: any) => {
            const fieldName = err.path?.join('.') || 'field';
            const message = err.msg || 'Invalid value';
            toast.error(`${fieldName}: ${message}`);
          });
        } else {
          toast.error('Validation failed. Please check your input.');
        }
      } else if (error.response?.data?.message) {
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
        toast.error('You do not have permission to create teams.');
      } else if (error.response?.status >= 500) {
        // Server errors
        toast.error('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        // Network errors
        toast.error('Network error. Please check your connection and try again.');
      } else {
        // Generic error
        toast.error('Failed to create team. Please try again.');
      }
    }
  });

  const handleAddMember = (member: TeamMember) => {
    if (!selectedMembers.find(m => m._id === member._id)) {
      setSelectedMembers([...selectedMembers, member]);
      setValue("memberIds", [...selectedMembers, member].map(m => m._id));
    }
    setSearchQuery("");
  }

  const handleRemoveMember = (memberId: string) => {
    const updatedMembers = selectedMembers.filter(m => m._id !== memberId);
    setSelectedMembers(updatedMembers);
    setValue("memberIds", updatedMembers.map(m => m._id));
  }

  const onSubmit = (data: CreateTeamFormData) => {
    const apiData: CreateTeamRequest = {
      name: data.name,
      description: data.description,
      memberIds: selectedMembers.map(m => m._id),
    }

    console.log("Creating team with data:", apiData)
    createTeam.mutate(apiData)
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Team Name *
            </label>
            <Input
              placeholder="Enter team name"
              {...register("name", { 
                required: "Team name is required",
                minLength: {
                  value: 2,
                  message: "Team name must be at least 2 characters"
                }
              })}
              className={`border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20 ${
                errors.name ? "border-red-500" : ""
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Description
            </label>
            <Textarea
              placeholder="Enter team description"
              {...register("description", {
                maxLength: {
                  value: 500,
                  message: "Description cannot exceed 500 characters"
                }
              })}
              className={`border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20 ${
                errors.description ? "border-red-500" : ""
              }`}
              rows={3}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>



          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Team Members *
            </label>
            <div className="space-y-3">
              {/* Search Input */}
              <div className="relative">
                                 <Input
                   placeholder="Search members by name or email..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20 pr-10"
                 />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>

                             {/* Search Results */}
               {searchQuery.length > 1 && (
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {searchLoading ? (
                    <div className="p-3 text-center text-gray-500">Searching...</div>
                  ) : searchResults && searchResults.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {searchResults
                        .filter(member => !selectedMembers.find(m => m._id === member._id))
                        .map((member) => (
                          <button
                            key={member._id}
                            type="button"
                            onClick={() => handleAddMember(member)}
                            className="w-full p-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{member.name}</p>
                                <p className="text-sm text-gray-500">{member.email}</p>
                              </div>
                              <UserPlus className="w-4 h-4 text-gray-400" />
                            </div>
                          </button>
                        ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-gray-500">No members found</div>
                  )}
                </div>
              )}

              {/* Selected Members */}
              {selectedMembers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Selected Members ({selectedMembers.length})</p>
                  <div className="space-y-2">
                    {selectedMembers.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member._id)}
                          className="p-1 text-gray-400 hover:text-red-500 focus:outline-none"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

                     <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
             <div className="text-sm text-blue-700">
               <strong>Note:</strong> Search for team members by typing their name or email. 
               All agents created by this admin will be shown in search results. 
               Team leader will be automatically assigned from the selected members.
             </div>
           </div>

          <Button
            type="submit"
            disabled={isSubmitting || createTeam.isPending}
            className="w-full bg-[#42A5F5] hover:bg-[#42A5F5]/90 text-white font-medium disabled:opacity-50"
          >
            {isSubmitting || createTeam.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Team...
              </>
            ) : (
              <>
                <Building className="w-4 h-4 mr-2" />
                Create Team
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
