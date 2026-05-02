import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NavHeader } from "@/components/NavHeader"
import { ChoresView } from "@/components/ChoresView"

export default async function ChoresPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/api/auth/signin")
  return (
    <div className="h-screen overflow-hidden bg-white dark:bg-gray-950 flex flex-col">
      <NavHeader activePage="chores" />
      <ChoresView />
    </div>
  )
}
