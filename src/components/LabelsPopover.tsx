import { useState, useMemo } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { X, Search, Pencil, Plus, Check, Eye } from 'lucide-react'

export type Label = {
  id: string
  name: string
  color: string
}

const DEFAULT_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
]

export const INITIAL_LABELS: Label[] = [
  { id: '1', name: 'Bug', color: '#ef4444' },
  { id: '2', name: 'Feature', color: '#3b82f6' },
  { id: '3', name: 'Improvement', color: '#8b5cf6' },
  { id: '4', name: 'Design', color: '#ec4899' },
  { id: '5', name: 'Urgent', color: '#f97316' },
]

type Props = {
  children: React.ReactNode
  selected: string[]
  onChange: (ids: string[]) => void
  labels?: Label[]
  onLabelsChange?: (labels: Label[]) => void
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <input
        autoFocus
        className="w-full bg-muted text-sm text-foreground placeholder-muted-foreground rounded-lg pl-8 pr-3 py-2 outline-none focus:ring-1 focus:ring-border transition-all"
        placeholder="Search labels…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

type LabelItemProps = {
  label: Label
  checked: boolean
  editing: boolean
  colorblind: boolean
  onToggle: () => void
  onEditStart: () => void
  onEditEnd: (name: string, color: string) => void
}

function LabelItem({ label, checked, editing, colorblind, onToggle, onEditStart, onEditEnd }: LabelItemProps) {
  const [editName, setEditName] = useState(label.name)
  const [editColor, setEditColor] = useState(label.color)

  if (editing) {
    return (
      <div className="rounded-lg bg-muted p-2.5 space-y-2">
        <input
          autoFocus
          className="w-full bg-background text-sm text-foreground rounded-md px-2.5 py-1.5 outline-none border border-border focus:ring-1 focus:ring-ring"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEditEnd(editName, editColor)
            if (e.key === 'Escape') onEditEnd(label.name, label.color)
          }}
        />
        <div className="flex gap-1.5 flex-wrap">
          {DEFAULT_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setEditColor(c)}
              className="h-5 w-5 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
              style={{ backgroundColor: c }}
            >
              {editColor === c && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-0.5">
          <button
            onClick={() => onEditEnd(label.name, label.color)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onEditEnd(editName, editColor)}
            className="text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md px-2.5 py-1 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-2.5 px-1 py-1.5 rounded-lg hover:bg-muted cursor-pointer group transition-colors"
      onClick={onToggle}
    >
      {/* Checkbox */}
      <div className={`h-4 w-4 flex-shrink-0 rounded border flex items-center justify-center transition-colors ${
        checked ? 'bg-primary border-primary' : 'border-border bg-transparent'
      }`}>
        {checked && <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />}
      </div>

      {/* Label pill */}
      <span
        className="flex-1 text-xs font-semibold rounded-full px-2.5 py-0.5 truncate"
        style={
          colorblind
            ? { backgroundColor: 'transparent', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))' }
            : { backgroundColor: label.color + '33', color: label.color }
        }
      >
        {colorblind && <span className="mr-1">◆</span>}
        {label.name}
      </span>

      {/* Edit icon */}
      <button
        onClick={(e) => { e.stopPropagation(); onEditStart() }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  )
}

export function LabelsPopover({ children, selected, onChange, labels: labelsProp, onLabelsChange }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [labels, setLabels] = useState<Label[]>(labelsProp ?? INITIAL_LABELS)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showMore, setShowMore] = useState(false)
  const [colorblind, setColorblind] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0])

  const filtered = useMemo(
    () => labels.filter((l) => l.name.toLowerCase().includes(query.toLowerCase())),
    [labels, query]
  )

  const visible = showMore ? filtered : filtered.slice(0, 5)

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
  }

  function editEnd(id: string, name: string, color: string) {
    const updated = labels.map((l) => l.id === id ? { ...l, name, color } : l)
    setLabels(updated)
    onLabelsChange?.(updated)
    setEditingId(null)
  }

  function createLabel() {
    if (!newName.trim()) return
    const label: Label = { id: Date.now().toString(), name: newName.trim(), color: newColor }
    const updated = [...labels, label]
    setLabels(updated)
    onLabelsChange?.(updated)
    onChange([...selected, label.id])
    setNewName('')
    setNewColor(DEFAULT_COLORS[0])
    setCreating(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-[300px] p-0 bg-background border-border rounded-xl shadow-2xl"
        align="start"
        sideOffset={6}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <span className="text-sm font-semibold text-foreground">Labels</span>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="px-3 pb-2">
          <SearchInput value={query} onChange={setQuery} />
        </div>

        {/* Section label */}
        <div className="px-4 pt-2 pb-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Labels</span>
        </div>

        {/* Labels list */}
        <div className="px-2 space-y-0.5 max-h-56 overflow-y-auto">
          {visible.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No labels found.</p>
          ) : (
            visible.map((label) => (
              <LabelItem
                key={label.id}
                label={label}
                checked={selected.includes(label.id)}
                editing={editingId === label.id}
                colorblind={colorblind}
                onToggle={() => toggle(label.id)}
                onEditStart={() => setEditingId(label.id)}
                onEditEnd={(name, color) => editEnd(label.id, name, color)}
              />
            ))
          )}
          {filtered.length > 5 && (
            <button
              onClick={() => setShowMore((v) => !v)}
              className="w-full text-xs text-muted-foreground hover:text-foreground py-1.5 transition-colors"
            >
              {showMore ? 'Show less' : `Show ${filtered.length - 5} more`}
            </button>
          )}
        </div>

        {/* Create new label */}
        <div className="px-3 pt-3 pb-2">
          {creating ? (
            <div className="space-y-2 bg-muted rounded-lg p-2.5">
              <input
                autoFocus
                className="w-full bg-background text-sm text-foreground rounded-md px-2.5 py-1.5 outline-none border border-border focus:ring-1 focus:ring-ring placeholder-muted-foreground"
                placeholder="Label name…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createLabel()
                  if (e.key === 'Escape') setCreating(false)
                }}
              />
              <div className="flex gap-1.5 flex-wrap">
                {DEFAULT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="h-5 w-5 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                    style={{ backgroundColor: c }}
                  >
                    {newColor === c && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-0.5">
                <button onClick={() => setCreating(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button
                  onClick={createLabel}
                  disabled={!newName.trim()}
                  className="text-xs bg-secondary hover:bg-secondary/80 disabled:opacity-40 text-secondary-foreground rounded-md px-2.5 py-1 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg px-3 py-2 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Create new label
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Colorblind mode</span>
          <button
            onClick={() => setColorblind((v) => !v)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              colorblind ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
              colorblind ? 'translate-x-4.5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
