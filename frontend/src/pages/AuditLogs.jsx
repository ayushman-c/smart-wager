import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import { Shield, Loader2, Search } from 'lucide-react'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Button } from '../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { formatDateTime } from '../lib/utils'

const ACTIONS = ['Login', 'Logout', 'EquipmentAdded', 'EquipmentEdited', 'EquipmentDeleted', 'EquipmentIssued', 'EquipmentReturned', 'StudentAdded', 'StudentEdited', 'StudentDeleted', 'SubmissionUploaded', 'SubmissionApproved', 'SubmissionRejected', 'QRGenerated', 'UserCreated', 'UserDeleted', 'ReportGenerated', 'Other']

const ACTION_COLORS = {
  Login: 'bg-green-100 text-green-700',
  Logout: 'bg-gray-100 text-gray-700',
  EquipmentAdded: 'bg-blue-100 text-blue-700',
  EquipmentDeleted: 'bg-red-100 text-red-700',
  EquipmentIssued: 'bg-indigo-100 text-indigo-700',
  EquipmentReturned: 'bg-teal-100 text-teal-700',
  StudentAdded: 'bg-purple-100 text-purple-700',
  SubmissionUploaded: 'bg-orange-100 text-orange-700',
  QRGenerated: 'bg-yellow-100 text-yellow-700',
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 30

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: LIMIT })
      if (filterAction) params.append('action', filterAction)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      const { data } = await api.get(`/audit?${params}`)
      setLogs(data.logs); setTotal(data.total)
    } catch {} finally { setLoading(false) }
  }, [page, filterAction, startDate, endDate])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">{total} total log entries</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={filterAction} onValueChange={v => { setFilterAction(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="All Actions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {ACTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-2 flex-1">
              <Input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1) }} className="flex-1" />
              <Input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1) }} className="flex-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Shield className="w-10 h-10 mb-2 opacity-30" />
              <p>No logs found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log._id}>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>{log.action}</span>
                    </TableCell>
                    <TableCell><span className="text-sm font-medium">{log.userName || '—'}</span></TableCell>
                    <TableCell><span className="text-sm capitalize">{log.userRole || '—'}</span></TableCell>
                    <TableCell><span className="text-sm text-muted-foreground">{log.description || '—'}</span></TableCell>
                    <TableCell><span className="text-xs font-mono text-muted-foreground">{log.ipAddress || '—'}</span></TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span></TableCell>
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
    </div>
  )
}
