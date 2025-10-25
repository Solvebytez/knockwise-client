"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const agentNavigationItems = [
  { id: "home", label: "Home", href: "/agent" },
  { id: "my-territories", label: "My Territories", href: "/my-territories" },
  { id: "create-zone", label: "Create My Territory", href: "/create-my-zone" },
  { id: "routes", label: "Route Planner", href: "/route-planner" },
];

export function AgentNavigation() {
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname === "/agent") return "home";
    if (
      pathname.includes("/my-territories") ||
      pathname.includes("/my-territory/")
    )
      return "my-territories";
    if (pathname.includes("/create-my-zone")) return "create-zone";
    if (pathname.includes("/route-planner")) return "routes";
    return "home";
  };

  const activeTab = getActiveTab();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="px-4">
        <div className="flex space-x-8">
          {agentNavigationItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer",
                  "focus:outline-none focus:ring-0",
                  isActive
                    ? "border-[#42A5F5] text-black font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
