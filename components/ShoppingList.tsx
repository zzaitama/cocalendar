"use client"

import { useState, useRef } from "react"
import type { ShoppingListData, ShoppingStore } from "@/types"

interface ShoppingListProps {
  initialData: ShoppingListData
}

export function ShoppingList({ initialData }: ShoppingListProps) {
  const [stores, setStores] = useState<ShoppingStore[]>(initialData.stores)
  const [activeId, setActiveId] = useState<string>(initialData.stores[0]?.id ?? "")
  const [newItemText, setNewItemText] = useState("")
  const [syncFailed, setSyncFailed] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function saveNow(updated: ShoppingStore[]) {
    try {
      const res = await fetch("/api/shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stores: updated }),
      })
      if (!res.ok) throw new Error("save failed")
      setSyncFailed(false)
    } catch {
      setSyncFailed(true)
    }
  }

  function scheduleSave(updated: ShoppingStore[]) {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => { void saveNow(updated) }, 500)
  }

  function toggleItem(storeId: string, itemId: string) {
    const updated = stores.map(s =>
      s.id !== storeId ? s : {
        ...s,
        items: s.items.map(i => i.id !== itemId ? i : { ...i, checked: !i.checked }),
      }
    )
    setStores(updated)
    scheduleSave(updated)
  }

  function deleteItem(storeId: string, itemId: string) {
    const updated = stores.map(s =>
      s.id !== storeId ? s : { ...s, items: s.items.filter(i => i.id !== itemId) }
    )
    setStores(updated)
    void saveNow(updated)
  }

  function addItem() {
    if (!newItemText.trim()) return
    const updated = stores.map(s =>
      s.id !== activeId ? s : {
        ...s,
        items: [...s.items, { id: crypto.randomUUID(), text: newItemText.trim(), checked: false }],
      }
    )
    setStores(updated)
    setNewItemText("")
    void saveNow(updated)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function addStore() {
    const name = window.prompt("Store name:")?.trim()
    if (!name) return
    const id = name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now()
    const newStore: ShoppingStore = { id, name, order: stores.length, items: [] }
    const updated = [...stores, newStore]
    setStores(updated)
    setActiveId(id)
    void saveNow(updated)
  }

  const activeStore = stores.find(s => s.id === activeId)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto shrink-0 border-b border-gray-200 dark:border-gray-800">
        {stores.map(store => (
          <button
            key={store.id}
            onClick={() => setActiveId(store.id)}
            className={`px-5 py-3 rounded-xl text-lg font-semibold whitespace-nowrap min-h-14 transition-colors ${
              activeId === store.id
                ? "bg-gray-950 dark:bg-white text-white dark:text-gray-950"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {store.name}
          </button>
        ))}
        <button
          onClick={addStore}
          className="px-5 py-3 rounded-xl text-lg font-semibold whitespace-nowrap min-h-14 shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          + New Store
        </button>
      </div>

      {syncFailed && (
        <p className="text-amber-500 text-sm text-right px-6 py-1 shrink-0">Sync failed</p>
      )}

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
        {activeStore && activeStore.items.length === 0 && (
          <p className="text-2xl text-gray-500 dark:text-gray-600 px-2 pt-2">Nothing here — add something below</p>
        )}
        {activeStore && activeStore.items.length > 0 && (
          <div className="flex flex-col gap-2">
            {activeStore.items.map(item => (
              <div key={item.id} className="flex items-center gap-3 min-h-16">
                <button
                  onClick={() => toggleItem(activeId, item.id)}
                  className={`w-14 h-14 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    item.checked
                      ? "bg-gray-950 dark:bg-white border-gray-950 dark:border-white"
                      : "border-gray-400 dark:border-gray-600 hover:border-gray-700 dark:hover:border-gray-400"
                  }`}
                  aria-label={item.checked ? "Uncheck item" : "Check item"}
                >
                  {item.checked && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white dark:text-gray-950">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <span className={`flex-1 text-xl leading-tight ${item.checked ? "line-through text-gray-400 dark:text-gray-600" : "text-gray-950 dark:text-white"}`}>
                  {item.text}
                </span>
                <button
                  onClick={() => deleteItem(activeId, item.id)}
                  className="w-14 h-14 flex items-center justify-center rounded-xl text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                  aria-label="Delete item"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 px-4 py-4 flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={newItemText}
          onChange={e => setNewItemText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") addItem() }}
          placeholder="Add item…"
          className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-950 dark:text-white text-xl rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-gray-950 dark:focus:ring-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
        />
        <button
          onClick={addItem}
          disabled={!newItemText.trim()}
          className="min-h-14 px-6 rounded-xl text-xl font-semibold bg-gray-950 dark:bg-white text-white dark:text-gray-950 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  )
}
