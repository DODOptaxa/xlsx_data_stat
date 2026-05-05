import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const fmt = (v) => {
  if (!v && v !== 0) return '—'
  if (v >= 1e9) return (v / 1e9).toFixed(2) + ' трлн'
  if (v >= 1e6) return (v / 1e6).toFixed(1) + ' млрд'
  if (v >= 1e3) return (v / 1e3).toFixed(0) + ' млн'
  return v.toFixed(0) + ' тис'
}

const ENTERPRISE_TYPES = [
  { key: 'large_thsd', pct: 'large_pct', label: 'Великий', color: '#00e5ff' },
  { key: 'medium_thsd', pct: 'medium_pct', label: 'Середній', color: '#7c3aed' },
  { key: 'small_thsd', pct: 'small_pct', label: 'Малий', color: '#f59e0b' },
  { key: 'micro_thsd', pct: 'micro_pct', label: 'Мікро', color: '#ef4444' },
]

export default function KvedExplorer() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [tree, setTree] = useState([])
  const [showTree, setShowTree] = useState(false)
  const [compareList, setCompareList] = useState([])
  const [compareData, setCompareData] = useState([])
  const debounceRef = useRef(null)

  // Load KVED tree for browsing
  useEffect(() => {
    fetch('/api/kved-tree').then(r => r.json()).then(setTree)
  }, [])

  // Search debounce
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); return }
    debounceRef.current = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(setResults)
    }, 300)
  }, [query])

  // Load detail
  useEffect(() => {
    if (!selected) { setDetail(null); return }
    fetch(`/api/kved/${encodeURIComponent(selected)}`)
      .then(r => r.json())
      .then(setDetail)
  }, [selected])

  // Load compare data
  useEffect(() => {
    if (!compareList.length) { setCompareData([]); return }
    Promise.all(compareList.map(k => fetch(`/api/kved/${k}`).then(r => r.json())))
      .then(setCompareData)
  }, [compareList])

  const toggleCompare = (kved) => {
    setCompareList(prev =>
      prev.includes(kved) ? prev.filter(k => k !== kved) : [...prev.slice(-3), kved]
    )
  }

  // Chart: total by year for selected
  const chartData = detail?.years?.map(y => ({
    year: String(y.year),
    total: y.total ? Math.round(y.total / 1000) : 0,
    large: y.large_thsd ? Math.round(y.large_thsd / 1000) : 0,
    medium: y.medium_thsd ? Math.round(y.medium_thsd / 1000) : 0,
    small: y.small_thsd ? Math.round(y.small_thsd / 1000) : 0,
    micro: y.micro_thsd ? Math.round(y.micro_thsd / 1000) : 0,
  })) || []

  // Compare chart
  const allYears = [2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024]
  const compareChartData = allYears.map(yr => {
    const row = { year: String(yr) }
    compareData.forEach(d => {
      const found = d.years?.find(y => y.year === yr)
      row[d.kved] = found?.total ? Math.round(found.total / 1e6) : 0
    })
    return row
  })

  const COMPARE_COLORS = ['#00e5ff', '#f59e0b', '#ef4444', '#10b981']

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
      {/* Left panel: search + tree */}
      <div>
        <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Пошук за назвою або кодом КВЕД..."
            style={{
              width: '100%', padding: '0.65rem 1rem', fontSize: '0.8rem',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--text-bright)', outline: 'none',
              fontFamily: 'DM Sans, sans-serif',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '1rem',
            }}>✕</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <button onClick={() => setShowTree(!showTree)} style={{
            padding: '0.3rem 0.75rem', fontSize: '0.72rem',
            background: showTree ? 'var(--surface2)' : 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: '6px',
            color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'DM Sans',
          }}>{showTree ? '↑ Сховати дерево' : '↓ Дерево КВЕД'}</button>
          {compareList.length > 0 && (
            <button onClick={() => setCompareList([])} style={{
              padding: '0.3rem 0.75rem', fontSize: '0.72rem',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontFamily: 'DM Sans',
            }}>Очистити ({compareList.length})</button>
          )}
        </div>

        {/* Search results */}
        {results.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.75rem' }}>
            <p style={{ padding: '0.6rem 1rem', fontSize: '0.65rem', color: 'var(--text-dim)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Результати ({results.length})
            </p>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {results.map(r => (
                <div key={r.Kved} onClick={() => { setSelected(r.Kved); setQuery(''); setResults([]) }}
                  style={{
                    padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: selected === r.Kved ? 'var(--surface2)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = selected === r.Kved ? 'var(--surface2)' : 'transparent'}
                >
                  <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--accent)', display: 'block' }}>{r.Kved}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text)', lineHeight: 1.3 }}>{r.Name_ua}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KVED tree browser */}
        {showTree && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
            <p style={{ padding: '0.6rem 1rem', fontSize: '0.65rem', color: 'var(--text-dim)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Дерево КВЕД ({tree.length} кодів)
            </p>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {tree.map(r => {
                const level = r.Kved === 'TOTAL' ? 0 : r.Kved.length === 1 ? 0 : r.Kved.length === 2 ? 1 : r.Kved.includes('.') ? (r.Kved.length === 4 ? 2 : 3) : 1
                return (
                  <div key={r.Kved}
                    onClick={() => setSelected(r.Kved)}
                    style={{
                      padding: `0.4rem 1rem 0.4rem ${1 + level * 1.2}rem`,
                      cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.02)',
                      background: selected === r.Kved ? 'rgba(0,229,255,0.07)' : 'transparent',
                      display: 'flex', alignItems: 'baseline', gap: '0.5rem',
                    }}
                    onMouseEnter={e => { if (selected !== r.Kved) e.currentTarget.style.background = 'var(--surface2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = selected === r.Kved ? 'rgba(0,229,255,0.07)' : 'transparent' }}
                  >
                    <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--accent)', flexShrink: 0 }}>{r.Kved}</span>
                    <span style={{ fontSize: '0.72rem', color: level === 0 ? 'var(--text-bright)' : 'var(--text)', lineHeight: 1.2, fontWeight: level === 0 ? 600 : 400 }}>
                      {r.Name_ua}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right panel: detail + compare */}
      <div>
        {!selected && !compareList.length && (
          <div style={{
            background: 'var(--surface)', border: '1px dashed var(--border)',
            borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-dim)',
          }}>
            <p className="display" style={{ fontSize: '1.5rem', marginBottom: '0.75rem', opacity: 0.4 }}>←</p>
            <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Оберіть код КВЕД</p>
            <p style={{ fontSize: '0.75rem' }}>Скористайтесь пошуком або деревом зліва</p>
          </div>
        )}

        {detail && (
          <div>
            {/* Detail header */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700 }}>КВЕД {detail.kved}</span>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-bright)', marginTop: '0.35rem', lineHeight: 1.3 }}>{detail.name_ua}</h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>{detail.name_en}</p>
                </div>
                <button
                  onClick={() => toggleCompare(detail.kved)}
                  style={{
                    padding: '0.4rem 0.9rem', fontSize: '0.72rem', cursor: 'pointer',
                    background: compareList.includes(detail.kved) ? 'rgba(0,229,255,0.1)' : 'var(--surface2)',
                    border: compareList.includes(detail.kved) ? '1px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: '6px', color: compareList.includes(detail.kved) ? 'var(--accent)' : 'var(--text-dim)',
                    fontFamily: 'DM Sans',
                  }}
                >{compareList.includes(detail.kved) ? '✓ Додано' : '+ Порівняти'}</button>
              </div>
            </div>

            {/* KPI cards */}
            {detail.years?.length > 0 && (() => {
              const latest = detail.years[detail.years.length - 1]
              const prev = detail.years[detail.years.length - 2]
              const delta = prev?.total && latest?.total ? ((latest.total - prev.total) / prev.total * 100).toFixed(1) : null
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                  {ENTERPRISE_TYPES.map(t => (
                    <div key={t.key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `3px solid ${t.color}`, borderRadius: '10px', padding: '0.85rem 1rem' }}>
                      <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: 4 }}>{t.label}</p>
                      <p className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-bright)' }}>
                        {latest[t.pct] != null ? latest[t.pct] + '%' : '—'}
                      </p>
                      <p style={{ fontSize: '0.65rem', color: t.color, marginTop: 2 }}>{latest[t.key] ? fmt(latest[t.key] * 1000) : '—'}</p>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Bar chart */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Загальний обсяг по роках (млн грн)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="year" tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [new Intl.NumberFormat('uk-UA').format(v) + ' млн', '']}
                    contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.72rem' }}
                    labelStyle={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono' }} />
                  <Bar dataKey="total" radius={[4,4,0,0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.year === '2022' ? '#ef4444' : 'var(--accent)'} opacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Full table */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <p style={{ padding: '0.75rem 1.25rem', fontSize: '0.7rem', color: 'var(--text-dim)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Деталізація по роках</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Рік', 'Усього', 'Великий', '%', 'Середній', '%', 'Малий', '%', 'Мікро', '%'].map((h, i) => (
                        <th key={i} style={{ padding: '0.5rem 0.75rem', textAlign: 'right', color: 'var(--text-dim)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...detail.years].reverse().map((y, i) => (
                      <tr key={y.year} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: y.year === 2022 ? 'rgba(239,68,68,0.04)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td className="mono" style={{ padding: '0.45rem 0.75rem', color: 'var(--accent)', fontWeight: 600 }}>{y.year}</td>
                        <td className="mono" style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-bright)', fontWeight: 600 }}>{y.total ? fmt(y.total * 1000) : '—'}</td>
                        <td className="mono" style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: '#00e5ff' }}>{y.large_thsd ? fmt(y.large_thsd * 1000) : '—'}</td>
                        <td className="mono" style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-dim)' }}>{y.large_pct ?? '—'}%</td>
                        <td className="mono" style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: '#7c3aed' }}>{y.medium_thsd ? fmt(y.medium_thsd * 1000) : '—'}</td>
                        <td className="mono" style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-dim)' }}>{y.medium_pct ?? '—'}%</td>
                        <td className="mono" style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: '#f59e0b' }}>{y.small_thsd ? fmt(y.small_thsd * 1000) : '—'}</td>
                        <td className="mono" style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-dim)' }}>{y.small_pct ?? '—'}%</td>
                        <td className="mono" style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: '#ef4444' }}>{y.micro_thsd ? fmt(y.micro_thsd * 1000) : '—'}</td>
                        <td className="mono" style={{ padding: '0.45rem 0.75rem', textAlign: 'right', color: 'var(--text-dim)' }}>{y.micro_pct ?? '—'}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Compare section */}
        {compareList.length > 1 && (
          <div style={{ marginTop: '1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
              Порівняння: {compareList.join(' vs ')} (млрд грн)
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {compareData.map((d, i) => (
                <span key={d.kved} style={{ padding: '0.25rem 0.6rem', borderRadius: 4, background: COMPARE_COLORS[i] + '22', border: `1px solid ${COMPARE_COLORS[i]}44`, fontSize: '0.7rem', color: COMPARE_COLORS[i], fontFamily: 'JetBrains Mono' }}>
                  {d.kved} — {d.name_ua?.slice(0, 30)}…
                </span>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={compareChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="year" tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.72rem' }}
                  labelStyle={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono' }} />
                {compareList.map((k, i) => (
                  <Bar key={k} dataKey={k} fill={COMPARE_COLORS[i]} radius={[2,2,0,0]} opacity={0.85} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
