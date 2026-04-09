import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || ''
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100')
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')

  let clients, total
  if (q) {
    const like = '%' + q + '%'
    clients = db.prepare('SELECT * FROM Client WHERE nom LIKE ? OR email LIKE ? OR ville LIKE ? ORDER BY nom LIMIT ? OFFSET ?').all(like, like, like, limit, offset)
    total = db.prepare('SELECT COUNT(*) as c FROM Client WHERE nom LIKE ? OR email LIKE ? OR ville LIKE ?').get(like, like, like) as any
  } else {
    clients = db.prepare('SELECT * FROM Client ORDER BY nom LIMIT ? OFFSET ?').all(limit, offset)
    total = db.prepare('SELECT COUNT(*) as c FROM Client').get() as any
  }
  return NextResponse.json({ clients, total: total.c })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const id = 'cli_' + Date.now().toString(36)
  db.prepare('INSERT INTO Client (id, ref, nom, email, telephone, adresse, ville, cp, pays, siret, tvaIntra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, body.ref || null, body.nom, body.email || null, body.telephone || null, body.adresse || null, body.ville || null, body.cp || null, body.pays || 'France', body.siret || null, body.tvaIntra || null
  )
  return NextResponse.json({ id, ...body })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  db.prepare('UPDATE Client SET nom=?, email=?, telephone=?, adresse=?, ville=?, cp=?, pays=?, siret=?, tvaIntra=? WHERE id=?').run(
    body.nom, body.email, body.telephone, body.adresse, body.ville, body.cp, body.pays, body.siret, body.tvaIntra, body.id
  )
  return NextResponse.json(body)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  db.prepare('DELETE FROM Client WHERE id=?').run(id)
  return NextResponse.json({ ok: true })
}
