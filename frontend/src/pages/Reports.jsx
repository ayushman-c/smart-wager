import { useState } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { FileText, Download, Loader2, BarChart3, Package, Users, ClipboardList, AlertTriangle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { formatDate } from '../lib/utils'

const ReportCard = ({ title, description, icon: Icon, color, onPDF, onExcel, loading }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={onPDF} disabled={loading}>
              {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <FileText className="w-3 h-3 mr-1" />}
              PDF
            </Button>
            <Button size="sm" variant="outline" onClick={onExcel} disabled={loading}>
              <Download className="w-3 h-3 mr-1" />Excel
            </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)

export default function Reports() {
  const [loading, setLoading] = useState({})
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const setLoad = (key, val) => setLoading(l => ({ ...l, [key]: val }))

  const generateInventoryPDF = async () => {
    setLoad('inv', true)
    try {
      const { data } = await api.get('/reports/inventory')
      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text('Equipment Inventory Report', 14, 20)
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
      doc.text(`Total: ${data.report.summary.total} | Available: ${data.report.summary.available} | Issued: ${data.report.summary.issued}`, 14, 34)
      autoTable(doc, {
        startY: 40,
        head: [['Equipment ID', 'Name', 'Category', 'Lab', 'Qty', 'Available', 'Status']],
        body: data.report.equipment.map(e => [e.equipmentId, e.name, e.category, e.labSection || '—', e.quantity, e.availableQuantity, e.status]),
        styles: { fontSize: 8 },
      })
      doc.save('inventory-report.pdf')
      toast.success('PDF downloaded')
    } catch { toast.error('Failed') } finally { setLoad('inv', false) }
  }

  const generateInventoryExcel = async () => {
    setLoad('inv_xl', true)
    try {
      const { data } = await api.get('/reports/inventory')
      const rows = data.report.equipment.map(e => ({ 'Equipment ID': e.equipmentId, 'Name': e.name, 'Category': e.category, 'Lab Section': e.labSection || '', 'Quantity': e.quantity, 'Available': e.availableQuantity, 'Status': e.status, 'Location': e.location || '' }))
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory')
      XLSX.writeFile(wb, 'inventory-report.xlsx')
      toast.success('Excel downloaded')
    } catch { toast.error('Failed') } finally { setLoad('inv_xl', false) }
  }

  const generateIssueReturnPDF = async () => {
    setLoad('ir', true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      const { data } = await api.get(`/reports/issue-return?${params}`)
      const doc = new jsPDF('l', 'mm', 'a4')
      doc.setFontSize(18)
      doc.text('Issue / Return Report', 14, 20)
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
      doc.text('ISSUES', 14, 36)
      autoTable(doc, {
        startY: 40,
        head: [['Transaction ID', 'Equipment', 'Student', 'Teacher', 'Issue Date', 'Due Date', 'Status']],
        body: data.report.issues.map(i => [i.transactionId, i.equipmentId?.name || '—', i.studentId?.userId?.name || '—', i.teacherId?.name || '—', formatDate(i.issueDate), formatDate(i.expectedReturnDate), i.status]),
        styles: { fontSize: 7 },
      })
      const returnY = doc.lastAutoTable.finalY + 10
      doc.text('RETURNS', 14, returnY)
      autoTable(doc, {
        startY: returnY + 4,
        head: [['Equipment', 'Student', 'Return Date', 'Condition', 'Overdue', 'Remarks']],
        body: data.report.returns.map(r => [r.equipmentId?.name || '—', r.studentId?.userId?.name || '—', formatDate(r.returnDate), r.condition, r.isOverdue ? `Yes (${r.overdueDays}d)` : 'No', r.remarks || '—']),
        styles: { fontSize: 7 },
      })
      doc.save('issue-return-report.pdf')
      toast.success('PDF downloaded')
    } catch { toast.error('Failed') } finally { setLoad('ir', false) }
  }

  const generateSubmissionsPDF = async () => {
    setLoad('sub', true)
    try {
      const { data } = await api.get('/reports/submissions')
      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text('Practical Submissions Report', 14, 20)
      doc.setFontSize(10)
      doc.text(`Total: ${data.report.total} | Generated: ${new Date().toLocaleString()}`, 14, 28)
      autoTable(doc, {
        startY: 34,
        head: [['Student', 'Roll No.', 'Practical', 'Experiment', 'Submitted', 'Late', 'Status', 'Marks']],
        body: data.report.submissions.map(s => [s.studentId?.userId?.name || '—', s.studentId?.rollNumber || '—', s.practicalNumber, s.experimentName, formatDate(s.submittedAt), s.isLate ? 'Yes' : 'No', s.verificationStatus, s.marks ?? '—']),
        styles: { fontSize: 8 },
      })
      doc.save('submissions-report.pdf')
      toast.success('PDF downloaded')
    } catch { toast.error('Failed') } finally { setLoad('sub', false) }
  }

  const generateMissingPDF = async () => {
    setLoad('miss', true)
    try {
      const { data } = await api.get('/reports/missing')
      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text('Missing Equipment Report', 14, 20)
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
      doc.text(`Missing: ${data.report.missing.length} | Overdue Issues: ${data.report.overdueIssues.length}`, 14, 34)
      doc.text('MISSING EQUIPMENT', 14, 42)
      autoTable(doc, {
        startY: 46,
        head: [['Equipment ID', 'Name', 'Category', 'Lab Section']],
        body: data.report.missing.map(e => [e.equipmentId, e.name, e.category, e.labSection || '—']),
        styles: { fontSize: 8 },
      })
      const overdueY = doc.lastAutoTable.finalY + 10
      doc.text('OVERDUE ISSUES', 14, overdueY)
      autoTable(doc, {
        startY: overdueY + 4,
        head: [['Transaction ID', 'Equipment', 'Student', 'Issue Date', 'Due Date']],
        body: data.report.overdueIssues.map(i => [i.transactionId, i.equipmentId?.name || '—', i.studentId?.userId?.name || '—', formatDate(i.issueDate), formatDate(i.expectedReturnDate)]),
        styles: { fontSize: 8 },
      })
      doc.save('missing-report.pdf')
      toast.success('PDF downloaded')
    } catch { toast.error('Failed') } finally { setLoad('miss', false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Generate and export lab reports</p>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Date Range (for Issue/Return Report)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2 flex-1"><Label>Start Date</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
            <div className="space-y-2 flex-1"><Label>End Date</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ReportCard title="Equipment Inventory" description="Full inventory list with status and quantities" icon={Package} color="bg-blue-500"
          onPDF={generateInventoryPDF} onExcel={generateInventoryExcel} loading={loading.inv || loading.inv_xl} />
        <ReportCard title="Issue / Return Log" description="All equipment issue and return transactions" icon={BarChart3} color="bg-indigo-500"
          onPDF={generateIssueReturnPDF} onExcel={generateIssueReturnPDF} loading={loading.ir} />
        <ReportCard title="Practical Submissions" description="All student practical work submissions" icon={ClipboardList} color="bg-purple-500"
          onPDF={generateSubmissionsPDF} onExcel={generateSubmissionsPDF} loading={loading.sub} />
        <ReportCard title="Missing & Overdue" description="Missing equipment and overdue issue alerts" icon={AlertTriangle} color="bg-red-500"
          onPDF={generateMissingPDF} onExcel={generateMissingPDF} loading={loading.miss} />
      </div>
    </div>
  )
}
