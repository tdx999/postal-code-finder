import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { AdSenseScript } from '../components/GoogleAd';
import styles from '../styles/ApiDocs.module.css';

const ApiDocs = () => {
  const [rate, setRate] = useState(null);
  useEffect(() => {
    let mounted = true;
    fetch('/api/public/rate-limit')
      .then(r => r.json())
      .then(j => { if (mounted) setRate(j && j.data ? j.data : null) })
      .catch(() => {});
    return () => { mounted = false };
  }, []);
  return (
    <>
      <Head>
        <title>API 使用文件 - 小白玩AI-3+3台灣郵遞區號查詢系統</title>
        <meta name="description" content="台灣郵遞區號查詢系統 API 使用文件與範例" />
        <AdSenseScript />
      </Head>
      
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>API 使用文件</h1>
          <p>快速整合郵遞區號查詢功能到您的應用程式</p>
        </header>

        <nav className={styles.nav}>
          <Link href="/">回首頁</Link>
          <Link href="/api-docs">API 文件</Link>
        </nav>

        <main className={styles.main}>
        <section className={styles.section}>
            <h2>基礎資訊</h2>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <h3>Base URL</h3>
                <code className={styles.urlCode}>https://postal-code-finder.vercel.app/api</code>
                <div className={styles.urlExample}>
                  <p><strong>可用網址查詢範例：</strong></p>
                  <code className={styles.urlCode}>
                    https://postal-code-finder-kshtn6k5n-autoassts-projects.vercel.app/api/postal-code?address=你要的住址
                  </code>
                </div>
              </div>
              <div className={styles.infoItem}>
                <h3>認證方式</h3>
                <p>目前為開放使用，無需 API Key</p>
              </div>
              <div className={styles.infoItem}>
                <h3>回應格式</h3>
                <p>JSON</p>
                <pre className={styles.jsonExample}><code>{`{
  "success": true,
  "data": {
    "address": "桃園市中壢區中山路100號",
    "input_address": "桃園市中壢區中山路100號",
    "postal_code": "320001",
    "english_address": "No. 100, Zhongshan Rd., Zhongli Dist., Taoyuan City 320001, Taiwan (R.O.C.)"
  }
}`}</code></pre>
              </div>
            </div>
          </section>
          <section className={styles.section}>
            <h2>概述</h2>
            <p>
              我們的 API 提供簡單且強大的方式來查詢台灣郵遞區號資訊。
              支援多種查詢方式，以及地址翻譯功能。
            </p>
          </section>
          <section className={styles.section}>
            <h2>超簡版</h2>
            <p>不需要安裝任何東西，直接把下面的程式貼到你的網頁就可以用。</p>
            <div className={styles.codeExamples}>
              <div className={styles.codeTab}>
                <h3>方法 A：一行就好（建議）</h3>
                <pre><code>{`<!-- 把這一行貼到你的頁面（建議放在 </body> 前） -->
<script src="https://your-domain.com/zip-widget.js" data-show="full" defer></script>`}</code></pre>
                <p>貼上後，頁面會自動出現：地址輸入框、查詢按鈕、3+3 區號、完整地址、原始輸入、英文地址。</p>
                <p>如果要指定放在哪個區塊：</p>
                <pre><code>{`<div id="zip-container"></div>
<script src="https://your-domain.com/zip-widget.js" data-target="zip-container" data-show="full" defer></script>`}</code></pre>
              </div>

              <div className={styles.codeTab}>
                <h3>方法 B：最簡 Fetch（自己控制顯示）</h3>
                <pre><code>{`<script>
function getZip() {
  var addr = document.getElementById('addr').value;
  fetch('https://your-domain.com/api/postal-code?address=' + encodeURIComponent(addr))
    .then(function(r){ return r.json(); })
    .then(function(d){
      var data = d && d.data ? d.data : {};
      document.getElementById('zip').textContent = data.postal_code || '';
      document.getElementById('addrOut').textContent = data.address || '';
      document.getElementById('inputOut').textContent = data.input_address || '';
      document.getElementById('eng').textContent = data.english_address || '';
    })
    .catch(function(){
      document.getElementById('zip').textContent = '';
    });
}
</script>

<input id="addr" placeholder="請輸入完整地址">
<button onclick="getZip()">查郵遞區號</button>
<div>3+3 郵遞區號：<span id="zip"></span></div>
<div>完整地址：<span id="addrOut"></span></div>
<div>原始輸入：<span id="inputOut"></span></div>
<div>英文地址：<span id="eng"></span></div>`}</code></pre>
                <p>把 <code>your-domain.com</code> 換成你的網域或本機（例如 <code>http://localhost:3002</code>）。</p>
              </div>
            </div>
          </section>
          <section className={styles.section}>
            <h2>快速整合</h2>
            <div className={styles.codeExamples}>
              <div className={styles.codeTab}>
                <h3>一段程式（Fetch，取 3+3 區號）</h3>
                <pre><code>{`<script>
async function getZip(address) {
  const res = await fetch('https://your-domain.com/api/postal-code?address=' + encodeURIComponent(address))
  const json = await res.json()
  return json?.data?.postal_code || ''
}

// 範例：按鈕觸發
async function onLookup() {
  const addr = document.getElementById('addr').value
  const zip = await getZip(addr)
  document.getElementById('zip').textContent = zip || '查無資料'
}
</script>

<input id="addr" placeholder="請輸入完整地址">
<button onclick="onLookup()">查郵遞區號</button>
<div>3+3 郵遞區號：<span id="zip"></span></div>`}</code></pre>
              </div>

              <div className={styles.codeTab}>
                <h3>一行嵌入（自動產生輸入＋按鈕＋結果）</h3>
                <pre><code>{`<!-- 放在你的頁面任意位置（建議 body 結尾） -->
<script src="https://your-domain.com/zip-widget.js" defer></script>`}</code></pre>
                <p>可選參數：</p>
                <pre><code>{`<!-- 指定掛載容器與 API Base URL -->
<div id="zip-container"></div>
<script src="https://your-domain.com/zip-widget.js" data-target="zip-container" data-api="https://your-domain.com" defer></script>`}</code></pre>
                <pre><code>{`<!-- 顯示完整欄位（address/input_address/english_address） -->
<script src="https://your-domain.com/zip-widget.js" data-show="full" defer></script>`}</code></pre>
                <p>
                  範例頁：<Link href="/embed-demo">/embed-demo</Link>
                </p>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>錯誤處理</h2>
            <p>API 使用標準的 HTTP 狀態碼來表示請求的成功或失敗：</p>
            <ul>
              <li><code>200 OK</code>: 請求成功</li>
              <li><code>400 Bad Request</code>: 請求參數錯誤</li>
              <li><code>404 Not Found</code>: 找不到相關資料</li>
              <li><code>500 Internal Server Error</code>: 伺服器錯誤</li>
            </ul>
            
            <div className={styles.errorExample}>
              <h4>錯誤回應格式</h4>
              <pre><code>{`{
  "success": false,
  "message": "請提供 address 或 (city + district) 或 postalCode 參數"
}`}</code></pre>
            </div>
          </section>

          <section className={styles.section}>
            <h2>使用限制</h2>
            <div className={styles.limitations}>
              <ul>
                <li><strong>查詢次數</strong>: 每台裝置在一段時間（約 {rate?.windowSeconds ?? '?'} 秒）最多查詢 {rate?.defaultPerMinute ?? '?'} 次</li>
                <li><strong>暫停說明</strong>: 查太快會被暫停一下；超過 {rate?.violationThreshold ?? '?'} 次超額會暫停 {rate?.banDurationSeconds ?? '?'} 秒</li>
                <li><strong>大量使用</strong>: 有大量需求？跟我們說一聲可以提高額度或加入白名單</li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2>常見問題</h2>
            <div className={styles.faq}>
            <div className={styles.faqItem}>
                <h4>Q: 都是已中華郵政的資料為主嗎？有其他資料來源嗎？</h4>
                <p>A: 本查詢是根據 中華郵政(郵局) 的資料為基礎，查詢出的結果有時會有錯誤, 完全正確資料請查 中華郵政(郵局) 官網。</p>
              </div> 
              <div className={styles.faqItem}>
                <h4>Q: API 是否有使用限制？</h4>
                <p>A: 簡單說：每台裝置在一段時間（約 {rate?.windowSeconds ?? '?'} 秒）能查 {rate?.defaultPerMinute ?? '?'} 次。太快會被暫停一下；需要更高額度請聯絡我們。</p>
              </div>
              
              <div className={styles.faqItem}>
                <h4>Q: 資料多久更新一次？</h4>
                <p>A: 不知道多久更新同步，現在郵局資料取得不易。</p>
              </div>
              
              <div className={styles.faqItem}>
                <h4>Q: 可以批次查詢嗎？</h4>
                <p>A: 目前支援單筆查詢，批次查詢功能正在開發中。</p>
              </div>
              
              <div className={styles.faqItem}>
                <h4>Q: 如何處理特殊地址？</h4>
                <p>A: 系統會自動解析巷、弄、號等資訊，並提供最接近的郵遞區號。</p>
              </div>
            </div>
          </section>
        </main>

        <footer className={styles.footer}>
          <p>&copy; 2025 小白玩AI-3+3台灣郵遞區號查詢系統. All rights reserved.</p>
          <p>網站所提供之資料, 僅供使用者參考, 如查詢結果與實際不同, 請以中華郵政(郵局)資料為準, 對於查詢結果錯誤, 本網站不負任何法律責任</p>
          <p>本系統僅供個人研究使用，如有任何問題，請聯絡 ai.autoasst@gmail.com</p>
          <p>如需技術支援，請聯絡 ai.autoasst@gmail.com</p>
        </footer>
      </div>
    </>
  );
};

export default ApiDocs;