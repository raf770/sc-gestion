import pkg from './src/generated/prisma/client.ts'
const { PrismaClient } = pkg
import { readFileSync } from 'fs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  console.log('📦 Creating entities...')
  await prisma.entity.upsert({ where: { id: 'sc_mobilier' }, update: {}, create: { id: 'sc_mobilier', name: 'SC Mobilier', address: '26 Rue Jean Jaurès', city: '92300 Levallois', siret: '84037966300015', legal: 'SAS au capital de 10.000 EUR', site: 'screencare.fr', email: 'contact@screencare.fr' } })
  await prisma.entity.upsert({ where: { id: 'sc_alba' }, update: {}, create: { id: 'sc_alba', name: 'SC by ALBA', address: '8 Rue Huntziger', city: '92110 Clichy', siret: '58206306100060', legal: 'SARL au capital de 174.000 EUR', site: '', email: '' } })
  console.log('  ✅ 2 entités')
  await prisma.settings.upsert({ where: { id: 'main' }, update: {}, create: { id: 'main', entityId: 'sc_mobilier' } })

  console.log('📦 Importing produits...')
  const produits = JSON.parse(readFileSync('prisma/seed-data/produits.json', 'utf-8'))
  let pc = 0
  for (const p of produits) {
    await prisma.produit.upsert({ where: { id: 'prod_' + p.ref }, update: {}, create: { id: 'prod_' + p.ref, ref: p.ref, nom: p.nom, prixVente: p.prixVente, prixAchat: p.prixAchat || 0, tva: p.tva || 20, stock: p.stock || 0, stockMin: p.stockMin || 5, categorie: p.categorie || 'Divers', ecoDeee: p.ecoDeee || 0, ecoDea: p.ecoDea || 0 } })
    pc++
  }
  console.log('  ✅ ' + pc + ' produits')

  console.log('📦 Importing clients...')
  const clients = JSON.parse(readFileSync('prisma/seed-data/clients.json', 'utf-8'))
  let cid = 0
  for (let i = 0; i < clients.length; i += 500) {
    const batch = clients.slice(i, i + 500)
    await prisma.client.createMany({ data: batch.map(c => ({ id: 'cli_' + (c.ref || cid++), ref: c.ref || null, nom: c.nom, email: c.email || null, telephone: c.telephone || null, adresse: c.adresse || null, ville: c.ville || null, cp: c.cp || null, pays: c.pays || 'France', siret: c.siret || null })), skipDuplicates: true })
    process.stdout.write('  ' + Math.min(i + 500, clients.length) + '/' + clients.length + '\r')
  }
  console.log('  ✅ ' + clients.length + ' clients')

  console.log('📦 Importing factures...')
  const factures = JSON.parse(readFileSync('prisma/seed-data/factures.json', 'utf-8'))
  const allClients = await prisma.client.findMany({ select: { id: true, nom: true } })
  const clientMap = {}
  for (const c of allClients) { clientMap[c.nom.toLowerCase().trim()] = c.id }
  let fc = 0, fs = 0
  for (const f of factures) {
    const clientId = clientMap[f.nomClient.toLowerCase().trim()]
    if (!clientId) { fs++; continue }
    let dv; try { dv = new Date(f.date); if (isNaN(dv.getTime())) dv = new Date() } catch(e) { dv = new Date() }
    let ev = null; try { if (f.echeance) { ev = new Date(f.echeance); if (isNaN(ev.getTime())) ev = null } } catch(e) { ev = null }
    const ttc = f.totalTTC || 0, ht = Math.round((ttc / 1.2) * 100) / 100, tva = Math.round((ttc - ht) * 100) / 100
    try { await prisma.document.create({ data: { id: 'doc_' + f.numero, type: 'facture', numero: f.numero, clientId, date: dv, echeance: ev, status: f.status || 'brouillon', entityId: 'sc_mobilier', isProforma: f.isProforma || false, totalHT: ht, totalTVA: tva, totalTTC: ttc, restePayer: f.restePayer || 0 } }); fc++ } catch(e) { fs++ }
  }
  console.log('  ✅ ' + fc + ' factures (' + fs + ' ignorées)')
  console.log('\n🎉 Seed terminé !')
  const s = { e: await prisma.entity.count(), c: await prisma.client.count(), p: await prisma.produit.count(), d: await prisma.document.count() }
  console.log('📊 ' + s.e + ' entités | ' + s.c + ' clients | ' + s.p + ' produits | ' + s.d + ' documents')
}

main().catch(e => { console.error('❌', e); process.exit(1) }).finally(() => prisma.$disconnect())
