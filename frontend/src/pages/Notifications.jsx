import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Bell, Check, Trash2, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { cn, formatDateTime } from '../lib/utils'

const severityStyle = {
  info: 'border-l-blue-400 bg-blue-50 dark:bg-blue-900/10',
  warning: 'border-l-yellow-400 bg-yellow-50 dark:bg-yellow-900/10',
  error: 'border-l-red-400 bg-red-50 dark:bg-red-900/10',
  success: 'border-l-green-400 bg-green-50 dark:bg-green-900/10',
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/notifications?page=${page}&limit=${LIMIT}`)
      setNotifications(data.notifications)
      setTotal(data.total)
      setUnreadCount(data.unreadCount)
    } catch {} finally { setLoading(false) }
  }, [page])

  useEffect(() => { fetch() }, [fetch])

  const markRead = async (id) => {
    try { await api.patch(`/notifications/${id}/read`); fetch() } catch {}
  }

  const markAllRead = async () => {
    try { await api.patch('/notifications/read-all'); toast.success('All marked as read'); fetch() } catch {}
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && <Button variant="outline" size="sm" onClick={markAllRead}><Check className="w-4 h-4 mr-2" />Mark All Read</Button>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <Bell className="w-10 h-10 mb-2 opacity-30" />
          <p>No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n._id} className={cn('border-l-4 rounded-r-lg p-4 flex gap-3', severityStyle[n.severity] || severityStyle.info, !n.isRead && 'ring-1 ring-inset ring-primary/20')}>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn('text-sm font-semibold', !n.isRead && 'text-foreground')}>{n.title}</p>
                  <span className="text-xs text-muted-foreground shrink-0">{formatDateTime(n.createdAt)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-background border">{n.type}</span>
                  {!n.isRead && (
                    <button onClick={() => markRead(n._id)} className="text-xs text-primary hover:underline">Mark read</button>
                  )}
                </div>
              </div>
              {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
            </div>
          ))}
        </div>
      )}

      {Math.ceil(total / LIMIT) > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <Button variant="outline" size="sm" disabled={page === Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}
