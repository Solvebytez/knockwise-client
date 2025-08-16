import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password, userType } = await request.json()

    // Mock authentication - replace with real authentication logic
    if (email && password) {
      const mockUser = {
        id: "1",
        email,
        userType,
      }

      const mockToken = "mock-jwt-token"

      return NextResponse.json({
        token: mockToken,
        user: mockUser,
      })
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
