"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

export default function SignInPage() {
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    setLoading(true)
    await signIn("google", { callbackUrl: "/" })
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center px-6">
      {/* Logo mark */}
      <div className="mb-8 flex items-center justify-center w-24 h-24 rounded-3xl bg-gray-950 dark:bg-white shadow-xl">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="10" width="36" height="32" rx="4" stroke="white" className="dark:stroke-gray-950" strokeWidth="3" fill="none"/>
          <line x1="6" y1="20" x2="42" y2="20" stroke="white" className="dark:stroke-gray-950" strokeWidth="3"/>
          <line x1="16" y1="6" x2="16" y2="14" stroke="white" className="dark:stroke-gray-950" strokeWidth="3" strokeLinecap="round"/>
          <line x1="32" y1="6" x2="32" y2="14" stroke="white" className="dark:stroke-gray-950" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="24" cy="31" r="3" fill="white" className="dark:fill-gray-950"/>
        </svg>
      </div>

      {/* Wordmark */}
      <h1 className="text-5xl font-bold text-gray-950 dark:text-white tracking-tight mb-3">
        CoCalendar
      </h1>

      {/* Tagline */}
      <p className="text-xl text-gray-500 dark:text-gray-400 mb-12 text-center max-w-xs">
        Your family&apos;s calendar, on the wall.
      </p>

      {/* Sign in button */}
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="flex items-center gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white px-8 py-5 rounded-2xl text-xl font-semibold shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-64 justify-center"
      >
        {loading ? (
          <svg className="animate-spin w-6 h-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        {loading ? "Signing in…" : "Continue with Google"}
      </button>

      {/* Footer */}
      <p className="mt-16 text-sm text-gray-400 dark:text-gray-600">
        Built for Raspberry Pi kiosk · {new Date().getFullYear()}
      </p>
    </div>
  )
}
