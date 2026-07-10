import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}

export function calculatePlatformFee(
  rate: number,
  pct: number = 13
): { fee: number; developerNet: number } {
  const fee = Math.round((rate * pct) / 100)
  return { fee, developerNet: rate - fee }
}
