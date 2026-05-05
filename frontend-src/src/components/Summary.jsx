import { useState } from 'react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const fmt = (v) => {
  if (!v && v !== 0) return '—'
  if (v >= 1e9) return (v / 1e9).toFixed(1) + ' трлн'
  if (v >= 1e6) return (v / 1e6).toFixed(1) + ' млрд'
  return (v / 1e3).toFixed(0) + ' млн'
}

const fmtFull = (v) => {
  if (!v) return '—'
  return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(Math.round(v / 1000)) + ' млн грн'
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: '8px', padding: '12px 16px', fontSize: '0.75rem'
    }}>
      <p className="mono" style={{ color: 'var(--accent)', marginBottom: 8, fontWeight: 600 }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-dim)' }}>{p.name}:</span>
          <span className="mono" style={{ color: 'var(--text-bright)', fontWeight: 600 }}>
            {typeof p.value === 'number' && p.value > 1000 ? fmt(p.value * 1000) : p.value + '%'}
          </span>
        </div>
      ))}
    </div>
  )
}

const StatCard = ({ label, value, sub, color, delta }) => (
  <div style={{
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '1.25rem 1.5rem',
    borderLeft: `3px solid ${color}`,
  }}>
    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</p>
    <p className="mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-bright)', letterSpacing: '-0.02em' }}>{value}</p>
    {sub && <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>{sub}</p>}
    {delta !== undefined && (
      <p className="mono" style={{ fontSize: '0.72rem', color: delta >= 0 ? 'var(--green)' : 'var(--micro)', marginTop: 4 }}>
        {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% YoY
      </p>
    )}
  </div>
)

export default function Summary({ summary }) {
  const [chartType, setChartType] = useState('total')

  if (!summary.length) return null

  const latest = summary[summary.length - 1]
  const prev = summary[summary.length - 2]
  const delta = prev?.total ? ((latest.total - prev.total) / prev.total) * 100 : null

  const chartData = summary.map(r => ({
    year: String(r.year),
    'Усього (млрд грн)': Math.round(r.total / 1e6),
    'Великий бізнес': Math.round(r.large_thsd / 1e6),
    'Середній бізнес': Math.round(r.medium_thsd / 1e6),
    'Малий бізнес': Math.round(r.small_thsd / 1e6),
    'Мікро': Math.round(r.micro_thsd / 1e6),
  }))

  const pctData = summary.map(r => ({
    year: String(r.year),
    'Великий': r.large_pct,
    'Середній': r.medium_pct,
    'Малий': r.small_pct,
    'Мікро': r.micro_pct,
  }))

  return (
    <div>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard label="Загальний обсяг 2024" value={fmt(latest.total * 1000)} sub="тис. грн → млрд" color="var(--accent)" delta={delta} />
        <StatCard label="Великий бізнес" value={latest.large_pct + '%'} sub={fmt(latest.large_thsd * 1000)} color="var(--large)" />
        <StatCard label="Середній бізнес" value={latest.medium_pct + '%'} sub={fmt(latest.medium_thsd * 1000)} color="var(--medium)" />
        <StatCard label="Малий бізнес" value={latest.small_pct + '%'} sub={fmt(latest.small_thsd * 1000)} color="var(--small)" />
        <StatCard label="Мікропідприємства" value={latest.micro_pct + '%'} sub={fmt(latest.micro_thsd * 1000)} color="var(--micro)" />
      </div>

      {/* Chart toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {[['total', 'Абсолютні значення'], ['pct', 'Частки (%)']].map(([k, l]) => (
          <button key={k} onClick={() => setChartType(k)} style={{
            padding: '0.35rem 0.9rem', fontSize: '0.75rem',
            background: chartType === k ? 'var(--accent)' : 'var(--surface)',
            color: chartType === k ? '#000' : 'var(--text-dim)',
            border: '1px solid var(--border)', borderRadius: '6px',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: chartType === k ? 600 : 400,
          }}>{l}</button>
        ))}
      </div>

      {/* Main chart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {chartType === 'total' ? 'Обсяг виробленої продукції за типом підприємства, млрд грн' : 'Структура виробництва за типом підприємства, %'}
        </p>
        <ResponsiveContainer width="100%" height={320}>
          {chartType === 'total' ? (
            <AreaChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <defs>
                {[['large', '#00e5ff'], ['medium', '#7c3aed'], ['small', '#f59e0b'], ['micro', '#ef4444']].map(([k, c]) => (
                  <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" tick={{ fill: 'var(--text-dim)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-dim)' }} />
              <Area type="monotone" dataKey="Великий бізнес" stroke="#00e5ff" fill="url(#g-large)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="Середній бізнес" stroke="#7c3aed" fill="url(#g-medium)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="Малий бізнес" stroke="#f59e0b" fill="url(#g-small)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="Мікро" stroke="#ef4444" fill="url(#g-micro)" strokeWidth={2} dot={false} />
            </AreaChart>
          ) : (
            <BarChart data={pctData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" tick={{ fill: 'var(--text-dim)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              <Bar dataKey="Великий" stackId="a" fill="#00e5ff" radius={[0,0,0,0]} />
              <Bar dataKey="Середній" stackId="a" fill="#7c3aed" />
              <Bar dataKey="Малий" stackId="a" fill="#f59e0b" />
              <Bar dataKey="Мікро" stackId="a" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Data table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Зведена таблиця по роках</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Рік', 'Усього (млн грн)', 'Великий %', 'Середній %', 'Малий %', 'Мікро %', 'ФОП (млн грн)'].map(h => (
                  <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'right', color: 'var(--text-dim)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...summary].reverse().map((r, i) => (
                <tr key={r.year} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td className="mono" style={{ padding: '0.55rem 1rem', color: 'var(--accent)', fontWeight: 600 }}>{r.year}</td>
                  <td className="mono" style={{ padding: '0.55rem 1rem', textAlign: 'right', color: 'var(--text-bright)' }}>{new Intl.NumberFormat('uk-UA').format(Math.round(r.total / 1000))}</td>
                  <td className="mono" style={{ padding: '0.55rem 1rem', textAlign: 'right', color: '#00e5ff' }}>{r.large_pct}%</td>
                  <td className="mono" style={{ padding: '0.55rem 1rem', textAlign: 'right', color: '#7c3aed' }}>{r.medium_pct}%</td>
                  <td className="mono" style={{ padding: '0.55rem 1rem', textAlign: 'right', color: '#f59e0b' }}>{r.small_pct}%</td>
                  <td className="mono" style={{ padding: '0.55rem 1rem', textAlign: 'right', color: '#ef4444' }}>{r.micro_pct}%</td>
                  <td className="mono" style={{ padding: '0.55rem 1rem', textAlign: 'right', color: 'var(--text-dim)' }}>{r.ie_total ? new Intl.NumberFormat('uk-UA').format(Math.round(r.ie_total / 1000)) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
