import { useState, useMemo } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { X, Search, Check } from 'lucide-react'

export type Member = {
  id: string
  name: string
  initials: string
  color: string
}

export const BOARD_MEMBERS: Member[] = [
  { id: 'm1', name: 'Alice Johnson', initials: 'AJ', color: '#3b82f6' },
  { id: 'm2', name: 'Marcus Lee', initials: 'ML', color: '#22c55e' },
  { id: 'm3', name: 'Sara Patel', initials: 'SP', color: '#8b5cf6' },
  { id: 'm4', name: 'Carlos Rivera', initials: 'CR', color: '#f59e0b' },
  { id: 'm5', name: 'Nina Okafor', initials: 'NO', color: '#ec4899' },
]

type Props = {
  children: React.ReactNode
  selected: string | null
  onChange: (memberId: string | null) => void
  members?: Member[]
}

export function MembersPopover({ children, selected, onChange, members = BOARD_MEMBERS }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () => members.filter((m) => m.name.toLowerCase().includes(query.toLowerCase())),
    [members, query]
  )

  function toggle(id: string) {
    onChange(selected === id ? null : id)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-0 bg-background border-border rounded-xl shadow-2xl"
        align="start"
        sideOffset={6}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <span className="text-sm font-semibold text-foreground">Members</span>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              autoFocus
              className="w-full bg-muted text-sm text-foreground placeholder-muted-foreground rounded-lg pl-8 pr-3 py-2 outline-none focus:ring-1 focus:ring-border transition-all"
              placeholder="Search members…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Section label */}
        <div className="px-4 pt-2 pb-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Board Members
          </span>
        </div>

        {/* Members list */}
        <div className="px-2 pb-3 space-y-0.5 max-h-56 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No members found.</p>
          ) : (
            filtered.map((member) => {
              const isSelected = selected === member.id
              return (
                <div
                  key={member.id}
                  onClick={() => toggle(member.id)}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                >
                  {/* Avatar */}
                  <div
                    className="h-7 w-7 flex-shrink-0 rounded-full flex items-center justify-center text-[11px] font-semibold text-white"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.initials}
                  </div>

                  {/* Name */}
                  <span className="flex-1 text-sm text-foreground">{member.name}</span>

                  {/* Check */}
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" strokeWidth={3} />
                  )}
                </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
