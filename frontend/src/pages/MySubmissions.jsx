import { useState, useEffect } from 'react'
import api from '../lib/api'
import { ClipboardList, Loader2, Eye } from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { cn, getStatusColor, formatDateTime, formatDate } from '../lib/utils'

export default function MySubmissions() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewModal, setViewModal] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      try { const { data } = await api.get('/submissions/my'); setSubmissions(data.submissions) }
      catch {} finally { setLoading(false) }
    }
    fetch()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Submissions</h1>
        <p className="text-muted-foreground">{submissions.length} practical submissions</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <ClipboardList className="w-10 h-10 mb-2 opacity-40" />
            <p>No submissions yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {submissions.map(sub => (
            <Card key={sub._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">Practical {sub.practicalNumber}</p>
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(sub.verificationStatus))}>{sub.verificationStatus}</span>
                      {sub.isLate && <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Late</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{sub.experimentName}</p>
                    {sub.subject && <p className="text-xs text-muted-foreground">{sub.subject}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{formatDateTime(sub.submittedAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {sub.marks != null && <p className="text-2xl font-bold text-primary">{sub.marks}<span className="text-sm font-normal text-muted-foreground">/100</span></p>}
                    <button onClick={() => setViewModal(sub)} className="mt-1 text-xs text-primary hover:underline flex items-center gap-1">
                      <Eye className="w-3 h-3" />View
                    </button>
                  </div>
                </div>
                {sub.teacherFeedback && (
                  <div className="mt-3 p-2 bg-muted rounded text-sm">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Teacher Feedback</p>
                    <p>{sub.teacherFeedback}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!viewModal} onOpenChange={() => setViewModal(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Submission Details</DialogTitle></DialogHeader>
          {viewModal && (
            <div className="space-y-4 text-sm">
              {[['Practical No.', viewModal.practicalNumber], ['Experiment', viewModal.experimentName], ['Subject', viewModal.subject || '—'], ['Submitted', formatDateTime(viewModal.submittedAt)], ['Late', viewModal.isLate ? 'Yes' : 'No'], ['Status', viewModal.verificationStatus], ['Marks', viewModal.marks ?? '—'], ['Feedback', viewModal.teacherFeedback || '—'], ['Remarks', viewModal.remarks || '—']].map(([l, v]) => (
                <div key={l} className="flex justify-between border-b pb-1 last:border-0">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
              {viewModal.images?.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs mb-2">Images</p>
                  <div className="flex flex-wrap gap-2">
                    {viewModal.images.map((img, i) => <a key={i} href={img} target="_blank" rel="noreferrer"><img src={img} alt="" className="w-20 h-20 object-cover rounded border" /></a>)}
                  </div>
                </div>
              )}
              {viewModal.pdfReport && <div><p className="text-muted-foreground text-xs mb-1">PDF Report</p><a href={viewModal.pdfReport} target="_blank" rel="noreferrer" className="text-primary underline">View PDF</a></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
