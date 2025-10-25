"use client";

import { RoleAwareHeader } from "@/components/role-aware-header";
import { RoleAwareNavigation } from "@/components/role-aware-navigation";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <RoleAwareHeader />
      <RoleAwareNavigation />
      <main>{children}</main>
    </div>
  );
}
