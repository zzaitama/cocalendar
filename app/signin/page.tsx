"use client"

import { signIn } from "next-auth/react"
import { useState, useEffect } from "react"

const FEATURES = [
  { icon: "📅", label: "Shared calendar", desc: "Everyone's schedule in one place" },
  { icon: "🏠", label: "Wall display", desc: "Always-on kiosk for the whole family" },
  { icon: "⭐", label: "Chores & rewards", desc: "Keep kids motivated and on track" },
  { icon: "🌤️", label: "Live weather", desc: "Plan your day at a glance" },
]

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Slight delay so animation feels intentional
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  async function handleSignIn() {
    setLoading(true)
    await signIn("google", { callbackUrl: "/" })
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col overflow-hidden relative">

      {/* Background mesh gradient */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% -10%, rgba(56,189,248,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 110%, rgba(99,102,241,0.10) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 50% 50%, rgba(0,188,212,0.05) 0%, transparent 70%)
          `
        }}
      />

      {/* Subtle grid texture */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "40px 40px"
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Top bar */}
        <div
          className="flex items-center justify-between px-6 pt-14 pb-4 transition-all duration-700"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(-8px)" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="16" rx="2" stroke="white" strokeWidth="1.8" fill="none"/>
                <line x1="3" y1="10" x2="21" y2="10" stroke="white" strokeWidth="1.8"/>
                <line x1="8" y1="3" x2="8" y2="7" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="16" y1="3" x2="16" y2="7" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-white/60 text-sm font-semibold tracking-wide">CoCalendar</span>
          </div>
          <div className="text-xs text-white/30 font-medium tracking-wider uppercase">Family</div>
        </div>

        {/* Hero section */}
        <div className="flex-1 flex flex-col justify-center px-6 pt-8 pb-6">

          {/* Pill badge */}
          <div
            className="mb-8 transition-all duration-700 delay-100"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(12px)" }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.07] border border-white/10 text-xs font-semibold text-white/60 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE ON YOUR WALL
            </span>
          </div>

          {/* Headline */}
          <div
            className="mb-5 transition-all duration-700 delay-150"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(12px)" }}
          >
            <h1 className="text-[2.8rem] font-extrabold leading-[1.05] tracking-tight text-white">
              Your family,<br />
              <span
                style={{
                  background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #00bcd4 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                in sync.
              </span>
            </h1>
          </div>

          {/* Sub */}
          <p
            className="text-white/50 text-base leading-relaxed mb-10 max-w-xs transition-all duration-700 delay-200"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(12px)" }}
          >
            One calendar for everyone. Built for a wall display, designed to use every day.
          </p>

          {/* Feature pills */}
          <div
            className="grid grid-cols-2 gap-2.5 mb-10 transition-all duration-700 delay-300"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(12px)" }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="flex flex-col gap-1.5 px-4 py-3.5 rounded-2xl bg-white/[0.05] border border-white/[0.07]"
              >
                <span className="text-xl">{f.icon}</span>
                <p className="text-white text-sm font-semibold leading-tight">{f.label}</p>
                <p className="text-white/40 text-xs leading-tight">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Sign in button */}
          <div
            className="transition-all duration-700 delay-[400ms]"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(12px)" }}
          >
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-50 relative overflow-hidden"
              style={{
                background: loading
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.95)",
                color: "#0A0A0A",
                boxShadow: loading ? "none" : "0 0 40px rgba(255,255,255,0.08)",
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5 text-white/60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  <span className="text-white/60">Signing in…</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>

          {/* Footer note */}
          <p
            className="text-center text-white/20 text-xs mt-6 transition-all duration-700 delay-500"
            style={{ opacity: mounted ? 1 : 0 }}
          >
            Only family members with Google access can sign in
          </p>
        </div>
      </div>
    </div>
  )
}
