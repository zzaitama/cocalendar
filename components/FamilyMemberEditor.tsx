"use client"

import { useState } from "react"
import { useFamily } from "@/context/FamilyContext"
import { useAvatar } from "@/context/AvatarContext"
import { AVATARS } from "@/lib/avatars"
import type { User } from "@/types"

// Google Calendar color options with their colorIds
const GCAL_COLORS = [
  { colorId: "1",  color: "#7986CB", label: "Lavender"  },
  { colorId: "2",  color: "#33B679", label: "Sage"      },
  { colorId: "3",  color: "#8E24AA", label: "Grape"     },
  { colorId: "4",  color: "#E67C73", label: "Flamingo"  },
  { colorId: "5",  color: "#F6BF26", label: "Banana"    },
  { colorId: "6",  color: "#F4511E", label: "Tangerine" },
  { colorId: "7",  color: "#039BE5", label: "Peacock"   },
  { colorId: "8",  color: "#616161", label: "Graphite"  },
  { colorId: "9",  color: "#3F51B5", label: "Blueberry" },
  { colorId: "10", color: "#0B8043", label: "Basil"     },
  { colorId: "11", color: "#D50000", label: "Tomato"    },
]

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

interface MemberRowProps {
  member: User
  onEdit: () => void
  onRemove: () => void
  avatar: string
}

function MemberRow({ member, onEdit, onRemove, avatar }: MemberRowProps) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-2xl bg-stone-50 dark:bg-gray-800">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 border-2 font-bold"
        style={{ borderColor: member.color, backgroundColor: member.color + "22", color: member.color }}
      >
        {avatar || member.name[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 dark:text-white truncate">{member.name}</p>
        <p className="text-xs text-stone-400 font-semibold">
          {GCAL_COLORS.find(c => c.colorId === member.gcalColorId)?.label ?? "Custom"}
        </p>
      </div>
      <button
        onClick={onEdit}
        className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-gray-700 text-stone-600 dark:text-gray-300 text-sm font-bold hover:bg-stone-200 dark:hover:bg-gray-600 transition-colors"
      >
        Edit
      </button>
      <button
        onClick={onRemove}
        className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-400 flex items-center justify-center text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-bold"
        aria-label="Remove"
      >
        ✕
      </button>
    </div>
  )
}

interface EditSheetProps {
  member: User
  avatarId: string
  onSave: (updated: User, avatarId: string) => void
  onCancel: () => void
  isNew: boolean
}

function EditSheet({ member, avatarId, onSave, onCancel, isNew }: EditSheetProps) {
  const [name, setName] = useState(member.name)
  const [gcalColorId, setGcalColorId] = useState(member.gcalColorId)
  const [selectedAvatarId, setSelectedAvatarId] = useState(avatarId)

  const selectedColor = GCAL_COLORS.find(c => c.colorId === gcalColorId)?.color ?? member.color

  function handleSave() {
    if (!name.trim()) return
    const color = GCAL_COLORS.find(c => c.colorId === gcalColorId)?.color ?? member.color
    onSave({ ...member, name: name.trim(), color, gcalColorId }, selectedAvatarId)
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[70] p-4"
      onClick={onCancel}
    >
      <div
        className="w-full sm:max-w-md bg-[#FAF9F7] dark:bg-gray-900 rounded-3xl p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-xl font-extrabold text-gray-900 dark:text-white">
            {isNew ? "Add member" : "Edit member"}
          </p>
          <button
            onClick={onCancel}
            className="w-9 h-9 rounded-full bg-stone-100 dark:bg-gray-800 text-stone-500 flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {/* Preview */}
        <div className="flex justify-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-4 font-bold"
            style={{ borderColor: selectedColor, backgroundColor: selectedColor + "22", color: selectedColor }}
          >
            {AVATARS.find(a => a.id === selectedAvatarId)?.emoji || name[0]?.toUpperCase() || "?"}
          </div>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-widest text-stone-400 font-bold">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Family member name"
            maxLength={40}
            className="w-full px-4 py-3 rounded-2xl bg-stone-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-lg outline-none focus:ring-2 focus:ring-stone-300 dark:focus:ring-gray-600"
          />
        </div>

        {/* Calendar color */}
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-widest text-stone-400 font-bold">Calendar Color</label>
          <div className="grid grid-cols-11 gap-1.5">
            {GCAL_COLORS.map(c => (
              <button
                key={c.colorId}
                onClick={() => setGcalColorId(c.colorId)}
                title={c.label}
                className="w-full aspect-square rounded-full transition-all"
                style={{
                  backgroundColor: c.color,
                  outline: gcalColorId === c.colorId ? `3px solid ${c.color}` : "none",
                  outlineOffset: "2px",
                  transform: gcalColorId === c.colorId ? "scale(1.2)" : "scale(1)",
                }}
              />
            ))}
          </div>
          <p className="text-xs text-stone-400 font-semibold text-center">
            {GCAL_COLORS.find(c => c.colorId === gcalColorId)?.label ?? "Custom"} · matches your Google Calendar event color
          </p>
        </div>

        {/* Avatar */}
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-widest text-stone-400 font-bold">Avatar</label>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map(avatar => (
              <button
                key={avatar.id}
                onClick={() => setSelectedAvatarId(avatar.id)}
                title={avatar.label}
                className={`w-full aspect-square rounded-2xl text-2xl flex items-center justify-center transition-all ${
                  selectedAvatarId === avatar.id
                    ? "scale-110"
                    : "bg-stone-100 dark:bg-gray-800 hover:bg-stone-200 dark:hover:bg-gray-700"
                }`}
                style={selectedAvatarId === avatar.id
                  ? { backgroundColor: selectedColor + "22", outline: `2px solid ${selectedColor}` }
                  : {}}
              >
                {avatar.emoji}
              </button>
            ))}
          </div>
          {selectedAvatarId && (
            <button
              onClick={() => setSelectedAvatarId("")}
              className="text-xs text-stone-400 hover:text-stone-600 font-semibold text-center"
            >
              Clear avatar
            </button>
          )}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-extrabold text-lg disabled:opacity-40 transition-opacity"
        >
          {isNew ? "Add member" : "Save changes"}
        </button>
      </div>
    </div>
  )
}

export function FamilyMemberEditor() {
  const { members, save } = useFamily()
  const { avatars, setAvatar } = useAvatar()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isNew, setIsNew] = useState(false)

  const editingMember = isNew
    ? { id: generateId(), name: "", color: "#33B679", gcalColorId: "2" }
    : members.find(m => m.id === editingId) ?? null

  async function handleSave(updated: User, newAvatarId: string) {
    const next = isNew
      ? [...members, updated]
      : members.map(m => m.id === updated.id ? updated : m)

    await save(next)
    if (newAvatarId !== (avatars[updated.id] ?? "")) {
      await setAvatar(updated.id, newAvatarId)
    }
    setEditingId(null)
    setIsNew(false)
  }

  async function handleRemove(id: string) {
    const next = members.filter(m => m.id !== id)
    await save(next)
  }

  function startNew() {
    setIsNew(true)
    setEditingId(null)
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest text-stone-400 font-bold">Family Members</p>
        <button
          onClick={startNew}
          className="px-3 py-1.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold hover:opacity-90 transition-opacity"
        >
          + Add
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {members.map(member => (
          <MemberRow
            key={member.id}
            member={member}
            avatar={AVATARS.find(a => a.id === avatars[member.id])?.emoji ?? ""}
            onEdit={() => { setEditingId(member.id); setIsNew(false) }}
            onRemove={() => handleRemove(member.id)}
          />
        ))}
      </div>

      {(editingId || isNew) && editingMember && (
        <EditSheet
          member={editingMember}
          avatarId={isNew ? "" : (avatars[editingId!] ?? "")}
          onSave={handleSave}
          onCancel={() => { setEditingId(null); setIsNew(false) }}
          isNew={isNew}
        />
      )}
    </section>
  )
}
