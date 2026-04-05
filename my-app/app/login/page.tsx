'use client';

import { useState } from 'react';
import Link from 'next/link';
import { handleLogin } from './actions';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const result = await handleLogin(email, password);

      if (!result.success) {
        setError(result.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      setSuccessMessage('Login successful! Redirecting...');
      // Reset form
      setEmail('');
      setPassword('');

      // Redirect to dashboard or home page after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err) {
      setError('An unexpected error occurred during login');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black min-h-screen p-4">
      <main className="flex flex-1 w-full max-w-md flex-col items-center justify-center py-16 px-8 sm:py-32 sm:px-16 bg-white dark:bg-black rounded-lg shadow-lg">
        <h1 className="text-2xl font-semibold mb-6 text-black dark:text-zinc-50">Login</h1>

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

        {!showForgotPassword ? (
          <>
            <form onSubmit={handleSubmit} className="w-full space-y-4">
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
                  disabled={isLoading}
                  className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={isLoading}
                  className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
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
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setError('');
                  setSuccessMessage('');
                  setEmail('');
                  setPassword('');
                }}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Forgot Password?
              </button>
            </div>

            <div className="mt-6 w-full">
              <Link href="/signup">
                <button
                  type="button"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-zinc-300 rounded-md shadow-sm text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sign Up
                </button>
              </Link>
            </div>
          </>
        ) : (
          <ForgotPasswordFlow 
            onBack={() => setShowForgotPassword(false)}
            onError={(err) => {
              setError(err);
              setShowForgotPassword(false);
            }}
            onSuccess={() => {
              setShowForgotPassword(false);
              setSuccessMessage('Password reset successfully! You can now log in with your new password.');
            }}
          />
        )}
      </main>
    </div>
  );
}

interface ForgotPasswordFlowProps {
  onBack: () => void;
  onError: (error: string) => void;
  onSuccess: () => void;
}

function ForgotPasswordFlow({ onBack, onError, onSuccess }: ForgotPasswordFlowProps) {
  const [step, setStep] = useState<'email' | 'security' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [pubguid, setPubguid] = useState('');
  const [questions, setQuestions] = useState<any>(null);
  const [answer1, setAnswer1] = useState('');
  const [answer2, setAnswer2] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || email.trim() === '') {
        setError('Invalid email address');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to retrieve security questions');
        setIsLoading(false);
        return;
      }

      setPubguid(data.pubguid);
      setQuestions(data.questions);
      setStep('security');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/validate-security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pubguid, answer1, answer2 }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Security question validation failed');
        setIsLoading(false);
        return;
      }

      setStep('reset');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!newPassword || !confirmPassword) {
        setError('Both password fields are required');
        setIsLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters long');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newPassword, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
        setIsLoading(false);
        return;
      }

      onSuccess();
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
        >
          ← Back to Login
        </button>
      </div>

      {error && (
        <div className="w-full mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {step === 'email' && (
        <form onSubmit={handleEmailSubmit} className="w-full space-y-4">
          <h2 className="text-lg font-medium mb-4 text-black dark:text-zinc-50">Reset Your Password</h2>
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email Address
            </label>
            <input
              type="email"
              id="reset-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Continue'}
          </button>
        </form>
      )}

      {step === 'security' && questions && (
        <form onSubmit={handleSecuritySubmit} className="w-full space-y-4">
          <h2 className="text-lg font-medium mb-4 text-black dark:text-zinc-50">Answer Security Questions</h2>
          <div>
            <label htmlFor="answer1" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {questions.questions?.[0]?.question || 'Security Question 1'}
            </label>
            <input
              type="text"
              id="answer1"
              value={answer1}
              onChange={(e) => setAnswer1(e.target.value)}
              required
              disabled={isLoading}
              className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="answer2" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {questions.questions?.[1]?.question || 'Security Question 2'}
            </label>
            <input
              type="text"
              id="answer2"
              value={answer2}
              onChange={(e) => setAnswer2(e.target.value)}
              required
              disabled={isLoading}
              className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Validating...' : 'Validate'}
          </button>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={handlePasswordReset} className="w-full space-y-4">
          <h2 className="text-lg font-medium mb-4 text-black dark:text-zinc-50">Continue with Password Reset</h2>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              New Password
            </label>
            <input
              type="password"
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isLoading}
              className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              className="mt-1 block w-full px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
}