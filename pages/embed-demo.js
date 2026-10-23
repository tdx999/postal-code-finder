import Head from 'next/head'
import Link from 'next/link'
import { useEffect } from 'react'

export default function EmbedDemo() {
  const base = ''
  useEffect(() => {
    if (!document.getElementById('zip-widget-loader')) {
      const s = document.createElement('script')
      s.id = 'zip-widget-loader'
      s.src = '/zip-widget.js'
      s.defer = true
      s.setAttribute('data-target', 'zip-container')
      s.setAttribute('data-show', 'full')
      document.body.appendChild(s)
    }
    return () => {
      const el = document.getElementById('zip-widget-loader')
      if (el) { try { document.body.removeChild(el) } catch (_) {} }
    }
  }, [])
  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 20 }}>
      <Head>
        <title>嵌入範例 - 郵遞區號查詢</title>
        <meta name="description" content="嵌入郵遞區號查詢的範例頁" />
      </Head>

      <h1>嵌入範例</h1>
      <p>以下展示兩種整合方式。</p>

      <section style={{ marginTop: 24 }}>
        <h2>一段程式（Fetch）</h2>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          <input id="addr-demo" placeholder="請輸入完整地址" defaultValue="桃園市八德區介壽路二段1425號" />
          <button onClick={async () => {
            const addr = document.getElementById('addr-demo').value
            const res = await fetch(`/api/postal-code?address=${encodeURIComponent(addr)}`)
            const json = await res.json()
            const zip = json?.data?.postal_code || ''
            document.getElementById('zip-demo').textContent = zip || '查無資料'
            document.getElementById('addr-res').textContent = json?.data?.address || ''
            document.getElementById('input-res').textContent = json?.data?.input_address || ''
            document.getElementById('eng-res').textContent = json?.data?.english_address || ''
          }}>查郵遞區號</button>
          <div>3+3 郵遞區號：<span id="zip-demo"></span></div>
          <div style={{ marginTop: 8 }}>
            <div>完整地址：<span id="addr-res"></span></div>
            <div>原始輸入：<span id="input-res"></span></div>
            <div>英文地址：<span id="eng-res"></span></div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>一行嵌入（Widget）</h2>
        <p>下方區塊由一行 <code>&lt;script&gt;</code> 自動產生。</p>
        <div id="zip-container" suppressHydrationWarning={true} style={{ border: '1px solid #eee', padding: 12 }}></div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>放到自己的網站</h2>
        <p>在你的頁面加入：</p>
        <pre><code>{`<script src="https://your-domain.com/zip-widget.js" defer></script>`}</code></pre>
        <p>或指定容器與 API Base：</p>
        <pre><code>{`<div id="zip-container"></div>
<script src="https://your-domain.com/zip-widget.js" data-target="zip-container" data-api="https://your-domain.com" defer></script>`}</code></pre>
        <p>更多說明請見 <Link href="/api-docs">API 文件</Link>。</p>
      </section>
    </div>
  )
}