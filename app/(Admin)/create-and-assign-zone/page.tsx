"use client"

import { useState } from "react"
import { TerritoryMap } from "@/components/territory-map"
import { Button } from "@/components/ui/button"
import { FileText, ArrowLeft, X } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CreateAndAssignZonePage() {
  const [showManuallyAssignForm, setShowManuallyAssignForm] = useState(false)
  const [formStep, setFormStep] = useState(1)
  const [territoryName, setTerritoryName] = useState("")
  const [territoryDescription, setTerritoryDescription] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState("")
  const [selectedStreet, setSelectedStreet] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("")
  const [assignedRep, setAssignedRep] = useState("")
  const [assignedDate, setAssignedDate] = useState("")
  const router = useRouter()

  const handleBackToOverview = () => {
    router.push('/territory-map')
  }

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (territoryName.trim() && selectedCity && selectedNeighbourhood && selectedStreet) {
      setFormStep(2)
    }
  }

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Here you would typically submit the data to your backend
    console.log("Manually Assign Form Data:", {
      territoryName,
      territoryDescription,
      selectedCity,
      selectedNeighbourhood,
      selectedStreet,
      selectedFilter,
      assignedRep,
      assignedDate
    })
    
    // Reset form
    setTerritoryName("")
    setTerritoryDescription("")
    setSelectedCity("")
    setSelectedNeighbourhood("")
    setSelectedStreet("")
    setSelectedFilter("")
    setAssignedRep("")
    setAssignedDate("")
    setFormStep(1)
    setShowManuallyAssignForm(false)
    
    // Show success message or redirect
    alert("Territory assigned successfully!")
  }

  const handleBackToStep1 = () => {
    setFormStep(1)
  }

  const handleCloseModal = () => {
    setShowManuallyAssignForm(false)
    setFormStep(1)
    setTerritoryName("")
    setTerritoryDescription("")
    setSelectedCity("")
    setSelectedNeighbourhood("")
    setSelectedStreet("")
    setSelectedFilter("")
    setAssignedRep("")
    setAssignedDate("")
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="px-6 py-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create & Assign Territory
            </h1>
            <p className="text-gray-600 mt-1">
              Draw territories on the map and assign them to sales representatives
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              size="sm"
              className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-sm"
              onClick={() => setShowManuallyAssignForm(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Manually Assign Form
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-gray-300"
              onClick={handleBackToOverview}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Overview
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <TerritoryMap />
      </div>

                     {/* Manually Assign Form Modal */}
        <Dialog open={showManuallyAssignForm} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl p-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
            <DialogHeader className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl font-bold text-gray-900">
                  Manually Assign Territory
                </DialogTitle>
              </div>
              
                             {/* Progress Steps */}
               <div className="flex items-center justify-center space-x-4 mt-4">
                 <div className={`flex items-center ${formStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-semibold text-sm ${formStep >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-gray-50'}`}>
                     1
                   </div>
                   <span className="ml-2 text-sm font-medium">Territory Details</span>
                 </div>
                 <div className="w-8 h-0.5 bg-gray-300"></div>
                 <div className={`flex items-center ${formStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-semibold text-sm ${formStep >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-gray-50'}`}>
                     2
                   </div>
                   <span className="ml-2 text-sm font-medium">Assignment</span>
                 </div>
               </div>
            </DialogHeader>
           
                                   {formStep === 1 && (
              <form onSubmit={handleStep1Submit} className="px-6 py-4 space-y-6">
                {/* Territory Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Territory Information
                  </h3>
                  
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="territoryName" className="text-sm font-medium text-gray-700">
                         Territory Name *
                       </Label>
                       <Input
                         id="territoryName"
                         type="text"
                         value={territoryName}
                         onChange={(e) => setTerritoryName(e.target.value)}
                         placeholder="Enter territory name"
                         className="h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                         required
                       />
                     </div>
                     
                     <div className="space-y-2">
                       <Label htmlFor="selectedCity" className="text-sm font-medium text-gray-700">
                         City *
                       </Label>
                       <Select value={selectedCity} onValueChange={setSelectedCity} required>
                         <SelectTrigger className="h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500/20">
                           <SelectValue placeholder="Select a city" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="brampton">Brampton</SelectItem>
                           <SelectItem value="toronto">Toronto</SelectItem>
                           <SelectItem value="mississauga">Mississauga</SelectItem>
                           <SelectItem value="vaughan">Vaughan</SelectItem>
                           <SelectItem value="markham">Markham</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </div>

                  <div className="space-y-2">
                    <Label htmlFor="territoryDescription" className="text-sm font-medium text-gray-700">
                      Description
                    </Label>
                    <textarea
                      id="territoryDescription"
                      value={territoryDescription}
                      onChange={(e) => setTerritoryDescription(e.target.value)}
                      placeholder="Optional description for this territory"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                {/* Geographical Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Geographical Details
                  </h3>
                  
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="selectedNeighbourhood" className="text-sm font-medium text-gray-700">
                         Neighbourhood *
                       </Label>
                       <Select value={selectedNeighbourhood} onValueChange={setSelectedNeighbourhood} required>
                         <SelectTrigger className="h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500/20">
                           <SelectValue placeholder="Select a neighbourhood" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="credit-valley">Credit Valley</SelectItem>
                           <SelectItem value="downtown">Downtown</SelectItem>
                           <SelectItem value="midtown">Midtown</SelectItem>
                           <SelectItem value="uptown">Uptown</SelectItem>
                           <SelectItem value="suburbs">Suburbs</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>

                     <div className="space-y-2">
                       <Label htmlFor="selectedStreet" className="text-sm font-medium text-gray-700">
                         Street *
                       </Label>
                       <Select value={selectedStreet} onValueChange={setSelectedStreet} required>
                         <SelectTrigger className="h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500/20">
                           <SelectValue placeholder="Select a street" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="valleyway-dr">Valleyway Dr</SelectItem>
                           <SelectItem value="main-st">Main St</SelectItem>
                           <SelectItem value="queen-st">Queen St</SelectItem>
                           <SelectItem value="king-st">King St</SelectItem>
                           <SelectItem value="dundas-st">Dundas St</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                   </div>

                                     <div className="space-y-2">
                     <Label htmlFor="selectedFilter" className="text-sm font-medium text-gray-700">
                       Filter Homes for CSV Export (Optional)
                     </Label>
                     <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                       <SelectTrigger className="h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500/20">
                         <SelectValue placeholder="All Statuses" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all-statuses">All Statuses</SelectItem>
                         <SelectItem value="new">New</SelectItem>
                         <SelectItem value="knocked">Knocked</SelectItem>
                         <SelectItem value="not-home">Not Home</SelectItem>
                         <SelectItem value="interested">Interested</SelectItem>
                         <SelectItem value="not-interested">Not Interested</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <strong>Step 1:</strong> Enter territory information and select the geographical area. You'll assign it to a sales representative in the next step.
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                    disabled={!territoryName.trim() || !selectedCity || !selectedNeighbourhood || !selectedStreet}
                  >
                    Next Step
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseModal}
                    className="px-8 border-gray-300 hover:bg-gray-50 py-2.5"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {formStep === 2 && (
              <form onSubmit={handleStep2Submit} className="px-6 py-4 space-y-6">
                {/* Territory Summary */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Territory Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Territory Name:</span>
                      <span className="ml-2 text-gray-900">{territoryName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Location:</span>
                      <span className="ml-2 text-gray-900">{selectedCity} - {selectedNeighbourhood}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Street:</span>
                      <span className="ml-2 text-gray-900">{selectedStreet}</span>
                    </div>
                    {selectedFilter && (
                      <div>
                        <span className="font-medium text-gray-700">Filter:</span>
                        <span className="ml-2 text-gray-900">{selectedFilter}</span>
                      </div>
                    )}
                    {territoryDescription && (
                      <div className="md:col-span-2">
                        <span className="font-medium text-gray-700">Description:</span>
                        <span className="ml-2 text-gray-900">{territoryDescription}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assignment Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Assignment Details
                  </h3>
                  
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="assignedRep" className="text-sm font-medium text-gray-700">
                         Assign to Sales Rep *
                       </Label>
                       <Select value={assignedRep} onValueChange={setAssignedRep} required>
                         <SelectTrigger className="h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500/20">
                           <SelectValue placeholder="Select sales representative" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="john-doe">John Doe</SelectItem>
                           <SelectItem value="jane-smith">Jane Smith</SelectItem>
                           <SelectItem value="mike-johnson">Mike Johnson</SelectItem>
                           <SelectItem value="sarah-wilson">Sarah Wilson</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     
                     <div className="space-y-2">
                       <Label htmlFor="assignedDate" className="text-sm font-medium text-gray-700">
                         Assignment Date *
                       </Label>
                       <Input
                         id="assignedDate"
                         type="date"
                         value={assignedDate}
                         onChange={(e) => setAssignedDate(e.target.value)}
                         className="h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                         required
                       />
                     </div>
                   </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <strong>Step 2:</strong> Assign the territory to a sales representative and set the assignment date.
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToStep1}
                    className="px-8 border-gray-300 hover:bg-gray-50 py-2.5"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                    disabled={!assignedRep || !assignedDate}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Assign Territory
                  </Button>
                </div>
              </form>
            )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
