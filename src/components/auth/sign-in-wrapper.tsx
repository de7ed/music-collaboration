"use client"

import { SignIn } from "@clerk/nextjs"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function SignInWrapper() {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is already signed in, redirect immediately
    if (isLoaded && userId) {
      router.push("/lyric-sheets")
    }
  }, [isLoaded, userId, router])

  // Show loading state while checking auth
  if (!isLoaded) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // If already signed in, don't show the form
  if (userId) {
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>
  }

  return <SignIn />
}
