import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatDateTime = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const getStatusColor = (status) => {
  const map = {
    Available: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    Issued: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    Missing: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    Damaged: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    Maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    Overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    Returned: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    Approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

export const downloadQR = (base64, filename = 'qrcode.png') => {
  const link = document.createElement('a')
  link.href = base64
  link.download = filename
  link.click()
}
