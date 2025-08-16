"use client"

import { useRouter } from "next/navigation"
import { UserTypeCard } from "@/components/user-type-card"
import { AuthLayout } from "@/components/auth-layout"

export default function SelectUserTypePage() {
  const router = useRouter()

  const handleUserTypeSelect = (userType: "SubAdmin" | "SalesRep") => {
    // Store the selected user type in localStorage or state
    localStorage.setItem("selectedUserType", userType)
    // Navigate to login page
    router.push("/login")
  }

  return (
    <AuthLayout step={1} totalSteps={2}>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Welcome to KnockWise</h1>
          <p className="text-gray-600">Select your user type to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UserTypeCard
            title="SubAdmin"
            description="Manage territories, assign sales reps, and oversee operations"
            icon="👨‍💼"
            onClick={() => handleUserTypeSelect("SubAdmin")}
          />
          <UserTypeCard
            title="Sales Rep"
            description="Access your assigned territories and manage leads"
            icon="👤"
            onClick={() => handleUserTypeSelect("SalesRep")}
          />
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Choose your role to access the appropriate dashboard and features.</p>
        </div>
      </div>
    </AuthLayout>
  )
}
