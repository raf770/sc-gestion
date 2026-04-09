import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || ''
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100')
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')

  let produits, total
  if (q) {
    const like = '%' + q + '%'
    produits = db.prepare('SELECT * FROM Produit WHERE nom LIKE ? OR ref LIKE ? OR categorie LIKE ? ORDER BY ref LIMIT ? OFFSET ?').all(like, like, like, limit, offset)
    total = db.prepare('SELECT COUNT(*) as c FROM Produit WHERE nom LIKE ? OR ref LIKE ? OR categorie LIKE ?').get(like, like, like) as any
  } else {
    produits = db.prepare('SELECT * FROM Produit ORDER BY ref LIMIT ? OFFSET ?').all(limit, offset)
    total = db.prepare('SELECT COUNT(*) as c FROM Produit').get() as any
  }
  return NextResponse.json({ produits, total: total.c })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const id = 'prod_' + Date.now().toString(36)
  db.prepare('INSERT INTO Produit (id, ref, nom, prixVente, prixAchat, tva, stock, stockMin, categorie, ecoDeee, ecoDea) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, body.ref, body.nom, body.prixVente || 0, body.prixAchat || 0, body.tva || 20, body.stock || 0, body.stockMin || 5, body.categorie || 'Divers', body.ecoDeee || 0, body.ecoDea || 0
  )
  return NextResponse.json({ id, ...body })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  db.prepare('UPDATE Produit SET ref=?, nom=?, prixVente=?, prixAchat=?, tva=?, stock=?, stockMin=?, categorie=?, ecoDeee=?, ecoDea=? WHERE id=?').run(
    body.ref, body.nom, body.prixVente, body.prixAchat, body.tva, body.stock, body.stockMin, body.categorie, body.ecoDeee, body.ecoDea, body.id
  )
  return NextResponse.json(body)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  db.prepare('DELETE FROM Produit WHERE id=?').run(id)
  return NextResponse.json({ ok: true })
}
