"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserPlus, Eye, EyeOff, RefreshCw } from "lucide-react"
import { apiInstance } from "@/lib/apiInstance"
import { toast } from "sonner"

interface CreateAgentFormData {
  name: string
  email: string
  password: string
  username: string
  contactNumber: string
  role: string
}

interface CreateAgentRequest {
  name: string
  email: string
  username: string
  contactNumber: string
  password: string
  primaryTeamId: null
  primaryZoneId: null
  teamIds: string[]
  zoneIds: string[]
}

const createAgentMutation = async (data: CreateAgentRequest) => {
  const response = await apiInstance.post("/users/create-agent", data)
  return response.data
}

// Function to generate a secure random password
const generateRandomPassword = (): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  const allChars = uppercase + lowercase + numbers + symbols
  
  let password = ''
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest with random characters
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export function CreateMemberForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CreateAgentFormData>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      username: "",
      contactNumber: "",
      role: "",
    },
  })

  const createAgent = useMutation({
    mutationFn: createAgentMutation,
    onSuccess: (data) => {
      console.log('Agent created successfully:', data);
      toast.success('Team member created successfully!');
      reset();
      
      // Invalidate queries to refresh the table and stats
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['team-overview'] });
      queryClient.invalidateQueries({ queryKey: ['recent-additions'] });
    },
    onError: (error: any) => {
      console.error('Error creating agent:', error);
      
      // Handle different types of errors with specific messages
      if (error.response?.data?.errors) {
        // Backend validation errors
        const validationErrors = error.response.data.errors;
        if (Array.isArray(validationErrors)) {
          validationErrors.forEach((err: any) => {
            const fieldName = err.path?.join('.') || 'field';
            const message = err.msg || 'Invalid value';
            toast.error(`${fieldName}: ${message}`);
          });
        } else {
          toast.error('Validation failed. Please check your input.');
        }
      } else if (error.response?.data?.message) {
        // Backend business logic errors
        toast.error(error.response.data.message);
      } else if (error.response?.status === 409) {
        // Conflict errors (email/username already exists)
        toast.error('Email or username already exists. Please use a different one.');
      } else if (error.response?.status === 401) {
        // Authentication errors
        toast.error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        // Permission errors
        toast.error('You do not have permission to create team members.');
      } else if (error.response?.status >= 500) {
        // Server errors
        toast.error('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        // Network errors
        toast.error('Network error. Please check your connection and try again.');
      } else {
        // Generic error
        toast.error('Failed to create team member. Please try again.');
      }
    }
  });

  const handleGeneratePassword = () => {
    setIsGeneratingPassword(true)
    
    // Simulate a small delay for better UX
    setTimeout(() => {
      const newPassword = generateRandomPassword()
      setValue("password", newPassword)
      setShowPassword(true) // Show the generated password
      setIsGeneratingPassword(false)
      toast.success("Password generated successfully!")
    }, 300)
  }

  const onSubmit = (data: CreateAgentFormData) => {
    // Only send the fields that the backend expects
    const apiData: CreateAgentRequest = {
      name: data.name,
      email: data.email,
      password: data.password,
      username: data.username,
      contactNumber: data.contactNumber,
      primaryTeamId: null, // Will be void when creating member first
      primaryZoneId: null, // Will be void when creating member first
      teamIds: [], // Will be void when creating member first
      zoneIds: [], // Will be void when creating member first
    }

    console.log("Creating agent with data:", apiData)
    createAgent.mutate(apiData)
  }

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-gray-900 flex items-center">
          <UserPlus className="w-5 h-5 mr-2 text-[#42A5F5]" />
          Add New Team Member
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Full Name *
              </label>
              <Input
                placeholder="Enter full name"
                {...register("name", { required: "Full name is required" })}
                className={`border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20 ${
                  errors.name ? "border-red-500" : ""
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Email Address *
              </label>
              <Input
                type="email"
                placeholder="Enter email address"
                {...register("email", { 
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                })}
                className={`border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20 ${
                  errors.email ? "border-red-500" : ""
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Username *
              </label>
              <Input
                placeholder="Enter username"
                {...register("username", { 
                  required: "Username is required",
                  minLength: {
                    value: 3,
                    message: "Username must be at least 3 characters"
                  }
                })}
                className={`border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20 ${
                  errors.username ? "border-red-500" : ""
                }`}
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Contact Number *
              </label>
              <Input
                placeholder="Enter contact number"
                {...register("contactNumber", { 
                  required: "Contact number is required",
                  pattern: {
                    value: /^[\+]?[1-9][\d]{0,15}$/,
                    message: "Invalid contact number"
                  }
                })}
                className={`border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20 ${
                  errors.contactNumber ? "border-red-500" : ""
                }`}
              />
              {errors.contactNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.contactNumber.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Password *
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  {...register("password", { 
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters"
                    }
                  })}
                  className={`border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20 pr-20 ${
                    errors.password ? "border-red-500" : ""
                  }`}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    disabled={isGeneratingPassword}
                    className="p-1 text-gray-400 hover:text-[#42A5F5] disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Generate random password"
                  >
                    {isGeneratingPassword ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password.message}</p>
                )}
                <p className="text-xs text-gray-500 ml-auto">
                  Click the refresh icon to generate a secure password
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Role
              </label>
              <Select 
                onValueChange={(value) => setValue("role", value)}
                {...register("role")}
              >
                <SelectTrigger className="border-gray-300 focus:border-[#42A5F5] focus:ring-[#42A5F5]/20">
                  <SelectValue placeholder="Role will be set to Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AGENT">Agent</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Role will automatically be set to "Agent" by the backend
              </p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <div className="text-sm text-blue-700">
              <strong>Note:</strong> Team and Zone assignments will be set to null initially. 
              You can assign them later through the territory management system.
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || createAgent.isPending}
            className="w-full bg-[#42A5F5] hover:bg-[#42A5F5]/90 text-white font-medium disabled:opacity-50"
          >
            {isSubmitting || createAgent.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Member...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Create Team Member
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
