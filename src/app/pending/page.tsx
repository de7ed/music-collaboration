import { SignOutButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-sm text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Account pending approval</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Your account has been created and is awaiting admin approval. You
            will receive an email once your account is activated.
          </p>
        </div>
        <p className="text-xs text-gray-400">
          Questions?{" "}
          <a
            href="mailto:david.barron@nrg.com"
            className="underline underline-offset-2"
          >
            Contact the admin
          </a>
        </p>
        <SignOutButton>
          <Button variant="outline" size="sm">
            Sign out
          </Button>
        </SignOutButton>
      </div>
    </div>
  )
}
