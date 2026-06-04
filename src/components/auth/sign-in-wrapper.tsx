"use client"

import { SignIn } from "@clerk/nextjs"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function SignInWrapper() {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // If user is already signed in, redirect immediately
    if (isLoaded && userId) {
      router.push("/lyric-sheets")
    }
  }, [isLoaded, userId, router])

  // Wait for auth to load AND component to mount before rendering
  if (!mounted || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-2">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  // If already signed in, show redirecting message and DON'T render SignIn
  if (userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-2">
          <p className="text-gray-500">Already signed in. Redirecting...</p>
        </div>
      </div>
    )
  }

  // Only render SignIn when we're sure user is NOT signed in
  return <SignIn />
}
