"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Edit, Eye, EyeOff, MapPin, X } from "lucide-react"
import { toast } from "sonner"

interface Territory {
  _id: string
  name: string
  description?: string
  status: string
  boundary: any
  createdAt?: string
  totalResidents?: number
  activeResidents?: number
  buildingData?: {
    totalBuildings?: number
    residentialHomes?: number
    addresses?: string[]
    coordinates?: number[][]
    houseNumbers?: {
      odd: number[]
      even: number[]
    }
  }
  currentAssignment?: {
    _id: string
    agentId?: { _id: string; name: string; email: string }
    teamId?: { _id: string; name: string }
    effectiveFrom: string
    effectiveTo?: string
    status: string
  }
}

interface Agent {
  _id: string
  name: string
  email: string
}

interface Team {
  _id: string
  name: string
}

interface TerritoryEditSidebarProps {
  territory: Territory | null
  agents: Agent[]
  teams: Team[]
  onUpdate: (data: any) => void
  isUpdating: boolean
  showExistingTerritories: boolean
  onToggleExistingTerritories: (show: boolean) => void
  existingTerritoriesCount: number
  onFocusTerritory: () => void
  onEditBoundary?: () => void
  onBoundaryUpdate?: (newBoundary: any) => void
  isDetectingBuildings?: boolean
  detectedBuildings?: any[]
  onUpdateTerritory?: (data: any) => void
  hasBoundaryChanges?: boolean
  hasAnyChanges?: boolean
}

export function TerritoryEditSidebar({ 
  territory, 
  agents, 
  teams, 
  onUpdate, 
  isUpdating,
  showExistingTerritories,
  onToggleExistingTerritories,
  existingTerritoriesCount,
  onFocusTerritory,
  onEditBoundary,
  onBoundaryUpdate,
  isDetectingBuildings,
  detectedBuildings,
  onUpdateTerritory,
  hasBoundaryChanges = false,
  hasAnyChanges = false
}: TerritoryEditSidebarProps) {
  // State
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [isEditTerritoryOpen, setIsEditTerritoryOpen] = useState(false)
  const [territoryName, setTerritoryName] = useState('')
  const [territoryDescription, setTerritoryDescription] = useState('')
  const [assignmentType, setAssignmentType] = useState<'none' | 'individual' | 'team'>('none')
  const [assignedRep, setAssignedRep] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')
  const [assignedDate, setAssignedDate] = useState('')
  // Search states for display
  const [agentSearchText, setAgentSearchText] = useState('')
  const [teamSearchText, setTeamSearchText] = useState('')
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([])
  const [availableTeams, setAvailableTeams] = useState<Team[]>([])

  // Function to check if there are any changes (name, description, or boundary)
  const hasChanges = () => {
    // Check for boundary changes
    if (hasBoundaryChanges) {
      return true
    }

    // Check for name changes
    if (territoryName.trim() !== (territory?.name || '')) {
      return true
    }

    // Check for description changes
    if (territoryDescription.trim() !== (territory?.description || '')) {
      return true
    }

    // Check for assignment changes
    const currentAssignment = territory?.currentAssignment
    if (assignmentType === 'none' && (currentAssignment?.agentId || currentAssignment?.teamId)) {
      return true
    }
    if (assignmentType === 'individual' && assignedRep && currentAssignment?.agentId?._id !== assignedRep) {
      return true
    }
    if (assignmentType === 'team' && selectedTeam && currentAssignment?.teamId?._id !== selectedTeam) {
      return true
    }

    return false
  }

  // Initialize form data when territory loads
  useEffect(() => {
    if (territory) {
      setTerritoryName(territory.name || '')
      setTerritoryDescription(territory.description || '')
      
      // Set assignment data
      if (territory.currentAssignment?.agentId) {
        setAssignmentType('individual')
        setAssignedRep(territory.currentAssignment.agentId._id)
        setAgentSearchText(`${territory.currentAssignment.agentId.name} (${territory.currentAssignment.agentId.email})`)
        setTeamSearchText('') // Clear team search
      } else if (territory.currentAssignment?.teamId) {
        setAssignmentType('team')
        setSelectedTeam(territory.currentAssignment.teamId._id)
        setTeamSearchText(territory.currentAssignment.teamId.name)
        setAgentSearchText('') // Clear agent search
      } else {
        setAssignmentType('none')
        setAgentSearchText('') // Clear both searches
        setTeamSearchText('')
      }

      // Set effective date if available
      if (territory.currentAssignment?.effectiveFrom) {
        const date = new Date(territory.currentAssignment.effectiveFrom)
        setAssignedDate(date.toISOString().split('T')[0])
      }
    }
  }, [territory])

  // Filter available agents and teams based on current assignment
  useEffect(() => {
    if (territory) {
      // For agents, exclude the currently assigned agent to this territory
      const filteredAgents = agents.filter(agent => {
        if (territory.currentAssignment?.agentId?._id === agent._id) {
          return true // Include current assignment
        }
        return true // Show all agents for now
      })
      setAvailableAgents(filteredAgents)

      // For teams, exclude the currently assigned team to this territory
      const filteredTeams = teams.filter(team => {
        if (territory.currentAssignment?.teamId?._id === team._id) {
          return true // Include current assignment
        }
        return true // Show all teams for now
      })
      setAvailableTeams(filteredTeams)
    }
  }, [agents, teams, territory])

  const handleAssignmentTypeChange = (value: 'none' | 'individual' | 'team') => {
    setAssignmentType(value)
    // Clear search inputs and selections when switching
    setAgentSearchText('')
    setTeamSearchText('')
    setAssignedRep('')
    setSelectedTeam('')
  }

  const handleEditTerritoryClick = () => {
    setIsEditTerritoryOpen(!isEditTerritoryOpen)
    // Close assignment form if open
    if (isEditFormOpen) {
      setIsEditFormOpen(false)
    }
  }

  const handleReassignClick = () => {
    setIsEditFormOpen(!isEditFormOpen)
    // Close territory edit form if open
    if (isEditTerritoryOpen) {
      setIsEditTerritoryOpen(false)
    }
  }

  const handleEditBoundary = () => {
    // This will trigger map drawing mode
    if (onEditBoundary) {
      onEditBoundary()
    }
    // Keep the territory edit form open while drawing
    // Only close the assignment form if it's open
    if (isEditFormOpen) {
      setIsEditFormOpen(false)
    }
  }

  const handleUpdateTerritory = () => {
    console.log('handleUpdateTerritory called in sidebar')
    
    // Since building detection happens immediately when drawing is complete,
    // we just need to update the territory with the current data
    if (onUpdateTerritory) {
      const updateData = {
        name: territoryName.trim(),
        description: territoryDescription.trim(),
      }
      console.log('Calling onUpdateTerritory with data:', updateData)
      onUpdateTerritory(updateData)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const updateData: any = {
      name: territoryName.trim(),
      description: territoryDescription.trim(),
    }

    // Add assignment data based on type
    if (assignmentType === 'none') {
      // Remove all assignments - will set status to DRAFT
      updateData.removeAssignment = true
    } else if (assignmentType === 'individual' && assignedRep) {
      updateData.assignedAgentId = assignedRep
      if (assignedDate) {
        updateData.effectiveFrom = new Date(assignedDate).toISOString()
      }
    } else if (assignmentType === 'team' && selectedTeam) {
      updateData.teamId = selectedTeam
      if (assignedDate) {
        updateData.effectiveFrom = new Date(assignedDate).toISOString()
      }
    }

    console.log('Submitting update data:', updateData)
    onUpdate(updateData)
  }

  if (!territory) {
    return (
      <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto shadow-lg">
        <div className="p-6">
          <div className="text-center text-gray-500">
            Loading territory...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto shadow-lg">
      <div className="p-6">
        {/* Territory Information */}
        <div className="mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              Territory: {territory.name}
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <Badge 
                variant={
                  territory.status === 'ACTIVE' ? 'default' :
                  territory.status === 'SCHEDULED' ? 'secondary' :
                  territory.status === 'COMPLETED' ? 'default' : 'outline'
                }
                className={
                  territory.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  territory.status === 'SCHEDULED' ? 'bg-yellow-100 text-yellow-800' :
                  territory.status === 'COMPLETED' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                }
              >
                {territory.status}
              </Badge>
            </div>
            
            {territory.description && (
              <p className="text-sm text-blue-700 mb-3">{territory.description}</p>
            )}
            
            {/* Current Assignment Details */}
            {territory.currentAssignment && (
              <div className="text-sm text-blue-800 space-y-1">
                <p>
                  <strong>Assignment:</strong> {
                    territory.currentAssignment.agentId 
                      ? `${territory.currentAssignment.agentId.name} (${territory.currentAssignment.agentId.email})`
                      : territory.currentAssignment.teamId 
                        ? `Team: ${territory.currentAssignment.teamId.name}`
                        : 'None'
                  }
                </p>
                <p>
                  <strong>Effective From:</strong> {new Date(territory.currentAssignment.effectiveFrom).toLocaleDateString()}
                </p>
              </div>
            )}
            
            {/* Territory Context */}
            <div className="text-xs text-blue-600 mt-2 pt-2 border-t border-blue-200">
              <p>💡 <strong>Tip:</strong> Other territories are shown in orange on the map</p>
            </div>
          </div>
          
          {/* Existing Territories Toggle */}
          {existingTerritoriesCount > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showExistingTerritories"
                    checked={showExistingTerritories}
                    onChange={(e) => onToggleExistingTerritories(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="showExistingTerritories" className="text-sm font-medium text-gray-700">
                    Show Other Territories
                  </label>
                </div>
                <div className="flex items-center space-x-1">
                  {showExistingTerritories ? (
                    <Eye className="w-4 h-4 text-gray-500" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {existingTerritoriesCount} other territories available
              </p>
            </div>
          )}
          
          {/* Focus Territory Button */}
          <Button
            onClick={onFocusTerritory}
            variant="outline"
            className="w-full mt-4 border-blue-500 text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            Focus on Territory
          </Button>
        </div>
        
        {/* Edit Territory Button */}
        <Button 
          onClick={handleEditTerritoryClick}
          className="w-full mt-4 bg-yellow-400 hover:bg-yellow-500 text-black flex items-center justify-center gap-2"
        >
          <Edit className="h-4 w-4" />
          {isEditTerritoryOpen ? 'Cancel Edit Territory' : 'Edit Territory'}
        </Button>

        {/* Reassign Button */}
        <Button 
          onClick={handleReassignClick}
          className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
        >
          <Edit className="h-4 w-4" />
          {isEditFormOpen ? 'Cancel Edit' : 'Want to Reassign'}
        </Button>

        {/* Edit Territory Form */}
        {isEditTerritoryOpen && (
          <div className="border-t border-gray-200 pt-6">
            <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
              <div className="space-y-6 pr-2">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Edit Territory Details
                  </h2>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-blue-800">
                      Territory Information
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Update territory name, description, and boundary
                    </div>
                  </div>
                </div>

                {/* Territory Name */}
                <div className="space-y-3">
                  <Label htmlFor="editTerritoryName" className="text-sm font-medium text-gray-700">
                    Territory Name
                  </Label>
                  <Input
                    id="editTerritoryName"
                    type="text"
                    value={territoryName}
                    onChange={(e) => setTerritoryName(e.target.value)}
                    placeholder="Enter territory name..."
                    className="h-12 text-base"
                  />
                </div>

                {/* Territory Description */}
                <div className="space-y-3">
                  <Label htmlFor="editTerritoryDescription" className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    id="editTerritoryDescription"
                    value={territoryDescription}
                    onChange={(e) => setTerritoryDescription(e.target.value)}
                    placeholder="Enter territory description..."
                    className="min-h-24 resize-none"
                  />
                </div>

                                                   {/* Territory Details Display */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">
                      Current Territory Details
                    </Label>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium text-gray-900">{territory?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${
                          territory?.status === 'ACTIVE' ? 'text-green-600' :
                          territory?.status === 'SCHEDULED' ? 'text-yellow-600' :
                          territory?.status === 'COMPLETED' ? 'text-purple-600' : 'text-orange-600'
                        }`}>
                          {territory?.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Residents:</span>
                        <span className="font-medium text-blue-600">
                          {territory?.totalResidents || territory?.buildingData?.totalBuildings || territory?.buildingData?.residentialHomes || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium text-gray-900">
                          {territory?.createdAt ? new Date(territory.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Boundary:</span>
                        <span className="font-medium text-gray-900">Polygon Area</span>
                      </div>
                    </div>
                  </div>

                  {/* Building Detection Status */}
                  {isDetectingBuildings && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">
                        Building Detection
                      </Label>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm font-medium text-blue-800">Detecting buildings and residents...</span>
                        </div>
                        <div className="text-xs text-blue-600">
                          Analyzing the new boundary area to identify residential buildings
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detected Buildings Display */}
                  {detectedBuildings && detectedBuildings.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">
                        Newly Detected Buildings ({detectedBuildings.length})
                      </Label>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-green-800 mb-2">
                          Buildings detected in new boundary
                        </div>
                                                 <div className="space-y-1 max-h-32 overflow-y-auto">
                           {detectedBuildings.slice(0, 5).map((building, index) => (
                             <div key={index} className="text-xs text-green-700 flex justify-between">
                               <span>
                                 {building.buildingNumber && (
                                   <span className="font-medium text-green-800">#{building.buildingNumber}</span>
                                 )} {building.address || `Building ${index + 1}`}
                               </span>
                               <span className="text-green-600">✓</span>
                             </div>
                           ))}
                           {detectedBuildings.length > 5 && (
                             <div className="text-xs text-green-600">
                               +{detectedBuildings.length - 5} more buildings
                             </div>
                           )}
                         </div>
                      </div>
                    </div>
                  )}

                 {/* Edit Boundary Button */}
                 <div className="space-y-3">
                   <Label className="text-sm font-medium text-gray-700">
                     Boundary Management
                   </Label>
                   <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                     <div className="text-sm font-medium text-blue-800 mb-2">
                       Edit Territory Boundary
                     </div>
                     <div className="text-xs text-blue-600 mb-3">
                       Click to enable drawing mode on the map. Draw a new polygon to update the boundary and automatically detect residents.
                     </div>
                     <Button
                       type="button"
                       onClick={handleEditBoundary}
                       className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-10"
                     >
                       Edit Boundary on Map
                     </Button>
                   </div>
                 </div>

                                 {/* Action Buttons */}
                 <div className="flex gap-3 pt-4">
                   <Button
                     type="button"
                     className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium h-12"
                     onClick={handleUpdateTerritory}
                     disabled={isDetectingBuildings || isUpdating || !hasChanges()}
                   >
                     {isUpdating ? 'Updating...' : 'Update Territory'}
                   </Button>
                   <Button
                     type="button"
                     variant="outline"
                     className="flex-1 h-12"
                     onClick={() => setIsEditTerritoryOpen(false)}
                     disabled={isDetectingBuildings || isUpdating}
                   >
                     Cancel
                   </Button>
                 </div>
                 {!hasChanges() && (
                   <p className="text-xs text-gray-500 mt-2 text-center">
                     No changes detected. Make changes to name, description, or boundary to enable update.
                   </p>
                 )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {isEditFormOpen && (
          <div className="border-t border-gray-200 pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Territory Assignment
                </h2>
                
                {/* Success Message */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-green-800">
                    Territory Saved as {territory?.status || 'Draft'}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    You can assign it now or leave it for later assignment
                  </div>
                </div>
              </div>

              {/* Assignment Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  Assignment Type
                </Label>
                <RadioGroup value={assignmentType} onValueChange={handleAssignmentTypeChange}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="none-edit" className="border-2" />
                      <Label htmlFor="none-edit" className="text-sm font-medium flex items-center gap-2">
                        <span className="text-lg">❌</span>
                        Not Assign
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="team" id="team-edit" className="border-2" />
                      <Label htmlFor="team-edit" className="text-sm font-medium flex items-center gap-2">
                        <span className="text-lg">👥</span>
                        Team
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="individual" id="individual-edit" className="border-2" />
                      <Label htmlFor="individual-edit" className="text-sm font-medium flex items-center gap-2">
                        <span className="text-lg">👤</span>
                        Individual
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Team Selection */}
              {assignmentType === 'team' && (
                <div className="space-y-3">
                  <Label htmlFor="teamSearch" className="text-sm font-medium text-gray-700">
                    Search Team
                  </Label>
                  <Input
                    id="teamSearch"
                    type="text"
                    value={teamSearchText}
                    onChange={(e) => setTeamSearchText(e.target.value)}
                    placeholder="Search for team name..."
                    className="h-12 text-base"
                  />
                  {/* Show matching teams */}
                  {teamSearchText && !selectedTeam && (() => {
                    const matchingTeams = availableTeams.filter(team => 
                      team.name.toLowerCase().includes(teamSearchText.toLowerCase())
                    )
                    return matchingTeams.length > 0 && (
                      <div className="mt-2 space-y-1 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2 bg-white">
                        {matchingTeams.map((team) => (
                          <div
                            key={team._id}
                            className="p-2 hover:bg-gray-100 rounded cursor-pointer text-sm"
                            onClick={() => {
                              setSelectedTeam(team._id)
                              setTeamSearchText(team.name)
                            }}
                          >
                            {team.name}
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                  
                  {/* Show selected team with remove button */}
                  {selectedTeam && (() => {
                    const selectedTeamData = availableTeams.find(team => team._id === selectedTeam)
                    return selectedTeamData && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800">{selectedTeamData.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTeam('')
                            setTeamSearchText('')
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Individual Agent Selection */}
              {assignmentType === 'individual' && (
                <div className="space-y-3">
                  <Label htmlFor="agentSearch" className="text-sm font-medium text-gray-700">
                    Search Agent
                  </Label>
                  <Input
                    id="agentSearch"
                    type="text"
                    value={agentSearchText}
                    onChange={(e) => setAgentSearchText(e.target.value)}
                    placeholder="Search for agent name or email..."
                    className="h-12 text-base"
                  />
                  {/* Show matching agents */}
                  {agentSearchText && !assignedRep && (() => {
                    const matchingAgents = availableAgents.filter(agent => 
                      agent.name.toLowerCase().includes(agentSearchText.toLowerCase()) ||
                      agent.email.toLowerCase().includes(agentSearchText.toLowerCase())
                    )
                    return matchingAgents.length > 0 && (
                      <div className="mt-2 space-y-1 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2 bg-white">
                        {matchingAgents.map((agent) => (
                          <div
                            key={agent._id}
                            className="p-2 hover:bg-gray-100 rounded cursor-pointer text-sm"
                            onClick={() => {
                              setAssignedRep(agent._id)
                              setAgentSearchText(`${agent.name} (${agent.email})`)
                            }}
                          >
                            {agent.name} ({agent.email})
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                  
                  {/* Show selected agent with remove button */}
                  {assignedRep && (() => {
                    const selectedAgentData = availableAgents.find(agent => agent._id === assignedRep)
                    return selectedAgentData && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800">
                          {selectedAgentData.name} ({selectedAgentData.email})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAssignedRep('')
                            setAgentSearchText('')
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Assignment Date */}
              {(assignmentType === 'individual' || assignmentType === 'team') && (
                <div className="space-y-3">
                  <Label htmlFor="assignedDate" className="text-sm font-medium text-gray-700">
                    Assignment Date
                  </Label>
                  <Input
                    id="assignedDate"
                    type="date"
                    value={assignedDate}
                    onChange={(e) => setAssignedDate(e.target.value)}
                    className="h-12 text-base"
                    placeholder="dd-mm-yyyy"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-medium h-12"
                  disabled={isUpdating || !territoryName.trim() || !hasChanges()}
                >
                  {isUpdating ? 'Updating...' : 'Update Assignment'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => setIsEditFormOpen(false)}
                >
                  Skip for Now
                </Button>
              </div>
              {!hasChanges() && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  No changes detected. Make changes to name, description, boundary, or assignment to enable update.
                </p>
              )}
            </form>

            {/* Territory Details */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Territory Details
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium text-gray-900">{territory?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    territory?.status === 'ACTIVE' ? 'text-green-600' :
                    territory?.status === 'SCHEDULED' ? 'text-yellow-600' :
                    territory?.status === 'COMPLETED' ? 'text-purple-600' : 'text-orange-600'
                  }`}>
                    {territory?.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Residents:</span>
                  <span className="font-medium text-blue-600">
                    {territory?.totalResidents || territory?.buildingData?.totalBuildings || territory?.buildingData?.residentialHomes || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium text-gray-900">
                    {territory?.createdAt ? new Date(territory.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
