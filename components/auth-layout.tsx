"use client"

import type React from "react"

import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"

interface AuthLayoutProps {
  children: React.ReactNode
  step: number
  totalSteps: number
  showBackButton?: boolean
  backHref?: string
}

export function AuthLayout({ children, step, totalSteps, showBackButton = true, backHref = "/" }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Map background */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/jo%20taillieu%20architecten%201.jpg-MUe3rfXfPtNU9XzKHozV7yno61nXRW.jpeg')`,
          }}
        />
        <div className="absolute inset-0 bg-blue-600/30" />
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          {showBackButton && (
            <Link href={backHref} className="text-gray-600 hover:text-gray-800">
              <ChevronLeft className="w-6 h-6" />
            </Link>
          )}
          <div className="flex items-center ml-auto">
            <Logo height={48} />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col justify-center px-6 lg:px-12">
          <div className="max-w-md mx-auto w-full">{children}</div>
        </div>

        {/* Footer */}
        <div className="p-6 lg:p-12">
          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-8">
            <span className="text-gray-400 text-sm mr-4">
              {step} of {totalSteps}
            </span>
            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div key={index} className={`h-1 w-8 rounded-full ${index < step ? "bg-blue-500" : "bg-gray-200"}`} />
              ))}
            </div>
          </div>

          {/* Help section */}
          <div className="text-center">
            <span className="text-gray-600 text-sm">Need Help? </span>
            <a href="tel:+8765432101" className="text-blue-500 text-sm hover:underline">
              Call an expert +8765432101
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
