'use client'

import { useState, useEffect } from 'react'
import type { MembershipRow, UserData, PayableRow } from '@/lib/db-queries'

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
  const [isEditing, setIsEditing] = useState(false)
  const [cards, setCards] = useState<PayableRow[]>([])
  const [showAddCardPopup, setShowAddCardPopup] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [securityCode, setSecurityCode] = useState('')
  const [expiration, setExpiration] = useState('')

  useEffect(() => {
    async function fetchCards() {
      try {
        const response = await fetch('/api/dashboard/payment')
        const data = await response.json()
        if (data.success) {
          setCards(data.cards)
        }
      } catch (error) {
        console.error('Failed to fetch cards:', error)
      }
    }
    fetchCards()
  }, [])

  const totalFee = memberships.reduce((sum, membership) => sum + membership.fee, 0)
  const totalBalance = memberships.reduce((sum, membership) => sum + membership.balance, 0)
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
      setIsEditing(false)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch (error) {
      setStatus('Failed to logout')
    }
  }

  function handleCancelEdit() {
    setFname(userData.fname)
    setLname(userData.lname)
    setPhone(userData.phone || '')
    setStreet(userData.demographics.street || '')
    setCity(userData.demographics.city || '')
    setStateValue(userData.demographics.state || '')
    setZip(userData.demographics.zip || '')
    setIsEditing(false)
  }

  async function handleAddCard() {
    if (!cardNumber || !securityCode || !expiration) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/dashboard/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardNumber, securityCode, expiration }),
      })

      const data = await response.json()
      if (data.success) {
        setCards(data.cards)
        setCardNumber('')
        setSecurityCode('')
        setExpiration('')
        setShowAddCardPopup(false)
        setStatus('Card added successfully.')
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {status && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
          {status}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(240px,280px)_minmax(320px,1fr)_minmax(240px,280px)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">User Info</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-lg bg-blue-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-600"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateProfile}
                  disabled={isProcessing}
                  className="rounded-lg bg-green-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-green-600 disabled:opacity-60"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="rounded-lg bg-gray-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <p className="font-medium text-slate-900">Name</p>
              {isEditing ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={fname}
                    onChange={(e) => setFname(e.target.value)}
                    className="flex-1 rounded border px-2 py-1"
                    placeholder="First Name"
                  />
                  <input
                    type="text"
                    value={lname}
                    onChange={(e) => setLname(e.target.value)}
                    className="flex-1 rounded border px-2 py-1"
                    placeholder="Last Name"
                  />
                </div>
              ) : (
                <p>{userData.fname} {userData.lname}</p>
              )}
            </div>
            <div>
              <p className="font-medium text-slate-900">Email</p>
              <p>{userData.email}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Phone</p>
              {isEditing ? (
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded border px-2 py-1"
                  placeholder="Phone"
                />
              ) : (
                <p>{userData.phone || 'Not provided'}</p>
              )}
            </div>
            <div>
              <p className="font-medium text-slate-900">Address</p>
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full rounded border px-2 py-1"
                    placeholder="Street"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="flex-1 rounded border px-2 py-1"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      value={stateValue}
                      onChange={(e) => setStateValue(e.target.value)}
                      className="w-16 rounded border px-2 py-1"
                      placeholder="State"
                    />
                    <input
                      type="text"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="w-20 rounded border px-2 py-1"
                      placeholder="Zip"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <p>{userData.demographics.street || 'Street not set'}</p>
                  <p>{userData.demographics.city || 'City not set'}, {userData.demographics.state || 'State not set'} {userData.demographics.zip || ''}</p>
                </div>
              )}
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
                          Fee: ${membership.fee.toFixed(2)} · Balance: ${membership.balance.toFixed(2)} · Due: {membership.due || 'N/A'}
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
          <h2 className="text-xl font-semibold text-slate-900">Billing Info</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-700">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Payment Options</p>
              {cards.length > 0 ? (
                <div className="mt-2">
                  <select className="w-full rounded border px-2 py-1">
                    {cards.map((card) => (
                      <option key={card.mem_id} value={card.mem_id}>
                        ****{card.card_info.last4} (exp. {card.card_info.expiration}){card.card_primary ? ' - Primary' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="mt-2 text-slate-600">No payment options added.</p>
              )}
              <div className="mt-2">
                <button
                  onClick={() => setShowAddCardPopup(true)}
                  className="rounded bg-blue-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-blue-600"
                >
                  Add New Card
                </button>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Total monthly fee</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">${totalFee.toFixed(2)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Outstanding balance</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">${totalBalance.toFixed(2)}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-900">Total memberships</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{memberships.length}</p>
            </div>
          </div>
        </section>
      </div>

      {showAddCardPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Add New Card</h3>
            <div className="mt-4 space-y-4">
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full rounded border px-2 py-1"
                placeholder="Card Number"
              />
              <input
                type="text"
                value={securityCode}
                onChange={(e) => setSecurityCode(e.target.value)}
                className="w-full rounded border px-2 py-1"
                placeholder="Security Code"
              />
              <input
                type="text"
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                className="w-full rounded border px-2 py-1"
                placeholder="Expiration (MM/YY)"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowAddCardPopup(false)}
                className="rounded bg-gray-500 px-4 py-2 text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCard}
                disabled={isProcessing}
                className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-60"
              >
                Add Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
