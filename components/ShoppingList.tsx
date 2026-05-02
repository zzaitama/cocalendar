"use client"

import { useState, useRef, useCallback } from "react"
import type { ShoppingListData, ShoppingStore } from "@/types"

const CARD_COLORS = [
  { label: "Slate",  bg: "#f1f5f9", dark: "#1e293b", accent: "#64748b" },
  { label: "Red",    bg: "#fef2f2", dark: "#450a0a", accent: "#ef4444" },
  { label: "Orange", bg: "#fff7ed", dark: "#431407", accent: "#f97316" },
  { label: "Yellow", bg: "#fefce8", dark: "#422006", accent: "#eab308" },
  { label: "Green",  bg: "#f0fdf4", dark: "#052e16", accent: "#22c55e" },
  { label: "Teal",   bg: "#f0fdfa", dark: "#042f2e", accent: "#14b8a6" },
  { label: "Blue",   bg: "#eff6ff", dark: "#172554", accent: "#3b82f6" },
  { label: "Purple", bg: "#faf5ff", dark: "#3b0764", accent: "#a855f7" },
  { label: "Pink",   bg: "#fdf2f8", dark: "#500724", accent: "#ec4899" },
]

const EMOJIS = ["🛒","🍎","🏠","👗","💊","📚","🐾","🎁","🧹","🍕","🧴","🌿","☕","🎮","🏋️"]

const DEFAULT_COLOR = CARD_COLORS[0]

function getCardColor(color: string) {
  return CARD_COLORS.find(c => c.bg === color) ?? DEFAULT_COLOR
}

interface CardSettingsModalProps {
  store: ShoppingStore
  onClose: () => void
  onSave: (name: string, color: string, emoji: string) => void
  onDelete: () => void
}

function CardSettingsModal({ store, onClose, onSave, onDelete }: CardSettingsModalProps) {
  const [name, setName] = useState(store.name)
  const [color, setColor] = useState(store.color || DEFAULT_COLOR.bg)
  const [emoji, setEmoji] = useState(store.emoji || "🛒")
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-6" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-sm flex flex-col gap-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="text-gray-950 dark:text-white text-xl font-bold">List Settings</p>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center justify-center">✕</button>
        </div>

        <div>
          <p className="text-gray-500 text-sm mb-2">Name</p>
          <input
            autoFocus
            className="w-full bg-gray-100 dark:bg-gray-800 text-gray-950 dark:text-white rounded-xl px-4 py-3 text-lg outline-none"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") onSave(name, color, emoji) }}
          />
        </div>

        <div>
          <p className="text-gray-500 text-sm mb-2">Emoji</p>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setEmoji(e)}
                className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-colors ${emoji === e ? "bg-gray-950 dark:bg-white" : "bg-gray-100 dark:bg-gray-800"}`}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-gray-500 text-sm mb-2">Color</p>
          <div className="flex flex-wrap gap-2">
            {CARD_COLORS.map(c => (
              <button key={c.bg} onClick={() => setColor(c.bg)}
                className={`w-9 h-9 rounded-full border-4 transition-all ${color === c.bg ? "border-gray-950 dark:border-white scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c.accent }} />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          {confirmDelete ? (
            <>
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold">Cancel</button>
              <button onClick={onDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold">Delete list</button>
            </>
          ) : (
            <>
              <button onClick={() => setConfirmDelete(true)} className="py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-red-500 font-semibold">Delete</button>
              <button onClick={() => onSave(name, color, emoji)} disabled={!name.trim()} className="flex-1 py-3 rounded-xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 font-semibold disabled:opacity-40">Save</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface StoreCardProps {
  store: ShoppingStore
  onToggleItem: (itemId: string) => void
  onDeleteItem: (itemId: string) => void
  onAddItem: (text: string) => void
  onSettingsOpen: () => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  isDraggingOver: boolean
}

function StoreCard({ store, onToggleItem, onDeleteItem, onAddItem, onSettingsOpen, onDragStart, onDragOver, onDrop, isDraggingOver }: StoreCardProps) {
  const [newItem, setNewItem] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const cardColor = getCardColor(store.color)
  const isDark = document.documentElement.classList.contains("dark")
  const cardBg = isDark ? cardColor.dark : cardColor.bg
  const accentColor = cardColor.accent

  function handleAdd() {
    if (!newItem.trim()) return
    onAddItem(newItem.trim())
    setNewItem("")
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const incomplete = store.items.filter(i => !i.checked)
  const complete = store.items.filter(i => i.checked)

  return (
    <div
      draggable
      onDragStart={() => onDragStart()}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`rounded-2xl p-4 flex flex-col gap-3 transition-all ${isDraggingOver ? "scale-105 shadow-2xl" : "shadow-sm"}`}
      style={{ backgroundColor: cardBg, border: `2px solid ${isDraggingOver ? accentColor : "transparent"}` }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{store.emoji || "🛒"}</span>
          <p className="text-gray-950 dark:text-white text-lg font-bold">{store.name}</p>
          {incomplete.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: accentColor }}>
              {incomplete.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* drag handle */}
          <div className="w-8 h-8 flex items-center justify-center cursor-grab text-gray-400 active:cursor-grabbing">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="4" r="1.5"/><circle cx="11" cy="4" r="1.5"/>
              <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
              <circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/>
            </svg>
          </div>
          <button onClick={onSettingsOpen} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-black/5 transition-colors" aria-label="List settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-1">
        {store.items.length === 0 && (
          <p className="text-gray-400 text-sm px-1 py-2">Nothing here yet</p>
        )}
        {incomplete.map(item => (
          <div key={item.id} className="flex items-center gap-3 py-1.5 group">
            <button onClick={() => onToggleItem(item.id)}
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
              style={{ borderColor: accentColor }}>
            </button>
            <span className="flex-1 text-gray-950 dark:text-white text-base leading-tight">{item.text}</span>
            <button onClick={() => onDeleteItem(item.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        ))}
        {complete.length > 0 && (
          <>
            <div className="h-px bg-black/10 dark:bg-white/10 my-1" />
            {complete.map(item => (
              <div key={item.id} className="flex items-center gap-3 py-1.5 group">
                <button onClick={() => onToggleItem(item.id)}
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: accentColor }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </button>
                <span className="flex-1 text-gray-400 text-base line-through leading-tight">{item.text}</span>
                <button onClick={() => onDeleteItem(item.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Add item input */}
      <div className="flex gap-2 pt-1">
        <input
          ref={inputRef}
          type="text"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleAdd() }}
          placeholder="Add item…"
          className="flex-1 bg-black/5 dark:bg-white/5 text-gray-950 dark:text-white text-base rounded-xl px-3 py-2.5 outline-none placeholder:text-gray-400"
        />
        <button onClick={handleAdd} disabled={!newItem.trim()}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-30 transition-colors"
          style={{ backgroundColor: accentColor }}>
          Add
        </button>
      </div>
    </div>
  )
}

interface ShoppingListProps {
  initialData: ShoppingListData
}

export function ShoppingList({ initialData }: ShoppingListProps) {
  const [stores, setStores] = useState<ShoppingStore[]>(
    initialData.stores.map((s, i) => ({
      ...s,
      color: s.color ?? CARD_COLORS[i % CARD_COLORS.length].bg,
      emoji: s.emoji ?? "🛒",
    }))
  )
  const [settingsFor, setSettingsFor] = useState<string | null>(null)
  const [syncFailed, setSyncFailed] = useState(false)
  const dragId = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const saveNow = useCallback(async (updated: ShoppingStore[]) => {
    try {
      const res = await fetch("/api/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stores: updated }),
      })
      if (!res.ok) throw new Error()
      setSyncFailed(false)
    } catch {
      setSyncFailed(true)
    }
  }, [])

  function updateStores(updated: ShoppingStore[]) {
    setStores(updated)
    void saveNow(updated)
  }

  function toggleItem(storeId: string, itemId: string) {
    updateStores(stores.map(s => s.id !== storeId ? s : {
      ...s, items: s.items.map(i => i.id !== itemId ? i : { ...i, checked: !i.checked })
    }))
  }

  function deleteItem(storeId: string, itemId: string) {
    updateStores(stores.map(s => s.id !== storeId ? s : {
      ...s, items: s.items.filter(i => i.id !== itemId)
    }))
  }

  function addItem(storeId: string, text: string) {
    updateStores(stores.map(s => s.id !== storeId ? s : {
      ...s, items: [...s.items, { id: crypto.randomUUID(), text, checked: false }]
    }))
  }

  function addStore() {
    const idx = stores.length
    const newStore: ShoppingStore = {
      id: "store-" + Date.now(),
      name: "New List",
      order: idx,
      color: CARD_COLORS[idx % CARD_COLORS.length].bg,
      emoji: "🛒",
      items: [],
    }
    const updated = [...stores, newStore]
    updateStores(updated)
    setSettingsFor(newStore.id)
  }

  function saveCardSettings(storeId: string, name: string, color: string, emoji: string) {
    updateStores(stores.map(s => s.id !== storeId ? s : { ...s, name, color, emoji }))
    setSettingsFor(null)
  }

  function deleteStore(storeId: string) {
    updateStores(stores.filter(s => s.id !== storeId))
    setSettingsFor(null)
  }

  // Drag-to-reorder
  function handleDragStart(storeId: string) {
    dragId.current = storeId
  }

  function handleDragOver(e: React.DragEvent, storeId: string) {
    e.preventDefault()
    setDragOverId(storeId)
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    setDragOverId(null)
    if (!dragId.current || dragId.current === targetId) return
    const from = stores.findIndex(s => s.id === dragId.current)
    const to = stores.findIndex(s => s.id === targetId)
    const reordered = [...stores]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    updateStores(reordered.map((s, i) => ({ ...s, order: i })))
    dragId.current = null
  }

  const settingsStore = stores.find(s => s.id === settingsFor)

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {syncFailed && (
        <p className="text-amber-500 text-sm text-right pb-2">Sync failed — check connection</p>
      )}

      {/* Card grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {stores.map(store => (
          <div key={store.id} className="break-inside-avoid">
            <StoreCard
              store={store}
              onToggleItem={itemId => toggleItem(store.id, itemId)}
              onDeleteItem={itemId => deleteItem(store.id, itemId)}
              onAddItem={text => addItem(store.id, text)}
              onSettingsOpen={() => setSettingsFor(store.id)}
              onDragStart={() => handleDragStart(store.id)}
              onDragOver={e => handleDragOver(e, store.id)}
              onDrop={e => handleDrop(e, store.id)}
              isDraggingOver={dragOverId === store.id}
            />
          </div>
        ))}

        {/* Add new list card */}
        <div className="break-inside-avoid">
          <button
            onClick={addStore}
            className="w-full rounded-2xl p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 flex items-center justify-center gap-2 text-lg font-semibold hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-500 dark:hover:text-gray-500 transition-colors min-h-24"
          >
            <span className="text-2xl">+</span>
            New list
          </button>
        </div>
      </div>

      {/* Card settings modal */}
      {settingsStore && (
        <CardSettingsModal
          store={settingsStore}
          onClose={() => setSettingsFor(null)}
          onSave={(name, color, emoji) => saveCardSettings(settingsStore.id, name, color, emoji)}
          onDelete={() => deleteStore(settingsStore.id)}
        />
      )}
    </div>
  )
}
