"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const agentNavigationItems = [
  { id: "home", label: "Home", href: "/agent" },
  { id: "knockmap", label: "My Territories", href: "/knockmap" },
  { id: "street", label: "Street", href: "/street" },
  { id: "knockform", label: "KnockForm", href: "/knockform" },
];

export function AgentNavigation() {
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname === "/agent") return "home";
    if (pathname.includes("/knockmap")) return "knockmap";
    if (pathname.includes("/street")) return "street";
    if (pathname.includes("/knockform")) return "knockform";
    return "home";
  };

  const activeTab = getActiveTab();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="px-4">
        <div className="flex space-x-8">
          {agentNavigationItems.map((item) => {
            const isActive = activeTab === item.id;
            const isKnockForm = item.id === "knockform";

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "py-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer relative",
                  "focus:outline-none focus:ring-0",
                  isActive
                    ? "border-[#42A5F5] text-black font-bold" // Active tab - bold black
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                  isKnockForm &&
                    isActive &&
                    "border-[#42A5F5] bg-blue-50 rounded-t-lg px-3" // KnockForm special styling
                )}
              >
                {item.label}
                {/* Special underline for KnockForm when active */}
                {isKnockForm && isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#42A5F5]"></div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
