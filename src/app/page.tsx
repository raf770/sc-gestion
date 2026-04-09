'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

// ========== TYPES ==========
type Client = { id: string; ref?: string; nom: string; email?: string; telephone?: string; adresse?: string; ville?: string; cp?: string; pays?: string; siret?: string; tvaIntra?: string }
type Produit = { id: string; ref: string; nom: string; prixVente: number; prixAchat: number; tva: number; stock: number; stockMin: number; categorie?: string; ecoDeee: number; ecoDea: number; couleur?: string; longueur?: number; largeur?: number; hauteur?: number; poids?: number; poidsNet?: number; ean?: string; pcb?: number; eanMaster?: string; paletteProduits?: number; paletteCartons?: number }
type Document = { id: string; type: string; numero: string; clientId: string; clientNom?: string; date: string; echeance?: string; status: string; entityId: string; totalHT: number; totalTVA: number; totalTTC: number; restePayer: number; isProforma: number; notes?: string; source?: string }
type Ligne = { produitId?: string; description: string; qte: number; prixUnit: number; tva: number; remise: number }

const TABS = [
  { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
  { id: 'factures', label: 'Factures', icon: '📄' },
  { id: 'devis', label: 'Devis', icon: '📋' },
  { id: 'avoirs', label: 'Avoirs', icon: '📑' },
  { id: 'clients', label: 'Clients', icon: '👥' },
  { id: 'produits', label: 'Produits', icon: '📦' },
  { id: 'export', label: 'Export EDI', icon: '📤' },
  { id: 'marketplace', label: 'Marketplace', icon: '🛒' },
  { id: 'social', label: 'Réseaux sociaux', icon: '📱' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'campaigns', label: 'Campagnes Ads', icon: '🎯' },
]

const STATUS_COLORS: Record<string, string> = {
  'brouillon': '#6b7280', 'envoyé': '#3b82f6', 'payé': '#22c55e', 'proforma': '#f59e0b', 'annulé': '#ef4444', 'retard': '#dc2626',
}
const SOURCES = ['Direct', 'Site web', 'Téléphone', 'Email', 'Salon', 'Recommandation', 'Shopify', 'Amazon']
const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

// ========== MAIN APP ==========
export default function SCGestion() {
  const [tab, setTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f8f9fa', color: '#1a1a2e' }}>
      <aside style={{ width: sidebarOpen ? 220 : 60, background: '#1a1a2e', color: '#fff', transition: 'width 0.2s', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #2d2d4e', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setSidebarOpen(!sidebarOpen)}>
          <span style={{ fontSize: 22 }}>🏢</span>
          {sidebarOpen && <span style={{ fontWeight: 700, fontSize: 15 }}>SC Gestion</span>}
        </div>
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {TABS.map(t => (
            <div key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', background: tab === t.id ? '#2d2d4e' : 'transparent', borderLeft: tab === t.id ? '3px solid #3b82f6' : '3px solid transparent', fontSize: 14 }}>
              <span>{t.icon}</span>
              {sidebarOpen && <span>{t.label}</span>}
            </div>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'factures' && <DocumentsList type="facture" title="Factures" />}
        {tab === 'devis' && <DocumentsList type="devis" title="Devis" />}
        {tab === 'avoirs' && <DocumentsList type="avoir" title="Avoirs" />}
        {tab === 'clients' && <ClientsList />}
        {tab === 'produits' && <ProduitsList />}
        {tab === 'export' && <ExportEDI />}
        {tab === 'marketplace' && <Marketplace />}
        {tab === 'social' && <SocialMedia />}
        {tab === 'analytics' && <Analytics />}
        {tab === 'campaigns' && <Campaigns />}
      </main>
    </div>
  )
}

// ========== DASHBOARD ==========
function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [selectedYear, setSelectedYear] = useState<string>('')
  useEffect(() => { fetch('/api/stats').then(r => r.json()).then(d => { setStats(d); if (d.caByYear?.length > 0) setSelectedYear(d.caByYear[0].year) }) }, [])
  if (!stats) return <p>Chargement...</p>

  const yearData = stats.caByYear?.find((y: any) => y.year === selectedYear)
  const totalPaye = yearData?.caPaye || 0
  const totalEnCours = yearData?.caEnCours || 0
  const totalRetard = yearData?.caRetard || 0

  const cards = [
    { label: `CA Total (${selectedYear})`, value: (yearData?.caTotal || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }), color: '#22c55e' },
    { label: 'CA En cours', value: totalEnCours.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }), color: '#3b82f6' },
    { label: 'En retard', value: `${totalRetard.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} (${stats.enRetard})`, color: '#dc2626' },
    { label: 'Factures', value: stats.factures, color: '#8b5cf6' },
    { label: 'Clients', value: stats.clients, color: '#06b6d4' },
    { label: 'Produits', value: stats.produits, color: '#ec4899' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Tableau de bord</h1>
        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
          {(stats.caByYear || []).map((y: any) => <option key={y.year} value={y.year}>{y.year} ({y.nbFactures} factures)</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: `4px solid ${c.color}` }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* CA by year table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>📅 CA par année</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>Année</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Payé</th>
              <th style={{ textAlign: 'right', padding: 8 }}>En cours</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Retard</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Nb</th>
            </tr></thead>
            <tbody>{(stats.caByYear || []).map((y: any) => (
              <tr key={y.year} style={{ borderBottom: '1px solid #f3f4f6', background: y.year === selectedYear ? '#eff6ff' : 'transparent', cursor: 'pointer' }} onClick={() => setSelectedYear(y.year)}>
                <td style={{ padding: 8, fontWeight: 600 }}>{y.year}</td>
                <td style={{ padding: 8, textAlign: 'right', color: '#22c55e' }}>{y.caPaye.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                <td style={{ padding: 8, textAlign: 'right', color: '#3b82f6' }}>{y.caEnCours.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                <td style={{ padding: 8, textAlign: 'right', color: '#dc2626' }}>{y.caRetard.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{y.nbFactures}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>🏆 Top 10 Clients</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>Client</th>
              <th style={{ textAlign: 'right', padding: 8 }}>Nb</th>
              <th style={{ textAlign: 'right', padding: 8 }}>CA</th>
            </tr></thead>
            <tbody>{(stats.topClients || []).map((c: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: 8 }}>{c.nom}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>{c.nb}</td>
                <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>{c.total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* Monthly chart (simple bar) */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>📈 CA mensuel ({selectedYear})</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160 }}>
          {MONTHS.map((m, i) => {
            const monthData = (stats.caByMonth || []).find((d: any) => parseInt(d.month) === i + 1)
            const val = monthData?.total || 0
            const maxVal = Math.max(...(stats.caByMonth || []).map((d: any) => d.total || 0), 1)
            const h = Math.max((val / maxVal) * 140, 2)
            return (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>{val > 0 ? (val / 1000).toFixed(1) + 'k' : ''}</div>
                <div style={{ height: h, background: val > 0 ? '#3b82f6' : '#e5e7eb', borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }}></div>
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4 }}>{m}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ========== SHARED COMPONENTS ==========
function StatusBadge({ status }: { status: string }) {
  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: (STATUS_COLORS[status] || '#6b7280') + '20', color: STATUS_COLORS[status] || '#6b7280' }}>{status}</span>
}

function QuickModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: '90%', maxWidth: 500, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FormField({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
    </div>
  )
}

// ========== CLIENT SEARCH ==========
function ClientSearch({ value, onChange, onCreateNew }: { value: string; onChange: (id: string, nom: string) => void; onCreateNew: () => void }) {
  const [q, setQ] = useState(''); const [results, setResults] = useState<Client[]>([]); const [open, setOpen] = useState(false); const [selectedName, setSelectedName] = useState(''); const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { if (value && !selectedName) { fetch(`/api/clients?q=&limit=5000`).then(r => r.json()).then(d => { const c = d.clients.find((c: Client) => c.id === value); if (c) setSelectedName(c.nom) }) } }, [value])
  useEffect(() => { if (q.length >= 1) { fetch(`/api/clients?q=${encodeURIComponent(q)}&limit=20`).then(r => r.json()).then(d => { setResults(d.clients); setOpen(true) }) } else { setResults([]); setOpen(false) } }, [q])
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input type="text" placeholder="🔍 Rechercher un client..." value={open ? q : (selectedName || q)} onChange={e => { setQ(e.target.value); setSelectedName('') }} onFocus={() => { if (selectedName) { setQ(selectedName); setSelectedName('') }; setOpen(true) }} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }} />
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #d1d5db', borderRadius: '0 0 6px 6px', maxHeight: 250, overflowY: 'auto', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <div onClick={onCreateNew} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #e5e7eb', color: '#3b82f6', fontWeight: 600, fontSize: 13 }}>➕ Créer un nouveau client</div>
          {results.length === 0 && q.length >= 1 && <div style={{ padding: '10px 12px', color: '#9ca3af', fontSize: 13 }}>Aucun résultat</div>}
          {results.map(c => (
            <div key={c.id} onClick={() => { onChange(c.id, c.nom); setSelectedName(c.nom); setQ(''); setOpen(false) }} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: 13 }} onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')} onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
              <div style={{ fontWeight: 500 }}>{c.nom}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{[c.ville, c.email].filter(Boolean).join(' • ')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ========== PRODUCT SEARCH ==========
function ProduitSearch({ onSelect, onCreateNew }: { onSelect: (p: Produit) => void; onCreateNew: () => void }) {
  const [q, setQ] = useState(''); const [results, setResults] = useState<Produit[]>([]); const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (q.length >= 1) { fetch(`/api/produits?q=${encodeURIComponent(q)}&limit=20`).then(r => r.json()).then(d => { setResults(d.produits); setOpen(true) }) } else { setResults([]); setOpen(false) } }, [q])
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input type="text" placeholder="🔍 Ajouter un produit..." value={q} onChange={e => setQ(e.target.value)} onFocus={() => setOpen(true)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #d1d5db', borderRadius: '0 0 6px 6px', maxHeight: 250, overflowY: 'auto', zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <div onClick={onCreateNew} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #e5e7eb', color: '#3b82f6', fontWeight: 600, fontSize: 13 }}>➕ Créer un nouveau produit</div>
          {results.map(p => (
            <div key={p.id} onClick={() => { onSelect(p); setQ(''); setOpen(false) }} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: 13 }} onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')} onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><strong>{p.ref}</strong> — {p.nom}</span><span style={{ fontWeight: 600 }}>{p.prixVente.toFixed(2)}€</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ========== DOCUMENTS LIST ==========
function DocumentsList({ type, title }: { type: string; title: string }) {
  const [docs, setDocs] = useState<Document[]>([]); const [total, setTotal] = useState(0); const [totaux, setTotaux] = useState<any>(null); const [q, setQ] = useState(''); const [statusFilter, setStatusFilter] = useState(''); const [page, setPage] = useState(0); const [showForm, setShowForm] = useState(false); const [editDoc, setEditDoc] = useState<Document | null>(null); const limit = 30

  const load = useCallback(() => {
    const params = new URLSearchParams({ type, limit: String(limit), offset: String(page * limit) })
    if (q) params.set('q', q); if (statusFilter) params.set('status', statusFilter)
    fetch(`/api/documents?${params}`).then(r => r.json()).then(d => { setDocs(d.documents); setTotal(d.total); if (d.totaux) setTotaux(d.totaux) })
  }, [type, q, statusFilter, page])
  useEffect(() => { load() }, [load])

  if (showForm || editDoc) return <DocumentForm type={type} doc={editDoc} onClose={() => { setShowForm(false); setEditDoc(null); load() }} />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{title} <span style={{ fontSize: 14, fontWeight: 400, color: '#6b7280' }}>({total})</span></h1>
        <button onClick={() => setShowForm(true)} style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>+ Nouveau</button>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input type="text" placeholder="🔍 Rechercher..." value={q} onChange={e => { setQ(e.target.value); setPage(0) }} style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}>
          {['', 'brouillon', 'envoyé', 'payé', 'proforma', 'retard', 'annulé'].map(s => <option key={s} value={s}>{s || 'Tous'}</option>)}
        </select>
      </div>
      {type === 'facture' && totaux && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: '4px solid #22c55e' }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Payé ({totaux.nbPaye})</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{totaux.totalPaye.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 8, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>En cours ({totaux.nbEnCours})</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#3b82f6' }}>{totaux.totalEnCours.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 8, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: '4px solid #dc2626' }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>En retard ({totaux.nbRetard})</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#dc2626' }}>{totaux.totalRetard.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 8, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: '4px solid #6b7280' }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Brouillon ({totaux.nbBrouillon})</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{totaux.totalBrouillon.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
          </div>
          <div style={{ background: '#1a1a2e', borderRadius: 8, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>CA Total</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{totaux.totalCA.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
          </div>
        </div>
      )}
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ textAlign: 'left', padding: '10px 12px' }}>Numéro</th><th style={{ textAlign: 'left', padding: '10px 12px' }}>Client</th><th style={{ textAlign: 'left', padding: '10px 12px' }}>Date</th><th style={{ textAlign: 'center', padding: '10px 12px' }}>Statut</th><th style={{ textAlign: 'right', padding: '10px 12px' }}>TTC</th><th style={{ textAlign: 'right', padding: '10px 12px' }}>Reste</th>
          </tr></thead>
          <tbody>{docs.map(d => (
            <tr key={d.id} onClick={() => setEditDoc(d)} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')} onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
              <td style={{ padding: '10px 12px', fontWeight: 600 }}>{d.numero}</td>
              <td style={{ padding: '10px 12px' }}>{d.clientNom}</td>
              <td style={{ padding: '10px 12px' }}>{d.date ? new Date(d.date).toLocaleDateString('fr-FR') : ''}</td>
              <td style={{ padding: '10px 12px', textAlign: 'center' }}><StatusBadge status={d.status} /></td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{d.totalTTC.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', color: d.restePayer > 0 ? '#ef4444' : '#22c55e' }}>{d.restePayer.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {total > limit && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>←</button>
          <span style={{ padding: '6px 14px', fontSize: 13 }}>{page + 1} / {Math.ceil(total / limit)}</span>
          <button disabled={(page + 1) * limit >= total} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>→</button>
        </div>
      )}
    </div>
  )
}

// ========== DOCUMENT FORM ==========
function DocumentForm({ type, doc, onClose }: { type: string; doc: Document | null; onClose: () => void }) {
  const [clientId, setClientId] = useState(doc?.clientId || ''); const [date, setDate] = useState(doc?.date ? doc.date.split('T')[0] : new Date().toISOString().split('T')[0]); const [status, setStatus] = useState(doc?.status || 'brouillon'); const [source, setSource] = useState(doc?.source || 'Direct'); const [entityId, setEntityId] = useState(doc?.entityId || 'sc_mobilier'); const [notes, setNotes] = useState(doc?.notes || ''); const [lignes, setLignes] = useState<Ligne[]>([]); const [showNewClient, setShowNewClient] = useState(false); const [showNewProduit, setShowNewProduit] = useState(false); const [saving, setSaving] = useState(false)
  const [ncNom, setNcNom] = useState(''); const [ncEmail, setNcEmail] = useState(''); const [ncTel, setNcTel] = useState(''); const [ncAdresse, setNcAdresse] = useState(''); const [ncVille, setNcVille] = useState(''); const [ncCp, setNcCp] = useState('')
  const [npRef, setNpRef] = useState(''); const [npNom, setNpNom] = useState(''); const [npPrix, setNpPrix] = useState(''); const [npTva, setNpTva] = useState('20')

  const addLine = (p: Produit) => { setLignes([...lignes, { produitId: p.id, description: `${p.ref} - ${p.nom}`, qte: 1, prixUnit: p.prixVente, tva: p.tva, remise: 0 }]) }
  const updateLine = (idx: number, field: string, val: any) => { const u = [...lignes]; (u[idx] as any)[field] = val; setLignes(u) }
  const removeLine = (idx: number) => setLignes(lignes.filter((_, i) => i !== idx))

  const totalHT = lignes.reduce((s, l) => s + l.qte * l.prixUnit * (1 - l.remise / 100), 0)
  const totalTVA = lignes.reduce((s, l) => s + l.qte * l.prixUnit * (1 - l.remise / 100) * l.tva / 100, 0)
  const totalTTC = totalHT + totalTVA

  const save = async () => {
    if (!clientId) return alert('Veuillez sélectionner un client'); setSaving(true)
    const body = { id: doc?.id, type, clientId, date, status, source, entityId, notes, lignes, totalHT: Math.round(totalHT * 100) / 100, totalTVA: Math.round(totalTVA * 100) / 100, totalTTC: Math.round(totalTTC * 100) / 100, restePayer: status === 'payé' ? 0 : Math.round(totalTTC * 100) / 100 }
    await fetch('/api/documents', { method: doc ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); setSaving(false); onClose()
  }
  const createClient = async () => { if (!ncNom) return; const res = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nom: ncNom, email: ncEmail, telephone: ncTel, adresse: ncAdresse, ville: ncVille, cp: ncCp }) }); const c = await res.json(); setClientId(c.id); setShowNewClient(false); setNcNom(''); setNcEmail(''); setNcTel(''); setNcAdresse(''); setNcVille(''); setNcCp('') }
  const createProduit = async () => { if (!npRef || !npNom) return; const res = await fetch('/api/produits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ref: npRef, nom: npNom, prixVente: parseFloat(npPrix) || 0, tva: parseFloat(npTva) || 20 }) }); const p = await res.json(); addLine({ ...p, prixVente: parseFloat(npPrix) || 0, tva: parseFloat(npTva) || 20 } as Produit); setShowNewProduit(false); setNpRef(''); setNpNom(''); setNpPrix(''); setNpTva('20') }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>{doc ? 'Modifier' : 'Nouveau'} {type}</h1>
        <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>← Retour</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div>
          <div style={{ background: '#fff', borderRadius: 10, padding: 20, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>👤 Client</h3>
            <ClientSearch value={clientId} onChange={(id) => setClientId(id)} onCreateNew={() => setShowNewClient(true)} />
          </div>
          <div style={{ background: '#fff', borderRadius: 10, padding: 20, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📦 Produits</h3>
            <ProduitSearch onSelect={addLine} onCreateNew={() => setShowNewProduit(true)} />
            {lignes.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 12 }}>
                <thead><tr style={{ borderBottom: '2px solid #e5e7eb' }}><th style={{ textAlign: 'left', padding: 6 }}>Description</th><th style={{ textAlign: 'center', padding: 6, width: 60 }}>Qté</th><th style={{ textAlign: 'right', padding: 6, width: 90 }}>Prix HT</th><th style={{ textAlign: 'center', padding: 6, width: 60 }}>TVA%</th><th style={{ textAlign: 'right', padding: 6, width: 90 }}>Total HT</th><th style={{ width: 30 }}></th></tr></thead>
                <tbody>{lignes.map((l, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 6 }}><input value={l.description} onChange={e => updateLine(i, 'description', e.target.value)} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 4, padding: '4px 6px', fontSize: 13, boxSizing: 'border-box' }} /></td>
                    <td style={{ padding: 6 }}><input type="number" value={l.qte} onChange={e => updateLine(i, 'qte', parseInt(e.target.value) || 0)} style={{ width: '100%', textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: 4, padding: '4px 6px', fontSize: 13, boxSizing: 'border-box' }} /></td>
                    <td style={{ padding: 6 }}><input type="number" step="0.01" value={l.prixUnit} onChange={e => updateLine(i, 'prixUnit', parseFloat(e.target.value) || 0)} style={{ width: '100%', textAlign: 'right', border: '1px solid #e5e7eb', borderRadius: 4, padding: '4px 6px', fontSize: 13, boxSizing: 'border-box' }} /></td>
                    <td style={{ padding: 6 }}><input type="number" value={l.tva} onChange={e => updateLine(i, 'tva', parseFloat(e.target.value) || 0)} style={{ width: '100%', textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: 4, padding: '4px 6px', fontSize: 13, boxSizing: 'border-box' }} /></td>
                    <td style={{ padding: 6, textAlign: 'right', fontWeight: 600 }}>{(l.qte * l.prixUnit * (1 - l.remise / 100)).toFixed(2)}€</td>
                    <td style={{ padding: 6 }}><button onClick={() => removeLine(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}>✕</button></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
          <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>📝 Notes</h3>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 6, padding: '8px 10px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
        </div>
        <div>
          <div style={{ background: '#fff', borderRadius: 10, padding: 20, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>⚙️ Paramètres</h3>
            <FormField label="Date" value={date} onChange={setDate} type="date" />
            <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Statut</label><select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}>{['brouillon', 'envoyé', 'payé', 'proforma', 'retard', 'annulé'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Source</label><select value={source} onChange={e => setSource(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}>{SOURCES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div style={{ marginBottom: 12 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Entité</label><select value={entityId} onChange={e => setEntityId(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}><option value="sc_mobilier">SC Mobilier</option><option value="sc_alba">SC by ALBA</option></select></div>
          </div>
          <div style={{ background: '#1a1a2e', color: '#fff', borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}><span>Total HT</span><span>{totalHT.toFixed(2)}€</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}><span>TVA</span><span>{totalTVA.toFixed(2)}€</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 700, borderTop: '1px solid #2d2d4e', paddingTop: 12 }}><span>Total TTC</span><span>{totalTTC.toFixed(2)}€</span></div>
          </div>
          <button onClick={save} disabled={saving} style={{ width: '100%', padding: '12px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>{saving ? 'Enregistrement...' : '💾 Enregistrer'}</button>
        </div>
      </div>

      {showNewClient && (
        <QuickModal title="Nouveau client" onClose={() => setShowNewClient(false)}>
          <FormField label="Nom *" value={ncNom} onChange={setNcNom} /><FormField label="Email" value={ncEmail} onChange={setNcEmail} /><FormField label="Téléphone" value={ncTel} onChange={setNcTel} /><FormField label="Adresse" value={ncAdresse} onChange={setNcAdresse} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><FormField label="Ville" value={ncVille} onChange={setNcVille} /><FormField label="CP" value={ncCp} onChange={setNcCp} /></div>
          <button onClick={createClient} style={{ width: '100%', padding: 10, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>Créer et sélectionner</button>
        </QuickModal>
      )}
      {showNewProduit && (
        <QuickModal title="Nouveau produit" onClose={() => setShowNewProduit(false)}>
          <FormField label="Référence *" value={npRef} onChange={setNpRef} /><FormField label="Nom *" value={npNom} onChange={setNpNom} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><FormField label="Prix HT" value={npPrix} onChange={setNpPrix} type="number" /><FormField label="TVA %" value={npTva} onChange={setNpTva} type="number" /></div>
          <button onClick={createProduit} style={{ width: '100%', padding: 10, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>Créer et ajouter</button>
        </QuickModal>
      )}
    </div>
  )
}

// ========== CLIENTS LIST ==========
function ClientsList() {
  const [clients, setClients] = useState<Client[]>([]); const [total, setTotal] = useState(0); const [q, setQ] = useState(''); const [page, setPage] = useState(0); const [editClient, setEditClient] = useState<Client | null>(null); const [showForm, setShowForm] = useState(false); const limit = 50

  const load = useCallback(() => { const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) }); if (q) params.set('q', q); fetch(`/api/clients?${params}`).then(r => r.json()).then(d => { setClients(d.clients); setTotal(d.total) }) }, [q, page])
  useEffect(() => { load() }, [load])

  const [fNom, setFNom] = useState(''); const [fEmail, setFEmail] = useState(''); const [fTel, setFTel] = useState(''); const [fAdresse, setFAdresse] = useState(''); const [fVille, setFVille] = useState(''); const [fCp, setFCp] = useState(''); const [fSiret, setFSiret] = useState('')
  const openEdit = (c: Client) => { setEditClient(c); setShowForm(true); setFNom(c.nom); setFEmail(c.email || ''); setFTel(c.telephone || ''); setFAdresse(c.adresse || ''); setFVille(c.ville || ''); setFCp(c.cp || ''); setFSiret(c.siret || '') }
  const openNew = () => { setEditClient(null); setShowForm(true); setFNom(''); setFEmail(''); setFTel(''); setFAdresse(''); setFVille(''); setFCp(''); setFSiret('') }
  const saveClient = async () => { const body = { id: editClient?.id, nom: fNom, email: fEmail, telephone: fTel, adresse: fAdresse, ville: fVille, cp: fCp, siret: fSiret, pays: 'France' }; await fetch('/api/clients', { method: editClient ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); setShowForm(false); load() }
  const deleteClient = async (id: string) => { if (!confirm('Supprimer ?')) return; await fetch(`/api/clients?id=${id}`, { method: 'DELETE' }); load() }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><h1 style={{ fontSize: 24, fontWeight: 700 }}>Clients ({total})</h1><button onClick={openNew} style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>+ Nouveau</button></div>
      
      <input type="text" placeholder="🔍 Rechercher..." value={q} onChange={e => { setQ(e.target.value); setPage(0) }} style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, marginBottom: 16, boxSizing: 'border-box' }} />
      {showForm && (
        <QuickModal title={editClient ? 'Modifier client' : 'Nouveau client'} onClose={() => setShowForm(false)}>
          <FormField label="Nom *" value={fNom} onChange={setFNom} /><FormField label="Email" value={fEmail} onChange={setFEmail} /><FormField label="Téléphone" value={fTel} onChange={setFTel} /><FormField label="Adresse" value={fAdresse} onChange={setFAdresse} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><FormField label="Ville" value={fVille} onChange={setFVille} /><FormField label="CP" value={fCp} onChange={setFCp} /></div>
          <FormField label="SIRET" value={fSiret} onChange={setFSiret} />
          <button onClick={saveClient} style={{ width: '100%', padding: 10, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>{editClient ? 'Modifier' : 'Créer'}</button>
        </QuickModal>
      )}
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}><th style={{ textAlign: 'left', padding: '10px 12px' }}>Nom</th><th style={{ textAlign: 'left', padding: '10px 12px' }}>Email</th><th style={{ textAlign: 'left', padding: '10px 12px' }}>Tél</th><th style={{ textAlign: 'left', padding: '10px 12px' }}>Ville</th><th style={{ textAlign: 'center', padding: '10px 12px' }}>Actions</th></tr></thead>
          <tbody>{clients.map(c => (
            <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}><td style={{ padding: '10px 12px', fontWeight: 500 }}>{c.nom}</td><td style={{ padding: '10px 12px', color: '#6b7280' }}>{c.email}</td><td style={{ padding: '10px 12px' }}>{c.telephone}</td><td style={{ padding: '10px 12px' }}>{c.ville}</td><td style={{ padding: '10px 12px', textAlign: 'center' }}><button onClick={() => openEdit(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 8 }}>✏️</button><button onClick={() => deleteClient(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button></td></tr>
          ))}</tbody>
        </table>
      </div>
      {total > limit && <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}><button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>←</button><span style={{ padding: '6px 14px', fontSize: 13 }}>{page + 1} / {Math.ceil(total / limit)}</span><button disabled={(page + 1) * limit >= total} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>→</button></div>}
    </div>
  )
}

// ========== PRODUITS LIST ==========
function ProduitsList() {
  const [produits, setProduits] = useState<Produit[]>([]); const [total, setTotal] = useState(0); const [q, setQ] = useState(''); const [page, setPage] = useState(0); const [showForm, setShowForm] = useState(false); const [editProd, setEditProd] = useState<Produit | null>(null); const [viewProd, setViewProd] = useState<Produit | null>(null); const limit = 50

  const load = useCallback(() => { const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) }); if (q) params.set('q', q); fetch(`/api/produits?${params}`).then(r => r.json()).then(d => { setProduits(d.produits); setTotal(d.total) }) }, [q, page])
  useEffect(() => { load() }, [load])

  const [fRef, setFRef] = useState(''); const [fNom, setFNom] = useState(''); const [fPrix, setFPrix] = useState(''); const [fTva, setFTva] = useState('20'); const [fCat, setFCat] = useState(''); const [fStock, setFStock] = useState('0')
  const openEdit = (p: Produit) => { setEditProd(p); setShowForm(true); setFRef(p.ref); setFNom(p.nom); setFPrix(String(p.prixVente)); setFTva(String(p.tva)); setFCat(p.categorie || ''); setFStock(String(p.stock)) }
  const openNew = () => { setEditProd(null); setShowForm(true); setFRef(''); setFNom(''); setFPrix(''); setFTva('20'); setFCat(''); setFStock('0') }
  const saveProd = async () => { const body = { id: editProd?.id, ref: fRef, nom: fNom, prixVente: parseFloat(fPrix) || 0, tva: parseFloat(fTva) || 20, categorie: fCat, stock: parseInt(fStock) || 0, prixAchat: 0, stockMin: 5, ecoDeee: 0, ecoDea: 0 }; await fetch('/api/produits', { method: editProd ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); setShowForm(false); load() }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><h1 style={{ fontSize: 24, fontWeight: 700 }}>Produits ({total})</h1><button onClick={openNew} style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>+ Nouveau</button></div>
      
      {viewProd && (
        <QuickModal title={viewProd.ref + ' — ' + viewProd.nom} onClose={() => setViewProd(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', marginBottom: 10 }}>📦 Produit</h4>
              <div style={{ fontSize: 13, lineHeight: 2 }}>
                <div><strong>Référence :</strong> {viewProd.ref}</div>
                <div><strong>Nom :</strong> {viewProd.nom}</div>
                <div><strong>Couleur :</strong> {viewProd.couleur || '—'}</div>
                <div><strong>Catégorie :</strong> {viewProd.categorie || '—'}</div>
                <div><strong>Prix HT :</strong> {viewProd.prixVente.toFixed(2)}€</div>
                <div><strong>TVA :</strong> {viewProd.tva}%</div>
                <div><strong>EAN :</strong> <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{viewProd.ean || '—'}</span></div>
              </div>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', marginBottom: 10 }}>📐 Dimensions & Poids</h4>
              <div style={{ fontSize: 13, lineHeight: 2 }}>
                <div><strong>Longueur :</strong> {viewProd.longueur ? viewProd.longueur + ' mm' : '—'}</div>
                <div><strong>Largeur :</strong> {viewProd.largeur ? viewProd.largeur + ' mm' : '—'}</div>
                <div><strong>Hauteur :</strong> {viewProd.hauteur ? viewProd.hauteur + ' mm' : '—'}</div>
                <div><strong>Poids brut :</strong> {viewProd.poids ? viewProd.poids + ' kg' : '—'}</div>
                <div><strong>Poids net :</strong> {viewProd.poidsNet ? viewProd.poidsNet + ' kg' : '—'}</div>
              </div>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', marginBottom: 10 }}>📋 Conditionnement</h4>
              <div style={{ fontSize: 13, lineHeight: 2 }}>
                <div><strong>PCB (master) :</strong> {viewProd.pcb || '—'}</div>
                <div><strong>EAN Master :</strong> <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{viewProd.eanMaster || '—'}</span></div>
              </div>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', marginBottom: 10 }}>🏗️ Palettisation</h4>
              <div style={{ fontSize: 13, lineHeight: 2 }}>
                <div><strong>Produits/palette :</strong> {viewProd.paletteProduits || '—'}</div>
                <div><strong>Cartons/palette :</strong> {viewProd.paletteCartons || '—'}</div>
                <div><strong>Stock actuel :</strong> <span style={{ color: viewProd.stock <= viewProd.stockMin ? '#ef4444' : '#22c55e', fontWeight: 700 }}>{viewProd.stock}</span></div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => { openEdit(viewProd); setViewProd(null) }} style={{ flex: 1, padding: 10, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>✏️ Modifier</button>
            <button onClick={() => setViewProd(null)} style={{ flex: 1, padding: 10, background: '#f3f4f6', color: '#1a1a2e', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Fermer</button>
          </div>
        </QuickModal>
      )}
      <input type="text" placeholder="🔍 Rechercher..." value={q} onChange={e => { setQ(e.target.value); setPage(0) }} style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, marginBottom: 16, boxSizing: 'border-box' }} />
      {showForm && (
        <QuickModal title={editProd ? 'Modifier produit' : 'Nouveau produit'} onClose={() => setShowForm(false)}>
          <FormField label="Référence *" value={fRef} onChange={setFRef} /><FormField label="Nom *" value={fNom} onChange={setFNom} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><FormField label="Prix HT" value={fPrix} onChange={setFPrix} type="number" /><FormField label="TVA %" value={fTva} onChange={setFTva} type="number" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><FormField label="Catégorie" value={fCat} onChange={setFCat} /><FormField label="Stock" value={fStock} onChange={setFStock} type="number" /></div>
          <button onClick={saveProd} style={{ width: '100%', padding: 10, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>{editProd ? 'Modifier' : 'Créer'}</button>
        </QuickModal>
      )}
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}><th style={{ textAlign: 'left', padding: '10px 12px' }}>Réf</th><th style={{ textAlign: 'left', padding: '10px 12px' }}>Nom</th><th style={{ textAlign: 'left', padding: '10px 12px' }}>Cat.</th><th style={{ textAlign: 'right', padding: '10px 12px' }}>Prix HT</th><th style={{ textAlign: 'center', padding: '10px 12px' }}>Stock</th><th style={{ textAlign: 'center', padding: '10px 12px' }}>Actions</th></tr></thead>
          <tbody>{produits.map(p => (
            <tr key={p.id} onClick={() => setViewProd(p)} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')} onMouseLeave={e => (e.currentTarget.style.background = '#fff')}><td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.ref}</td><td style={{ padding: '10px 12px' }}>{p.nom}</td><td style={{ padding: '10px 12px', color: '#6b7280' }}>{p.categorie}</td><td style={{ padding: '10px 12px', textAlign: 'right' }}>{p.prixVente.toFixed(2)}€</td><td style={{ padding: '10px 12px', textAlign: 'center' }}><span style={{ color: p.stock <= p.stockMin ? '#ef4444' : '#22c55e', fontWeight: 600 }}>{p.stock}</span></td><td style={{ padding: '10px 12px', textAlign: 'center' }}><button onClick={(e) => { e.stopPropagation(); openEdit(p) }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button></td></tr>
          ))}</tbody>
        </table>
      </div>
      {total > limit && <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}><button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>←</button><span style={{ padding: '6px 14px', fontSize: 13 }}>{page + 1} / {Math.ceil(total / limit)}</span><button disabled={(page + 1) * limit >= total} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>→</button></div>}
    </div>
  )
}

// ========== EXPORT EDI ==========
function ExportEDI() {
  const [docs, setDocs] = useState<Document[]>([]); const [selected, setSelected] = useState<Set<string>>(new Set()); const [sep, setSep] = useState(';'); const [statusFilter, setStatusFilter] = useState('')
  useEffect(() => { fetch('/api/documents?type=facture&limit=200').then(r => r.json()).then(d => setDocs(d.documents)) }, [])
  const filtered = statusFilter ? docs.filter(d => d.status === statusFilter) : docs
  const toggleAll = () => { if (selected.size === filtered.length) setSelected(new Set()); else setSelected(new Set(filtered.map(d => d.id))) }
  const toggle = (id: string) => { const s = new Set(selected); if (s.has(id)) s.delete(id); else s.add(id); setSelected(s) }
  const exportCSV = () => {
    const rows = filtered.filter(d => selected.has(d.id)); if (rows.length === 0) return alert('Sélectionnez au moins une facture')
    const headers = ['Numéro', 'Date', 'Client', 'Statut', 'Total HT', 'TVA', 'Total TTC', 'Reste à payer']
    const lines = rows.map(d => [d.numero, d.date ? new Date(d.date).toLocaleDateString('fr-FR') : '', d.clientNom || '', d.status, d.totalHT.toFixed(2), d.totalTVA.toFixed(2), d.totalTTC.toFixed(2), d.restePayer.toFixed(2)])
    const csv = [headers.join(sep), ...lines.map(l => l.join(sep))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `export_factures_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Export EDI</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}><option value="">Tous</option>{['brouillon', 'envoyé', 'payé', 'proforma', 'retard', 'annulé'].map(s => <option key={s} value={s}>{s}</option>)}</select>
        <span style={{ fontSize: 13, color: '#6b7280' }}>Sep:</span>
        <select value={sep} onChange={e => setSep(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6 }}><option value=";">;</option><option value=",">,</option><option value={'\t'}>Tab</option></select>
        <div style={{ flex: 1 }} /><span style={{ fontSize: 13, color: '#6b7280' }}>{selected.size} sélectionné(s)</span>
        <button onClick={exportCSV} style={{ padding: '10px 20px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>📤 Exporter</button>
      </div>
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead><tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}><th style={{ padding: '10px 12px', width: 40 }}><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th><th style={{ textAlign: 'left', padding: '10px 12px' }}>Numéro</th><th style={{ textAlign: 'left', padding: '10px 12px' }}>Client</th><th style={{ textAlign: 'left', padding: '10px 12px' }}>Date</th><th style={{ textAlign: 'center', padding: '10px 12px' }}>Statut</th><th style={{ textAlign: 'right', padding: '10px 12px' }}>TTC</th></tr></thead>
          <tbody>{filtered.map(d => (
            <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6' }}><td style={{ padding: '10px 12px' }}><input type="checkbox" checked={selected.has(d.id)} onChange={() => toggle(d.id)} /></td><td style={{ padding: '10px 12px', fontWeight: 600 }}>{d.numero}</td><td style={{ padding: '10px 12px' }}>{d.clientNom}</td><td style={{ padding: '10px 12px' }}>{d.date ? new Date(d.date).toLocaleDateString('fr-FR') : ''}</td><td style={{ padding: '10px 12px', textAlign: 'center' }}><StatusBadge status={d.status} /></td><td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{d.totalTTC.toFixed(2)}€</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}

// ========== MARKETPLACE (SHOPIFY + AMAZON) ==========
function Marketplace() {
  const [shopifyKey, setShopifyKey] = useState(''); const [shopifyStore, setShopifyStore] = useState(''); const [shopifyEnabled, setShopifyEnabled] = useState(false)
  const [amazonKey, setAmazonKey] = useState(''); const [amazonSecret, setAmazonSecret] = useState(''); const [amazonEnabled, setAmazonEnabled] = useState(false)
  const [cronInterval, setCronInterval] = useState('24'); const [lastSync, setLastSync] = useState<string | null>(null)

  const testShopify = () => { if (!shopifyStore || !shopifyKey) return alert('Remplis le store et la clé API'); alert('✅ Connexion Shopify simulée ! En production, cela appellera l\'API Shopify Admin.') }
  const testAmazon = () => { if (!amazonKey || !amazonSecret) return alert('Remplis les clés API'); alert('✅ Connexion Amazon simulée ! En production, cela appellera l\'API SP-API.') }
  const syncNow = () => { setLastSync(new Date().toLocaleString('fr-FR')); alert('🔄 Synchronisation lancée ! Les commandes seront importées comme documents de type "commande".') }

  const Card = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <div style={{ background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{icon} {title}</h3>
      {children}
    </div>
  )

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>🛒 Marketplace — Shopify & Amazon</h1>

      <Card title="Shopify" icon="🟢">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Nom du store (xxx.myshopify.com)" value={shopifyStore} onChange={setShopifyStore} placeholder="monstore" />
          <FormField label="Clé API (Admin API access token)" value={shopifyKey} onChange={setShopifyKey} placeholder="shpat_xxxxx" />
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <input type="checkbox" checked={shopifyEnabled} onChange={e => setShopifyEnabled(e.target.checked)} /> Activer la synchronisation
          </label>
          <button onClick={testShopify} style={{ padding: '8px 16px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Tester la connexion</button>
        </div>
        <div style={{ marginTop: 12, padding: 12, background: '#f9fafb', borderRadius: 6, fontSize: 12, color: '#6b7280' }}>
          Pour obtenir un token Shopify : Settings → Apps and sales channels → Develop apps → Create an app → Configure Admin API scopes (read_orders) → Install app → Copier le token
        </div>
      </Card>

      <Card title="Amazon (SP-API)" icon="🟠">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Access Key ID" value={amazonKey} onChange={setAmazonKey} placeholder="AKIA..." />
          <FormField label="Secret Access Key" value={amazonSecret} onChange={setAmazonSecret} placeholder="xxxxx" />
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <input type="checkbox" checked={amazonEnabled} onChange={e => setAmazonEnabled(e.target.checked)} /> Activer la synchronisation
          </label>
          <button onClick={testAmazon} style={{ padding: '8px 16px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Tester la connexion</button>
        </div>
        <div style={{ marginTop: 12, padding: 12, background: '#f9fafb', borderRadius: 6, fontSize: 12, color: '#6b7280' }}>
          Amazon SP-API nécessite : un compte Seller Central, une app Developer enregistrée, et les credentials IAM. Voir docs.developer.amazonservices.com
        </div>
      </Card>

      <Card title="Planification CRON" icon="⏰">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>Fréquence de synchronisation</label>
            <select value={cronInterval} onChange={e => setCronInterval(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}>
              <option value="1">Toutes les heures</option>
              <option value="6">Toutes les 6 heures</option>
              <option value="12">Toutes les 12 heures</option>
              <option value="24">Tous les jours</option>
            </select>
          </div>
          <button onClick={syncNow} style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', marginTop: 16 }}>🔄 Synchroniser maintenant</button>
        </div>
        {lastSync && <p style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>Dernière sync : {lastSync}</p>}
        <div style={{ marginTop: 12, padding: 12, background: '#fefce8', borderRadius: 6, fontSize: 12, color: '#92400e', border: '1px solid #fde68a' }}>
          💡 En production, le CRON sera géré via une API route Next.js + Vercel Cron Jobs (vercel.json) ou un service externe (cron-job.org). Les commandes récupérées seront automatiquement créées comme documents avec auto-création des clients.
        </div>
      </Card>
    </div>
  )
}

// ========== SOCIAL MEDIA ==========
function SocialMedia() {
  const [platform, setPlatform] = useState('instagram')
  const [postText, setPostText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [platforms, setPlatforms] = useState({ instagram: false, linkedin: false, twitter: false, facebook: false })
  const [posting, setPosting] = useState(false)
  const [history, setHistory] = useState<{ date: string; text: string; platforms: string[]; status: string }[]>([])

  const [igToken, setIgToken] = useState(''); const [liToken, setLiToken] = useState(''); const [twKey, setTwKey] = useState(''); const [fbToken, setFbToken] = useState('')
  const [showConfig, setShowConfig] = useState(false)

  const selectedPlatforms = Object.entries(platforms).filter(([, v]) => v).map(([k]) => k)

  const post = () => {
    if (!postText) return alert('Écris un texte')
    if (selectedPlatforms.length === 0) return alert('Sélectionne au moins un réseau')
    setPosting(true)
    setTimeout(() => {
      setHistory([{ date: new Date().toLocaleString('fr-FR'), text: postText, platforms: selectedPlatforms, status: 'publié' }, ...history])
      setPosting(false); setPostText(''); setImageUrl('')
      alert('✅ Publication envoyée sur : ' + selectedPlatforms.join(', '))
    }, 1500)
  }

  const PlatformIcon = ({ name, emoji, color }: { name: string; emoji: string; color: string }) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: `2px solid ${platforms[name as keyof typeof platforms] ? color : '#e5e7eb'}`, borderRadius: 8, cursor: 'pointer', background: platforms[name as keyof typeof platforms] ? color + '10' : '#fff', transition: 'all 0.2s' }}>
      <input type="checkbox" checked={platforms[name as keyof typeof platforms]} onChange={e => setPlatforms({ ...platforms, [name]: e.target.checked })} style={{ display: 'none' }} />
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <span style={{ fontWeight: 600, fontSize: 14, color: platforms[name as keyof typeof platforms] ? color : '#6b7280' }}>{name.charAt(0).toUpperCase() + name.slice(1)}</span>
    </label>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>📱 Réseaux sociaux</h1>
        <button onClick={() => setShowConfig(!showConfig)} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>⚙️ Configurer les API</button>
      </div>

      {showConfig && (
        <div style={{ background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🔑 Tokens API</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Instagram (Graph API Token)" value={igToken} onChange={setIgToken} placeholder="IGQ..." />
            <FormField label="LinkedIn (Access Token)" value={liToken} onChange={setLiToken} placeholder="AQV..." />
            <FormField label="Twitter/X (Bearer Token)" value={twKey} onChange={setTwKey} placeholder="AAAA..." />
            <FormField label="Facebook (Page Access Token)" value={fbToken} onChange={setFbToken} placeholder="EAA..." />
          </div>
          <div style={{ marginTop: 12, padding: 12, background: '#f9fafb', borderRadius: 6, fontSize: 12, color: '#6b7280' }}>
            💡 Chaque plateforme nécessite une app developer et des tokens OAuth. Instagram et Facebook passent par Meta Business Suite. LinkedIn utilise son propre portail developer. Twitter/X utilise l'API v2.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div>
          {/* Compose */}
          <div style={{ background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>✍️ Nouvelle publication</h3>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <PlatformIcon name="instagram" emoji="📸" color="#E4405F" />
              <PlatformIcon name="linkedin" emoji="💼" color="#0A66C2" />
              <PlatformIcon name="twitter" emoji="𝕏" color="#1DA1F2" />
              <PlatformIcon name="facebook" emoji="👤" color="#1877F2" />
            </div>
            <textarea value={postText} onChange={e => setPostText(e.target.value)} placeholder="Écris ton post ici..." rows={5} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '12px', fontSize: 14, resize: 'vertical', marginBottom: 12, boxSizing: 'border-box' }} />
            <FormField label="URL de l'image (optionnel)" value={imageUrl} onChange={setImageUrl} placeholder="https://..." />

            {imageUrl && (
              <div style={{ marginBottom: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', maxHeight: 200 }}>
                <img src={imageUrl} alt="preview" style={{ width: '100%', objectFit: 'cover' }} onError={e => (e.currentTarget.style.display = 'none')} />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{postText.length} caractères • {selectedPlatforms.length} plateforme(s)</span>
              <button onClick={post} disabled={posting} style={{ padding: '10px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                {posting ? '⏳ Publication...' : '🚀 Publier'}
              </button>
            </div>
          </div>
        </div>

        <div>
          {/* Preview */}
          <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>👁️ Aperçu</h3>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>SC</div>
                <div><div style={{ fontSize: 13, fontWeight: 600 }}>SC Mobilier</div><div style={{ fontSize: 11, color: '#9ca3af' }}>Maintenant</div></div>
              </div>
              <p style={{ fontSize: 13, whiteSpace: 'pre-wrap', marginBottom: imageUrl ? 12 : 0 }}>{postText || 'Ton texte apparaîtra ici...'}</p>
              {imageUrl && <div style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid #e5e7eb' }}><img src={imageUrl} alt="" style={{ width: '100%', maxHeight: 150, objectFit: 'cover' }} onError={e => (e.currentTarget.style.display = 'none')} /></div>}
            </div>
          </div>

          {/* History */}
          <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📜 Historique</h3>
            {history.length === 0 && <p style={{ fontSize: 13, color: '#9ca3af' }}>Aucune publication</p>}
            {history.map((h, i) => (
              <div key={i} style={{ borderBottom: '1px solid #f3f4f6', padding: '8px 0', fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>{h.platforms.join(', ')}</span>
                  <span style={{ color: '#22c55e' }}>✅ {h.status}</span>
                </div>
                <p style={{ color: '#6b7280', marginTop: 4 }}>{h.text.substring(0, 80)}{h.text.length > 80 ? '...' : ''}</p>
                <span style={{ color: '#9ca3af', fontSize: 11 }}>{h.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
// ========== GOOGLE ANALYTICS ==========
function Analytics() {
  const [gaId, setGaId] = useState('')
  const [connected, setConnected] = useState(false)
  const [period, setPeriod] = useState('30')
  const [loading, setLoading] = useState(false)

  // Simulated data - in production this comes from Google Analytics Data API
  const [data, setData] = useState<any>(null)

  const connect = () => {
    setLoading(true)
    fetch('/api/analytics?days=' + period)
      .then(r => r.json())
      .then(d => {
        if (d.error) { alert('Erreur GA4: ' + d.error); setLoading(false); return }
        setConnected(true); setLoading(false); setData(d)
      })
      .catch(e => { alert('Erreur: ' + e.message); setLoading(false) })
  }

  const disconnect = () => { setConnected(false); setData(null) }

  useEffect(() => {
    if (connected) {
      fetch('/api/analytics?days=' + period).then(r => r.json()).then(d => { if (!d.error) setData(d) })
    }
  }, [period, connected])

  const Card = ({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) => (
    <div style={{ background: '#fff', borderRadius: 8, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: '4px solid ' + color }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#22c55e', marginTop: 2 }}>{sub}</div>}
    </div>
  )

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>📈 Google Analytics</h1>

      {!connected ? (
        <div style={{ background: '#fff', borderRadius: 10, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', maxWidth: 600 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span style={{ fontSize: 48 }}>📊</span>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 12 }}>Connecter Google Analytics</h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>Visualise les performances de ton site directement dans SC Gestion</p>
          </div>
          <div style={{ padding: '12px 16px', background: '#dcfce7', borderRadius: 8, fontSize: 14, color: '#16a34a', fontWeight: 500 }}>✅ Propriété GA4 : 279909061 (configurée côté serveur)</div>
          <div style={{ marginTop: 8, padding: 12, background: '#f9fafb', borderRadius: 6, fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
            💡 Va dans Google Analytics → Admin → Paramètres de la propriété → ID de propriété. En production, on utilisera un compte de service Google (JSON key) + l API Google Analytics Data API v1.
          </div>
          <button onClick={connect} disabled={loading} style={{ width: '100%', padding: 12, background: '#4285f4', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>
            {loading ? '⏳ Connexion...' : '🔗 Connecter Google Analytics'}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#16a34a', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>● Connecté — GA4 #{gaId}</span>
              <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}>
                <option value="7">7 derniers jours</option><option value="30">30 derniers jours</option><option value="90">90 derniers jours</option>
              </select>
            </div>
            <button onClick={disconnect} style={{ padding: '6px 14px', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Déconnecter</button>
          </div>

          {data && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 20 }}>
                <Card label="Utilisateurs" value={data.users.toLocaleString()} color="#4285f4" sub="+12.3%" />
                <Card label="Nouveaux utilisateurs" value={data.newUsers.toLocaleString()} color="#34a853" sub="+8.1%" />
                <Card label="Sessions" value={data.sessions.toLocaleString()} color="#fbbc04" />
                <Card label="Pages vues" value={data.pageviews.toLocaleString()} color="#ea4335" />
                <Card label="Taux de rebond" value={data.bounceRate + '%'} color="#ff6d01" />
                <Card label="Durée moyenne" value={data.avgDuration} color="#46bdc6" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, marginBottom: 20 }}>
                <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>📉 Utilisateurs par jour</h3>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120 }}>
                    {data.daily.map((d: any, i: number) => {
                      const maxVal = Math.max(...data.daily.map((x: any) => x.users))
                      return <div key={i} style={{ flex: 1, background: '#4285f4', borderRadius: '2px 2px 0 0', height: Math.max((d.users / maxVal) * 110, 2), opacity: 0.7 }} title={(d.date || '') + ': ' + d.users + ' users'} />
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>🔝 Pages les plus vues</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr style={{ borderBottom: '2px solid #e5e7eb' }}><th style={{ textAlign: 'left', padding: 8 }}>Page</th><th style={{ textAlign: 'right', padding: 8 }}>Vues</th><th style={{ textAlign: 'right', padding: 8 }}>Users</th></tr></thead>
                    <tbody>{data.topPages.map((p: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}><td style={{ padding: 8, fontWeight: 500 }}>{p.page}</td><td style={{ padding: 8, textAlign: 'right' }}>{p.views.toLocaleString()}</td><td style={{ padding: 8, textAlign: 'right' }}>{p.users.toLocaleString()}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
                <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>🌐 Sources de trafic</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr style={{ borderBottom: '2px solid #e5e7eb' }}><th style={{ textAlign: 'left', padding: 8 }}>Source</th><th style={{ textAlign: 'right', padding: 8 }}>Sessions</th><th style={{ textAlign: 'right', padding: 8 }}>%</th></tr></thead>
                    <tbody>{data.topSources.map((s: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}><td style={{ padding: 8, fontWeight: 500 }}>{s.source}</td><td style={{ padding: 8, textAlign: 'right' }}>{s.sessions.toLocaleString()}</td><td style={{ padding: 8, textAlign: 'right' }}>{s.pct}%</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ========== GOOGLE ADS CAMPAIGNS ==========
function Campaigns() {
  const [customerId, setCustomerId] = useState('')
  const [devToken, setDevToken] = useState('')
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [period, setPeriod] = useState('30')

  const connect = () => {
    if (!customerId || !devToken) return alert('Remplis les champs')
    setLoading(true)
    setTimeout(() => {
      setConnected(true); setLoading(false)
      setData({
        totalSpend: 4850.30, totalClicks: 12450, totalImpressions: 285000, totalConversions: 234, ctr: 4.37, cpc: 0.39, convRate: 1.88, roas: 3.42,
        campaigns: [
          { name: 'Catalogue Mobilier 2026', status: 'active', budget: 50, spend: 1420.50, clicks: 3800, impressions: 82000, conversions: 89, ctr: 4.63, cpc: 0.37 },
          { name: 'Marque SC Mobilier', status: 'active', budget: 30, spend: 890.20, clicks: 2900, impressions: 45000, conversions: 67, ctr: 6.44, cpc: 0.31 },
          { name: 'Retargeting Visiteurs', status: 'active', budget: 25, spend: 780.40, clicks: 1800, impressions: 38000, conversions: 45, ctr: 4.74, cpc: 0.43 },
          { name: 'Shopping Feed Produits', status: 'active', budget: 40, spend: 1250.80, clicks: 2800, impressions: 95000, conversions: 28, ctr: 2.95, cpc: 0.45 },
          { name: 'Promo Été (pausé)', status: 'paused', budget: 20, spend: 508.40, clicks: 1150, impressions: 25000, conversions: 5, ctr: 4.60, cpc: 0.44 },
        ],
        daily: Array.from({length: 30}, (_, i) => ({ day: i + 1, spend: Math.floor(Math.random() * 80 + 100), clicks: Math.floor(Math.random() * 300 + 200), conv: Math.floor(Math.random() * 10 + 2) }))
      })
    }, 1500)
  }

  const disconnect = () => { setConnected(false); setData(null); setCustomerId(''); setDevToken('') }

  const Card = ({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) => (
    <div style={{ background: '#fff', borderRadius: 8, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: '4px solid ' + color }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 2 }}>{sub}</div>}
    </div>
  )

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>🎯 Campagnes Google Ads</h1>

      {!connected ? (
        <div style={{ background: '#fff', borderRadius: 10, padding: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', maxWidth: 600 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span style={{ fontSize: 48 }}>🎯</span>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 12 }}>Connecter Google Ads</h2>
            <p style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>Suis tes campagnes et ton ROAS directement ici</p>
          </div>
          <FormField label="Customer ID (xxx-xxx-xxxx)" value={customerId} onChange={setCustomerId} placeholder="123-456-7890" />
          <FormField label="Developer Token" value={devToken} onChange={setDevToken} placeholder="xxxxx" />
          <div style={{ marginTop: 8, padding: 12, background: '#f9fafb', borderRadius: 6, fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
            💡 Google Ads API nécessite : un compte MCC ou manager, un developer token (ads.google.com/aw/apicenter), et OAuth2. En production, on utilisera la librairie google-ads-api pour Node.js.
          </div>
          <button onClick={connect} disabled={loading} style={{ width: '100%', padding: 12, background: '#ea4335', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>
            {loading ? '⏳ Connexion...' : '🔗 Connecter Google Ads'}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#16a34a', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>● Connecté — {customerId}</span>
              <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}>
                <option value="7">7 jours</option><option value="30">30 jours</option><option value="90">90 jours</option>
              </select>
            </div>
            <button onClick={disconnect} style={{ padding: '6px 14px', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Déconnecter</button>
          </div>

          {data && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
                <Card label="Dépenses" value={data.totalSpend.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} color="#ea4335" />
                <Card label="Clics" value={data.totalClicks.toLocaleString()} color="#4285f4" />
                <Card label="Impressions" value={(data.totalImpressions / 1000).toFixed(0) + 'k'} color="#fbbc04" />
                <Card label="Conversions" value={data.totalConversions} color="#34a853" />
                <Card label="CTR" value={data.ctr + '%'} color="#ff6d01" />
                <Card label="CPC moyen" value={data.cpc.toFixed(2) + '€'} color="#46bdc6" />
                <Card label="Taux conv." value={data.convRate + '%'} color="#7b61ff" />
                <Card label="ROAS" value={data.roas + 'x'} color="#22c55e" sub="Retour sur investissement" />
              </div>

              <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>💰 Dépenses quotidiennes</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 120 }}>
                  {data.daily.map((d: any, i: number) => {
                    const maxVal = Math.max(...data.daily.map((x: any) => x.spend))
                    return <div key={i} style={{ flex: 1, background: '#ea4335', borderRadius: '2px 2px 0 0', height: Math.max((d.spend / maxVal) * 110, 2), opacity: 0.7 }} title={'J' + d.day + ': ' + d.spend + '€'} />
                  })}
                </div>
              </div>

              <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>📋 Campagnes</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px' }}>Campagne</th>
                    <th style={{ textAlign: 'center', padding: '10px 12px' }}>Statut</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px' }}>Budget/j</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px' }}>Dépensé</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px' }}>Clics</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px' }}>CTR</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px' }}>CPC</th>
                    <th style={{ textAlign: 'right', padding: '10px 12px' }}>Conv.</th>
                  </tr></thead>
                  <tbody>{data.campaigns.map((c: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>{c.name}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.status === 'active' ? '#dcfce7' : '#fef3c7', color: c.status === 'active' ? '#16a34a' : '#d97706' }}>{c.status === 'active' ? 'Actif' : 'Pausé'}</span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{c.budget}€</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{c.spend.toFixed(2)}€</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{c.clicks.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{c.ctr}%</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{c.cpc.toFixed(2)}€</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#22c55e' }}>{c.conversions}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
