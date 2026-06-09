import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Plus, QrCode, Eye, Check, X, Loader2, ClipboardList, Download } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { cn, getStatusColor, formatDateTime, downloadQR } from '../lib/utils'
import { useAuth } from '../context/AuthContext'

export default function Submissions() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [qrs, setQrs] = useState([])
  const [activeTab, setActiveTab] = useState('submissions')
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [qrModal, setQrModal] = useState(false)
  const [viewModal, setViewModal] = useState(null)
  const [reviewModal, setReviewModal] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [qrForm, setQrForm] = useState({ practicalNumber: '', experimentName: '', subject: '', semester: '', section: '', department: '', deadline: '', maxSubmissions: '', description: '' })
  const [reviewForm, setReviewForm] = useState({ verificationStatus: '', teacherFeedback: '', marks: '' })

  const LIMIT = 15

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: LIMIT })
      if (filterStatus) params.append('status', filterStatus)
      const { data } = await api.get(`/submissions?${params}`)
      setSubmissions(data.submissions); setTotal(data.total)
    } catch {} finally { setLoading(false) }
  }, [page, filterStatus])

  const fetchQRs = useCallback(async () => {
    try { const { data } = await api.get('/submissions/qr'); setQrs(data.qrs) } catch {}
  }, [])

  useEffect(() => { fetchSubmissions(); fetchQRs() }, [fetchSubmissions, fetchQRs])

  const handleGenerateQR = async (e) => {
    e.preventDefault()
    if (!qrForm.practicalNumber || !qrForm.experimentName) return toast.error('Practical number and experiment name required')
    setFormLoading(true)
    try {
      await api.post('/submissions/qr', qrForm)
      toast.success('Submission QR generated')
      setQrModal(false)
      setQrForm({ practicalNumber: '', experimentName: '', subject: '', semester: '', section: '', department: '', deadline: '', maxSubmissions: '', description: '' })
      fetchQRs()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setFormLoading(false) }
  }

  const handleReview = async (e) => {
    e.preventDefault()
    if (!reviewForm.verificationStatus) return toast.error('Select verification status')
    setFormLoading(true)
    try {
      await api.patch(`/submissions/${reviewModal._id}/review`, reviewForm)
      toast.success('Submission reviewed')
      setReviewModal(null)
      fetchSubmissions()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setFormLoading(false) }
  }

  const handleToggleQR = async (id) => {
    try { await api.patch(`/submissions/qr/${id}/toggle`); toast.success('QR status toggled'); fetchQRs() }
    catch { toast.error('Failed') }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Submissions</h1><p className="text-muted-foreground">Manage practical work submissions</p></div>
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <Button onClick={() => setQrModal(true)}><Plus className="w-4 h-4 mr-2" /><QrCode className="w-4 h-4 mr-1" />Generate QR</Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {['submissions', 'qrcodes'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn('px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors', activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {tab === 'submissions' ? 'Submissions' : 'QR Codes'}
          </button>
        ))}
      </div>

      {activeTab === 'submissions' && (
        <>
          <Card>
            <CardContent className="p-4">
              <Select value={filterStatus} onValueChange={v => { setFilterStatus(v === 'all' ? '' : v); setPage(1) }}>
                <SelectTrigger className="w-48"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {loading ? <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              : submissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <ClipboardList className="w-10 h-10 mb-2 opacity-40" /><p>No submissions found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Practical</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map(sub => (
                      <TableRow key={sub._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{sub.studentId?.userId?.name}</p>
                            <p className="text-xs text-muted-foreground">{sub.studentId?.rollNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">P{sub.practicalNumber}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-32">{sub.experimentName}</p>
                          </div>
                        </TableCell>
                        <TableCell><span className="text-sm">{sub.subject || '—'}</span></TableCell>
                        <TableCell><span className="text-xs text-muted-foreground">{formatDateTime(sub.submittedAt)}</span></TableCell>
                        <TableCell>{sub.isLate ? <span className="text-xs text-red-600 font-medium">Yes</span> : <span className="text-xs text-green-600">No</span>}</TableCell>
                        <TableCell><span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(sub.verificationStatus))}>{sub.verificationStatus}</span></TableCell>
                        <TableCell><span className="text-sm">{sub.marks ?? '—'}</span></TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setViewModal(sub)} className="p-1.5 rounded hover:bg-accent"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                            {sub.verificationStatus === 'Pending' && (
                              <button onClick={() => { setReviewModal(sub); setReviewForm({ verificationStatus: '', teacherFeedback: '', marks: '' }) }} className="p-1.5 rounded hover:bg-accent"><Check className="w-4 h-4 text-green-600" /></button>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      {activeTab === 'qrcodes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {qrs.map(qr => (
            <Card key={qr._id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{qr.experimentName}</p>
                    <p className="text-xs text-muted-foreground">P{qr.practicalNumber} · {qr.subject || 'N/A'}</p>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full ml-2 shrink-0', qr.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                    {qr.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {qr.qrCode && <img src={qr.qrCode} alt="QR" className="w-32 h-32 mx-auto rounded border" />}
                <p className="text-xs text-muted-foreground text-center font-mono">{qr.qrId}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleToggleQR(qr._id)}>
                    {qr.isActive ? <><X className="w-3 h-3 mr-1" />Deactivate</> : <><Check className="w-3 h-3 mr-1" />Activate</>}
                  </Button>
                  {qr.qrCode && <Button size="sm" variant="outline" onClick={() => downloadQR(qr.qrCode, `${qr.qrId}.png`)}><Download className="w-3 h-3" /></Button>}
                </div>
              </CardContent>
            </Card>
          ))}
          {qrs.length === 0 && <div className="col-span-3 text-center py-12 text-muted-foreground">No QR codes generated yet</div>}
        </div>
      )}

      {/* Generate QR Modal */}
      <Dialog open={qrModal} onOpenChange={setQrModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Generate Submission QR</DialogTitle></DialogHeader>
          <form onSubmit={handleGenerateQR} className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Practical Number *</Label><Input value={qrForm.practicalNumber} onChange={e => setQrForm(f => ({ ...f, practicalNumber: e.target.value }))} placeholder="e.g. 3" required /></div>
            <div className="space-y-2"><Label>Experiment Name *</Label><Input value={qrForm.experimentName} onChange={e => setQrForm(f => ({ ...f, experimentName: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Subject</Label><Input value={qrForm.subject} onChange={e => setQrForm(f => ({ ...f, subject: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Semester</Label><Input type="number" min="1" max="8" value={qrForm.semester} onChange={e => setQrForm(f => ({ ...f, semester: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Section</Label><Input value={qrForm.section} onChange={e => setQrForm(f => ({ ...f, section: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Department</Label><Input value={qrForm.department} onChange={e => setQrForm(f => ({ ...f, department: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Deadline</Label><Input type="datetime-local" value={qrForm.deadline} onChange={e => setQrForm(f => ({ ...f, deadline: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Max Submissions</Label><Input type="number" value={qrForm.maxSubmissions} onChange={e => setQrForm(f => ({ ...f, maxSubmissions: e.target.value }))} /></div>
            <div className="space-y-2 col-span-2"><Label>Description</Label><Textarea value={qrForm.description} onChange={e => setQrForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setQrModal(false)}>Cancel</Button>
              <Button type="submit" disabled={formLoading}>{formLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : 'Generate QR'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Submission Modal */}
      <Dialog open={!!viewModal} onOpenChange={() => setViewModal(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Submission Details</DialogTitle></DialogHeader>
          {viewModal && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                {[['Student', viewModal.studentId?.userId?.name], ['Roll No.', viewModal.studentId?.rollNumber], ['Practical', `P${viewModal.practicalNumber}`], ['Experiment', viewModal.experimentName], ['Subject', viewModal.subject || '—'], ['Submitted', formatDateTime(viewModal.submittedAt)], ['Late', viewModal.isLate ? 'Yes' : 'No'], ['Status', viewModal.verificationStatus], ['Marks', viewModal.marks ?? '—'], ['Feedback', viewModal.teacherFeedback || '—']].map(([l, v]) => (
                  <div key={l}><p className="text-muted-foreground text-xs">{l}</p><p className="font-medium">{v}</p></div>
                ))}
              </div>
              {viewModal.remarks && <div><p className="text-muted-foreground text-xs">Remarks</p><p className="italic">{viewModal.remarks}</p></div>}
              {viewModal.images?.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs mb-2">Images</p>
                  <div className="flex flex-wrap gap-2">
                    {viewModal.images.map((img, i) => <a key={i} href={img} target="_blank" rel="noreferrer"><img src={img} alt={`img-${i}`} className="w-20 h-20 object-cover rounded border" /></a>)}
                  </div>
                </div>
              )}
              {viewModal.pdfReport && <div><p className="text-muted-foreground text-xs mb-1">PDF Report</p><a href={viewModal.pdfReport} target="_blank" rel="noreferrer" className="text-primary text-sm underline">View PDF</a></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={!!reviewModal} onOpenChange={() => setReviewModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Review Submission</DialogTitle></DialogHeader>
          <form onSubmit={handleReview} className="space-y-4">
            <div className="space-y-2">
              <Label>Decision *</Label>
              <Select value={reviewForm.verificationStatus} onValueChange={v => setReviewForm(f => ({ ...f, verificationStatus: v }))}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Approved">Approve</SelectItem>
                  <SelectItem value="Rejected">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Marks</Label>
              <Input type="number" min="0" max="100" value={reviewForm.marks} onChange={e => setReviewForm(f => ({ ...f, marks: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Feedback</Label>
              <Textarea value={reviewForm.teacherFeedback} onChange={e => setReviewForm(f => ({ ...f, teacherFeedback: e.target.value }))} rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReviewModal(null)}>Cancel</Button>
              <Button type="submit" disabled={formLoading}>{formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
