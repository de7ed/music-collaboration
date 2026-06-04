import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="space-y-6 w-full flex flex-col items-center">
      <div className="text-center space-y-1 max-w-sm">
        <h2 className="text-lg font-semibold">Request an account</h2>
        <p className="text-sm text-gray-500">
          After signing up, an admin will review and approve your account before
          you can access the platform.
        </p>
      </div>
      <SignUp forceRedirectUrl="/pending" />
    </div>
  )
}
