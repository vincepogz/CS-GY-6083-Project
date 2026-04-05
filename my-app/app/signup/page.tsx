'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAdditionalFields(true);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle signup logic here
    console.log('Signup attempt:', { email, firstName, lastName, phone });
    // Reset form
    setEmail('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setShowAdditionalFields(false);
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black min-h-screen p-4">
      <main className="flex flex-1 w-full max-w-md flex-col items-center justify-center py-16 px-8 sm:py-32 sm:px-16 bg-white dark:bg-black rounded-lg shadow-lg">
        <div className="w-full mb-4">
          <Link href="/login" className="inline-flex items-center text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Login
          </Link>
        </div>
        <h1 className="text-2xl font-semibold mb-6 text-black dark:text-zinc-50">Sign Up</h1>
        <form onSubmit={showAdditionalFields ? handleFinalSubmit : handleInitialSubmit} className="w-full space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={showAdditionalFields}
              className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {showAdditionalFields && (
            <>
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-50"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-50"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-50"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {showAdditionalFields ? 'Complete Sign Up' : 'Sign Up'}
          </button>
        </form>
      </main>
    </div>
  );
}