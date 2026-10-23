import { useState } from 'react'

export default function RateLimitUI() {
  const [ip, setIp] = useState('')
  const [action, setAction] = useState('status')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const submit = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/admin/rate-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token
        },
        body: JSON.stringify({ action, ip })
      })
      const data = await res.json()
      if (!res.ok || data.success === false) {
        setError(data.message || '操作失敗')
      } else {
        setResult(data)
      }
    } catch (e) {
      setError(String(e.message || e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '40px auto', padding: 20 }}>
      <h1>限流管理</h1>
      <p>選擇操作並輸入 IP 與管理密鑰。</p>

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>操作</span>
          <select value={action} onChange={e => setAction(e.target.value)}>
            <option value="status">查詢狀態</option>
            <option value="reset">解封 IP</option>
            <option value="whitelist">加入白名單</option>
            <option value="unwhitelist">移除白名單</option>
            <option value="list">列出目前 IP 使用狀態</option>
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>IP{action === 'list' ? '（此操作不需要輸入）' : ''}</span>
          <input value={ip} onChange={e => setIp(e.target.value)} placeholder={action === 'list' ? '不需輸入' : '例如 127.0.0.1'} disabled={action === 'list'} />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>管理密鑰</span>
          <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="RATE_LIMIT_ADMIN_TOKEN" />
        </label>

        <button onClick={submit} disabled={loading || !action || !token || (action !== 'list' && !ip)}>
          {loading ? '執行中…' : '送出'}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 16, color: '#b00020' }}>{error}</div>
      )}

      {result && (
        <div style={{ marginTop: 16 }}>
          <pre style={{ background: '#f5f5f5', padding: 12, overflowX: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
// 限流管理介面頁面
// 功能：輸入 IP 與管理密鑰，選擇操作（status/reset/whitelist/unwhitelist）並呼叫管理端點
// 顯示：將 API JSON 回應直接顯示於頁面