import { cookies } from 'next/headers'
import DashboardClient from './DashboardClient'
import { verifyJwt } from '@/lib/auth'
import { getUserDataByEmail, getMembershipsByUserPubguid } from '@/lib/db-queries'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const payload = token ? verifyJwt(token) : null

  if (!payload) {
    return <UnauthenticatedDashboard />
  }

  const user = await getUserDataByEmail(payload.email)
  const memberships = await getMembershipsByUserPubguid(payload.identityPubguid)

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-900">User Dashboard</h1>
          <p className="mt-2 text-slate-600">Welcome back, {user.fname}. Manage your account membership and review your balance.</p>
        </div>

        <DashboardClient user={user} memberships={memberships} />
      </div>
    </main>
  )
}

function UnauthenticatedDashboard() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] max-w-4xl flex-col items-center justify-center text-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-lg">
          <h1 className="text-3xl font-semibold text-slate-900">User must sign-in</h1>
          <p className="mt-4 text-slate-600">You need to log in or sign up before accessing the dashboard.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href="/login" className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
              Login
            </a>
            <a href="/signup" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
