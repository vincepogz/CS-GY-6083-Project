'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { handleInitialSignup, handleCompleteSignup } from './actions';

const securityQuestions = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favorite book?",
  "What city were you born in?",
  "What is your favorite movie?",
  "What was your childhood nickname?",
  "What is the name of your favorite teacher?",
  "What is your favorite food?",
  "What was the make of your first car?",
  "What is your favorite color?",
  "What is the name of the street you grew up on?",
  "What was your first job?",
  "What is your favorite sport?",
  "What is the name of your best friend from childhood?"
];

export default function Signup() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [pubguid, setPubguid] = useState('');
  const [question1, setQuestion1] = useState('');
  const [answer1, setAnswer1] = useState('');
  const [question2, setQuestion2] = useState('');
  const [answer2, setAnswer2] = useState('');
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [showSecurityQuestions, setShowSecurityQuestions] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (showSecurityQuestions && isClient) {
      // Generate two random questions only on client side
      const availableQuestions = [...securityQuestions];
      const q1 = availableQuestions.splice(Math.floor(Math.random() * availableQuestions.length), 1)[0];
      const q2 = availableQuestions.splice(Math.floor(Math.random() * availableQuestions.length), 1)[0];
      setQuestion1(q1);
      setQuestion2(q2);
    }
  }, [showSecurityQuestions, isClient]);

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Check if email already exists
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to validate email');
        setIsLoading(false);
        return;
      }

      if (data.exists) {
        setError('The user already exist');
        setIsLoading(false);
        return;
      }

      setShowAdditionalFields(true);
    } catch (err) {
      setError('An error occurred while validating email');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const result = await handleInitialSignup(email, firstName, lastName, phone);

      if (!result.success) {
        setError(result.error || 'Signup failed');
        setIsLoading(false);
        return;
      }

      setPubguid(result.pubguid!);
      setShowSecurityQuestions(true);
    } catch (err) {
      setError('An unexpected error occurred during signup');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const result = await handleCompleteSignup(pubguid, email, password, question1, answer1, question2, answer2);

      if (!result.success) {
        setError(result.error || 'Signup failed');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Sign up successful! Redirecting to login...');
      // Reset form
      setEmail('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setPassword('');
      setAnswer1('');
      setAnswer2('');
      setShowAdditionalFields(false);
      setShowSecurityQuestions(false);

      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      setError('An unexpected error occurred during signup');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
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

        {error && (
          <div className="w-full mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="w-full mb-4 p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
          </div>
        )}

        <form onSubmit={showSecurityQuestions ? handleSecuritySubmit : showAdditionalFields ? handleFinalSubmit : handleInitialSubmit} className="w-full space-y-4">
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
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-50"
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Minimum 8 characters</p>
              </div>
            </>
          )}

          {showSecurityQuestions && (
            <>
              <div>
                <label htmlFor="question1" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Security Question 1
                </label>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {question1 || (isClient ? 'Loading question...' : 'Security question will appear here')}
                </p>
                <input
                  type="text"
                  id="answer1"
                  value={answer1}
                  onChange={(e) => setAnswer1(e.target.value)}
                  required
                  disabled={!isClient || !question1}
                  className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="question2" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Security Question 2
                </label>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {question2 || (isClient ? 'Loading question...' : 'Security question will appear here')}
                </p>
                <input
                  type="text"
                  id="answer2"
                  value={answer2}
                  onChange={(e) => setAnswer2(e.target.value)}
                  required
                  disabled={!isClient || !question2}
                  className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              showSecurityQuestions ? 'Complete Sign Up' : showAdditionalFields ? 'Continue Sign Up' : 'Sign Up'
            )}
          </button>
        </form>
      </main>
    </div>
  );
}