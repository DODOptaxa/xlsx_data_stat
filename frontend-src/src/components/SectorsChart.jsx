import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend
} from 'recharts'

const YEARS = [2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024]

const fmt = (v) => {
  if (!v) return '—'
  if (v >= 1e6) return (v / 1e6).toFixed(1) + ' трлн'
  if (v >= 1e3) return (v / 1e3).toFixed(0) + ' млрд'
  return v + ' млн'
}

const COLORS = ['#00e5ff','#7c3aed','#f59e0b','#ef4444','#10b981','#f97316','#06b6d4','#8b5cf6','#84cc16','#ec4899','#14b8a6','#f43f5e','#a78bfa','#34d399','#fbbf24','#60a5fa','#fb7185','#4ade80']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: '0.72rem', maxWidth: 260 }}>
      <p style={{ color: 'var(--text-dim)', marginBottom: 6, fontSize: '0.65rem' }}>{label}</p>
      {payload.slice(0,5).map(p => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
          <span style={{ color: p.color }}>{p.dataKey}</span>
          <span className="mono" style={{ color: 'var(--text-bright)', fontWeight: 600 }}>{fmt(p.value * 1000)}</span>
        </div>
      ))}
    </div>
  )
}

export default function SectorsChart() {
  const [sections, setSections] = useState([])
  const [year, setYear] = useState(2023)
  const [selectedKved, setSelectedKved] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sections')
      .then(r => r.json())
      .then(d => { setSections(d); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!selectedKved) { setDetail(null); return }
    fetch(`/api/kved/${selectedKved}`)
      .then(r => r.json())
      .then(setDetail)
  }, [selectedKved])

  const barData = sections.map((s, i) => {
    const yr = s.years?.find(y => y.year === year)
    return {
      kved: s.kved,
      name: s.name_en || s.name_ua,
      name_ua: s.name_ua,
      total: yr?.total ? Math.round(yr.total / 1e6) : 0,
      large: yr?.large_thsd ? Math.round(yr.large_thsd / 1e6) : 0,
      medium: yr?.medium_thsd ? Math.round(yr.medium_thsd / 1e6) : 0,
      small: yr?.small_thsd ? Math.round(yr.small_thsd / 1e6) : 0,
      color: COLORS[i % COLORS.length],
    }
  }).filter(d => d.total > 0).sort((a, b) => b.total - a.total)

  // Multi-year trend data for selected sections
  const trendData = YEARS.map(yr => {
    const row = { year: String(yr) }
    sections.slice(0, 8).forEach(s => {
      const found = s.years?.find(y => y.year === yr)
      row[s.kved] = found?.total ? Math.round(found.total / 1e6) : 0
    })
    return row
  })

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>завантаження...</div>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: detail ? '1fr 380px' : '1fr', gap: '1.5rem' }}>
      <div>
        {/* Year selector */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {YEARS.map(y => (
            <button key={y} onClick={() => setYear(y)} style={{
              padding: '0.3rem 0.7rem', fontSize: '0.72rem',
              background: year === y ? 'var(--accent)' : 'var(--surface)',
              color: year === y ? '#000' : 'var(--text-dim)',
              border: '1px solid var(--border)', borderRadius: '6px',
              cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontWeight: year === y ? 700 : 400,
              transition: 'all 0.15s',
            }}>{y}</button>
          ))}
        </div>

        {/* Bar chart */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
            Обсяг виробництва за секціями КВЕД, {year} (млрд грн) — клікніть для деталей
          </p>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={barData} margin={{ top: 0, right: 10, left: 0, bottom: 60 }} onClick={e => e?.activePayload && setSelectedKved(e.activePayload[0]?.payload?.kved)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="kved" tick={{ fill: 'var(--text-dim)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: '0.72rem' }}>
                    <p style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>{d.kved} — {d.name_ua}</p>
                    <p className="mono" style={{ color: 'var(--text-bright)' }}>Усього: {fmt(d.total * 1e9)}</p>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.65rem', marginTop: 4 }}>Клікніть для деталей →</p>
                  </div>
                )
              }} />
              <Bar dataKey="total" radius={[4, 4, 0, 0]} cursor="pointer">
                {barData.map((entry, i) => (
                  <Cell key={entry.kved} fill={selectedKved === entry.kved ? '#fff' : entry.color} opacity={selectedKved && selectedKved !== entry.kved ? 0.3 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend chart */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
            Динаміка топ-8 секцій 2013–2024 (млрд грн)
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.7rem' }} />
              {sections.slice(0, 8).map((s, i) => (
                <Line key={s.kved} type="monotone" dataKey={s.kved} name={s.kved} stroke={COLORS[i]} strokeWidth={2} dot={false}
                  opacity={selectedKved ? (selectedKved === s.kved ? 1 : 0.2) : 1} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail panel */}
      {detail && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', position: 'sticky', top: '70px', height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700 }}>КВЕД {detail.kved}</span>
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)', marginTop: 4, lineHeight: 1.3 }}>{detail.name_ua}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 2, lineHeight: 1.3 }}>{detail.name_en}</p>
            </div>
            <button onClick={() => setSelectedKved(null)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-dim)', cursor: 'pointer', padding: '4px 8px', fontSize: '0.7rem' }}>✕</button>
          </div>
          <div style={{ height: 1, background: 'var(--border)', marginBottom: '1rem' }} />
          {detail.years?.map(y => (
            <div key={y.year} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{y.year}</span>
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-bright)', fontWeight: 600 }}>{y.total ? fmt(y.total * 1000) : '—'}</span>
              <div style={{ display: 'flex', gap: 3 }}>
                {[y.large_pct, y.medium_pct, y.small_pct].map((p, i) => (
                  <div key={i} title={['Великий', 'Середній', 'Малий'][i] + ': ' + p + '%'} style={{
                    width: Math.max(2, (p || 0) * 0.5), height: 12,
                    background: ['#00e5ff', '#7c3aed', '#f59e0b'][i],
                    borderRadius: 2, opacity: 0.8,
                  }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
