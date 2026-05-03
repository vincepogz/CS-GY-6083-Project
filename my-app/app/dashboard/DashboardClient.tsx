'use client'

import { useState } from 'react'
import type { MembershipRow, UserData } from '@/lib/db-queries'

interface DashboardClientProps {
  user: UserData
  memberships: MembershipRow[]
}

const availableMemberships = [
  { label: 'Free', fee: 0 },
  { label: 'Member', fee: 5.99 },
  { label: 'Premium', fee: 25.99 },
]

export default function DashboardClient({ user, memberships: initialMemberships }: DashboardClientProps) {
  const [memberships, setMemberships] = useState(initialMemberships)
  const [userData, setUserData] = useState<UserData>(user)
  const [status, setStatus] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fname, setFname] = useState(user.fname)
  const [lname, setLname] = useState(user.lname)
  const [phone, setPhone] = useState(user.phone || '')
  const [street, setStreet] = useState(user.demographics.street || '')
  const [city, setCity] = useState(user.demographics.city || '')
  const [stateValue, setStateValue] = useState(user.demographics.state || '')
  const [zip, setZip] = useState(user.demographics.zip || '')

  const totalFee = memberships.reduce((sum, membership) => sum + membership.fee, 0)
  const totalBalance = memberships.reduce((sum, membership) => sum + membership.balance, 0)
  const totalDue = memberships.reduce((sum, membership) => sum + membership.due, 0)
  const hasMembership = memberships.length > 0

  async function updateMemberships(response: Response) {
    const data = await response.json()
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to update memberships')
    }
    setMemberships(data.memberships || [])
    setStatus('Membership list updated successfully.')
  }

  async function handleAddMembership(membershipType: string) {
    setStatus(null)
    setIsProcessing(true)

    try {
      const response = await fetch('/api/dashboard/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: membershipType }),
      })

      await updateMemberships(response)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleRemoveMembership(mem_id: number) {
    setStatus(null)
    setIsProcessing(true)

    try {
      const response = await fetch('/api/dashboard/membership', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mem_id }),
      })

      await updateMemberships(response)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleUpdateProfile() {
    setStatus(null)
    setIsProcessing(true)

    try {
      const response = await fetch('/api/dashboard/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fname,
          lname,
          phone,
          street,
          city,
          state: stateValue,
          zip,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setUserData(data.user)
      setStatus('Profile updated successfully.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {status && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
          {status}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(240px,280px)_minmax(320px,1fr)_minmax(240px,280px)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">User Info</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div>
              <p className="font-medium text-slate-900">Name</p>
              <p>{userData.fname} {userData.lname}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Email</p>
              <p>{userData.email}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Phone</p>
              <p>{userData.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Identity</p>
              <p className="break-all">{userData.identityPubguid}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Address</p>
              <p>{userData.demographics.street || 'Street not set'}</p>
              <p>{userData.demographics.city || 'City not set'}, {userData.demographics.state || 'State not set'} {userData.demographics.zip || ''}</p>
            </div>
          </div>

        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Membership Info</h2>
              <p className="text-sm text-slate-500">Manage plan assignments for your account.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {hasMembership ? (
              <div className="space-y-4">
                {memberships.map((membership) => (
                  <div key={membership.mem_id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{membership.type}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Fee: ${membership.fee.toFixed(2)} · Balance: ${membership.balance.toFixed(2)} · Due: ${membership.due.toFixed(2)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMembership(membership.mem_id)}
                        disabled={isProcessing}
                        className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Remove Membership
                      </button>
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Only one membership is allowed per account.
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  {availableMemberships.map((membership) => (
                    <button
                      key={membership.label}
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAddMembership(membership.label)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-900 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <p>{membership.label}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {membership.fee === 0 ? 'Zero Cost' : `$${membership.fee.toFixed(2)} / month`}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  No membership found.
                </div>
              </>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Balance</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-700">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Total monthly fee</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">${totalFee.toFixed(2)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Outstanding balance</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">${totalBalance.toFixed(2)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Total due</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">${totalDue.toFixed(2)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Payment options</p>
              <p className="mt-2 text-slate-600">Use your dashboard membership actions to manage the current plan.</p>
            </div>
          </div>
        </section>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
        <p className="font-medium text-slate-900">Need to change account details?</p>
        <p className="mt-2">Go to your profile or update your member preferences by using the membership action buttons.</p>
      </div>
    </div>
  )
}
