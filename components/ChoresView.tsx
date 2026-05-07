"use client"

import { useState, useEffect, useCallback } from "react"
import { useAvatar } from "@/context/AvatarContext"

export interface Chore {
  id: string
  title: string
  assignee: "Daddy" | "Mommy" | "Colette" | "Monti" | "Unassigned"
  completedAt: string | null
  completedWeek: number | null
}

type Assignee = "Daddy" | "Mommy" | "Colette" | "Monti" | "Unassigned"

const ASSIGNEES: { name: Assignee; color: string }[] = [
  { name: "Daddy",   color: "#33B679" },
  { name: "Mommy",   color: "#039BE5" },
  { name: "Colette", color: "#E67C73" },
  { name: "Monti",   color: "#F6BF26" },
  { name: "Unassigned", color: "#9E9E9E" },
]

function AddChoreModal({ onClose, onAdd }: { onClose: () => void; onAdd: (title: string, assignee: Assignee) => void }) {
  const [title, setTitle] = useState("")
  const [assignee, setAssignee] = useState<Assignee>("Unassigned")

  function handleSave() {
    if (!title.trim()) return
    onAdd(title.trim(), assignee)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-full max-w-sm flex flex-col gap-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-gray-950 dark:text-white text-2xl font-bold">Add Chore</p>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center text-xl">✕</button>
        </div>
        <input
          autoFocus
          className="w-full bg-gray-100 dark:bg-gray-800 text-gray-950 dark:text-white rounded-xl px-4 py-4 text-xl outline-none"
          placeholder="Chore title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") onClose() }}
        />
        <div>
          <p className="text-gray-500 text-sm mb-3">Assign to</p>
          <div className="flex flex-wrap gap-2">
            {ASSIGNEES.map(a => (
              <button
                key={a.name}
                onClick={() => setAssignee(a.name)}
                className={`px-5 py-3 rounded-xl text-lg font-semibold border-2 transition-colors ${assignee === a.name ? "border-transparent text-white" : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-transparent"}`}
                style={assignee === a.name ? { backgroundColor: a.color, borderColor: a.color } : {}}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xl font-semibold">Cancel</button>
          <button onClick={handleSave} disabled={!title.trim()} className="flex-1 py-4 rounded-xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-xl font-semibold disabled:opacity-40">Save</button>
        </div>
      </div>
    </div>
  )
}

function ChoreCard({ chore, onToggle, onDelete }: { chore: Chore; onToggle: () => void; onDelete: () => void }) {
  const a = ASSIGNEES.find(x => x.name === chore.assignee)!
  return (
    <div className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-colors ${chore.completedAt ? "opacity-50" : "bg-gray-100 dark:bg-gray-800"}`}>
      <button
        onClick={onToggle}
        className="w-14 h-14 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
        style={{ borderColor: a.color, backgroundColor: chore.completedAt ? a.color : "transparent" }}
        aria-label={chore.completedAt ? "Mark incomplete" : "Mark complete"}
      >
        {chore.completedAt && <span className="text-white text-xl">✓</span>}
      </button>
      <span className={`flex-1 text-xl text-gray-950 dark:text-white ${chore.completedAt ? "line-through text-gray-400 dark:text-gray-500" : ""}`}>
        {chore.title}
      </span>
      <button
        onClick={onDelete}
        className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 flex items-center justify-center flex-shrink-0 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
        aria-label="Delete chore"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>
    </div>
  )
}

function ChoreGroupHeader({ name, color, incompleteCount }: { name: string; color: string; incompleteCount: number }) {
  const { getAvatar } = useAvatar()
  const user = USERS.find(u => u.name === name)
  const emoji = user ? getAvatar(user.id) : ""
  return (
    <div className="flex items-center gap-3 mb-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-lg border-2 shrink-0"
        style={{ borderColor: color, backgroundColor: color + "22" }}
      >
        {emoji || <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />}
      </div>
      <p className="text-gray-950 dark:text-white text-xl font-bold">{name}</p>
      <p className="text-gray-400 text-sm">{incompleteCount} remaining</p>
    </div>
  )
}

export function ChoresView() {
  const [chores, setChores] = useState<Chore[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/chores")
      if (res.ok) setChores(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAdd(title: string, assignee: Assignee) {
    const res = await fetch("/api/chores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, assignee }),
    })
    if (res.ok) load()
  }

  async function handleToggle(chore: Chore) {
    await fetch(`/api/chores/${chore.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !chore.completedAt }),
    })
    load()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/chores/${id}`, { method: "DELETE" })
    load()
  }

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-gray-400 text-xl">Loading...</div>
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        {ASSIGNEES.map(({ name, color }) => {
          const group = chores.filter(c => c.assignee === name)
          const incomplete = group.filter(c => !c.completedAt)
          const complete = group.filter(c => c.completedAt)
          return (
            <div key={name}>
              <ChoreGroupHeader name={name} color={color} incompleteCount={incomplete.length} />
              <div className="flex flex-col gap-2">
                {incomplete.length === 0 && complete.length === 0 && (
                  <p className="text-gray-400 text-lg px-4">No chores</p>
                )}
                {incomplete.map(c => (
                  <ChoreCard key={c.id} chore={c} onToggle={() => handleToggle(c)} onDelete={() => handleDelete(c.id)} />
                ))}
                {complete.map(c => (
                  <ChoreCard key={c.id} chore={c} onToggle={() => handleToggle(c)} onDelete={() => handleDelete(c.id)} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gray-950 dark:bg-white text-white dark:text-gray-950 flex items-center justify-center shadow-lg text-3xl hover:scale-105 transition-transform"
        aria-label="Add chore"
      >
        +
      </button>

      {showAdd && <AddChoreModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
    </div>
  )
}


