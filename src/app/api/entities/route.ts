import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  const entities = db.prepare('SELECT * FROM Entity').all()
  const settings = db.prepare('SELECT * FROM Settings WHERE id = ?').get('main')
  return NextResponse.json({ entities, settings })
}
