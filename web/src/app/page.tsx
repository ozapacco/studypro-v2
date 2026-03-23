import { redirect } from 'next/navigation'

export default function RootPage() {
  // Bypass de auth temporário:
  redirect('/dashboard')
}
