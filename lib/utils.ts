import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate age from birth date
 * @param tanggalLahir - Birth date (YYYY-MM-DD format or Date object)
 * @returns Age in years
 */
export function calculateAge(tanggalLahir: string | Date): number {
  const birthDate = typeof tanggalLahir === 'string' 
    ? new Date(tanggalLahir) 
    : tanggalLahir
  
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  // Adjust if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

/**
 * Format date to YYYY-MM-DD for input fields
 * @param date - Date object or string
 * @returns Formatted date string
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format date to Indonesian readable format
 * @param date - Date object or string
 * @returns Formatted date string (e.g., "1 Januari 2000")
 */
export function formatDateIndonesian(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}
