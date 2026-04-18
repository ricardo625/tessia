import { useState, useRef, useEffect } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  Maximize2,
  MoreHorizontal,
  X,
  Plus,
  Tag,
  Calendar,
  CheckSquare,
  ChevronDown,
  Users,
  Check,
  Pencil,
  Paperclip,
  FileText,
  Image,
  File,
  Trash2,
} from 'lucide-react'
import { LabelsPopover, type Label } from '@/components/LabelsPopover'
import { MembersPopover, BOARD_MEMBERS } from '@/components/MembersPopover'

export type ActivityItem = {
  id: string
  user: string
  initials: string
  action: string
  timestamp: string
  type?: 'comment' | 'event'
  color?: string
}

export type ChecklistItem = {
  id: string
  text: string
  done: boolean
}

export type TaskDetail = {
  id: string
  person: string
  column: string
  description: string
  activity: ActivityItem[]
  labels?: string[]
  memberId?: string
  updatedAt?: Date
  updatedBy?: string
  checklist?: ChecklistItem[]
  checklistName?: string
  checklistDueDate?: string
  attachments?: Attachment[]
  columnEnteredAt?: string
  // Pipeline view fields
  dealValue?: string
  nextAction?: string
  // Process view fields
  blockers?: string
}

export type Attachment = {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: string
  uploadedBy: string
}

type Props = {
  task: TaskDetail | null
  columnTitle: string
  open: boolean
  onClose: () => void
  onUpdate: (updated: TaskDetail) => void
  labels: Label[]
  onLabelsChange: (labels: Label[]) => void
}

function timeAgo(ts: string) {
  return ts
}

function renderMentions(text: string) {
  const parts = text.split(/(@[\w\s]+?)(?=\s|$|[^a-zA-Z\s])/g)
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="text-primary font-semibold">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

type ActivityEntryProps = {
  item: ActivityItem
  canEdit: boolean
  isEditing: boolean
  editText: string
  onEditStart: () => void
  onEditChange: (v: string) => void
  onEditSave: () => void
  onEditCancel: () => void
  onDelete: () => void
}

function ActivityEntry({ item, canEdit, isEditing, editText, onEditStart, onEditChange, onEditSave, onEditCancel, onDelete }: ActivityEntryProps) {
  return (
    <div className="flex gap-3 py-3">
      <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
        <AvatarFallback
          className="text-[11px] font-semibold"
          style={item.color ? { backgroundColor: item.color, color: '#fff' } : undefined}
        >
          {item.initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-sm font-medium text-foreground">{item.user}</span>
          <span className="text-xs text-muted-foreground">{timeAgo(item.timestamp)}</span>
        </div>
        {item.type === 'comment' ? (
          isEditing ? (
            <div className="space-y-1.5">
              <textarea
                autoFocus
                rows={3}
                className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground outline-none resize-none border border-border focus:border-input"
                value={editText}
                onChange={(e) => onEditChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onEditSave()
                  if (e.key === 'Escape') onEditCancel()
                }}
              />
              <div className="flex gap-2">
                <button onClick={onEditSave} className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-2.5 py-1 font-medium transition-colors">Save</button>
                <button onClick={onEditCancel} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-muted rounded-lg px-3 py-2 text-sm text-foreground leading-snug">
                {renderMentions(item.action)}
              </div>
              {canEdit && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <button onClick={onEditStart} className="hover:text-foreground transition-colors">Edit</button>
                  <span>•</span>
                  <button onClick={onDelete} className="hover:text-destructive transition-colors">Delete</button>
                </div>
              )}
            </>
          )
        ) : (
          <p className="text-sm text-foreground leading-snug">{item.action}</p>
        )}
      </div>
    </div>
  )
}


export function TaskModal({ task, columnTitle, open, onClose, onUpdate, labels, onLabelsChange }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [descEditing, setDescEditing] = useState(false)
  const [descDraft, setDescDraft] = useState('')
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [commentFocused, setCommentFocused] = useState(false)
  const [hideDetails, setHideDetails] = useState(false)
  const [creatingChecklist, setCreatingChecklist] = useState(false)
  const [checklistNameDraft, setChecklistNameDraft] = useState('Checklist')
  const [checklistDueDateDraft, setChecklistDueDateDraft] = useState('')
  const [hideChecked, setHideChecked] = useState(false)
  const [addingItem, setAddingItem] = useState(false)
  const [newItemText, setNewItemText] = useState('')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItemText, setEditingItemText] = useState('')
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null)
  const [editingActivityText, setEditingActivityText] = useState('')
  const [showMention, setShowMention] = useState(false)
  const [, setMentionQuery] = useState('')
  const [mentionStart, setMentionStart] = useState(0)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const commentRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])

  const CURRENT_USER = { name: 'Sara Patel', initials: 'SP', color: '#8b5cf6' }

  useEffect(() => {
    if (task) {
      setTitle(task.person)
      setDescription(task.description)
      setSelectedLabels(task.labels ?? [])
      setSelectedMember(task.memberId ?? null)
      setAttachments(task.attachments ?? [])
    }
  }, [task])

  function handleTitleBlur() {
    if (!task) return
    onUpdate({ ...task, person: title, updatedAt: new Date(), updatedBy: CURRENT_USER.name })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!task || !e.target.files) return
    const newAttachments: Attachment[] = Array.from(e.target.files).map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      uploadedBy: CURRENT_USER.name,
    }))
    const updated = [...attachments, ...newAttachments]
    setAttachments(updated)
    onUpdate({ ...task, attachments: updated, updatedAt: new Date(), updatedBy: CURRENT_USER.name })
    e.target.value = ''
  }

  function removeAttachment(id: string) {
    if (!task) return
    const updated = attachments.filter((a) => a.id !== id)
    setAttachments(updated)
    onUpdate({ ...task, attachments: updated, updatedAt: new Date(), updatedBy: CURRENT_USER.name })
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function fileIcon(type: string) {
    if (type.startsWith('image/')) return <Image className="h-4 w-4 flex-shrink-0" />
    if (type === 'application/pdf' || type.includes('text')) return <FileText className="h-4 w-4 flex-shrink-0" />
    return <File className="h-4 w-4 flex-shrink-0" />
  }

  function startDescEdit() {
    setDescDraft(description)
    setDescEditing(true)
  }

  function cancelDescEdit() {
    setDescEditing(false)
    setDescDraft('')
  }

  function saveDescription() {
    if (!task) return
    const trimmed = descDraft.trim()
    const newActivity: ActivityItem = {
      id: Date.now().toString(),
      user: CURRENT_USER.name,
      initials: CURRENT_USER.initials,
      action: 'updated the description',
      timestamp: 'just now',
    }
    setDescription(trimmed)
    onUpdate({ ...task, description: trimmed, activity: [newActivity, ...task.activity], updatedAt: new Date(), updatedBy: CURRENT_USER.name })
    setDescEditing(false)
    setDescDraft('')
  }

  function submitComment() {
    if (!task || !comment.trim()) return
    const newActivity: ActivityItem = {
      id: Date.now().toString(),
      user: CURRENT_USER.name,
      initials: CURRENT_USER.initials,
      action: comment.trim(),
      timestamp: 'just now',
      type: 'comment',
      color: CURRENT_USER.color,
    }
    onUpdate({ ...task, activity: [newActivity, ...task.activity], updatedAt: new Date(), updatedBy: CURRENT_USER.name })
    setComment('')
    setCommentFocused(false)
    setShowMention(false)
  }

  function saveEditActivity() {
    if (!task || !editingActivityId || !editingActivityText.trim()) {
      setEditingActivityId(null)
      return
    }
    const updated = task.activity.map((a) =>
      a.id === editingActivityId ? { ...a, action: editingActivityText.trim() } : a
    )
    onUpdate({ ...task, activity: updated })
    setEditingActivityId(null)
    setEditingActivityText('')
  }

  function deleteActivity(id: string) {
    if (!task) return
    onUpdate({ ...task, activity: task.activity.filter((a) => a.id !== id) })
  }

  function handleCommentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setComment(val)
    const cursor = e.target.selectionStart ?? val.length
    const before = val.slice(0, cursor)
    const match = before.match(/@([\w\s]*)$/)
    if (match) {
      setMentionQuery(match[1].trimStart())
      setMentionStart(cursor - match[0].length)
      setShowMention(true)
    } else {
      setShowMention(false)
      setMentionQuery('')
    }
  }

  function selectMention(name: string) {
    const cursor = commentRef.current?.selectionStart ?? comment.length
    const before = comment.slice(0, mentionStart)
    const after = comment.slice(cursor)
    const inserted = `@${name} `
    setComment(before + inserted + after)
    setShowMention(false)
    setMentionQuery('')
    setTimeout(() => {
      commentRef.current?.focus()
      const pos = before.length + inserted.length
      commentRef.current?.setSelectionRange(pos, pos)
    }, 0)
  }

  const mentionMatches = BOARD_MEMBERS

  function createChecklist() {
    if (!task) return
    const name = checklistNameDraft.trim() || 'Checklist'
    onUpdate({ ...task, checklistName: name, checklistDueDate: checklistDueDateDraft || undefined, checklist: [], updatedAt: new Date(), updatedBy: CURRENT_USER.name })
    setCreatingChecklist(false)
    setChecklistNameDraft('Checklist')
    setChecklistDueDateDraft('')
  }

  function toggleChecklistItem(id: string) {
    if (!task?.checklist) return
    const updated = task.checklist.map((item) => item.id === id ? { ...item, done: !item.done } : item)
    onUpdate({ ...task, checklist: updated, updatedAt: new Date(), updatedBy: CURRENT_USER.name })
  }

  function addChecklistItem() {
    if (!task || !newItemText.trim()) return
    const newItem: ChecklistItem = { id: Date.now().toString(), text: newItemText.trim(), done: false }
    onUpdate({ ...task, checklist: [...(task.checklist ?? []), newItem], updatedAt: new Date(), updatedBy: CURRENT_USER.name })
    setNewItemText('')
    setAddingItem(false)
  }

  function deleteChecklistItem(id: string) {
    if (!task?.checklist) return
    onUpdate({ ...task, checklist: task.checklist.filter((i) => i.id !== id), updatedAt: new Date(), updatedBy: CURRENT_USER.name })
  }

  function saveEditItem() {
    if (!task?.checklist || !editingItemId || !editingItemText.trim()) {
      setEditingItemId(null)
      return
    }
    onUpdate({ ...task, checklist: task.checklist.map((i) => i.id === editingItemId ? { ...i, text: editingItemText.trim() } : i), updatedAt: new Date(), updatedBy: CURRENT_USER.name })
    setEditingItemId(null)
    setEditingItemText('')
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-2xl w-full p-0 bg-background border-border text-foreground rounded-2xl overflow-hidden gap-0 [&>button]:hidden"
        style={{ maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted hover:bg-muted/80 rounded-md px-2.5 py-1.5">
            <span>{columnTitle}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          <div className="flex items-center gap-1">
            <IconBtn icon={Maximize2} />
            <IconBtn icon={MoreHorizontal} />
            <IconBtn icon={X} onClick={onClose} />
          </div>
        </div>

        {/* Body */}
        <div className="flex overflow-hidden" style={{ maxHeight: 'calc(80vh - 49px)' }}>
          {/* Left panel — 70% */}
          <div className="flex-1 overflow-y-auto px-5 py-5 min-w-0">
            {/* Title */}
            <textarea
              ref={titleRef}
              className="w-full resize-none bg-transparent text-2xl font-bold text-foreground placeholder-muted-foreground outline-none leading-tight mb-4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              rows={1}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = el.scrollHeight + 'px'
              }}
            />

            {/* Action row */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded-full px-3 py-1.5 transition-colors">
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
              <MembersPopover
                selected={selectedMember}
                members={BOARD_MEMBERS}
                onChange={(id) => {
                  setSelectedMember(id)
                  const member = BOARD_MEMBERS.find((m) => m.id === id) ?? null
                  if (task) onUpdate({
                    ...task,
                    memberId: id ?? undefined,
                    person: member ? member.name : title,
                    updatedAt: new Date(),
                    updatedBy: CURRENT_USER.name,
                  })
                }}
              >
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded-full px-3 py-1.5 transition-colors">
                  <Users className="h-3.5 w-3.5" />
                  Members{selectedMember && (() => {
                    const m = BOARD_MEMBERS.find((m) => m.id === selectedMember)
                    return m ? (
                      <span
                        className="ml-0.5 h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ backgroundColor: m.color }}
                      >
                        {m.initials[0]}
                      </span>
                    ) : null
                  })()}
                </button>
              </MembersPopover>
              <LabelsPopover
                selected={selectedLabels}
                labels={labels}
                onLabelsChange={onLabelsChange}
                onChange={(ids) => {
                  setSelectedLabels(ids)
                  if (task) onUpdate({ ...task, labels: ids, updatedAt: new Date(), updatedBy: CURRENT_USER.name })
                }}
              >
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded-full px-3 py-1.5 transition-colors">
                  <Tag className="h-3.5 w-3.5" />
                  Labels{selectedLabels.length > 0 && <span className="ml-0.5 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] leading-none">{selectedLabels.length}</span>}
                </button>
              </LabelsPopover>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded-full px-3 py-1.5 transition-colors">
                <Calendar className="h-3.5 w-3.5" />
                Dates
              </button>
              <button
                onClick={() => { if (task.checklist === undefined && !creatingChecklist) setCreatingChecklist(true) }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded-full px-3 py-1.5 transition-colors"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Checklist{task.checklist !== undefined && <span className="ml-0.5 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] leading-none">{task.checklist.length}</span>}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded-full px-3 py-1.5 transition-colors"
              >
                <Paperclip className="h-3.5 w-3.5" />
                Attachment{attachments.length > 0 && <span className="ml-0.5 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] leading-none">{attachments.length}</span>}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {attachments.length > 0 && (
              <div className="mb-6">
                <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attachments</div>
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-foreground/20 transition-colors group">
                      {att.type.startsWith('image/') ? (
                        <a href={att.url} target="_blank" rel="noreferrer" className="h-10 w-14 rounded flex-shrink-0 overflow-hidden bg-muted">
                          <img src={att.url} alt={att.name} className="h-full w-full object-cover" />
                        </a>
                      ) : (
                        <div className="h-10 w-14 rounded flex-shrink-0 bg-muted flex items-center justify-center text-muted-foreground">
                          {fileIcon(att.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <a href={att.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-foreground hover:underline truncate block">{att.name}</a>
                        <span className="text-xs text-muted-foreground">{formatFileSize(att.size)}</span>
                      </div>
                      <button
                        onClick={() => removeAttachment(att.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator className="mb-6" />

            {/* Description */}
            <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Description
            </div>
            {/* Checklist creation prompt */}
            {creatingChecklist && (
              <div className="mb-6">
                <div className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Checklist</div>
                <div className="space-y-2">
                  <input
                    autoFocus
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-input placeholder-muted-foreground"
                    placeholder="Checklist name…"
                    value={checklistNameDraft}
                    onChange={(e) => setChecklistNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') createChecklist()
                      if (e.key === 'Escape') { setCreatingChecklist(false); setChecklistNameDraft('Checklist') }
                    }}
                  />
                  <input
                    type="date"
                    className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-input"
                    value={checklistDueDateDraft}
                    onChange={(e) => setChecklistDueDateDraft(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button onClick={createChecklist} className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-3 py-1.5 font-medium transition-colors">Add</button>
                    <button onClick={() => { setCreatingChecklist(false); setChecklistNameDraft('Checklist'); setChecklistDueDateDraft('') }} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5">Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {descEditing ? (
              <div className="space-y-2">
                <Textarea
                  autoFocus
                  className="w-full min-h-[120px] bg-transparent border-border focus:border-input text-sm text-foreground placeholder-muted-foreground resize-none transition-colors rounded-lg"
                  placeholder="Add a more detailed description…"
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') cancelDescEdit()
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveDescription()
                  }}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={saveDescription}
                    className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-3 py-1.5 transition-colors font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelDescEdit}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={startDescEdit}
                className="w-full min-h-[120px] text-sm rounded-lg px-3 py-2 cursor-text hover:bg-muted/50 transition-colors"
              >
                {description ? (
                  <span className="text-foreground whitespace-pre-wrap">{description}</span>
                ) : (
                  <span className="text-muted-foreground">Add a more detailed description…</span>
                )}
              </div>
            )}

            {/* Checklist section */}
            {task.checklist !== undefined && (
              <div className="mt-6">
                <Separator className="mb-6" />
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  <CheckSquare className="h-4 w-4 text-foreground flex-shrink-0" />
                  <span className="text-sm font-semibold text-foreground flex-1">
                    {task.checklistName || 'Checklist'}
                    {task.checklistDueDate && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">Due {task.checklistDueDate}</span>
                    )}
                  </span>
                  <button
                    onClick={() => setHideChecked((v) => !v)}
                    className="text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded-md px-2.5 py-1 transition-colors whitespace-nowrap"
                  >
                    {hideChecked ? 'Show checked' : 'Hide checked'}
                  </button>
                  <button
                    onClick={() => {
                      if (!task?.checklist) return
                      const remaining = task.checklist.filter((i) => !i.done)
                      onUpdate({ ...task, checklist: remaining, updatedAt: new Date(), updatedBy: CURRENT_USER.name })
                    }}
                    disabled={!task.checklist?.some((i) => i.done)}
                    className="text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded-md px-2.5 py-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Delete checked
                  </button>
                </div>

                {/* Progress bar */}
                {(() => {
                  const total = task.checklist!.length
                  const done = task.checklist!.filter((i) => i.done).length
                  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
                  return (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })()}

                {/* Items */}
                <div className="space-y-0.5 mb-3">
                  {(hideChecked ? task.checklist!.filter((i) => !i.done) : task.checklist!).map((item) => (
                    <div key={item.id} className="group flex items-center gap-2.5 py-1.5 px-1 rounded-lg hover:bg-muted/50 transition-colors">
                      <button
                        onClick={() => toggleChecklistItem(item.id)}
                        className={`h-4 w-4 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                          item.done ? 'bg-primary border-primary' : 'border-border bg-transparent hover:border-primary/60'
                        }`}
                      >
                        {item.done && <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />}
                      </button>

                      {editingItemId === item.id ? (
                        <input
                          autoFocus
                          className="flex-1 bg-transparent border-b border-border text-sm text-foreground outline-none py-0.5"
                          value={editingItemText}
                          onChange={(e) => setEditingItemText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditItem()
                            if (e.key === 'Escape') { setEditingItemId(null); setEditingItemText('') }
                          }}
                          onBlur={saveEditItem}
                        />
                      ) : (
                        <span
                          className={`flex-1 text-sm leading-snug select-none ${item.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                          onDoubleClick={() => { setEditingItemId(item.id); setEditingItemText(item.text) }}
                        >
                          {item.text}
                        </span>
                      )}

                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                        <button
                          onClick={() => { setEditingItemId(item.id); setEditingItemText(item.text) }}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => deleteChecklistItem(item.id)}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add item */}
                {addingItem ? (
                  <div className="space-y-2">
                    <input
                      autoFocus
                      className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-input placeholder-muted-foreground"
                      placeholder="Add an item…"
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addChecklistItem()
                        if (e.key === 'Escape') { setAddingItem(false); setNewItemText('') }
                      }}
                    />
                    <div className="flex gap-2">
                      <button onClick={addChecklistItem} disabled={!newItemText.trim()} className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 rounded-lg px-3 py-1.5 font-medium transition-colors">Add</button>
                      <button onClick={() => { setAddingItem(false); setNewItemText('') }} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingItem(true)}
                    className="text-xs text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 rounded-lg px-3 py-2 w-full text-left transition-colors"
                  >
                    + Add an item
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px bg-border flex-shrink-0" />

          {/* Right panel — 30% */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Activity
              </span>
              <button
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setHideDetails((v) => !v)}
              >
                {hideDetails ? 'Show details' : 'Hide details'}
              </button>
            </div>

            {/* Comment input */}
            <div className="px-5 pb-4 flex-shrink-0 relative overflow-visible">
              <div className={`rounded-xl border transition-colors ${commentFocused ? 'border-input bg-background' : 'border-border bg-muted/50'}`}>
                <textarea
                  ref={commentRef}
                  className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none resize-none px-3 pt-3 pb-2 rounded-xl"
                  placeholder="Write a comment… (use @ to mention)"
                  rows={commentFocused ? 3 : 1}
                  value={comment}
                  onChange={handleCommentChange}
                  onFocus={() => setCommentFocused(true)}
                  onBlur={() => { if (!comment) setCommentFocused(false) }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' && showMention) { e.preventDefault(); setShowMention(false) }
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment()
                  }}
                />
                {commentFocused && (
                  <div className="flex justify-end px-3 pb-2">
                    <button
                      onClick={submitComment}
                      disabled={!comment.trim()}
                      className="text-xs bg-muted hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed text-foreground rounded-lg px-3 py-1.5 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
              {/* @ mention dropdown */}
              {showMention && mentionMatches.length > 0 && (
                <div className="absolute left-5 right-5 top-full mt-1 bg-background border border-border rounded-xl shadow-2xl overflow-hidden z-[200]">
                  <div className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                    Members
                  </div>
                  {mentionMatches.map((m) => (
                    <button
                      key={m.id}
                      onMouseDown={(e) => { e.preventDefault(); selectMention(m.name) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted transition-colors text-left"
                    >
                      <div
                        className="h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
                        style={{ backgroundColor: m.color }}
                      >
                        {m.initials}
                      </div>
                      <span className="text-sm text-foreground">{m.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Separator className="flex-shrink-0" />

            {/* Activity feed */}
            {!hideDetails && (
              <div className="overflow-y-auto flex-1 px-5">
                {task.activity.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">No activity yet.</p>
                ) : (
                  task.activity.map((item, i) => (
                    <div key={item.id}>
                      <ActivityEntry
                        item={item}
                        canEdit={item.type === 'comment' && item.user === CURRENT_USER.name}
                        isEditing={editingActivityId === item.id}
                        editText={editingActivityText}
                        onEditStart={() => { setEditingActivityId(item.id); setEditingActivityText(item.action) }}
                        onEditChange={setEditingActivityText}
                        onEditSave={saveEditActivity}
                        onEditCancel={() => { setEditingActivityId(null); setEditingActivityText('') }}
                        onDelete={() => deleteActivity(item.id)}
                      />
                      {i < task.activity.length - 1 && <Separator />}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function IconBtn({ icon: Icon, onClick }: { icon: React.ElementType; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
