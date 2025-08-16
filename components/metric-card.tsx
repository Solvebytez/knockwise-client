"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface MetricCardProps {
  icon: LucideIcon
  value: string
  title: string
  subtitle: string
  buttonText: string
  changeText: string
  onClick?: () => void
}

export function MetricCard({ icon: Icon, value, title, subtitle, buttonText, changeText, onClick }: MetricCardProps) {
  return (
    <Card className="bg-[#42A5F5] text-white p-6 relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Icon className="w-8 h-8 text-white" />
          <div className="text-4xl font-bold">{value}</div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-blue-100 text-sm">{subtitle}</p>
      </div>

      <div className="flex items-center justify-between">
        <Button
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-4 py-2 rounded"
          onClick={onClick}
        >
          {buttonText}
        </Button>
        <div className="text-right">
          <div className="text-xs text-blue-100 flex items-center">
            <span className="mr-1">📈</span>
            {changeText}
          </div>
          <div className="text-xs text-blue-100 mt-1">Today</div>
        </div>
      </div>
    </Card>
  )
}
