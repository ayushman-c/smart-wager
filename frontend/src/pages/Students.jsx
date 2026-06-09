import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Plus, Search, Edit, Trash2, Eye, Loader2, GraduationCap } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { formatDate } from '../lib/utils'

const DEPARTMENTS = ['Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Computer Science', 'Electronics', 'Chemical Engineering', 'Other']

export default function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterSem, setFilterSem] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewModal, setViewModal] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', rollNumber: '', registrationNumber: '', department: '', semester: '', section: '', batch: '', contactNumber: '', guardianName: '', guardianContact: '', address: '' })

  const LIMIT = 15

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: LIMIT })
      if (search) params.append('search', search)
      if (filterDept) params.append('department', filterDept)
      if (filterSem) params.append('semester', filterSem)
      const { data } = await api.get(`/students?${params}`)
      setStudents(data.students); setTotal(data.total)
    } catch { toast.error('Failed to load students') }
    finally { setLoading(false) }
  }, [page, search, filterDept, filterSem])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  const openAdd = () => { setEditItem(null); setForm({ name: '', email: '', password: '', rollNumber: '', registrationNumber: '', department: '', semester: '', section: '', batch: '', contactNumber: '', guardianName: '', guardianContact: '', address: '' }); setModalOpen(true) }
  const openEdit = (s) => { setEditItem(s); setForm({ name: s.userId?.name || '', email: s.userId?.email || '', password: '', rollNumber: s.rollNumber, registrationNumber: s.registrationNumber, department: s.department, semester: String(s.semester), section: s.section || '', batch: s.batch || '', contactNumber: s.contactNumber || '', guardianName: s.guardianName || '', guardianContact: s.guardianContact || '', address: s.address || '' }); setModalOpen(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.rollNumber || !form.registrationNumber || !form.department || !form.semester) return toast.error('Fill all required fields')
    setFormLoading(true)
    try {
      if (editItem) {
        await api.put(`/students/${editItem._id}`, form)
        toast.success('Student updated')
      } else {
        await api.post('/students', form)
        toast.success('Student added')
      }
      setModalOpen(false); fetchStudents()
    } catch (e) { toast.error(e.response?.data?.message || 'Operation failed') }
    finally { setFormLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this student?')) return
    try { await api.delete(`/students/${id}`); toast.success('Student deactivated'); fetchStudents() }
    catch (e) { toast.error(e.response?.data?.message || 'Failed') }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Students</h1><p className="text-muted-foreground">{total} enrolled students</p></div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Add Student</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name, roll number..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <Select value={filterDept} onValueChange={v => { setFilterDept(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="All Departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterSem} onValueChange={v => { setFilterSem(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="All Semesters" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <GraduationCap className="w-10 h-10 mb-2 opacity-40" />
              <p>No students found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(s => (
                  <TableRow key={s._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{s.userId?.name}</p>
                        <p className="text-xs text-muted-foreground">{s.userId?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-sm font-mono">{s.rollNumber}</span></TableCell>
                    <TableCell><span className="text-sm">{s.department}</span></TableCell>
                    <TableCell><span className="text-sm">Sem {s.semester}</span></TableCell>
                    <TableCell><span className="text-sm">{s.contactNumber || '—'}</span></TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewModal(s)} className="p-1.5 rounded hover:bg-accent"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-accent"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                        <button onClick={() => handleDelete(s._id)} className="p-1.5 rounded hover:bg-accent"><Trash2 className="w-4 h-4 text-destructive" /></button>
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

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Student' : 'Add Student'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Full Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
            {!editItem && <div className="space-y-2"><Label>Password (default: roll number)</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Leave blank to use roll number" /></div>}
            <div className="space-y-2"><Label>Roll Number *</Label><Input value={form.rollNumber} onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Registration Number *</Label><Input value={form.registrationNumber} onChange={e => setForm(f => ({ ...f, registrationNumber: e.target.value }))} required /></div>
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Semester *</Label>
              <Select value={form.semester} onValueChange={v => setForm(f => ({ ...f, semester: v }))}>
                <SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger>
                <SelectContent>{[1, 2, 3, 4, 5, 6, 7, 8].map(s => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Section</Label><Input value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} placeholder="e.g. A" /></div>
            <div className="space-y-2"><Label>Batch</Label><Input value={form.batch} onChange={e => setForm(f => ({ ...f, batch: e.target.value }))} placeholder="e.g. 2022-26" /></div>
            <div className="space-y-2"><Label>Contact Number</Label><Input value={form.contactNumber} onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Guardian Name</Label><Input value={form.guardianName} onChange={e => setForm(f => ({ ...f, guardianName: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Guardian Contact</Label><Input value={form.guardianContact} onChange={e => setForm(f => ({ ...f, guardianContact: e.target.value }))} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={formLoading}>{formLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={!!viewModal} onOpenChange={() => setViewModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Student Profile</DialogTitle></DialogHeader>
          {viewModal && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 pb-3 border-b">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {viewModal.userId?.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-base">{viewModal.userId?.name}</p>
                  <p className="text-muted-foreground">{viewModal.userId?.email}</p>
                </div>
              </div>
              {[
                ['Roll Number', viewModal.rollNumber],
                ['Registration No.', viewModal.registrationNumber],
                ['Department', viewModal.department],
                ['Semester', `Semester ${viewModal.semester}`],
                ['Section', viewModal.section || '—'],
                ['Batch', viewModal.batch || '—'],
                ['Contact', viewModal.contactNumber || '—'],
                ['Guardian', viewModal.guardianName || '—'],
                ['Guardian Contact', viewModal.guardianContact || '—'],
                ['Address', viewModal.address || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
