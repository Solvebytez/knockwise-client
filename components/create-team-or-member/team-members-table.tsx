"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Edit } from "lucide-react"
///import { apiInstance } from "@/lib/apiInstance"
import { toast } from "sonner"
import { useTabContext } from "../create-team-or-member/tab-context"
import { apiInstance } from "@/lib/apiInstance"

interface TeamMember {
  id: string
  name: string
  email: string
  username: string
  phone: string
  role: string
  status: "active" | "inactive"
  joinDate: string
}

// Mock data - in real app this would come from API
const mockTeamMembers: TeamMember[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@knockwise.io",
    username: "johnsmith",
    phone: "+1 (555) 123-4567",
    role: "Sales Representative",
    status: "active",
    joinDate: "2024-01-15"
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.johnson@knockwise.io",
    username: "sarahjohnson",
    phone: "+1 (555) 234-5678",
    role: "Team Lead",
    status: "active",
    joinDate: "2024-02-01"
  }
]

const fetchTeamMembers = async (): Promise<TeamMember[]> => {
  // In real app, this would be an API call
  // const response = await apiInstance.get("/users/team-members")
  // return response.data.data
  
  // For now, return mock data
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockTeamMembers), 500)
  })
}

const deleteTeamMember = async (id: string): Promise<void> => {
  // In real app, this would be an API call
   await apiInstance.delete(`/users/team-members/${id}`)
  
  // For now, just simulate API call
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 500)
  })
}

export function TeamMembersTable() {
  const { activeTab, setActiveTab } = useTabContext()
  const queryClient = useQueryClient()

  const { data: teamMembers = [], isLoading, error } = useQuery({
    queryKey: ["teamMembers"],
    queryFn: fetchTeamMembers,
  })

  const deleteMember = useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: () => {
      toast.success("Team member deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] })
    },
    onError: (error: any) => {
      console.error("Error deleting team member:", error)
      toast.error("Failed to delete team member. Please try again.")
    },
  })

  const handleDeleteMember = (id: string) => {
    if (confirm("Are you sure you want to delete this team member?")) {
      deleteMember.mutate(id)
    }
  }

  if (activeTab === "create") {
    return null // Don't show table when on create tab
  }

  if (isLoading) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#42A5F5]"></div>
            <span className="ml-2 text-gray-600">Loading team members...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Failed to load team members. Please try again.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-gray-900 flex items-center justify-between">
          <span>Team Members</span>
          <Button
            onClick={() => setActiveTab("create")}
            className="bg-[#42A5F5] hover:bg-[#42A5F5]/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Username</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Contact</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Join Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{member.name}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{member.email}</td>
                  <td className="py-3 px-4 text-gray-600">{member.username}</td>
                  <td className="py-3 px-4 text-gray-600">{member.phone}</td>
                  <td className="py-3 px-4 text-gray-600">{member.role}</td>
                  <td className="py-3 px-4">
                    <Badge variant={member.status === "active" ? "default" : "secondary"}>
                      {member.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{member.joinDate}</td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-600 hover:text-[#42A5F5]"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-600 hover:text-red-600"
                        onClick={() => handleDeleteMember(member.id)}
                        disabled={deleteMember.isPending}
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
      </CardContent>
    </Card>
  )
}
