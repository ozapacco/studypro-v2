import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StudyPro - Orquestrador Adaptativo de Estudos',
  description: 'Sistema nervoso central do seu estudo para concursos policiais',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
