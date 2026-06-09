import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Loader2, Users as UsersIcon, Search } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { cn, formatDate } from '../lib/utils'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '', department: '', contactNumber: '', isActive: true })

  const LIMIT = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: LIMIT })
      if (search) params.append('search', search)
      if (filterRole) params.append('role', filterRole)
      const { data } = await api.get(`/users?${params}`)
      setUsers(data.users); setTotal(data.total)
    } catch {} finally { setLoading(false) }
  }, [page, search, filterRole])

  useEffect(() => { fetch() }, [fetch])

  const openAdd = () => { setEditItem(null); setForm({ name: '', email: '', password: '', role: '', department: '', contactNumber: '', isActive: true }); setModalOpen(true) }
  const openEdit = (u) => { setEditItem(u); setForm({ name: u.name, email: u.email, password: '', role: u.role, department: u.department || '', contactNumber: u.contactNumber || '', isActive: u.isActive }); setModalOpen(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.role) return toast.error('Fill required fields')
    setFormLoading(true)
    try {
      if (editItem) { await api.put(`/users/${editItem._id}`, form); toast.success('User updated') }
      else { if (!form.password) return toast.error('Password required'); await api.post('/users', form); toast.success('User created') }
      setModalOpen(false); fetch()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setFormLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return
    try { await api.delete(`/users/${id}`); toast.success('Deleted'); fetch() }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
  }

  const roleColor = { admin: 'bg-red-100 text-red-700', teacher: 'bg-blue-100 text-blue-700', student: 'bg-green-100 text-green-700' }
  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Users</h1><p className="text-muted-foreground">{total} registered users</p></div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Add User</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <Select value={filterRole} onValueChange={v => { setFilterRole(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="All Roles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <UsersIcon className="w-10 h-10 mb-2 opacity-40" /><p>No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </TableCell>
                    <TableCell><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', roleColor[u.role])}>{u.role}</span></TableCell>
                    <TableCell><span className="text-sm">{u.department || '—'}</span></TableCell>
                    <TableCell><span className="text-sm">{u.contactNumber || '—'}</span></TableCell>
                    <TableCell><span className={cn('px-2 py-0.5 rounded-full text-xs', u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>{u.isActive ? 'Active' : 'Inactive'}</span></TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{formatDate(u.lastLogin)}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-accent"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                        <button onClick={() => handleDelete(u._id)} className="p-1.5 rounded hover:bg-accent"><Trash2 className="w-4 h-4 text-destructive" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editItem ? 'Edit User' : 'Add User'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Full Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
            {!editItem && <div className="space-y-2"><Label>Password *</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required /></div>}
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Department</Label><Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Contact Number</Label><Input value={form.contactNumber} onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))} /></div>
            {editItem && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4" />
                <Label htmlFor="active">Active</Label>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={formLoading}>{formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
