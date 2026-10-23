export default function handler(req, res) {
  try {
    const cfg = require('../../../config/rateLimit.json') || {}
    const def = typeof cfg.defaultPerMinute === 'number' ? cfg.defaultPerMinute : 100
    const win = typeof cfg.windowSeconds === 'number' ? cfg.windowSeconds : 60
    const ban = cfg.ban || {}
    const out = {
      defaultPerMinute: def,
      windowSeconds: win,
      banEnabled: ban.enabled !== false,
      violationThreshold: typeof ban.violationThreshold === 'number' ? ban.violationThreshold : 0,
      banDurationSeconds: typeof ban.banDurationSeconds === 'number' ? ban.banDurationSeconds : 0
    }
    res.status(200).json({ success: true, data: out })
  } catch (_) {
    res.status(200).json({ success: true, data: { defaultPerMinute: 100, windowSeconds: 60, banEnabled: false, violationThreshold: 0, banDurationSeconds: 0 } })
  }
}