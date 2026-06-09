import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Search, ArrowDownToLine, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { cn, getStatusColor, formatDate } from '../lib/utils'

const CONDITIONS = ['Good', 'Damaged', 'Missing Parts', 'Needs Maintenance']

export default function ReturnEquipment() {
  const [transactions, setTransactions] = useState([])
  const [returns, setReturns] = useState([])
  const [search, setSearch] = useState('')
  const [selectedTx, setSelectedTx] = useState(null)
  const [condition, setCondition] = useState('')
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(false)
  const [txLoading, setTxLoading] = useState(true)
  const [retLoading, setRetLoading] = useState(true)

  const fetchActive = useCallback(async () => {
    setTxLoading(true)
    try {
      const params = new URLSearchParams({ status: 'Issued', limit: 30 })
      if (search) params.append('search', search)
      const { data } = await api.get(`/issue?${params}`)
      setTransactions(data.transactions)
    } catch {} finally { setTxLoading(false) }
  }, [search])

  const fetchReturns = useCallback(async () => {
    setRetLoading(true)
    try {
      const { data } = await api.get('/return?limit=15')
      setReturns(data.transactions)
    } catch {} finally { setRetLoading(false) }
  }, [])

  useEffect(() => { fetchActive() }, [fetchActive])
  useEffect(() => { fetchReturns() }, [fetchReturns])

  const handleReturn = async () => {
    if (!selectedTx || !condition) return toast.error('Select transaction and condition')
    setLoading(true)
    try {
      await api.post('/return', { issueTransactionId: selectedTx._id, condition, remarks })
      toast.success('Equipment returned successfully')
      setSelectedTx(null); setCondition(''); setRemarks('')
      fetchActive(); fetchReturns()
    } catch (e) { toast.error(e.response?.data?.message || 'Return failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Return Equipment</h1>
        <p className="text-muted-foreground">Process equipment returns</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Return Form */}
        <Card>
          <CardHeader><CardTitle className="text-base">Process Return</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Search active issues */}
            <div className="space-y-2">
              <Label>Find Active Issue</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search by student or equipment..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            {/* Active Transactions List */}
            <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
              {txLoading ? (
                <div className="flex items-center justify-center h-20"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">No active issues found</div>
              ) : transactions.map(tx => (
                <button key={tx._id}
                  onClick={() => setSelectedTx(selectedTx?._id === tx._id ? null : tx)}
                  className={cn('w-full text-left px-3 py-2 hover:bg-accent text-sm transition-colors', selectedTx?._id === tx._id && 'bg-primary/5 border-l-2 border-primary')}>
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{tx.equipmentId?.name}</p>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', getStatusColor(tx.status))}>{tx.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{tx.studentId?.userId?.name} · {tx.studentId?.rollNumber}</p>
                  <p className="text-xs text-muted-foreground font-mono">{tx.transactionId} · Issued: {formatDate(tx.issueDate)}</p>
                </button>
              ))}
            </div>

            {selectedTx && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <p className="font-medium text-blue-800 dark:text-blue-300">Selected: {selectedTx.equipmentId?.name}</p>
                </div>
                <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">Student: {selectedTx.studentId?.userId?.name}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Condition on Return *</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} placeholder="Any notes about the condition..." />
            </div>

            <Button className="w-full" onClick={handleReturn} disabled={loading || !selectedTx || !condition}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : <><ArrowDownToLine className="w-4 h-4 mr-2" />Process Return</>}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Returns */}
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Returns</CardTitle></CardHeader>
          <CardContent className="p-0">
            {retLoading ? (
              <div className="flex items-center justify-center h-48"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : returns.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No returns yet</div>
            ) : (
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {returns.map(tx => (
                  <div key={tx._id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{tx.equipmentId?.name}</p>
                        <p className="text-xs text-muted-foreground">{tx.studentId?.userId?.name}</p>
                      </div>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', tx.condition === 'Good' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700')}>{tx.condition}</span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Returned: {formatDate(tx.returnDate)}</span>
                      {tx.isOverdue && <span className="text-red-500">⚠ Overdue by {tx.overdueDays}d</span>}
                    </div>
                    {tx.remarks && <p className="text-xs text-muted-foreground italic mt-0.5">"{tx.remarks}"</p>}
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
