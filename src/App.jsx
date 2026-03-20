import { useState, useEffect, useMemo } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

const MESI = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']
const MESI_FULL = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']

const KM_OPTIONS = [
  { label: 'Tutte le distanze', value: '' },
  { label: 'Fino a 10 km', value: '0-10' },
  { label: '10 – 21 km', value: '10-21' },
  { label: 'Mezza maratona (21 km)', value: '21-22' },
  { label: 'Maratona (42 km)', value: '42-43' },
  { label: 'Ultra (50 km+)', value: '50-9999' },
]

function formatData(dateStr) {
  if (!dateStr) return { day: '?', mon: '---' }
  const d = new Date(dateStr)
  return { day: d.getDate(), mon: MESI[d.getMonth()] }
}

function GaraCard({ gara }) {
  const { day, mon } = formatData(gara.data)
  const tipo = (gara.tipologia || '').toLowerCase()
  const annullata = gara.annullata === 'SI' || gara.annullata === true

  const handleClick = () => {
    if (gara.url) window.open(gara.url.startsWith('http') ? gara.url : 'https://' + gara.url, '_blank')
  }

  return (
    <div className={`gara-card${annullata ? ' annullata' : ''}`} onClick={handleClick}>
      <div className="gara-date">
        <div className="day">{day}</div>
        <div className="mon">{mon}</div>
      </div>
      <div className="gara-info">
        <div className="gara-name">{gara.nome}</div>
        <div className="gara-meta">
          <span>📍 {gara.citta}{gara.provincia ? `, ${gara.provincia}` : ''}</span>
          {gara.regione && <span>{gara.regione}</span>}
          <span className={`badge badge-${tipo}`}>{gara.tipologia || '—'}</span>
          {annullata && <span className="badge" style={{background:'rgba(255,80,80,0.15)',color:'#f06060',border:'1px solid rgba(255,80,80,0.3)'}}>Annullata</span>}
        </div>
      </div>
      <div className="gara-right">
        {gara.km ? (
          <div className="gara-km">{parseFloat(gara.km) % 1 === 0 ? parseInt(gara.km) : parseFloat(gara.km)}<span> km</span></div>
        ) : (
          <div className="gara-km" style={{fontSize:'14px',color:'var(--text3)'}}>—</div>
        )}
      </div>
    </div>
  )
}

function PageContatti() {
  return (
    <div className="contatti-page">
      <div className="contatti-inner">
        <h2 className="contatti-title">Contatti</h2>
        <p className="contatti-sub">Conosci una gara non in elenco? Segnalacela, la aggiungeremo al calendario il prima possibile.</p>
        <a className="contatti-email" href="mailto:calendariogare@outlook.com">
          calendariogare@outlook.com
        </a>
        <p className="contatti-note">Indica nome della gara, data, città e link ufficiale. Risponderemo entro 48 ore.</p>
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('home')
  const [gare, setGare] = useState([])
  const [loading, setLoading] = useState(true)
  const [regione, setRegione] = useState('')
  const [provincia, setProvincia] = useState('')
  const [kmRange, setKmRange] = useState('')
  const [tipologia, setTipologia] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchGare() {
      setLoading(true)
      const { data, error } = await supabase
        .from('garepodistiche')
        .select('*')
        .order('data', { ascending: true })
      if (!error) setGare(data || [])
      setLoading(false)
    }
    fetchGare()
  }, [])

  const regioni = useMemo(() => [...new Set(gare.map(g => g.regione).filter(Boolean))].sort(), [gare])
  const province = useMemo(() => {
    const src = regione ? gare.filter(g => g.regione === regione) : gare
    return [...new Set(src.map(g => g.provincia).filter(Boolean))].sort()
  }, [gare, regione])

  const filtered = useMemo(() => {
    return gare.filter(g => {
      if (regione && g.regione !== regione) return false
      if (provincia && g.provincia !== provincia) return false
      if (tipologia && (g.tipologia || '').toLowerCase() !== tipologia) return false
      if (search) {
        const q = search.toLowerCase()
        if (!(g.nome?.toLowerCase().includes(q) || g.citta?.toLowerCase().includes(q))) return false
      }
      if (kmRange) {
        const [min, max] = kmRange.split('-').map(Number)
        const km = parseFloat(g.km)
        if (isNaN(km) || km < min || km > max) return false
      }
      return true
    })
  }, [gare, regione, provincia, tipologia, kmRange, search])

  const byMonth = useMemo(() => {
    const map = {}
    filtered.forEach(g => {
      if (!g.data) {
        if (!map['zz-da-definire']) map['zz-da-definire'] = []
        map['zz-da-definire'].push(g)
        return
      }
      const d = new Date(g.data)
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`
      if (!map[key]) map[key] = []
      map[key].push(g)
    })
    return map
  }, [filtered])

  const monthKeys = Object.keys(byMonth).sort()

  function monthLabel(key) {
    if (key === 'zz-da-definire') return 'Data da definire'
    const [year, month] = key.split('-')
    return `${MESI_FULL[parseInt(month)]} ${year}`
  }

  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="logo" onClick={() => setPage('home')} style={{cursor:'pointer'}}>
            <div className="logo-dot" />
            RUNMAP ITALIA
          </div>
          <nav className="nav">
            <button className={`nav-btn${page === 'home' ? ' nav-active' : ''}`} onClick={() => setPage('home')}>Calendario</button>
            <button className={`nav-btn${page === 'contatti' ? ' nav-active' : ''}`} onClick={() => setPage('contatti')}>Contatti</button>
          </nav>
        </div>
        <div className="header-count">{loading ? '...' : `${gare.length} gare in archivio`}</div>
      </header>

      {page === 'contatti' ? <PageContatti /> : (
        <>
          <section className="hero">
            <h1>GARE<br />PODISTICHE<br /><span>ITALIA</span></h1>
            <p>Tutte le gare su strada, trail e cronometrica in un unico calendario. Filtra per regione, distanza e tipologia.</p>
          </section>

          <div className="filters-wrap">
            <div className="filters">
              <div className="filter-group">
                <label>Cerca</label>
                <input type="text" placeholder="Nome gara o città..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="filter-group">
                <label>Regione</label>
                <select value={regione} onChange={e => { setRegione(e.target.value); setProvincia('') }}>
                  <option value="">Tutte le regioni</option>
                  {regioni.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>Provincia</label>
                <select value={provincia} onChange={e => setProvincia(e.target.value)} disabled={!regione}>
                  <option value="">Tutte le province</option>
                  {province.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>Distanza</label>
                <select value={kmRange} onChange={e => setKmRange(e.target.value)}>
                  {KM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="tipo-row">
                {['', 'strada', 'trail', 'cronometrica', 'pista'].map(t => (
                  <button key={t} className={`tipo-btn${tipologia === t ? ` active-${t || 'all'}` : ''}`} onClick={() => setTipologia(t)}>
                    {t === '' ? 'Tutte' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="results-wrap">
            <div className="results-meta">
              <h2>Risultati</h2>
              <span>{filtered.length} gare trovate</span>
            </div>
            {loading && <div className="loading"><span /><span /><span /></div>}
            {!loading && filtered.length === 0 && (
              <div className="empty-state">
                <h3>Nessuna gara trovata</h3>
                <p>Prova a modificare i filtri di ricerca</p>
              </div>
            )}
            {!loading && monthKeys.map(key => (
              <div className="month-block" key={key}>
                <div className="month-label">{monthLabel(key)}</div>
                {byMonth[key].map(g => <GaraCard key={g.id} gara={g} />)}
              </div>
            ))}
          </div>

          <footer className="footer">
            <p>Conosci una gara non in elenco? Segnalacela!</p>
            <a href="mailto:calendariogare@outlook.com">calendariogare@outlook.com</a>
            <div className="footer-copy">RunMap Italia — Calendario gare podistiche</div>
          </footer>
        </>
      )}
    </>
  )
}
