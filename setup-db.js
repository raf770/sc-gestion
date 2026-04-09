const Database = require('better-sqlite3')
const db = new Database('prisma/dev.db')

db.exec(`
CREATE TABLE IF NOT EXISTS Entity (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  siret TEXT NOT NULL,
  legal TEXT NOT NULL,
  site TEXT,
  email TEXT
);

CREATE TABLE IF NOT EXISTS Settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  logoUrl TEXT,
  entityId TEXT NOT NULL DEFAULT 'sc_mobilier',
  ediSep TEXT NOT NULL DEFAULT ';'
);

CREATE TABLE IF NOT EXISTS Client (
  id TEXT PRIMARY KEY,
  ref TEXT,
  nom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  adresse TEXT,
  ville TEXT,
  cp TEXT,
  pays TEXT DEFAULT 'France',
  siret TEXT,
  tvaIntra TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Produit (
  id TEXT PRIMARY KEY,
  ref TEXT NOT NULL,
  nom TEXT NOT NULL,
  prixVente REAL DEFAULT 0,
  prixAchat REAL DEFAULT 0,
  tva REAL DEFAULT 20,
  stock INTEGER DEFAULT 0,
  stockMin INTEGER DEFAULT 5,
  categorie TEXT,
  ean TEXT,
  ecoDeee REAL DEFAULT 0,
  ecoDea REAL DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Document (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  numero TEXT NOT NULL,
  clientId TEXT NOT NULL,
  date TEXT,
  echeance TEXT,
  status TEXT DEFAULT 'brouillon',
  source TEXT,
  objet TEXT,
  entityId TEXT DEFAULT 'sc_mobilier',
  showLogo INTEGER DEFAULT 1,
  isProforma INTEGER DEFAULT 0,
  sourceDocNum TEXT,
  totalHT REAL DEFAULT 0,
  totalTVA REAL DEFAULT 0,
  totalTTC REAL DEFAULT 0,
  restePayer REAL DEFAULT 0,
  notes TEXT,
  shipName TEXT,
  shipAddr TEXT,
  shipCity TEXT,
  shipZip TEXT,
  shipCountry TEXT,
  shipPhone TEXT,
  shipEmail TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES Client(id)
);

CREATE TABLE IF NOT EXISTS LigneDocument (
  id TEXT PRIMARY KEY,
  documentId TEXT NOT NULL,
  produitId TEXT,
  description TEXT,
  qte INTEGER DEFAULT 1,
  prixUnit REAL DEFAULT 0,
  tva REAL DEFAULT 20,
  remise REAL DEFAULT 0,
  ordre INTEGER DEFAULT 0,
  FOREIGN KEY (documentId) REFERENCES Document(id) ON DELETE CASCADE,
  FOREIGN KEY (produitId) REFERENCES Produit(id)
);
`)

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
console.log('✅ Tables créées:', tables.map(t => t.name).join(', '))
db.close()
