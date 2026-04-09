import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  db.prepare(`UPDATE Document SET status = 'retard' WHERE type = 'facture' AND status = 'envoyé' AND echeance IS NOT NULL AND echeance < date('now')`).run()

  const clients = (db.prepare('SELECT COUNT(*) as c FROM Client').get() as any).c
  const produits = (db.prepare('SELECT COUNT(*) as c FROM Produit').get() as any).c
  const factures = (db.prepare("SELECT COUNT(*) as c FROM Document WHERE type = 'facture'").get() as any).c
  const devis = (db.prepare("SELECT COUNT(*) as c FROM Document WHERE type = 'devis'").get() as any).c
  const avoirs = (db.prepare("SELECT COUNT(*) as c FROM Document WHERE type = 'avoir'").get() as any).c
  const enRetard = (db.prepare("SELECT COUNT(*) as c FROM Document WHERE type = 'facture' AND status = 'retard'").get() as any).c

  const caByYear = db.prepare(`
    SELECT COALESCE(substr(date,1,4), 'Autre') as year,
      COALESCE(SUM(CASE WHEN status IN ('payé','envoyé','retard') THEN totalTTC ELSE 0 END), 0) as caTotal,
      COALESCE(SUM(CASE WHEN status = 'payé' THEN totalTTC ELSE 0 END), 0) as caPaye,
      COALESCE(SUM(CASE WHEN status = 'envoyé' THEN totalTTC ELSE 0 END), 0) as caEnCours,
      COALESCE(SUM(CASE WHEN status = 'retard' THEN totalTTC ELSE 0 END), 0) as caRetard,
      COUNT(*) as nbFactures
    FROM Document WHERE type = 'facture' AND status != 'annulé'
    GROUP BY year ORDER BY year DESC
  `).all()

  const caByMonth = db.prepare(`
    SELECT substr(date,6,2) as month, COALESCE(SUM(totalTTC),0) as total, COUNT(*) as nb
    FROM Document WHERE type = 'facture' AND status IN ('payé','envoyé','retard')
    AND substr(date,1,4) = ?
    GROUP BY month ORDER BY month
  `).all(new Date().getFullYear().toString())

  const topClients = db.prepare("SELECT c.nom, SUM(d.totalTTC) as total, COUNT(d.id) as nb FROM Document d JOIN Client c ON d.clientId = c.id WHERE d.type = 'facture' AND d.status IN ('payé','envoyé','retard') GROUP BY c.id ORDER BY total DESC LIMIT 10").all()

  return NextResponse.json({ clients, produits, factures, devis, avoirs, enRetard, caByYear, caByMonth, topClients })
}
