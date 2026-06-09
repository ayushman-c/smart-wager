import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../lib/utils'
import {
  LayoutDashboard, Package, Users, GraduationCap, QrCode,
  ArrowUpFromLine, ArrowDownToLine, FileText, BarChart3,
  Settings, LogOut, ClipboardList, Bell, Shield, X,
} from 'lucide-react'

const navGroups = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'teacher'] },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/equipment', icon: Package, label: 'Equipment', roles: ['admin', 'teacher'] },
      { to: '/students', icon: GraduationCap, label: 'Students', roles: ['admin', 'teacher'] },
      { to: '/users', icon: Users, label: 'Users', roles: ['admin'] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/issue', icon: ArrowUpFromLine, label: 'Issue Equipment', roles: ['admin', 'teacher'] },
      { to: '/return', icon: ArrowDownToLine, label: 'Return Equipment', roles: ['admin', 'teacher'] },
      { to: '/scanner', icon: QrCode, label: 'QR Scanner', roles: ['admin', 'teacher', 'student'] },
    ],
  },
  {
    label: 'Academics',
    items: [
      { to: '/submissions', icon: ClipboardList, label: 'Submissions', roles: ['admin', 'teacher'] },
      { to: '/my-submissions', icon: FileText, label: 'My Submissions', roles: ['student'] },
      { to: '/submit', icon: ArrowUpFromLine, label: 'Submit Practical', roles: ['student'] },
      { to: '/my-equipment', icon: Package, label: 'My Equipment', roles: ['student'] },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin', 'teacher'] },
      { to: '/audit', icon: Shield, label: 'Audit Logs', roles: ['admin'] },
      { to: '/notifications', icon: Bell, label: 'Notifications', roles: ['admin', 'teacher', 'student'] },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin', 'teacher', 'student'] },
    ],
  },
]

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const filtered = navGroups.map(g => ({
    ...g,
    items: g.items.filter(i => i.roles.includes(user?.role)),
  })).filter(g => g.items.length > 0)

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg">Smart Wager</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {filtered.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                {group.label}
              </p>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors mb-0.5',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
