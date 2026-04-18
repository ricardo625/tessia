import { useRef, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Clock, AlertCircle, TrendingUp, Layers, DollarSign, ArrowRight, AlertTriangle, MessageSquare, Paperclip, CreditCard, Bell, LogOut, ArrowDownUp } from 'lucide-react'
import { TaskModal, type TaskDetail } from '@/components/TaskModal'
import { INITIAL_LABELS, type Label } from '@/components/LabelsPopover'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { NotificationsPanel } from '@/components/NotificationsPanel'
import './App.css'

type Column = { id: string; title: string }
type BoardView = 'pipeline' | 'process'

const STORAGE_KEY = 'board-view'

// ── Pipeline view ──────────────────────────────────────────────────────────

const pipelineColumnsInit: Column[] = [
  { id: 'new-lead', title: 'New Lead' },
  { id: 'qualified', title: 'Qualified' },
  { id: 'contacted', title: 'Contacted' },
  { id: 'proposal', title: 'Proposal' },
  { id: 'closed-won', title: 'Closed Won' },
]

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 60 * 60 * 1000)
}

function daysAgoISO(d: number) {
  return new Date(Date.now() - d * 86400000).toISOString()
}

const initialPipelineCards: TaskDetail[] = [
  {
    id: 'p1', person: 'James Holloway', column: 'new-lead',
    description: 'Personal injury — rear-end collision on I-95',
    dealValue: '$18,000 est. retainer', nextAction: 'Schedule intake consultation',
    activity: [{ id: 'a1', user: 'Alice Johnson', initials: 'AJ', action: 'added inquiry', timestamp: '3 hours ago' }],
    updatedAt: hoursAgo(3), updatedBy: 'Alice Johnson', columnEnteredAt: daysAgoISO(2),
  },
  {
    id: 'p2', person: 'Elena Vasquez', column: 'qualified',
    description: 'Estate planning — trust & will revision',
    dealValue: '$6,500 flat fee', nextAction: 'Send engagement letter',
    activity: [
      { id: 'a2', user: 'Marcus Lee', initials: 'ML', action: 'qualified prospect', timestamp: '1.5 hours ago' },
      { id: 'a2t', user: 'Marcus Lee', initials: 'ML', color: '#6366f1', action: '@RA can you review the engagement letter before we send?', timestamp: '45 min ago', type: 'comment', tagged: true },
    ],
    updatedAt: hoursAgo(1.5), updatedBy: 'Marcus Lee', columnEnteredAt: daysAgoISO(5),
  },
  {
    id: 'p3', person: 'Robert Ng', column: 'contacted',
    description: 'Business formation — LLC setup & operating agreement',
    dealValue: '$3,800 flat fee', nextAction: 'Follow up on scope questions',
    activity: [{ id: 'a3', user: 'Sara Patel', initials: 'SP', action: 'sent intro email', timestamp: '30 min ago' }],
    updatedAt: hoursAgo(0.5), updatedBy: 'Sara Patel', columnEnteredAt: daysAgoISO(9),
  },
  {
    id: 'p4', person: 'Diana Osei', column: 'proposal',
    description: 'Employment dispute — wrongful termination claim',
    dealValue: '$40,000 contingency', nextAction: 'Await signed retainer',
    activity: [
      { id: 'a4', user: 'Carlos Rivera', initials: 'CR', action: 'sent retainer proposal', timestamp: '15 min ago' },
      { id: 'a4t', user: 'Carlos Rivera', initials: 'CR', color: '#f59e0b', action: '@RA the client has questions about the contingency split — can you jump on a call?', timestamp: '10 min ago', type: 'comment', tagged: true },
    ],
    updatedAt: hoursAgo(0.25), updatedBy: 'Carlos Rivera', columnEnteredAt: daysAgoISO(16),
  },
  {
    id: 'p5', person: 'Marcus Webb', column: 'closed-won',
    description: 'Real estate closing — commercial property acquisition',
    dealValue: '$12,000 retainer', nextAction: 'Begin title search',
    activity: [{ id: 'a5', user: 'Nina Okafor', initials: 'NO', action: 'client signed retainer', timestamp: '5 min ago' }],
    updatedAt: hoursAgo(0.08), updatedBy: 'Nina Okafor', columnEnteredAt: daysAgoISO(1),
  },
]

// ── Process view ───────────────────────────────────────────────────────────

const processColumnsInit: Column[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'blocked', title: 'Blocked' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' },
]

const initialProcessCards: TaskDetail[] = [
  {
    id: 'q1', person: 'Elena Vasquez', column: 'backlog',
    description: 'Draft revocable living trust — estate planning matter',
    activity: [{ id: 'b1', user: 'Alice Johnson', initials: 'AJ', action: 'opened matter', timestamp: '2 hours ago' }],
    updatedAt: hoursAgo(2), updatedBy: 'Alice Johnson', columnEnteredAt: daysAgoISO(3),
  },
  {
    id: 'q2', person: 'James Holloway', column: 'in-progress',
    description: 'Compile medical records and police report for PI claim',
    activity: [{ id: 'b2', user: 'Marcus Lee', initials: 'ML', action: 'assigned to intake', timestamp: '1 hour ago' }],
    updatedAt: hoursAgo(1), updatedBy: 'Marcus Lee', columnEnteredAt: daysAgoISO(7),
  },
  {
    id: 'q3', person: 'Diana Osei', column: 'blocked',
    description: 'File EEOC complaint — wrongful termination',
    blockers: 'Awaiting employment records from former employer',
    activity: [
      { id: 'b3', user: 'Sara Patel', initials: 'SP', action: 'flagged blocker', timestamp: '45 min ago' },
      { id: 'b3t', user: 'Sara Patel', initials: 'SP', color: '#10b981', action: '@RA this is now 18 days in blocked — should we escalate to the partner?', timestamp: '20 min ago', type: 'comment', tagged: true },
    ],
    updatedAt: hoursAgo(0.75), updatedBy: 'Sara Patel', columnEnteredAt: daysAgoISO(18),
  },
  {
    id: 'q4', person: 'Robert Ng', column: 'review',
    description: 'Operating agreement draft — LLC formation review',
    activity: [{ id: 'b4', user: 'Carlos Rivera', initials: 'CR', action: 'submitted for partner review', timestamp: '20 min ago' }],
    updatedAt: hoursAgo(0.33), updatedBy: 'Carlos Rivera', columnEnteredAt: daysAgoISO(4),
  },
  {
    id: 'q5', person: 'Marcus Webb', column: 'done',
    description: 'Title search completed — commercial closing cleared',
    activity: [{ id: 'b5', user: 'Nina Okafor', initials: 'NO', action: 'closed matter step', timestamp: '5 min ago' }],
    updatedAt: hoursAgo(0.08), updatedBy: 'Nina Okafor', columnEnteredAt: daysAgoISO(1),
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function formatUpdatedAt(date: Date) {
  const now = Date.now()
  const diff = now - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return (
    date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' at ' +
    date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  )
}

function daysInColumn(enteredAt?: string): number {
  if (!enteredAt) return 0
  const diff = Date.now() - new Date(enteredAt).getTime()
  return Math.floor(diff / 86400000)
}

function checklistDueStatus(dateStr?: string): 'overdue' | 'today' | null {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr + 'T00:00:00')
  if (due < today) return 'overdue'
  if (due.getTime() === today.getTime()) return 'today'
  return null
}

// ── Component ──────────────────────────────────────────────────────────────

function App() {
  const [boardView, setBoardView] = useState<BoardView>(
    () => (localStorage.getItem(STORAGE_KEY) as BoardView | null) ?? 'process'
  )
  const [isTransitioning, setIsTransitioning] = useState(false)

  const [pipelineColumns, setPipelineColumns] = useState<Column[]>(pipelineColumnsInit)
  const [pipelineCards, setPipelineCards] = useState<TaskDetail[]>(initialPipelineCards)
  const [processColumns, setProcessColumns] = useState<Column[]>(processColumnsInit)
  const [processCards, setProcessCards] = useState<TaskDetail[]>(initialProcessCards)

  const columns = boardView === 'pipeline' ? pipelineColumns : processColumns
  const cards = boardView === 'pipeline' ? pipelineCards : processCards
  const setColumns = boardView === 'pipeline' ? setPipelineColumns : setProcessColumns
  const setCards = boardView === 'pipeline' ? setPipelineCards : setProcessCards

  const [dragOverCol, setDragOverCol] = useState<string | null>(null)
  const [colDropTarget, setColDropTarget] = useState<{ id: string; side: 'left' | 'right' } | null>(null)
  const [hoveredCol, setHoveredCol] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [editingColId, setEditingColId] = useState<string | null>(null)
  const [editingColName, setEditingColName] = useState('')
  const [selectedTask, setSelectedTask] = useState<TaskDetail | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set())
  const [sortedCols, setSortedCols] = useState<Set<string>>(new Set())

  function toggleColSort(colId: string) {
    setSortedCols((prev) => {
      const next = new Set(prev)
      next.has(colId) ? next.delete(colId) : next.add(colId)
      return next
    })
  }
  const [allLabels, setAllLabels] = useState<Label[]>(INITIAL_LABELS)
  const editInputRef = useRef<HTMLInputElement>(null)
  const dragging = useRef<{ type: 'card' | 'column'; id: string } | null>(null)

  useEffect(() => {
    if (editingColId) editInputRef.current?.select()
  }, [editingColId])

  function switchView(view: BoardView) {
    if (view === boardView || isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      setBoardView(view)
      localStorage.setItem(STORAGE_KEY, view)
      setIsTransitioning(false)
    }, 150)
  }

  function startEditColumn(col: Column) {
    setEditingColId(col.id)
    setEditingColName(col.title)
  }

  function commitEditColumn() {
    const title = editingColName.trim()
    if (title) setColumns((prev) => prev.map((c) => (c.id === editingColId ? { ...c, title } : c)))
    setEditingColId(null)
  }

  function onCardDragStart(e: React.DragEvent, id: string) {
    dragging.current = { type: 'card', id }
    e.stopPropagation()
  }

  function onColumnDragStart(_e: React.DragEvent, id: string) {
    dragging.current = { type: 'column', id }
  }

  function onColumnDragOver(e: React.DragEvent, colId: string) {
    e.preventDefault()
    if (dragging.current?.type === 'card') {
      setDragOverCol(colId)
      return
    }
    if (dragging.current?.type === 'column' && dragging.current.id !== colId) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const side = e.clientX < rect.left + rect.width / 2 ? 'left' : 'right'
      setColDropTarget({ id: colId, side })
    }
  }

  function onColumnDrop(_e: React.DragEvent, colId: string) {
    const current = dragging.current
    dragging.current = null
    setDragOverCol(null)
    setColDropTarget(null)

    if (current?.type === 'card') {
      setCards((prev) => prev.map((c) => (c.id === current.id ? { ...c, column: colId, columnEnteredAt: new Date().toISOString() } : c)))
    } else if (current?.type === 'column' && colDropTarget) {
      const fromId = current.id
      setColumns((prev) => {
        const from = prev.findIndex((c) => c.id === fromId)
        let to = prev.findIndex((c) => c.id === colDropTarget.id)
        if (from === -1 || to === -1) return prev
        const next = [...prev]
        const [moved] = next.splice(from, 1)
        to = next.findIndex((c) => c.id === colDropTarget.id)
        const insertAt = colDropTarget.side === 'right' ? to + 1 : to
        next.splice(insertAt, 0, moved)
        return next
      })
    }
  }

  function addCard(columnId: string) {
    const newCard: TaskDetail = {
      id: Date.now().toString(),
      person: 'New Client',
      column: columnId,
      description: '',
      activity: [],
      updatedAt: new Date(),
      updatedBy: 'You',
      columnEnteredAt: new Date().toISOString(),
    }
    setCards((prev) => [...prev, newCard])
  }

  function addColumn() {
    const title = newColumnName.trim()
    if (!title) return
    const id = title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    setColumns((prev) => [...prev, { id, title }])
    setNewColumnName('')
    setDialogOpen(false)
  }

  function updateTask(updated: TaskDetail) {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    if (selectedTask?.id === updated.id) setSelectedTask(updated)
  }

  const selectedColumnTitle = columns.find((c) => c.id === selectedTask?.column)?.title ?? ''

  return (
    <div className="min-h-screen bg-background p-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold text-foreground">Project Board</h1>
        <div className="flex items-center gap-3">
          {/* Segmented toggle */}
          <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => switchView('pipeline')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                boardView === 'pipeline'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Lead Pipeline
            </button>
            <button
              onClick={() => switchView('process')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                boardView === 'process'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Process Status
            </button>
          </div>

          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Column
          </Button>

          <Popover>
            <PopoverTrigger className="outline-none">
              <div className="relative">
                <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    RA
                  </AvatarFallback>
                </Avatar>
                {[...pipelineCards, ...processCards].some((c) =>
                  c.activity.some((a) => (a.tagged || a.action.includes('@RA')) && !readNotificationIds.has(a.id))
                ) && (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="end" className="w-48 p-1">
              <div className="px-2 py-1.5">
                <p className="text-xs font-medium">Ricardo Amarilla</p>
                <p className="text-[11px] text-muted-foreground">ricardo@foundey.com</p>
              </div>
              <Separator className="my-1" />
              <button
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors text-left"
                onClick={() => setNotificationsOpen(true)}
              >
                <Bell className="h-4 w-4 text-muted-foreground" />
                Notifications
              </button>
              <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors text-left">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Billing
              </button>
              <Separator className="my-1" />
              <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted text-destructive transition-colors text-left">
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Mode label */}
      <p className="text-xs text-muted-foreground mb-6">
        Viewing: {boardView === 'pipeline' ? 'Lead Conversion Pipeline' : 'Process Status Tracking'}
      </p>

      {/* ── Board ── */}
      <div
        className={`flex gap-4 overflow-x-auto pb-4 transition-opacity duration-150 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {columns.map((col) => (
          <div
            key={col.id}
            onDragOver={(e) => onColumnDragOver(e, col.id)}
            onDragLeave={() => { setDragOverCol(null); setColDropTarget(null) }}
            onDrop={(e) => onColumnDrop(e, col.id)}
            onMouseEnter={() => setHoveredCol(col.id)}
            onMouseLeave={() => setHoveredCol(null)}
            className={`relative flex-shrink-0 w-72 min-w-72 transition-opacity ${
              dragging.current?.type === 'column' && dragging.current.id === col.id
                ? 'opacity-40'
                : 'opacity-100'
            }${
              colDropTarget?.id === col.id && colDropTarget.side === 'left'
                ? ' before:absolute before:-left-3 before:top-0 before:h-full before:w-0.5 before:rounded-full before:bg-primary before:content-[""]'
                : ''
            }${
              colDropTarget?.id === col.id && colDropTarget.side === 'right'
                ? ' after:absolute after:-right-3 after:top-0 after:h-full after:w-0.5 after:rounded-full after:bg-primary after:content-[""]'
                : ''
            }`}
          >
            <div
              draggable
              onDragStart={(e) => onColumnDragStart(e, col.id)}
              className="mb-3 flex items-center gap-1 cursor-grab active:cursor-grabbing"
            >
              {editingColId === col.id ? (
                <input
                  ref={editInputRef}
                  className="w-full text-sm font-medium text-muted-foreground uppercase tracking-wide bg-transparent border-b border-border outline-none"
                  value={editingColName}
                  onChange={(e) => setEditingColName(e.target.value)}
                  onBlur={commitEditColumn}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEditColumn()
                    if (e.key === 'Escape') setEditingColId(null)
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="text-sm font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                  onClick={() => startEditColumn(col)}
                >
                  {col.title}
                </span>
              )}
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); toggleColSort(col.id) }}
                className={`ml-auto flex-shrink-0 rounded p-0.5 transition-colors ${
                  sortedCols.has(col.id)
                    ? 'text-primary'
                    : 'text-muted-foreground/40 hover:text-muted-foreground'
                }`}
                title={sortedCols.has(col.id) ? 'Remove sort' : 'Sort by latest edit'}
              >
                <ArrowDownUp className="h-3 w-3" />
              </button>
            </div>

            <div className={`min-h-24 rounded-lg transition-colors ${dragOverCol === col.id ? 'bg-muted' : ''}`}>
              {(sortedCols.has(col.id)
                ? [...cards.filter((c) => c.column === col.id)].sort(
                    (a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0)
                  )
                : cards.filter((c) => c.column === col.id)
              ).map((c) => (
                  <Card
                    key={c.id}
                    draggable
                    onDragStart={(e) => onCardDragStart(e, c.id)}
                    onClick={() => setSelectedTask(c)}
                    className="relative mb-2 cursor-pointer hover:shadow-md hover:border-border/80 active:opacity-50 select-none transition-shadow"
                  >
                    {/* Due status badge */}
                    {(() => {
                      const due = checklistDueStatus(c.checklistDueDate)
                      if (!due) return null
                      return due === 'overdue' ? (
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-destructive/10 border border-destructive/30 rounded-full px-2 py-0.5">
                          <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0" />
                          <span className="text-[10px] font-medium text-destructive">Overdue</span>
                        </div>
                      ) : (
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5">
                          <Clock className="h-3 w-3 text-amber-500 flex-shrink-0" />
                          <span className="text-[10px] font-medium text-amber-500">Due today</span>
                        </div>
                      )
                    })()}

                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm font-medium">{c.person}</CardTitle>
                    </CardHeader>

                    <CardContent className="px-4 pb-4">
                      {/* Labels */}
                      {c.labels && c.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {c.labels.map((lid) => {
                            const label = allLabels.find((l) => l.id === lid)
                            if (!label) return null
                            return (
                              <span
                                key={lid}
                                className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                                style={{ backgroundColor: label.color + '33', color: label.color }}
                              >
                                {label.name}
                              </span>
                            )
                          })}
                        </div>
                      )}

                      {/* View-specific fields */}
                      {boardView === 'pipeline' ? (
                        <>
                          {c.dealValue && (
                            <div className="flex items-center gap-1 mb-1.5">
                              <DollarSign className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                {c.dealValue}
                              </span>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {c.description || 'No description'}
                          </p>
                          {c.nextAction && (
                            <div className="flex items-center gap-1 mt-2">
                              <ArrowRight className="h-3 w-3 text-blue-500 flex-shrink-0" />
                              <span className="text-[10px] font-medium text-blue-500">{c.nextAction}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {c.blockers && (
                            <div className="flex items-start gap-1 mb-2 bg-destructive/5 border border-destructive/15 rounded-md px-2 py-1">
                              <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0 mt-0.5" />
                              <span className="text-[10px] text-destructive leading-tight">{c.blockers}</span>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {c.description || 'No description'}
                          </p>
                        </>
                      )}

                      {/* Activity signals + days in column */}
                      {(() => {
                        const commentCount = c.activity.filter((a) => a.type === 'comment').length
                        const attachmentCount = c.attachments?.length ?? 0
                        const days = daysInColumn(c.columnEnteredAt)
                        return (
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`flex items-center gap-1 text-[10px] ${commentCount === 0 ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>
                              <MessageSquare className="h-3 w-3" />
                              {commentCount}
                            </span>
                            <span className={`flex items-center gap-1 text-[10px] ${attachmentCount === 0 ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>
                              <Paperclip className="h-3 w-3" />
                              {attachmentCount}
                            </span>
                            {days > 0 && (
                              <span className={`flex items-center gap-1 text-[10px] ml-auto ${days >= 14 ? 'text-destructive' : days >= 7 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                                <Clock className="h-3 w-3" />
                                {days}d
                              </span>
                            )}
                          </div>
                        )
                      })()}

                      {/* Footer */}
                      {c.updatedAt && (
                        <p className="text-[10px] text-muted-foreground/60 mt-2">
                          Updated {formatUpdatedAt(c.updatedAt)}
                          {c.updatedBy ? ` by ${c.updatedBy}` : ''}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>

            <div className={`mt-2 transition-opacity ${hoveredCol === col.id ? 'opacity-100' : 'opacity-0'}`}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => addCard(col.id)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add client
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add column dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>New Column</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Column name"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addColumn()}
            autoFocus
          />
          <DialogFooter>
            <Button onClick={addColumn} disabled={!newColumnName.trim()}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notifications panel */}
      <NotificationsPanel
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        allCards={[...pipelineCards, ...processCards]}
        readIds={readNotificationIds}
        onMarkRead={(id) => setReadNotificationIds((prev) => new Set(prev).add(id))}
        onMarkAllRead={() => {
          const allTagged = [...pipelineCards, ...processCards]
            .flatMap((c) => c.activity)
            .filter((a) => a.tagged || a.action.includes('@RA'))
            .map((a) => a.id)
          setReadNotificationIds(new Set(allTagged))
        }}
        onSelectTask={(task) => { setSelectedTask(task); setNotificationsOpen(false) }}
      />

      {/* Task detail modal */}
      <TaskModal
        task={selectedTask}
        columnTitle={selectedColumnTitle}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={updateTask}
        labels={allLabels}
        onLabelsChange={setAllLabels}
      />
    </div>
  )
}

export default App
