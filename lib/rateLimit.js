import fs from 'fs'
import path from 'path'

let configCache = null
let configPath = null
let lastMtime = 0

function resolveConfigPath() {
  const candidates = [
    path.join(process.cwd(), 'config', 'rateLimit.json'),
    path.join(process.cwd(), 'postal-code-finder', 'config', 'rateLimit.json')
  ]
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p
    } catch (_) {}
  }
  return null
}

function loadConfig() {
  const cfgPath = configPath || resolveConfigPath()
  if (cfgPath) {
    configPath = cfgPath
    try {
      const stat = fs.statSync(cfgPath)
      if (!configCache || stat.mtimeMs !== lastMtime) {
        const raw = fs.readFileSync(cfgPath, 'utf-8')
        const parsed = JSON.parse(raw)
        configCache = { defaultPerMinute: 100, overrides: {}, whitelist: [], ...parsed }
        lastMtime = stat.mtimeMs
      }
      return configCache
    } catch (_) {}
  }
  if (!configCache) configCache = { defaultPerMinute: 100, overrides: {}, whitelist: [] }
  return configCache
}

const buckets = global.__rateBuckets || new Map()
global.__rateBuckets = buckets

function getIp(req) {
  const normalize = (s) => {
    if (!s) return 'unknown'
    let v = String(s).trim()
    if (v.includes(',')) v = v.split(',')[0].trim()
    if (v.startsWith('::ffff:')) v = v.replace('::ffff:', '')
    if (v === '::1') v = '127.0.0.1'
    return v
  }
  const xff = req.headers['x-forwarded-for']
  if (Array.isArray(xff) && xff.length > 0) return normalize(xff[0])
  if (typeof xff === 'string' && xff.length > 0) return normalize(xff)
  const addr = req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : 'unknown'
  return normalize(addr)
}

export function checkRate(req) {
  const cfg = loadConfig()
  const windowMs = Math.max(1, parseInt(cfg.windowSeconds || 60)) * 1000
  const ip = getIp(req)
  if (Array.isArray(cfg.whitelist) && cfg.whitelist.includes(ip)) {
    return { allowed: true, remaining: Infinity, limit: Infinity, resetAt: new Date(Date.now() + windowMs).toISOString() }
  }
  const limit = (cfg.overrides && cfg.overrides[ip] && cfg.overrides[ip].perMinute) || cfg.defaultPerMinute || 100
  const now = Date.now()
  const b = buckets.get(ip)
  const banCfg = cfg.ban || {}
  const banEnabled = banCfg.enabled !== false
  const banDurationMs = Math.max(0, parseInt(banCfg.banDurationSeconds || 0)) * 1000
  const violationThreshold = Math.max(1, parseInt(banCfg.violationThreshold || 0))

  if (b && b.bannedUntil && now < b.bannedUntil) {
    return { allowed: false, remaining: 0, limit, resetAt: new Date(b.bannedUntil).toISOString(), blocked: true }
  }
  if (!b || now - b.windowStart >= windowMs) {
    const prevViolations = b && b.violations ? b.violations : 0
    buckets.set(ip, { windowStart: now, count: 1, violations: prevViolations, bannedUntil: null })
    return { allowed: true, remaining: limit - 1, limit, resetAt: new Date(now + windowMs).toISOString() }
  }
  if (b.count < limit) {
    b.count += 1
    return { allowed: true, remaining: limit - b.count, limit, resetAt: new Date(b.windowStart + windowMs).toISOString() }
  }
  if (banEnabled && violationThreshold > 0 && banDurationMs > 0) {
    const v = (b.violations || 0) + 1
    b.violations = v
    if (v >= violationThreshold) {
      b.bannedUntil = now + banDurationMs
      return { allowed: false, remaining: 0, limit, resetAt: new Date(b.bannedUntil).toISOString(), blocked: true }
    }
  }
  return { allowed: false, remaining: 0, limit, resetAt: new Date(b.windowStart + windowMs).toISOString(), blocked: false }
}

export function resetIp(ip) {
  if (!ip) return { ok: false }
  buckets.delete(ip)
  return { ok: true }
}

function writeConfig(next) {
  const p = configPath || resolveConfigPath() || path.join(process.cwd(), 'config', 'rateLimit.json')
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true })
    fs.writeFileSync(p, JSON.stringify(next, null, 2))
    configCache = null
    lastMtime = 0
    return true
  } catch (_) {
    return false
  }
}

export function addWhitelist(ip) {
  const cfg = loadConfig()
  const list = new Set(Array.isArray(cfg.whitelist) ? cfg.whitelist : [])
  list.add(ip)
  const next = { ...cfg, whitelist: Array.from(list) }
  return writeConfig(next)
}

export function removeWhitelist(ip) {
  const cfg = loadConfig()
  const list = new Set(Array.isArray(cfg.whitelist) ? cfg.whitelist : [])
  list.delete(ip)
  const next = { ...cfg, whitelist: Array.from(list) }
  return writeConfig(next)
}

export function banIp(ip, seconds) {
  const now = Date.now()
  const b = buckets.get(ip) || { windowStart: now, count: 0, violations: 0, bannedUntil: null }
  b.bannedUntil = now + Math.max(1, parseInt(seconds || 0)) * 1000
  buckets.set(ip, b)
  return { ok: true, bannedUntil: b.bannedUntil }
}

export function unbanIp(ip) {
  const b = buckets.get(ip)
  if (b) { b.bannedUntil = null }
  return { ok: true }
}

export function reloadRateLimitConfig() {
  configCache = null
  lastMtime = 0
  return loadConfig()
}

export function listIpUsage() {
  const cfg = loadConfig()
  const normalize = (s) => {
    if (!s) return 'unknown'
    let v = String(s).trim()
    if (v.startsWith('::ffff:')) v = v.replace('::ffff:', '')
    if (v === '::1') v = '127.0.0.1'
    return v
  }
  const agg = new Map()
  for (const [rawIp, b] of buckets.entries()) {
    const ip = normalize(rawIp)
    const existing = agg.get(ip)
    if (!existing) {
      agg.set(ip, {
        ip,
        windowStart: b.windowStart ? new Date(b.windowStart).toISOString() : null,
        count: b.count || 0,
        violations: b.violations || 0,
        bannedUntil: b.bannedUntil ? new Date(b.bannedUntil).toISOString() : null
      })
    } else {
      existing.count += (b.count || 0)
      existing.violations += (b.violations || 0)
      const ws = b.windowStart ? new Date(b.windowStart).toISOString() : null
      if (!existing.windowStart || (ws && ws < existing.windowStart)) existing.windowStart = ws
      const bu = b.bannedUntil ? new Date(b.bannedUntil).toISOString() : null
      if (!existing.bannedUntil || (bu && bu > existing.bannedUntil)) existing.bannedUntil = bu
    }
  }
  const out = []
  for (const v of agg.values()) {
    const limit = (cfg.overrides && cfg.overrides[v.ip] && cfg.overrides[v.ip].perMinute) || cfg.defaultPerMinute || 100
    out.push({ ...v, limit })
  }
  return out
}
// 每 IP 限流與封鎖模組
// 功能：
// - 依設定檔 rateLimit.json 執行限流（defaultPerMinute、windowSeconds）
// - 支援白名單（whitelist）、特定 IP 覆蓋速率（overrides）
// - 自動封鎖：違規次數達 ban.violationThreshold 封鎖 ban.banDurationSeconds
// - 管理操作：resetIp、add/removeWhitelist、banIp、unbanIp、reloadRateLimitConfig
// 主要方法：checkRate(req) 回傳 { allowed, remaining, limit, resetAt, blocked }