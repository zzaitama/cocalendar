"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import type { ChoreTemplate } from "@/types/chores"
import type { User } from "@/types"
import { USERS } from "@/lib/config"
import { ChoreForm } from "./ChoreForm"

const BUCKET_LABEL: Record<string, string> = {
  morning: "🌅 Morning",
  afternoon: "☀️ Afternoon",
  evening: "🌙 Evening",
  anytime: "🔄 Anytime",
}

const RECURRENCE_LABEL: Record<string, string> = {
  daily: "Every day",
  selectedDays: "Selected days",
  manual: "Manual",
}

export function ChoreManagementPage() {
  const [templates, setTemplates] = useState<ChoreTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/chore-templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(data: Omit<ChoreTemplate, "id" | "sortOrder" | "createdAt" | "updatedAt">) {
    const res = await fetch("/api/chore-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error)
    setTemplates((prev) => [...prev, json.template])
    setShowCreate(false)
  }

  async function handleEdit(id: string, data: Omit<ChoreTemplate, "id" | "sortOrder" | "createdAt" | "updatedAt">) {
    const res = await fetch(`/api/chore-templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error)
    setTemplates((prev) => prev.map((t) => (t.id === id ? json.template : t)))
    setEditingId(null)
  }

  async function handleToggleActive(template: ChoreTemplate) {
    const res = await fetch(`/api/chore-templates/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !template.isActive }),
    })
    const json = await res.json()
    if (res.ok) setTemplates((prev) => prev.map((t) => (t.id === template.id ? json.template : t)))
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/chore-templates/${id}`, { method: "DELETE" })
      if (res.ok) setTemplates((prev) => prev.filter((t) => t.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  const userMap = Object.fromEntries((USERS as User[]).map((u) => [u.id, u]))

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/chores" className="min-h-14 min-w-14 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Manage Chores</h1>
        </div>
        <Link
          href="/chores/rewards"
          className="text-sm text-blue-600 dark:text-blue-400 font-semibold min-h-14 flex items-center px-2"
        >
          Rewards →
        </Link>
      </div>

      {showCreate && (
        <ChoreForm
          users={USERS as User[]}
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {!showCreate && (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full min-h-14 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 font-semibold text-lg hover:border-blue-400 hover:text-blue-500 transition-colors"
        >
          + New Chore
        </button>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-center py-8">No chores yet. Add one above!</p>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => {
            const user = template.personId ? userMap[template.personId] : null
            if (editingId === template.id) {
              return (
                <ChoreForm
                  key={template.id}
                  initial={template}
                  users={USERS as User[]}
                  onSave={(data) => handleEdit(template.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              )
            }
            return (
              <div
                key={template.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl p-4 flex items-center gap-3 ${
                  !template.isActive ? "opacity-50" : ""
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: user?.color ?? "#6B7280" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{template.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.name ?? "Anyone"} · {BUCKET_LABEL[template.timeBucket]} · {RECURRENCE_LABEL[template.recurrenceType]} · ⭐{template.points}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(template)}
                    className={`w-10 h-5 rounded-full transition-colors ${template.isActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${template.isActive ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                  <button
                    onClick={() => setEditingId(template.id)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-blue-500"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${template.title}"?`)) handleDelete(template.id)
                    }}
                    disabled={deletingId === template.id}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-red-500 disabled:opacity-40"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
