import LoginTemplate from "@/modules/account/templates/login-template"
import GoogleAuth from "@/components/common/google-auth"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your account.",
}

export default function Login() {
  return (
    <div className="w-full flex justify-center py-24">
      <div className="max-w-[640px] flex flex-col gap-y-4">
        <LoginTemplate />
        <div className="relative flex items-center justify-center text-sm uppercase my-4">
          <span className="bg-white px-4 text-gray-500">or</span>
          <div className="absolute border-b border-gray-200 w-full" />
        </div>
        <GoogleAuth />
      </div>
    </div>
  )
}