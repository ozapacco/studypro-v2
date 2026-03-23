import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const AVAILABLE_EXAMS = [
  'Polícia Civil (Agente/Escrivão)',
  'Polícia Militar (Soldado/Oficial)',
  'Polícia Federal',
  'Polícia Rodoviária Federal',
  'Guarda Municipal',
  'Polícia Penal',
];

export async function GET() {
  // Em um cenário real, buscaríamos do banco. 
  // Aqui seguimos o dicionário pré-definido para Carreiras Policiais.
  return NextResponse.json({
    exams: AVAILABLE_EXAMS,
  });
}
