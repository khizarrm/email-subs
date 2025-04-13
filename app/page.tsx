import { LoginButton } from "@/components/login-button"
import { UserProfile } from "@/components/user-profile"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-3xl font-bold text-center">Next.js with Google Auth</h1>
        {session ? <UserProfile /> : <LoginButton />}
      </div>
    </main>
  )
}
