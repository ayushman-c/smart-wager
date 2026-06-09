import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Search, ArrowUpFromLine, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Textarea } from '../components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { cn, getStatusColor, formatDate } from '../lib/utils'

export default function IssueEquipment() {
  const [students, setStudents] = useState([])
  const [equipment, setEquipment] = useState([])
  const [transactions, setTransactions] = useState([])
  const [studentSearch, setStudentSearch] = useState('')
  const [equipSearch, setEquipSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [notes, setNotes] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [txLoading, setTxLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true)
    try {
      const { data } = await api.get('/issue?status=Issued&limit=20')
      setTransactions(data.transactions)
    } catch {} finally { setTxLoading(false) }
  }, [])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const searchStudents = async (q) => {
    if (!q || q.length < 2) return setStudents([])
    try {
      const { data } = await api.get(`/students?search=${q}&limit=8`)
      setStudents(data.students)
    } catch {}
  }

  const searchEquipment = async (q) => {
    if (!q || q.length < 2) return setEquipment([])
    try {
      const { data } = await api.get(`/equipment?search=${q}&status=Available&limit=8`)
      setEquipment(data.equipment)
    } catch {}
  }

  const handleIssue = async () => {
    if (!selectedStudent || !selectedEquipment) return toast.error('Select both student and equipment')
    setLoading(true)
    try {
      await api.post('/issue', {
        studentId: selectedStudent._id,
        equipmentId: selectedEquipment._id,
        expectedReturnDate: expectedReturnDate || undefined,
        notes, quantity,
      })
      toast.success(`${selectedEquipment.name} issued to ${selectedStudent.userId?.name}`)
      setSelectedStudent(null); setSelectedEquipment(null)
      setStudentSearch(''); setEquipSearch(''); setStudents([]); setEquipment([])
      setNotes(''); setExpectedReturnDate(''); setQuantity(1)
      fetchTransactions()
    } catch (e) { toast.error(e.response?.data?.message || 'Issue failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Issue Equipment</h1>
        <p className="text-muted-foreground">Assign equipment to a student</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issue Form */}
        <Card>
          <CardHeader><CardTitle className="text-base">New Issue</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Student Search */}
            <div className="space-y-2">
              <Label>Search Student *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Name or roll number..." value={studentSearch}
                  onChange={e => { setStudentSearch(e.target.value); searchStudents(e.target.value) }} />
              </div>
              {students.length > 0 && !selectedStudent && (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {students.map(s => (
                    <button key={s._id} onClick={() => { setSelectedStudent(s); setStudentSearch(s.userId?.name || ''); setStudents([]) }}
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm">
                      <p className="font-medium">{s.userId?.name}</p>
                      <p className="text-muted-foreground text-xs">{s.rollNumber} · {s.department}</p>
                    </button>
                  ))}
                </div>
              )}
              {selectedStudent && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-green-800 dark:text-green-300">{selectedStudent.userId?.name}</p>
                    <p className="text-green-600 dark:text-green-400 text-xs">{selectedStudent.rollNumber}</p>
                  </div>
                  <button onClick={() => { setSelectedStudent(null); setStudentSearch('') }} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
                </div>
              )}
            </div>

            {/* Equipment Search */}
            <div className="space-y-2">
              <Label>Search Equipment *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Equipment name or ID..." value={equipSearch}
                  onChange={e => { setEquipSearch(e.target.value); searchEquipment(e.target.value) }} />
              </div>
              {equipment.length > 0 && !selectedEquipment && (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {equipment.map(eq => (
                    <button key={eq._id} onClick={() => { setSelectedEquipment(eq); setEquipSearch(eq.name); setEquipment([]) }}
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm">
                      <p className="font-medium">{eq.name}</p>
                      <p className="text-muted-foreground text-xs">{eq.equipmentId} · Available: {eq.availableQuantity}</p>
                    </button>
                  ))}
                </div>
              )}
              {selectedEquipment && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-300">{selectedEquipment.name}</p>
                    <p className="text-blue-600 dark:text-blue-400 text-xs">{selectedEquipment.equipmentId} · {selectedEquipment.availableQuantity} available</p>
                  </div>
                  <button onClick={() => { setSelectedEquipment(null); setEquipSearch('') }} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" min="1" max={selectedEquipment?.availableQuantity || 1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Expected Return</Label>
                <Input type="date" value={expectedReturnDate} onChange={e => setExpectedReturnDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any remarks..." />
            </div>

            <Button className="w-full" onClick={handleIssue} disabled={loading || !selectedStudent || !selectedEquipment}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Issuing...</> : <><ArrowUpFromLine className="w-4 h-4 mr-2" />Issue Equipment</>}
            </Button>
          </CardContent>
        </Card>

        {/* Active Issues */}
        <Card>
          <CardHeader><CardTitle className="text-base">Active Issues</CardTitle></CardHeader>
          <CardContent className="p-0">
            {txLoading ? (
              <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : transactions.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No active issues</div>
            ) : (
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {transactions.map(tx => (
                  <div key={tx._id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{tx.equipmentId?.name}</p>
                        <p className="text-xs text-muted-foreground">{tx.studentId?.userId?.name} · {tx.studentId?.rollNumber}</p>
                      </div>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getStatusColor(tx.status))}>{tx.status}</span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Issued: {formatDate(tx.issueDate)}</span>
                      {tx.expectedReturnDate && <span>Due: {formatDate(tx.expectedReturnDate)}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{tx.transactionId}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
