'use client'

import { useState, type FormEvent } from 'react'

type UserData = {
  fname: string
  lname: string
  email: string
  phone: string | null
  identityPubguid: string
  active: boolean
  loginExists: boolean
  securityQuestions: Array<{ question: string }>
}

export default function AdminPage() {
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authError, setAuthError] = useState('')

  const [searchEmail, setSearchEmail] = useState('')
  const [users, setUsers] = useState<UserData[]>([])
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [fname, setFname] = useState('')
  const [lname, setLname] = useState('')
  const [phone, setPhone] = useState('')

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        setAuthError(data.error || 'Invalid admin credentials')
        return
      }

      setIsAuthenticated(true)
      setAdminUsername('')
      setAdminPassword('')
      setMessage('Logged in successfully.')
    } catch (err) {
      setAuthError('Unable to authenticate admin at this time.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchUser = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: searchEmail }),
      })

      const data = await response.json()
      if (!response.ok || data.error) {
        setError(data.error || 'Failed to retrieve users')
        setUsers([])
        setSelectedUser(null)
        return
      }

      setUsers(data.users || [])
      setSelectedUser(data.users?.[0] ?? null)

      if (data.users?.length > 0) {
        setFname(data.users[0].fname || '')
        setLname(data.users[0].lname || '')
        setPhone(data.users[0].phone || '')
      } else {
        setFname('')
        setLname('')
        setPhone('')
      }

      setMessage(`${data.users?.length || 0} account(s) loaded.`)
    } catch (err) {
      setError('Unable to fetch user data.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectUser = (user: UserData) => {
    setSelectedUser(user)
    setFname(user.fname || '')
    setLname(user.lname || '')
    setPhone(user.phone || '')
    setMessage('Account row selected.')
  }

  const handleUpdateUser = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedUser) {
      return
    }

    setError('')
    setMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identityPubguid: selectedUser.identityPubguid,
          fname,
          lname,
          phone,
        }),
      })

      const data = await response.json()
      if (!response.ok || data.error) {
        setError(data.error || 'Failed to update user')
        return
      }

      setSelectedUser(data.user)
      setUsers((current) =>
        current.map((item) =>
          item.identityPubguid === data.user.identityPubguid ? data.user : item
        )
      )
      setMessage('User updated successfully.')
    } catch (err) {
      setError('Unable to update user.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) {
      return
    }

    setError('')
    setMessage('')
    setIsLoading(true)

    try {
      const response = await fetch(
        `/api/admin/user?pubguid=${encodeURIComponent(selectedUser.identityPubguid)}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()
      if (!response.ok || data.error) {
        setError(data.error || 'Failed to deactivate user')
        return
      }

      setMessage('User deactivated successfully.')
      const updated = { ...selectedUser, active: false }
      setSelectedUser(updated)
      setUsers((current) =>
        current.map((item) =>
          item.identityPubguid === updated.identityPubguid ? updated : item
        )
      )
    } catch (err) {
      setError('Unable to deactivate user.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUsers([])
    setSelectedUser(null)
    setSearchEmail('')
    setMessage('Logged out.')
    setError('')
    setAuthError('')
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-4 text-zinc-900 dark:bg-black dark:text-zinc-100">
      <div className="mx-auto max-w-4xl space-y-8 rounded-3xl bg-white p-8 shadow-lg dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Use your environment credentials to sign in and manage user records.
            </p>
          </div>
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Log out
            </button>
          )}
        </div>

        {authError && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
            {authError}
          </div>
        )}

        {!isAuthenticated ? (
          <form onSubmit={handleAdminLogin} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Admin Username</label>
              <input
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="Admin username"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium">Admin Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                placeholder="Admin password"
                required
              />
            </div>
            <div className="sm:col-span-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium">Search by user email</label>
                <input
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder="user@example.com"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleSearchUser}
                  disabled={isLoading || !searchEmail}
                  className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Search User
                </button>
              </div>
            </div>

            {message && (
              <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-200">
                {error}
              </div>
            )}

            {users.length > 0 && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
                  <h2 className="mb-4 text-xl font-semibold">Matching Accounts</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 text-sm">
                      <thead className="bg-zinc-100 text-left text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                        <tr>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">First Name</th>
                          <th className="px-4 py-3">Last Name</th>
                          <th className="px-4 py-3">Phone</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Login</th>
                          <th className="px-4 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                        {users.map((item) => (
                          <tr key={item.identityPubguid} className={selectedUser?.identityPubguid === item.identityPubguid ? 'bg-blue-50 dark:bg-blue-950/40' : ''}>
                            <td className="px-4 py-3">{item.email}</td>
                            <td className="px-4 py-3">{item.fname}</td>
                            <td className="px-4 py-3">{item.lname}</td>
                            <td className="px-4 py-3">{item.phone || '—'}</td>
                            <td className="px-4 py-3">{item.active ? 'Active' : 'Inactive'}</td>
                            <td className="px-4 py-3">{item.loginExists ? 'Exists' : 'Missing'}</td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => handleSelectUser(item)}
                                className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedUser && (
                  <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold">Selected Account</h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Email: {selectedUser.email}</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">ID: {selectedUser.identityPubguid}</p>
                      </div>
                      <div className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        {selectedUser.active ? 'Active' : 'Inactive'}
                      </div>
                    </div>

                    <form onSubmit={handleUpdateUser} className="mt-6 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="block text-sm font-medium">First Name</label>
                          <input
                            value={fname}
                            onChange={(e) => setFname(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Last Name</label>
                          <input
                            value={lname}
                            onChange={(e) => setLname(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Phone</label>
                          <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isLoading ? 'Saving…' : 'Save changes'}
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteUser}
                          disabled={isLoading || !selectedUser.active}
                          className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {selectedUser.active ? 'Deactivate user' : 'Already inactive'}
                        </button>
                      </div>
                    </form>

                    <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-900">
                      <p className="text-sm font-semibold">Login record</p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                        {selectedUser.loginExists ? 'Exists' : 'Missing'}
                      </p>

                      {selectedUser.securityQuestions.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold">Security Questions</p>
                          <ul className="mt-2 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                            {selectedUser.securityQuestions.map((question, index) => (
                              <li key={index}>• {question.question}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
