const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const db = new Database(path.join(__dirname, 'prisma', 'dev.db'))

console.log('📦 Mise à jour palettisation...')

// 1. Add new columns if they don't exist
const newCols = [
  ['couleur', 'TEXT'],
  ['longueur', 'INTEGER'],
  ['largeur', 'INTEGER'],
  ['hauteur', 'INTEGER'],
  ['poids', 'REAL'],
  ['poidsNet', 'REAL'],
  ['pcb', 'INTEGER'],
  ['eanMaster', 'TEXT'],
  ['paletteProduits', 'INTEGER'],
  ['paletteCartons', 'INTEGER'],
]

const existingCols = db.prepare("PRAGMA table_info(Produit)").all().map(c => c.name)

for (const [col, type] of newCols) {
  if (!existingCols.includes(col)) {
    db.exec(`ALTER TABLE Produit ADD COLUMN ${col} ${type}`)
    console.log(`  ✅ Colonne ajoutée: ${col}`)
  }
}

// 2. Load palettisation data
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'prisma', 'seed-data', 'palettisation.json'), 'utf-8'))

// 3. Update existing products + create new ones
const updateStmt = db.prepare(`UPDATE Produit SET 
  couleur = COALESCE(?, couleur),
  longueur = COALESCE(?, longueur),
  largeur = COALESCE(?, largeur),
  hauteur = COALESCE(?, hauteur),
  poids = COALESCE(?, poids),
  poidsNet = COALESCE(?, poidsNet),
  ean = COALESCE(?, ean),
  pcb = COALESCE(?, pcb),
  eanMaster = COALESCE(?, eanMaster),
  paletteProduits = COALESCE(?, paletteProduits),
  paletteCartons = COALESCE(?, paletteCartons)
  WHERE ref = ?`)

const insertStmt = db.prepare(`INSERT OR IGNORE INTO Produit 
  (id, ref, nom, couleur, longueur, largeur, hauteur, poids, poidsNet, ean, pcb, eanMaster, paletteProduits, paletteCartons, prixVente, prixAchat, tva, stock, stockMin, categorie, ecoDeee, ecoDea, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 20, 0, 5, 'Divers', 0, 0, datetime('now'))`)

let updated = 0, created = 0, skipped = 0

const tx = db.transaction((items) => {
  for (const p of items) {
    // Try update first
    const result = updateStmt.run(
      p.couleur, p.longueur, p.largeur, p.hauteur, p.poids, p.poidsNet,
      p.ean, p.pcb, p.eanMaster, p.paletteProduits, p.paletteCartons, p.ref
    )
    
    if (result.changes > 0) {
      updated++
    } else {
      // Product doesn't exist, create it
      const nom = p.designation || p.ref
      insertStmt.run(
        'prod_' + p.ref, p.ref, nom, p.couleur,
        p.longueur, p.largeur, p.hauteur, p.poids, p.poidsNet,
        p.ean, p.pcb, p.eanMaster, p.paletteProduits, p.paletteCartons
      )
      created++
    }
  }
})

tx(data)

console.log(`\n🎉 Palettisation importée !`)
console.log(`  ✅ ${updated} produits mis à jour`)
console.log(`  ✅ ${created} nouveaux produits créés`)
console.log(`  📊 Total produits: ${db.prepare('SELECT COUNT(*) as c FROM Produit').get().c}`)
console.log(`  📊 Avec EAN: ${db.prepare("SELECT COUNT(*) as c FROM Produit WHERE ean IS NOT NULL AND ean != ''").get().c}`)
console.log(`  📊 Avec dimensions: ${db.prepare('SELECT COUNT(*) as c FROM Produit WHERE longueur IS NOT NULL').get().c}`)

db.close()
