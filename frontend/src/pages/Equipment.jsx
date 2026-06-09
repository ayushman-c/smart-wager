import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Plus, Search, QrCode, Edit, Trash2, RefreshCw, Download, Loader2, Package } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { cn, getStatusColor, formatDate, downloadQR } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = ['Hand Tools', 'Measuring Instruments', 'Power Tools', 'Safety Equipment', 'Testing Equipment', 'CNC/Machine Tools', 'Other']
const STATUSES = ['Available', 'Issued', 'Missing', 'Damaged', 'Maintenance']

export default function Equipment() {
  const { user } = useAuth()
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [qrModal, setQrModal] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({ name: '', category: '', description: '', labSection: '', quantity: 1, location: '', manufacturer: '', modelNumber: '', notes: '' })
  const [imageFile, setImageFile] = useState(null)

  const LIMIT = 15

  const fetchEquipment = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: LIMIT })
      if (search) params.append('search', search)
      if (filterCategory) params.append('category', filterCategory)
      if (filterStatus) params.append('status', filterStatus)
      const { data } = await api.get(`/equipment?${params}`)
      setEquipment(data.equipment)
      setTotal(data.total)
    } catch (e) { toast.error('Failed to load equipment') }
    finally { setLoading(false) }
  }, [page, search, filterCategory, filterStatus])

  useEffect(() => { fetchEquipment() }, [fetchEquipment])

  const openAdd = () => { setEditItem(null); setForm({ name: '', category: '', description: '', labSection: '', quantity: 1, location: '', manufacturer: '', modelNumber: '', notes: '' }); setImageFile(null); setModalOpen(true) }
  const openEdit = (item) => { setEditItem(item); setForm({ name: item.name, category: item.category, description: item.description || '', labSection: item.labSection || '', quantity: item.quantity, location: item.location || '', manufacturer: item.manufacturer || '', modelNumber: item.modelNumber || '', notes: item.notes || '' }); setImageFile(null); setModalOpen(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.category) return toast.error('Name and category are required')
    setFormLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (imageFile) fd.append('image', imageFile)
      if (editItem) {
        await api.put(`/equipment/${editItem._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Equipment updated')
      } else {
        await api.post('/equipment', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Equipment added')
      }
      setModalOpen(false)
      fetchEquipment()
    } catch (e) { toast.error(e.response?.data?.message || 'Operation failed') }
    finally { setFormLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this equipment?')) return
    try { await api.delete(`/equipment/${id}`); toast.success('Deleted'); fetchEquipment() }
    catch (e) { toast.error(e.response?.data?.message || 'Delete failed') }
  }

  const handleRegenerateQR = async (id) => {
    try { const { data } = await api.post(`/equipment/${id}/qr`); toast.success('QR regenerated'); fetchEquipment() }
    catch { toast.error('QR generation failed') }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipment</h1>
          <p className="text-muted-foreground">{total} items in inventory</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Add Equipment</Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name, ID, category..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
            <Select value={filterCategory} onValueChange={v => { setFilterCategory(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={v => { setFilterStatus(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : equipment.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Package className="w-10 h-10 mb-2 opacity-40" />
              <p>No equipment found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Lab Section</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Avail.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map(eq => (
                  <TableRow key={eq._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{eq.name}</p>
                        <p className="text-xs text-muted-foreground">{eq.equipmentId}</p>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-sm">{eq.category}</span></TableCell>
                    <TableCell><span className="text-sm">{eq.labSection || '—'}</span></TableCell>
                    <TableCell>{eq.quantity}</TableCell>
                    <TableCell>{eq.availableQuantity}</TableCell>
                    <TableCell>
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(eq.status))}>{eq.status}</span>
                    </TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{formatDate(eq.createdAt)}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setQrModal(eq)} className="p-1.5 rounded hover:bg-accent" title="View QR">
                          <QrCode className="w-4 h-4 text-muted-foreground" />
                        </button>
                        {(user?.role === 'admin' || user?.role === 'teacher') && (
                          <>
                            <button onClick={() => openEdit(eq)} className="p-1.5 rounded hover:bg-accent" title="Edit">
                              <Edit className="w-4 h-4 text-muted-foreground" />
                            </button>
                            {user?.role === 'admin' && (
                              <button onClick={() => handleDelete(eq._id)} className="p-1.5 rounded hover:bg-accent" title="Delete">
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
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
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Equipment name" required />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lab Section</Label>
              <Input value={form.labSection} onChange={e => setForm(f => ({ ...f, labSection: e.target.value }))} placeholder="e.g. ME-Lab-1" />
            </div>
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Storage location" />
            </div>
            <div className="space-y-2">
              <Label>Manufacturer</Label>
              <Input value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Model Number</Label>
              <Input value={form.modelNumber} onChange={e => setForm(f => ({ ...f, modelNumber: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Modal */}
      <Dialog open={!!qrModal} onOpenChange={() => setQrModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>QR Code — {qrModal?.name}</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            {qrModal?.qrCode ? (
              <img src={qrModal.qrCode} alt="QR Code" className="w-64 h-64 rounded-lg border" />
            ) : (
              <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">No QR generated yet</div>
            )}
            <p className="text-xs text-muted-foreground text-center">Equipment ID: {qrModal?.equipmentId}</p>
          </div>
          <DialogFooter>
            {(user?.role === 'admin' || user?.role === 'teacher') && (
              <Button variant="outline" onClick={() => handleRegenerateQR(qrModal?._id)}><RefreshCw className="w-4 h-4 mr-2" />Regenerate</Button>
            )}
            {qrModal?.qrCode && (
              <Button onClick={() => downloadQR(qrModal.qrCode, `${qrModal.equipmentId}-qr.png`)}><Download className="w-4 h-4 mr-2" />Download</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
