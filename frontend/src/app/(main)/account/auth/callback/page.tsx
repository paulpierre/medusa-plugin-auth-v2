"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAccount } from "@/lib/context/account-context"

export default function AuthCallback() {
  const { refetchCustomer } = useAccount()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the auth code from the URL
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const error = searchParams.get("error")

        if (error) {
          console.error("Authentication error:", error)
          router.push("/account/login?error=auth_failed")
          return
        }

        if (!code || !state) {
          router.push("/account/login?error=invalid_callback")
          return
        }

        // Exchange the code for a token
        const response = await fetch("/store/auth/google/callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code, state }),
        })

        if (!response.ok) {
          throw new Error("Failed to authenticate")
        }

        // Refresh the customer data
        await refetchCustomer()

        // Redirect to account page
        router.push("/account")
      } catch (error) {
        console.error("Callback error:", error)
        router.push("/account/login?error=callback_failed")
      }
    }

    handleCallback()
  }, [router, searchParams, refetchCustomer])

  return (
    <div className="w-full flex justify-center py-24">
      <div className="max-w-[640px] flex flex-col items-center gap-y-4">
        <h1 className="text-xl font-semibold">Completing sign in...</h1>
        <p className="text-gray-700">Please wait while we complete your authentication.</p>
      </div>
    </div>
  )
}