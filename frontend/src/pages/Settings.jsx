import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { Sun, Moon, Lock, User, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'

export default function Settings() {
  const { user, loadUser, theme, toggleTheme } = useAuth()
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', department: user?.department || '', contactNumber: user?.contactNumber || '' })
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [profileLoading, setProfileLoading] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    try {
      await api.put('/users/profile', profileForm)
      toast.success('Profile updated')
      loadUser()
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setProfileLoading(false) }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    if (pwdForm.newPassword !== pwdForm.confirmPassword) return toast.error('Passwords do not match')
    if (pwdForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    setPwdLoading(true)
    try {
      await api.put('/auth/password', { currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword })
      toast.success('Password changed successfully')
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setPwdLoading(false) }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Switch between light and dark mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <Sun className="w-4 h-4" /> Light
            </button>
            <button onClick={toggleTheme} className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <Moon className="w-4 h-4" /> Dark
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" />Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={user?.email} disabled className="opacity-60" /></div>
            <div className="space-y-2"><Label>Department</Label><Input value={profileForm.department} onChange={e => setProfileForm(f => ({ ...f, department: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Contact Number</Label><Input value={profileForm.contactNumber} onChange={e => setProfileForm(f => ({ ...f, contactNumber: e.target.value }))} /></div>
            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Lock className="w-4 h-4" />Change Password</CardTitle>
          <CardDescription>Keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={pwdForm.currentPassword} onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>New Password</Label><Input type="password" value={pwdForm.newPassword} onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Confirm New Password</Label><Input type="password" value={pwdForm.confirmPassword} onChange={e => setPwdForm(f => ({ ...f, confirmPassword: e.target.value }))} required /></div>
            <Button type="submit" disabled={pwdLoading}>
              {pwdLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</> : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Account Information</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          {[['Role', user?.role], ['User ID', user?._id], ['Joined', user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—']].map(([l, v]) => (
            <div key={l} className="flex justify-between">
              <span className="text-muted-foreground">{l}</span>
              <span className="font-medium font-mono text-xs">{v}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
