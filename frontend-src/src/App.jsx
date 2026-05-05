import { useState, useEffect } from 'react'
import Summary from './components/Summary'
import SectorsChart from './components/SectorsChart'
import KvedExplorer from './components/KvedExplorer'
import './index.css'

const TABS = [
  { id: 'overview', label: 'Огляд' },
  { id: 'sectors', label: 'Галузі' },
  { id: 'explorer', label: 'Провідник КВЕД' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/summary')
      .then(r => r.json())
      .then(d => { setSummary(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
        height: '60px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(10,12,16,0.95)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
          <span className="display" style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--accent)', letterSpacing: '-0.02em' }}>UA</span>
          <span className="display" style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>ECONOMIC OUTPUT</span>
        </div>
        <div style={{ height: '20px', width: '1px', background: 'var(--border)' }} />
        <nav style={{ display: 'flex', gap: '0.25rem' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '0.4rem 1rem',
              background: activeTab === tab.id ? 'var(--surface2)' : 'transparent',
              border: activeTab === tab.id ? '1px solid var(--border)' : '1px solid transparent',
              borderRadius: '6px',
              color: activeTab === tab.id ? 'var(--text-bright)' : 'var(--text-dim)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.15s',
            }}>
              {tab.label}
            </button>
          ))}
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>2013–2024</span>
          <span style={{ background: 'var(--green)', width: '6px', height: '6px', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
        </div>
      </header>

      {/* Page title */}
      <div style={{ padding: '2rem 2rem 0', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 className="display" style={{ fontSize: 'clamp(1.2rem, 3vw, 2rem)', fontWeight: 900, color: 'var(--text-bright)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Обсяг виробленої продукції<br/>
          <span style={{ color: 'var(--accent)', opacity: 0.8 }}>суб'єктів підприємництва України</span>
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
          Великого, середнього, малого та мікропідприємництва за видами економічної діяльності
        </p>
      </div>

      <main style={{ padding: '1.5rem 2rem', maxWidth: '1400px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'var(--text-dim)' }}>
            <span className="mono" style={{ fontSize: '0.8rem' }}>завантаження даних...</span>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <Summary summary={summary} />}
            {activeTab === 'sectors' && <SectorsChart />}
            {activeTab === 'explorer' && <KvedExplorer />}
          </>
        )}
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
