import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Package, Users, GraduationCap, ClipboardList, AlertTriangle, CheckCircle, Wrench, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { formatDate } from '../lib/utils'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function StatCard({ title, value, icon: Icon, color, description }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value ?? '—'}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [charts, setCharts] = useState(null)
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, c, a] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/charts'),
          api.get('/dashboard/activity'),
        ])
        setStats(s.data.stats)
        setCharts(c.data.charts)
        setActivity(a.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  )

  const issueChartData = charts?.issueData?.map(d => ({ date: d._id, Issues: d.count })) || []
  const returnChartData = charts?.returnData?.map(d => ({ date: d._id, Returns: d.count })) || []

  // Merge issue and return for combined chart
  const combined = {}
  issueChartData.forEach(d => { combined[d.date] = { date: d.date, Issues: d.Issues, Returns: 0 } })
  returnChartData.forEach(d => { if (combined[d.date]) combined[d.date].Returns = d.Returns; else combined[d.date] = { date: d.date, Issues: 0, Returns: d.Returns } })
  const combinedData = Object.values(combined).sort((a, b) => a.date.localeCompare(b.date))

  const submissionPieData = charts?.submissionStats?.map(d => ({ name: d._id, value: d.count })) || []
  const categoryData = charts?.equipmentByCategory?.map(d => ({ name: d._id, total: d.total, issued: d.issued })) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Equipment" value={stats?.totalEquipment} icon={Package} color="bg-blue-500" />
        <StatCard title="Available" value={stats?.availableEquipment} icon={CheckCircle} color="bg-green-500" />
        <StatCard title="Issued" value={stats?.issuedEquipment} icon={TrendingUp} color="bg-indigo-500" />
        <StatCard title="Missing / Damaged" value={(stats?.missingEquipment || 0) + (stats?.damagedEquipment || 0)} icon={AlertTriangle} color="bg-red-500" />
        <StatCard title="Total Students" value={stats?.totalStudents} icon={GraduationCap} color="bg-purple-500" />
        <StatCard title="Teachers" value={stats?.totalTeachers} icon={Users} color="bg-teal-500" />
        <StatCard title="Submissions" value={stats?.totalSubmissions} icon={ClipboardList} color="bg-orange-500" />
        <StatCard title="Overdue Issues" value={stats?.overdueIssues} icon={AlertTriangle} color="bg-rose-500" description="Require immediate action" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Daily Issues & Returns (Last 7 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Issues" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Returns" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Submission Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={submissionPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {submissionPieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Utilization + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Equipment by Category</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" name="Total" fill="#6366f1" radius={[0, 4, 4, 0]} />
                <Bar dataKey="issued" name="Issued" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top Issued Equipment</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {charts?.topEquipment?.map((eq, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{eq.name}</p>
                    <p className="text-xs text-muted-foreground">{eq.category}</p>
                  </div>
                  <span className="text-sm font-semibold">{eq.count}x</span>
                </div>
              )) || <p className="text-muted-foreground text-sm text-center py-4">No data yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Issues</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity?.recentIssues?.length ? activity.recentIssues.map(tx => (
                <div key={tx._id} className="flex items-start gap-3 border-b pb-2 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.equipmentId?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{tx.studentId?.userId?.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.issueDate)}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-4">No recent issues</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Returns</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity?.recentReturns?.length ? activity.recentReturns.map(tx => (
                <div key={tx._id} className="flex items-start gap-3 border-b pb-2 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.equipmentId?.name}</p>
                    <p className="text-xs text-muted-foreground">{tx.condition}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.returnDate)}</p>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-4">No recent returns</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Submissions</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activity?.recentSubmissions?.length ? activity.recentSubmissions.map(sub => (
                <div key={sub._id} className="flex items-start gap-3 border-b pb-2 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{sub.experimentName}</p>
                    <p className="text-xs text-muted-foreground truncate">{sub.studentId?.userId?.name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${sub.verificationStatus === 'Approved' ? 'bg-green-100 text-green-700' : sub.verificationStatus === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {sub.verificationStatus}
                    </span>
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground text-center py-4">No recent submissions</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
