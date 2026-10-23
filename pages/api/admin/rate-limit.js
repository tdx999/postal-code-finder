import { checkRate, resetIp, addWhitelist, removeWhitelist, reloadRateLimitConfig, listIpUsage } from '../../../lib/rateLimit'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: '僅支援 POST' })
  }

  const token = (req.headers['x-admin-token'] || (req.body && req.body.token))
  if (!process.env.RATE_LIMIT_ADMIN_TOKEN || token !== process.env.RATE_LIMIT_ADMIN_TOKEN) {
    return res.status(401).json({ success: false, message: '未授權' })
  }

  const action = req.body && req.body.action
  const ip = req.body && req.body.ip
  if (!action) return res.status(400).json({ success: false, message: '缺少 action' })

  if (action === 'reset') {
    if (!ip) return res.status(400).json({ success: false, message: '缺少 ip' })
    const r = resetIp(ip)
    return res.status(200).json({ success: r.ok, message: r.ok ? '已重置' : '重置失敗' })
  }
  if (action === 'whitelist') {
    if (!ip) return res.status(400).json({ success: false, message: '缺少 ip' })
    const ok = addWhitelist(ip)
    const cfg = reloadRateLimitConfig()
    return res.status(200).json({ success: ok, message: ok ? '已加入白名單' : '加入失敗', config: cfg })
  }
  if (action === 'unwhitelist') {
    if (!ip) return res.status(400).json({ success: false, message: '缺少 ip' })
    const ok = removeWhitelist(ip)
    const cfg = reloadRateLimitConfig()
    return res.status(200).json({ success: ok, message: ok ? '已移除白名單' : '移除失敗', config: cfg })
  }
  if (action === 'status') {
    const rate = checkRate({ headers: {}, socket: { remoteAddress: ip || '127.0.0.1' } })
    return res.status(200).json({ success: true, rate })
  }
  if (action === 'list') {
    const list = listIpUsage()
    return res.status(200).json({ success: true, ips: list, count: list.length })
  }

  return res.status(400).json({ success: false, message: '未知 action' })
}
// 限流管理 API 端點
// 方法：POST
// 認證：Header X-Admin-Token 或 Body token（需等於環境變數 RATE_LIMIT_ADMIN_TOKEN）
// 動作：status（查狀態）、reset（重置 IP 計數）、whitelist（加入白名單）、unwhitelist（移除白名單）