(() => {
  const script = document.currentScript
  const srcUrl = new URL(script.src, window.location.href)
  const baseApi = script.getAttribute('data-api') || `${srcUrl.origin}`
  const targetId = script.getAttribute('data-target')
  const showModeAttr = script.getAttribute('data-show') || script.getAttribute('data-mode') || 'zip'
  const showFull = String(showModeAttr).toLowerCase() === 'full'
  const mount = targetId ? document.getElementById(targetId) : null
  const theme = (script.getAttribute('data-theme') || 'light').toLowerCase()
  const primary = script.getAttribute('data-primary') || '#2563eb'
  const radius = parseInt(script.getAttribute('data-radius') || '8')
  const compact = String(script.getAttribute('data-compact') || 'false').toLowerCase() === 'true'

  if (mount && (mount.dataset && mount.dataset.rendered === '1')) {
    return
  }
  if (!mount) {
    const key = '__zipWidgetRendered'
    if (window[key]) return
    window[key] = true
  }

  const container = mount || document.createElement('div')
  container.style.display = 'inline-flex'
  container.style.gap = compact ? '6px' : '10px'
  container.style.alignItems = 'center'
  container.style.flexWrap = 'wrap'
  container.style.background = theme === 'dark' ? '#0f172a' : '#ffffff'
  container.style.color = theme === 'dark' ? '#e5e7eb' : '#111827'
  container.style.border = theme === 'dark' ? '1px solid #1f2937' : '1px solid #e5e7eb'
  container.style.borderRadius = `${radius}px`
  container.style.padding = compact ? '8px' : '12px'
  container.style.boxShadow = theme === 'dark' ? 'none' : '0 1px 2px rgba(0,0,0,0.06)'

  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = '請輸入完整地址'
  input.setAttribute('aria-label', '地址輸入')
  input.style.padding = compact ? '6px 8px' : '8px 10px'
  input.style.minWidth = compact ? '220px' : '280px'
  input.style.border = '1px solid #d1d5db'
  input.style.borderRadius = `${radius}px`
  input.style.outline = 'none'
  input.style.background = theme === 'dark' ? '#111827' : '#ffffff'
  input.style.color = theme === 'dark' ? '#e5e7eb' : '#111827'

  const button = document.createElement('button')
  button.textContent = '查郵遞區號'
  button.style.padding = compact ? '6px 10px' : '8px 14px'
  button.style.cursor = 'pointer'
  button.style.background = primary
  button.style.color = '#ffffff'
  button.style.border = 'none'
  button.style.borderRadius = `${radius}px`
  button.style.boxShadow = '0 1px 2px rgba(0,0,0,0.08)'
  button.onmouseenter = () => { button.style.opacity = '0.92' }
  button.onmouseleave = () => { button.style.opacity = '1' }

  const result = document.createElement('span')
  result.textContent = ''
  result.style.minWidth = '96px'
  result.style.fontWeight = '600'
  result.style.color = theme === 'dark' ? '#93c5fd' : '#1f2937'

  const status = document.createElement('span')
  status.textContent = ''
  status.style.color = theme === 'dark' ? '#9ca3af' : '#6b7280'
  status.style.marginLeft = '6px'

  const label = document.createElement('span')
  label.textContent = '3+3 郵遞區號：'
  label.style.fontSize = compact ? '13px' : '14px'
  label.style.color = theme === 'dark' ? '#9ca3af' : '#374151'

  container.appendChild(input)
  container.appendChild(button)
  container.appendChild(label)
  container.appendChild(result)

  if (showFull) {
    const mkRow = (labelText, id) => {
      const row = document.createElement('div')
      row.style.width = '100%'
      row.style.display = 'flex'
      row.style.gap = compact ? '6px' : '8px'
      const lab = document.createElement('span')
      lab.textContent = labelText
      lab.style.minWidth = '90px'
      lab.style.color = theme === 'dark' ? '#9ca3af' : '#374151'
      const val = document.createElement('span')
      val.id = id
      val.style.color = theme === 'dark' ? '#e5e7eb' : '#111827'
      row.appendChild(lab)
      row.appendChild(val)
      return row
    }
    const br = document.createElement('div')
    br.style.flexBasis = '100%'
    br.style.height = '0'
    br.style.margin = '0'
    container.appendChild(br)
    container.appendChild(mkRow('完整地址：', 'zw-address'))
    container.appendChild(mkRow('原始輸入：', 'zw-input'))
    container.appendChild(mkRow('英文地址：', 'zw-english'))
  }

  container.appendChild(status)

  async function lookup() {
    const address = input.value.trim()
    if (!address) { result.textContent = ''; status.textContent = '請輸入地址'; return }
    try {
      status.textContent = '查詢中…'
      const url = `${baseApi}/api/postal-code?address=${encodeURIComponent(address)}`
      const res = await fetch(url)
      const json = await res.json()
      const zip = (json && json.data && json.data.postal_code) ? json.data.postal_code : ''
      result.textContent = zip || '查無資料'
      if (showFull) {
        const d = json && json.data ? json.data : {}
        const addressEl = container.querySelector('#zw-address')
        const inputEl = container.querySelector('#zw-input')
        const englishEl = container.querySelector('#zw-english')
        if (addressEl) addressEl.textContent = d.address || ''
        if (inputEl) inputEl.textContent = d.input_address || ''
        if (englishEl) englishEl.textContent = d.english_address || ''
      }
      status.textContent = ''
    } catch (e) {
      result.textContent = ''
      status.textContent = '查詢失敗'
    }
  }

  button.addEventListener('click', lookup)
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') lookup() })

  if (!mount) document.body.appendChild(container)
  if (mount) mount.dataset.rendered = '1'
})()