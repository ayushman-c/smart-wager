import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Camera, CameraOff, Upload, CheckCircle, Loader2, FileText } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Textarea } from '../components/ui/textarea'
import { formatDateTime } from '../lib/utils'

export default function SubmitPractical() {
  const [scanning, setScanning] = useState(false)
  const [qrInfo, setQrInfo] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [images, setImages] = useState([])
  const [pdf, setPdf] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const html5QrRef = useRef(null)

  const startScanner = async () => {
    try {
      html5QrRef.current = new Html5Qrcode('submit-qr-reader')
      await html5QrRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (text) => {
          await stopScanner()
          await handleScanQR(text)
        },
        () => {}
      )
      setScanning(true)
    } catch { toast.error('Camera access denied') }
  }

  const stopScanner = async () => {
    if (html5QrRef.current && scanning) {
      await html5QrRef.current.stop().catch(() => {})
      html5QrRef.current = null
    }
    setScanning(false)
  }

  useEffect(() => () => { if (html5QrRef.current) html5QrRef.current.stop().catch(() => {}) }, [])

  const handleScanQR = async (qrData) => {
    try {
      const { data } = await api.post('/submissions/scan', { qrData })
      setQrInfo(data.submissionQR)
      toast.success('QR scanned! Fill in your submission details.')
    } catch (e) { toast.error(e.response?.data?.message || 'Invalid QR') }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!qrInfo) return toast.error('Scan a submission QR first')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('qrId', qrInfo.qrId)
      fd.append('remarks', remarks)
      images.forEach(img => fd.append('images', img))
      if (pdf) fd.append('pdf', pdf)
      const { data } = await api.post('/submissions', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSubmitted(data.submission)
      setQrInfo(null); setRemarks(''); setImages([]); setPdf(null)
      toast.success('Practical submitted successfully!')
    } catch (e) { toast.error(e.response?.data?.message || 'Submission failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Submit Practical</h1>
        <p className="text-muted-foreground">Scan your teacher's QR and upload your work</p>
      </div>

      {submitted && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-6 flex items-start gap-4">
            <CheckCircle className="w-8 h-8 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300">Submission Received!</p>
              <p className="text-sm text-green-700 dark:text-green-400">Practical {submitted.practicalNumber}: {submitted.experimentName}</p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">{formatDateTime(submitted.submittedAt)}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setSubmitted(null)}>Submit Another</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!submitted && (
        <>
          {/* Step 1: Scan */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>Scan Submission QR</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div id="submit-qr-reader" className="w-full bg-muted rounded-lg min-h-[250px] overflow-hidden" />
              <div className="flex gap-3">
                {!scanning ? <Button onClick={startScanner} className="flex-1"><Camera className="w-4 h-4 mr-2" />Scan QR Code</Button>
                  : <Button onClick={stopScanner} variant="outline" className="flex-1"><CameraOff className="w-4 h-4 mr-2" />Stop Scanner</Button>}
              </div>
              {qrInfo && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-sm">
                  <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-blue-600" /><p className="font-semibold text-blue-800 dark:text-blue-300">QR Scanned</p></div>
                  <p className="text-blue-700 dark:text-blue-400"><span className="font-medium">Practical:</span> {qrInfo.practicalNumber}</p>
                  <p className="text-blue-700 dark:text-blue-400"><span className="font-medium">Experiment:</span> {qrInfo.experimentName}</p>
                  {qrInfo.subject && <p className="text-blue-700 dark:text-blue-400"><span className="font-medium">Subject:</span> {qrInfo.subject}</p>}
                  {qrInfo.deadline && <p className="text-blue-700 dark:text-blue-400"><span className="font-medium">Deadline:</span> {formatDateTime(qrInfo.deadline)}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Upload */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">2</span>Upload Practical Work</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Practical Images (up to 5)</Label>
                  <input
                    type="file" accept="image/*" multiple
                    onChange={e => setImages(Array.from(e.target.files).slice(0, 5))}
                    className="w-full text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-primary file:text-primary-foreground file:text-xs cursor-pointer"
                  />
                  {images.length > 0 && <p className="text-xs text-muted-foreground">{images.length} image(s) selected</p>}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><FileText className="w-4 h-4" />PDF Report (optional)</Label>
                  <input
                    type="file" accept="application/pdf"
                    onChange={e => setPdf(e.target.files[0])}
                    className="w-full text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-secondary file:text-secondary-foreground file:text-xs cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} placeholder="Any notes for your teacher..." />
                </div>

                <Button type="submit" className="w-full" disabled={loading || !qrInfo}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : <><Upload className="w-4 h-4 mr-2" />Submit Practical</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
