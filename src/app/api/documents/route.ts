import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || ''
  const q = req.nextUrl.searchParams.get('q') || ''
  const status = req.nextUrl.searchParams.get('status') || ''
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')

  let where = 'WHERE 1=1'
  const params: any[] = []
  if (type) { where += ' AND d.type = ?'; params.push(type) }
  if (status) { where += ' AND d.status = ?'; params.push(status) }
  if (q) { where += ' AND (d.numero LIKE ? OR c.nom LIKE ?)'; params.push('%' + q + '%', '%' + q + '%') }

  const docs = db.prepare(`SELECT d.*, c.nom as clientNom, c.email as clientEmail, c.adresse as clientAdresse, c.ville as clientVille, c.cp as clientCp FROM Document d LEFT JOIN Client c ON d.clientId = c.id ${where} ORDER BY d.date DESC LIMIT ? OFFSET ?`).all(...params, limit, offset)
  const total = (db.prepare(`SELECT COUNT(*) as c FROM Document d LEFT JOIN Client c ON d.clientId = c.id ${where}`).get(...params) as any).c

  // Stats par statut (seulement filtré par type, pas par status ni q)
  let statsWhere = 'WHERE 1=1'
  const statsParams: any[] = []
  if (type) { statsWhere += ' AND type = ?'; statsParams.push(type) }

  const totaux = db.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN status = 'payé' THEN totalTTC ELSE 0 END), 0) as totalPaye,
      COALESCE(SUM(CASE WHEN status = 'envoyé' THEN totalTTC ELSE 0 END), 0) as totalEnCours,
      COALESCE(SUM(CASE WHEN status = 'retard' THEN totalTTC ELSE 0 END), 0) as totalRetard,
      COALESCE(SUM(CASE WHEN status = 'brouillon' THEN totalTTC ELSE 0 END), 0) as totalBrouillon,
      COALESCE(SUM(CASE WHEN status IN ('payé','envoyé','retard') THEN totalTTC ELSE 0 END), 0) as totalCA,
      COALESCE(SUM(restePayer), 0) as totalRestePayer,
      COUNT(CASE WHEN status = 'payé' THEN 1 END) as nbPaye,
      COUNT(CASE WHEN status = 'envoyé' THEN 1 END) as nbEnCours,
      COUNT(CASE WHEN status = 'retard' THEN 1 END) as nbRetard,
      COUNT(CASE WHEN status = 'brouillon' THEN 1 END) as nbBrouillon
    FROM Document ${statsWhere}
  `).get(...statsParams) as any

  return NextResponse.json({ documents: docs, total, totaux })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const id = 'doc_' + Date.now().toString(36)
  let numero = body.numero
  if (!numero) {
    const prefix = body.type === 'facture' ? 'FA' : body.type === 'devis' ? 'DE' : body.type === 'avoir' ? 'AV' : 'CM'
    const last = db.prepare("SELECT numero FROM Document WHERE type = ? ORDER BY numero DESC LIMIT 1").get(body.type) as any
    let nextNum = 1
    if (last) { const match = last.numero.match(/\d+$/); if (match) nextNum = parseInt(match[0]) + 1 }
    numero = prefix + '-' + String(nextNum).padStart(5, '0')
  }
  db.prepare(`INSERT INTO Document (id, type, numero, clientId, date, echeance, status, source, objet, entityId, showLogo, isProforma, totalHT, totalTVA, totalTTC, restePayer, notes, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`).run(
    id, body.type, numero, body.clientId, body.date || new Date().toISOString(), body.echeance || null,
    body.status || 'brouillon', body.source || null, body.objet || null, body.entityId || 'sc_mobilier',
    body.showLogo ? 1 : 0, body.isProforma ? 1 : 0, body.totalHT || 0, body.totalTVA || 0, body.totalTTC || 0, body.restePayer || 0, body.notes || null
  )
  if (body.lignes && body.lignes.length > 0) {
    const insertLine = db.prepare('INSERT INTO LigneDocument (id, documentId, produitId, description, qte, prixUnit, tva, remise, ordre) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    for (let i = 0; i < body.lignes.length; i++) { const l = body.lignes[i]; insertLine.run('lig_' + Date.now().toString(36) + '_' + i, id, l.produitId || null, l.description || null, l.qte || 1, l.prixUnit || 0, l.tva || 20, l.remise || 0, i) }
  }
  return NextResponse.json({ id, numero })
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  db.prepare(`UPDATE Document SET clientId=?, date=?, echeance=?, status=?, source=?, objet=?, entityId=?, showLogo=?, isProforma=?, totalHT=?, totalTVA=?, totalTTC=?, restePayer=?, notes=?, updatedAt=datetime('now') WHERE id=?`).run(
    body.clientId, body.date, body.echeance, body.status, body.source, body.objet, body.entityId,
    body.showLogo ? 1 : 0, body.isProforma ? 1 : 0, body.totalHT, body.totalTVA, body.totalTTC, body.restePayer, body.notes, body.id
  )
  if (body.lignes) {
    db.prepare('DELETE FROM LigneDocument WHERE documentId = ?').run(body.id)
    const insertLine = db.prepare('INSERT INTO LigneDocument (id, documentId, produitId, description, qte, prixUnit, tva, remise, ordre) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    for (let i = 0; i < body.lignes.length; i++) { const l = body.lignes[i]; insertLine.run('lig_' + Date.now().toString(36) + '_' + i, body.id, l.produitId || null, l.description || null, l.qte || 1, l.prixUnit || 0, l.tva || 20, l.remise || 0, i) }
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  db.prepare('DELETE FROM Document WHERE id=?').run(id)
  return NextResponse.json({ ok: true })
}
