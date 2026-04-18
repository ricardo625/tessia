import { X, Bell, AtSign } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import type { TaskDetail, ActivityItem } from '@/components/TaskModal'

type TaggedNotification = {
  activity: ActivityItem
  task: TaskDetail
}

type Props = {
  open: boolean
  onClose: () => void
  allCards: TaskDetail[]
  onSelectTask: (task: TaskDetail) => void
}

function getTaggedNotifications(cards: TaskDetail[]): TaggedNotification[] {
  const results: TaggedNotification[] = []
  for (const task of cards) {
    for (const activity of task.activity) {
      if (activity.action.includes('@RA') || activity.tagged) {
        results.push({ activity, task })
      }
    }
  }
  return results.sort((a, b) => {
    const ta = a.task.updatedAt?.getTime() ?? 0
    const tb = b.task.updatedAt?.getTime() ?? 0
    return tb - ta
  })
}

export function NotificationsPanel({ open, onClose, allCards, onSelectTask }: Props) {
  const notifications = getTaggedNotifications(allCards)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-96 bg-background border-l border-border shadow-xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Notifications</h2>
            {notifications.length > 0 && (
              <span className="text-[10px] font-medium bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                {notifications.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <AtSign className="h-8 w-8 opacity-30" />
              <p className="text-sm">No mentions yet</p>
            </div>
          ) : (
            <ul>
              {notifications.map(({ activity, task }, i) => (
                <li key={activity.id}>
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-muted/60 transition-colors"
                    onClick={() => { onSelectTask(task); onClose() }}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar size="sm" className="mt-0.5 flex-shrink-0">
                        <AvatarFallback className="text-[10px]" style={{ backgroundColor: activity.color + '33', color: activity.color }}>
                          {activity.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-snug">
                          <span className="font-medium">{activity.user}</span>
                          {' '}mentioned you in{' '}
                          <span className="font-medium text-primary">{task.person}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {activity.action}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  </button>
                  {i < notifications.length - 1 && <Separator />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
