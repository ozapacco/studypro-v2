import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-BR')
}

export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`
}
