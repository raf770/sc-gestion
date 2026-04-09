const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  console.log('📦 Creating entities...')
  await prisma.entity.upsert({
    where: { id: 'sc_mobilier' },
    update: {},
    create: { id: 'sc_mobilier', name: 'SC Mobilier', address: '26 Rue Jean Jaurès', city: '92300 Levallois', siret: '84037966300015', legal: 'SAS au capital de 10.000 EUR', site: 'screencare.fr', email: 'contact@screencare.fr' },
  })
  await prisma.entity.upsert({
    where: { id: 'sc_alba' },
    update: {},
    create: { id: 'sc_alba', name: 'SC by ALBA', address: '8 Rue Huntziger', city: '92110 Clichy', siret: '58206306100060', legal: 'SARL au capital de 174.000 EUR', site: '', email: '' },
  })
  console.log('  ✅ 2 entités')

  await prisma.settings.upsert({
    where: { id: 'main' },
    update: {},
    create: { id: 'main', entityId: 'sc_mobilier' },
  })

  console.log('📦 Importing produits...')
  const produits = JSON.parse(fs.readFileSync(path.join(__dirname, 'produits.json'), 'utf-8'))
  let prodCount = 0
  for (const p of produits) {
    await prisma.produit.upsert({
      where: { id: 'prod_' + p.ref },
      update: {},
      create: { id: 'prod_' + p.ref, ref: p.ref, nom: p.nom, prixVente: p.prixVente, prixAchat: p.prixAchat || 0, tva: p.tva || 20, stock: p.stock || 0, stockMin: p.stockMin || 5, categorie: p.categorie || 'Divers', ecoDeee: p.ecoDeee || 0, ecoDea: p.ecoDea || 0 },
    })
    prodCount++
  }
  console.log('  ✅ ' + prodCount + ' produits')

  console.log('📦 Importing clients...')
  const clients = JSON.parse(fs.readFileSync(path.join(__dirname, 'clients.json'), 'utf-8'))
  let cid = 0
  for (let i = 0; i < clients.length; i += 500) {
    const batch = clients.slice(i, i + 500)
    await prisma.client.createMany({
      data: batch.map(function(c) { return { id: 'cli_' + (c.ref || cid++), ref: c.ref || null, nom: c.nom, email: c.email || null, telephone: c.telephone || null, adresse: c.adresse || null, ville: c.ville || null, cp: c.cp || null, pays: c.pays || 'France', siret: c.siret || null } }),
      skipDuplicates: true,
    })
    process.stdout.write('  ' + Math.min(i + 500, clients.length) + '/' + clients.length + '\r')
  }
  console.log('  ✅ ' + clients.length + ' clients')

  console.log('📦 Importing factures...')
  const factures = JSON.parse(fs.readFileSync(path.join(__dirname, 'factures.json'), 'utf-8'))
  const allClients = await prisma.client.findMany({ select: { id: true, nom: true } })
  const clientMap = {}
  for (const c of allClients) { clientMap[c.nom.toLowerCase().trim()] = c.id }

  let facCount = 0, facSkipped = 0
  for (const f of factures) {
    const clientId = clientMap[f.nomClient.toLowerCase().trim()]
    if (!clientId) { facSkipped++; continue }
    var dateVal
    try { dateVal = new Date(f.date); if (isNaN(dateVal.getTime())) dateVal = new Date() } catch(e) { dateVal = new Date() }
    var echVal = null
    try { if (f.echeance) { echVal = new Date(f.echeance); if (isNaN(echVal.getTime())) echVal = null } } catch(e) { echVal = null }
    const ttc = f.totalTTC || 0
    const ht = Math.round((ttc / 1.2) * 100) / 100
    const tva = Math.round((ttc - ht) * 100) / 100
    try {
      await prisma.document.create({
        data: { id: 'doc_' + f.numero, type: 'facture', numero: f.numero, clientId: clientId, date: dateVal, echeance: echVal, status: f.status || 'brouillon', entityId: 'sc_mobilier', isProforma: f.isProforma || false, totalHT: ht, totalTVA: tva, totalTTC: ttc, restePayer: f.restePayer || 0 },
      })
      facCount++
    } catch(e) { facSkipped++ }
  }
  console.log('  ✅ ' + facCount + ' factures (' + facSkipped + ' ignorées)')

  console.log('\n🎉 Seed terminé !')
  const stats = { entities: await prisma.entity.count(), clients: await prisma.client.count(), produits: await prisma.produit.count(), documents: await prisma.document.count() }
  console.log('📊 ' + stats.entities + ' entités | ' + stats.clients + ' clients | ' + stats.produits + ' produits | ' + stats.documents + ' documents')
}

main()
  .catch(function(e) { console.error('❌ Erreur:', e); process.exit(1) })
  .finally(async function() { await prisma.$disconnect() })
