import { useState } from 'react'
import { X, Bell, AtSign, CheckCheck, Check } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import type { TaskDetail } from '@/components/TaskModal'

type TaggedNotification = {
  activityId: string
  user: string
  initials: string
  color?: string
  action: string
  timestamp: string
  task: TaskDetail
}

type Props = {
  open: boolean
  onClose: () => void
  allCards: TaskDetail[]
  readIds: Set<string>
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onSelectTask: (task: TaskDetail) => void
}

function getTaggedNotifications(cards: TaskDetail[]): TaggedNotification[] {
  const results: TaggedNotification[] = []
  for (const task of cards) {
    for (const activity of task.activity) {
      if (activity.tagged || activity.action.includes('@RA')) {
        results.push({
          activityId: activity.id,
          user: activity.user,
          initials: activity.initials,
          color: activity.color,
          action: activity.action,
          timestamp: activity.timestamp,
          task,
        })
      }
    }
  }
  return results.sort((a, b) => {
    const ta = a.task.updatedAt?.getTime() ?? 0
    const tb = b.task.updatedAt?.getTime() ?? 0
    return tb - ta
  })
}

type Tab = 'unread' | 'read'

export function NotificationsPanel({ open, onClose, allCards, readIds, onMarkRead, onMarkAllRead, onSelectTask }: Props) {
  const [tab, setTab] = useState<Tab>('unread')

  const all = getTaggedNotifications(allCards)
  const unread = all.filter((n) => !readIds.has(n.activityId))
  const read = all.filter((n) => readIds.has(n.activityId))
  const list = tab === 'unread' ? unread : read

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      )}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-96 bg-background border-l border-border shadow-xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Notifications</h2>
            {unread.length > 0 && (
              <span className="text-[10px] font-medium bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                {unread.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {tab === 'unread' && unread.length > 0 && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                All read
              </button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab('unread')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === 'unread'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Unread {unread.length > 0 && `(${unread.length})`}
          </button>
          <button
            onClick={() => setTab('read')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === 'read'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Read {read.length > 0 && `(${read.length})`}
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <AtSign className="h-8 w-8 opacity-30" />
              <p className="text-sm">{tab === 'unread' ? 'All caught up' : 'Nothing read yet'}</p>
            </div>
          ) : (
            <ul>
              {list.map(({ activityId, user, initials, color, action, timestamp, task }, i) => (
                <li key={activityId}>
                  <div className="flex items-start gap-0 px-4 py-3 hover:bg-muted/40 transition-colors group">
                    {/* Unread dot */}
                    <div className="flex-shrink-0 w-4 flex items-center justify-center mt-1.5">
                      {tab === 'unread' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </div>

                    <Avatar size="sm" className="mt-0.5 flex-shrink-0 mr-3">
                      <AvatarFallback
                        className="text-[10px]"
                        style={{ backgroundColor: (color ?? '#888') + '33', color: color ?? '#888' }}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <button
                      className="flex-1 min-w-0 text-left"
                      onClick={() => { onSelectTask(task); onClose() }}
                    >
                      <p className="text-xs text-foreground leading-snug">
                        <span className="font-medium">{user}</span>
                        {' '}mentioned you in{' '}
                        <span className="font-medium text-primary">{task.person}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{action}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{timestamp}</p>
                    </button>

                    {tab === 'unread' && (
                      <button
                        onClick={() => onMarkRead(activityId)}
                        className="flex-shrink-0 ml-2 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  {i < list.length - 1 && <Separator />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
