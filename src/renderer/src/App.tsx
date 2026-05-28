import type { SessionStats } from '../../shared/types'

const MOCK_STATS: SessionStats = {
  model: 'claude-sonnet-4-6',
  inputTokens: 12_480,
  outputTokens: 3_201,
  contextWindowSize: 200_000,
  contextUsedPercent: 7.8,
  isActive: true,
  sessionStartedAt: new Date().toISOString(),
}

function formatTokens(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function StatsPanel({ stats }: { stats: SessionStats }): JSX.Element {
  return (
    <div style={{ fontFamily: 'monospace', fontSize: 12, padding: 12, minWidth: 220 }}>
      <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
        {stats.isActive ? '🟢 Active' : '⚫ Idle'}
      </div>

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          <tr>
            <td style={{ color: '#888', paddingRight: 12 }}>Model</td>
            <td>{stats.model ?? '—'}</td>
          </tr>
          <tr>
            <td style={{ color: '#888' }}>Input</td>
            <td>{formatTokens(stats.inputTokens)} tokens</td>
          </tr>
          <tr>
            <td style={{ color: '#888' }}>Output</td>
            <td>{formatTokens(stats.outputTokens)} tokens</td>
          </tr>
          <tr>
            <td style={{ color: '#888' }}>Context</td>
            <td>
              {stats.contextUsedPercent.toFixed(1)}%&nbsp;/&nbsp;
              {formatTokens(stats.contextWindowSize)}
            </td>
          </tr>
        </tbody>
      </table>

      <div
        style={{
          marginTop: 8,
          height: 4,
          borderRadius: 2,
          background: '#333',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${stats.contextUsedPercent}%`,
            height: '100%',
            background: stats.contextUsedPercent > 80 ? '#f87171' : '#4ade80',
          }}
        />
      </div>
    </div>
  )
}

function App(): JSX.Element {
  return <StatsPanel stats={MOCK_STATS} />
}

export { App }
