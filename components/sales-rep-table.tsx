"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"

const salesRepData = [
  {
    id: 1,
    name: "Riya Mehta",
    email: "riya@zenith.com",
    phone: "+91 98765 43210",
    zone: "Janipur East",
    knockedToday: 10,
    status: "Active",
  },
  {
    id: 2,
    name: "Aman Shah",
    email: "aman@axis.com",
    phone: "+91 91012 33445",
    zone: "Gandhi Nagar",
    knockedToday: 20,
    status: "Active",
  },
  {
    id: 3,
    name: "Rohit Gupta",
    email: "sneha@bluewave.in",
    phone: "+91 99887 77665",
    zone: "Satwari",
    knockedToday: 14,
    status: "Trial",
  },
  {
    id: 4,
    name: "Snehal Verma",
    email: "kabir@dwellrise.com",
    phone: "+91 80802 12222",
    zone: "Shiv Nagar",
    knockedToday: 40,
    status: "Active",
  },
  {
    id: 5,
    name: "Gourav Sharma",
    email: "gourav@zenith.com",
    phone: "+91 85955 44411",
    zone: "Gandhi Nagar",
    knockedToday: 39,
    status: "Active",
  },
]

export function SalesRepTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [territoryFilter, setTerritoryFilter] = useState("All Territories")
  const [statusFilter, setStatusFilter] = useState("All Status")

  const filteredData = salesRepData.filter((rep) => {
    const matchesSearch = rep.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTerritory = territoryFilter === "All Territories" || rep.zone === territoryFilter
    const matchesStatus = statusFilter === "All Status" || rep.status === statusFilter
    return matchesSearch && matchesTerritory && matchesStatus
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Input
            placeholder="Search by name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Select value={territoryFilter} onValueChange={setTerritoryFilter}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Territory" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Territories">All Territories</SelectItem>
              <SelectItem value="Janipur East">Janipur East</SelectItem>
              <SelectItem value="Gandhi Nagar">Gandhi Nagar</SelectItem>
              <SelectItem value="Satwari">Satwari</SelectItem>
              <SelectItem value="Shiv Nagar">Shiv Nagar</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Status">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Trial">Trial</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium">Add</Button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#42A5F5] hover:bg-[#42A5F5]">
              <TableHead className="text-white font-semibold">SalesRep Name</TableHead>
              <TableHead className="text-white font-semibold">Email</TableHead>
              <TableHead className="text-white font-semibold">Phone</TableHead>
              <TableHead className="text-white font-semibold">Zone</TableHead>
              <TableHead className="text-white font-semibold">Knocked Today</TableHead>
              <TableHead className="text-white font-semibold">Status</TableHead>
              <TableHead className="text-white font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((rep) => (
              <TableRow key={rep.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{rep.name}</TableCell>
                <TableCell className="text-[#42A5F5]">{rep.email}</TableCell>
                <TableCell>{rep.phone}</TableCell>
                <TableCell>{rep.zone}</TableCell>
                <TableCell className="text-center">{rep.knockedToday}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      rep.status === "Active"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                    }
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        rep.status === "Active" ? "bg-green-500" : "bg-yellow-500"
                      }`}
                    />
                    {rep.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" className="bg-yellow-400 hover:bg-yellow-500 text-black">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center space-x-2 pt-4">
        <Button variant="outline" size="sm" disabled>
          &lt;
        </Button>
        <Button size="sm" className="bg-[#42A5F5] hover:bg-[#42A5F5]/90 text-white">
          1
        </Button>
        <Button variant="outline" size="sm">
          2
        </Button>
        <Button variant="outline" size="sm">
          3
        </Button>
        <Button variant="outline" size="sm">
          &gt;
        </Button>
      </div>
    </div>
  )
}
