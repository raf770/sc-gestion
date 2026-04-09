const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const db = new Database(path.join(__dirname, 'prisma', 'dev.db'))

console.log('🌱 Seeding database...')

// === ENTITIES ===
console.log('📦 Entities...')
db.exec(`INSERT OR IGNORE INTO Entity (id, name, address, city, siret, legal, site, email) VALUES
  ('sc_mobilier', 'SC Mobilier', '26 Rue Jean Jaurès', '92300 Levallois', '84037966300015', 'SAS au capital de 10.000 EUR', 'screencare.fr', 'contact@screencare.fr'),
  ('sc_alba', 'SC by ALBA', '8 Rue Huntziger', '92110 Clichy', '58206306100060', 'SARL au capital de 174.000 EUR', '', '')`)
db.exec(`INSERT OR IGNORE INTO Settings (id, entityId, ediSep) VALUES ('main', 'sc_mobilier', ';')`)
console.log('  ✅ 2 entités')

// === PRODUITS ===
console.log('📦 Produits...')
const produits = JSON.parse(fs.readFileSync('prisma/seed-data/produits.json', 'utf-8'))
const insertProd = db.prepare(`INSERT OR IGNORE INTO Produit (id, ref, nom, prixVente, prixAchat, tva, stock, stockMin, categorie, ecoDeee, ecoDea, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`)
const prodTx = db.transaction((items) => { for (const p of items) insertProd.run('prod_' + p.ref, p.ref, p.nom, p.prixVente, p.prixAchat || 0, p.tva || 20, p.stock || 0, p.stockMin || 5, p.categorie || 'Divers', p.ecoDeee || 0, p.ecoDea || 0) })
prodTx(produits)
console.log('  ✅ ' + produits.length + ' produits')

// === CLIENTS ===
console.log('📦 Clients...')
const clients = JSON.parse(fs.readFileSync('prisma/seed-data/clients.json', 'utf-8'))
const insertCli = db.prepare(`INSERT OR IGNORE INTO Client (id, ref, nom, email, telephone, adresse, ville, cp, pays, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`)
const cliTx = db.transaction((items) => { for (const c of items) insertCli.run('cli_' + c.ref, c.ref || null, c.nom, c.email || null, c.telephone || null, c.adresse || null, c.ville || null, c.cp || null, c.pays || 'France') })
cliTx(clients)
console.log('  ✅ ' + clients.length + ' clients')

// === FACTURES ===
console.log('📦 Factures...')
const factures = JSON.parse(fs.readFileSync('prisma/seed-data/factures.json', 'utf-8'))

// Build client name map
const allClients = db.prepare('SELECT id, nom FROM Client').all()
const clientMap = {}
for (const c of allClients) { clientMap[c.nom.toLowerCase().trim()] = c.id }

const insertDoc = db.prepare(`INSERT OR IGNORE INTO Document (id, type, numero, clientId, date, echeance, status, entityId, isProforma, totalHT, totalTVA, totalTTC, restePayer, createdAt, updatedAt, showLogo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 1)`)

let fc = 0, fs2 = 0
const facTx = db.transaction((items) => {
  for (const f of items) {
    const clientId = clientMap[f.nomClient.toLowerCase().trim()]
    if (!clientId) { fs2++; continue }
    const ttc = f.totalTTC || 0
    const ht = Math.round((ttc / 1.2) * 100) / 100
    const tva = Math.round((ttc - ht) * 100) / 100
    const isPro = f.isProforma ? 1 : 0
    try {
      insertDoc.run('doc_' + f.numero, 'facture', f.numero, clientId, f.date || null, f.echeance || null, f.status || 'brouillon', 'sc_mobilier', isPro, ht, tva, ttc, f.restePayer || 0)
      fc++
    } catch(e) { fs2++ }
  }
})
facTx(factures)
console.log('  ✅ ' + fc + ' factures (' + fs2 + ' ignorées)')

// === STATS ===
console.log('\n🎉 Seed terminé !')
const counts = {
  e: db.prepare('SELECT COUNT(*) as c FROM Entity').get().c,
  c: db.prepare('SELECT COUNT(*) as c FROM Client').get().c,
  p: db.prepare('SELECT COUNT(*) as c FROM Produit').get().c,
  d: db.prepare('SELECT COUNT(*) as c FROM Document').get().c,
}
console.log('📊 ' + counts.e + ' entités | ' + counts.c + ' clients | ' + counts.p + ' produits | ' + counts.d + ' documents')

db.close()
