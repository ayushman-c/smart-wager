import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { Package, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { cn, getStatusColor, formatDate } from '../lib/utils'

export default function MyEquipment() {
  const { studentProfile } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      if (!studentProfile?._id) return
      try {
        const { data } = await api.get(`/issue/student/${studentProfile._id}`)
        setTransactions(data.transactions)
      } catch {} finally { setLoading(false) }
    }
    fetch()
  }, [studentProfile])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Equipment</h1>
        <p className="text-muted-foreground">Equipment currently issued to you</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Package className="w-10 h-10 mb-2 opacity-40" />
            <p>No equipment currently issued</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {transactions.map(tx => (
            <Card key={tx._id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {tx.equipmentId?.image ? (
                    <img src={tx.equipmentId.image} alt="" className="w-12 h-12 rounded-lg object-cover border" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{tx.equipmentId?.name}</p>
                    <p className="text-xs text-muted-foreground">{tx.equipmentId?.equipmentId}</p>
                    <p className="text-xs text-muted-foreground">{tx.equipmentId?.category}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Issued</span>
                    <span>{formatDate(tx.issueDate)}</span>
                  </div>
                  {tx.expectedReturnDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due</span>
                      <span className={new Date(tx.expectedReturnDate) < new Date() ? 'text-red-600 font-medium' : ''}>{formatDate(tx.expectedReturnDate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(tx.status))}>{tx.status}</span>
                  </div>
                </div>
                {tx.notes && <p className="mt-2 text-xs text-muted-foreground italic border-t pt-2">"{tx.notes}"</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
