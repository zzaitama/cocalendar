import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NavHeader } from "@/components/NavHeader"
import { ChoreManagementPage } from "@/components/chores/ChoreManagementPage"

export default async function ChoresManagementPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/api/auth/signin")
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <NavHeader activePage="chores" />
      <ChoreManagementPage />
    </div>
  )
}
