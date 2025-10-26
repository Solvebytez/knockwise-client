"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore, type User } from "@/store/userStore";
import { apiInstance } from "@/lib/apiInstance";

import { useMutation } from "@tanstack/react-query";

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [selectedUserType, setSelectedUserType] = React.useState<string | null>(
    null
  );
  const { setUser } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    defaultValues: {
      email: "agent@knockwise.io",
      password: "Admin@12345",
    },
  });

  useEffect(() => {
    const userType = localStorage.getItem("selectedUserType");
    if (!userType) {
      router.push("/select-user-type");
      return;
    }
    setSelectedUserType(userType);
  }, [router]);

  useEffect(() => {
    setUser(null);
  }, [setUser]);

  const signInMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("🔗 API Instance baseURL:", apiInstance.defaults.baseURL);
      console.log(
        "🔗 Full URL will be:",
        `${apiInstance.defaults.baseURL}/auth/login`
      );
      const response = await apiInstance.post("/auth/login", data);
      console.log("response.data", response.data);
      return response.data;
    },
    onSuccess: (data: any) => {
      console.log("data", data.data.user);
      const userData = data.data.user as User;
      setUser(userData);

      // Redirect based on user role
      if (userData.role === "AGENT") {
        router.push("/agent");
      } else {
        router.push("/dashboard");
      }
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log("Form data being submitted:", data);
    console.log("Selected user type:", selectedUserType);

    const submitData = {
      email: data.email,
      password: data.password,
    };

    console.log("Final submit data:", submitData);

    signInMutation.mutate(submitData, {
      onSuccess: (data: any) => {
        console.log("Login successful, redirecting...");
        console.log("Login response data:", data);
        const userData = data.data.user as User;
        setUser(userData);

        // Check cookies after login
        console.log("Cookies after login:", document.cookie);

        // Wait a moment for cookies to be set
        setTimeout(() => {
          console.log("Cookies after timeout:", document.cookie);

          // Redirect based on user role using window.location for stability
          if (userData.role === "AGENT") {
            console.log("Redirecting to /agent");
            window.location.replace("/agent");
          } else {
            console.log("Redirecting to /dashboard");
            window.location.replace("/dashboard");
          }
        }, 100);
      },
      onError: (error: any) => {
        console.error("Login error:", error);
        setError("root", {
          message: error.response?.data?.message || "Login failed",
        });
      },
    });
  };

  if (!selectedUserType) {
    return (
      <AuthLayout step={2} totalSteps={2} backHref="/select-user-type">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout step={2} totalSteps={2} backHref="/select-user-type">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Login</h1>
          <p className="text-gray-600">
            Enter your credentials to access your account
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Logging in as:{" "}
            <span className="font-medium">{selectedUserType}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                className={`h-12 text-base border-0 border-b-2 rounded-none focus:ring-0 bg-transparent ${
                  errors.email
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-200 focus:border-blue-500"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Input
                type="password"
                placeholder="Password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                className={`h-12 text-base border-0 border-b-2 rounded-none focus:ring-0 bg-transparent ${
                  errors.password
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-200 focus:border-blue-500"
                }`}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {errors.root && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {errors.root.message}
            </div>
          )}

          <div className="flex justify-between items-center">
            <button
              type="button"
              className="text-blue-500 text-sm hover:underline"
            >
              Forgot Password
            </button>

            <Button
              type="submit"
              disabled={signInMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 rounded-full font-medium disabled:opacity-50"
            >
              {signInMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </div>
        </form>

        {/* Test credentials info */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Test Credentials:
          </h3>
          <div className="text-xs text-gray-600 space-y-2">
            <div>
              <h4 className="font-medium text-gray-700 mb-1">
                SubAdmin Users:
              </h4>
              <div className="space-y-1 ml-2">
                <p>subadmin@knockwise.io / Admin@12345</p>
                <p>jennifer.martinez@knockwise.io / Admin@12345</p>
                <p>david.thompson@knockwise.io / Admin@12345</p>
                <p>emily.rodriguez@knockwise.io / Admin@12345</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-1">
                SalesRep Users:
              </h4>
              <div className="space-y-1 ml-2">
                <p>agent@knockwise.io / Admin@12345</p>
                <p>michael.chen@knockwise.io / Agent@12345</p>
                <p>amanda.foster@knockwise.io / Agent@12345</p>
                <p>robert.kim@knockwise.io / Agent@12345</p>
                <p>jessica.brown@knockwise.io / Agent@12345</p>
                <p>christopher.lee@knockwise.io / Agent@12345</p>
                <p>samantha.taylor@knockwise.io / Agent@12345</p>
                <p>daniel.garcia@knockwise.io / Agent@12345</p>
                <p>ashley.white@knockwise.io / Agent@12345</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
