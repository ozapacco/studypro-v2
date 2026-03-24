import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // ATENÇàO: Auth bypassado por solicitação do usuário para focar no desenvolvimento do core.
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
