"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navigationItems = [
  { id: "home", label: "Home", href: "/dashboard" },
  { id: "territory", label: "Territory Management", href: "/territory-map" },
  { id: "routes", label: "Routes", href: "/routes" },
  { id: "team", label: "Create Team/Member", href: "/create-team" },
]

export function DashboardNavigation() {
  const pathname = usePathname()

  const getActiveTab = () => {
    if (pathname === "/dashboard") return "home"
    if (pathname.includes("/territory-map") || pathname.includes("/create-and-assign-zone")) return "territory"
    if (pathname.includes("/routes")) return "routes"
    if (pathname.includes("/create-team")) return "team"
    return "home"
  }

  const activeTab = getActiveTab()

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="px-4">
        <div className="flex space-x-8">
          {navigationItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer",
                "focus:outline-none focus:ring-0",
                activeTab === item.id
                  ? "border-[#42A5F5] text-[#42A5F5]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
