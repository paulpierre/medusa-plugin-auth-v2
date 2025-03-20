"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FcGoogle } from "react-icons/fc"

const GoogleAuth = () => {
  const router = useRouter()

  const handleGoogleLogin = () => {
    // Directly redirect to the Google auth endpoint
    // The backend will handle the OAuth flow initiation
    window.location.href = "/store/auth/google"
  }

  return (
    <Button
      variant="outline"
      className="w-full flex items-center gap-2 justify-center"
      onClick={handleGoogleLogin}
    >
      <FcGoogle size={20} />
      <span>Continue with Google</span>
    </Button>
  )
}

export default GoogleAuth