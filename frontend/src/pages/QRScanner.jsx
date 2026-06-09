import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { QrCode, Camera, CameraOff, Package, ClipboardList } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { cn, getStatusColor, formatDate } from '../lib/utils'

export default function QRScanner() {
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const scannerRef = useRef(null)
  const html5QrRef = useRef(null)

  const startScanner = async () => {
    try {
      html5QrRef.current = new Html5Qrcode('qr-reader')
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => handleScan(decodedText),
        () => {}
      )
      setScanning(true)
    } catch (err) {
      toast.error('Camera access denied or not available')
    }
  }

  const stopScanner = async () => {
    if (html5QrRef.current && scanning) {
      await html5QrRef.current.stop()
      html5QrRef.current = null
    }
    setScanning(false)
  }

  useEffect(() => {
    return () => { if (html5QrRef.current) { html5QrRef.current.stop().catch(() => {}) } }
  }, [])

  const handleScan = async (data) => {
    if (loading) return
    await stopScanner()
    setLoading(true)
    try {
      const response = await api.post('/qr/decode', { qrData: data })
      setResult(response.data)
      toast.success(`QR decoded: ${response.data.type}`)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to decode QR')
      setResult(null)
    } finally { setLoading(false) }
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manualInput.trim()) handleScan(manualInput.trim())
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">QR Scanner</h1>
        <p className="text-muted-foreground">Scan equipment or submission QR codes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><QrCode className="w-4 h-4" />Camera Scanner</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div id="qr-reader" className="w-full bg-muted rounded-lg min-h-[300px] overflow-hidden" />
            <div className="flex gap-3">
              {!scanning ? (
                <Button onClick={startScanner} className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />Start Camera
                </Button>
              ) : (
                <Button onClick={stopScanner} variant="outline" className="flex-1">
                  <CameraOff className="w-4 h-4 mr-2" />Stop Camera
                </Button>
              )}
              <Button variant="outline" onClick={() => setResult(null)}>Clear</Button>
            </div>

            {/* Manual input fallback */}
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-2">Or enter QR data manually:</p>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm"
                  placeholder='{"type":"equipment","equipmentId":"...","_id":"..."}'
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value)}
                />
                <Button type="submit" size="sm" disabled={loading}>Lookup</Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader><CardTitle className="text-base">Scan Result</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : !result ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <QrCode className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Scan a QR code to see details</p>
              </div>
            ) : result.type === 'equipment' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Package className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">Equipment QR</p>
                    <p className="font-bold text-lg">{result.data.name}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    ['Equipment ID', result.data.equipmentId],
                    ['Category', result.data.category],
                    ['Lab Section', result.data.labSection || '—'],
                    ['Total Qty', result.data.quantity],
                    ['Available', result.data.availableQuantity],
                    ['Location', result.data.location || '—'],
                    ['Manufacturer', result.data.manufacturer || '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between py-1 border-b last:border-0">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Status</span>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getStatusColor(result.data.status))}>{result.data.status}</span>
                  </div>
                </div>
              </div>
            ) : result.type === 'submission' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <ClipboardList className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">Submission QR</p>
                    <p className="font-bold text-lg">{result.data.experimentName}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    ['Practical No.', result.data.practicalNumber],
                    ['Subject', result.data.subject || '—'],
                    ['QR ID', result.data.qrId],
                    ['Teacher', result.data.teacherId?.name || '—'],
                    ['Deadline', result.data.deadline ? formatDate(result.data.deadline) : '—'],
                    ['Status', result.data.isActive ? 'Active' : 'Inactive'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between py-1 border-b last:border-0">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
