"use client"

import { Monitor, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserTypeCardProps {
  title: string
  description: string
  icon: string
  onClick: () => void
}

export function UserTypeCard({ title, description, icon, onClick }: UserTypeCardProps) {
  const getIcon = () => {
    switch (icon) {
      case "👨‍💼":
        return <Monitor className="w-8 h-8 text-gray-600" />
      case "👤":
        return <User className="w-8 h-8 text-gray-600" />
      default:
        return <User className="w-8 h-8 text-gray-600" />
    }
  }

  return (
    <button
      onClick={onClick}
      className="w-full p-6 rounded-lg border-2 border-gray-200 transition-all duration-200 hover:border-gray-300 hover:shadow-md bg-white"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-lg bg-gray-100">
          {getIcon()}
        </div>
        <div className="text-center">
          <h3 className="font-medium text-gray-700 text-lg">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </button>
  )
}
