/**
 * API 線上文件與使用指南頁面 (/api-docs)
 *
 * 提供台灣 3+3 郵遞區號查詢系統的 API 文件、即時測試網址、一行嵌入小工具與 Fetch 範例。
 *
 * 主要功能：
 *   - 小白三秒上手專區：網址列直接查、一行代碼嵌入小工具、三行程式碼 Fetch 呼叫
 *   - 完整 API 端點規格：智慧地址查郵遞區號、縣市、行政區與路名查詢 API
 *   - 一鍵複製與線上測試：提供程式碼一鍵複製與新分頁即時測試功能
 *   - 流量限制與常見問題：展示伺服器呼叫額度與常見問題解答
 *
 * 依賴服務：
 *   - /api/public/rate-limit: 讀取伺服器當前 API 流量限制設定
 *   - GoogleAd: 廣告展示元件
 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { AdSenseScript } from '../components/GoogleAd';
import styles from '../styles/ApiDocs.module.css';

const BASE_URL = 'https://postal-code-finder-lac.vercel.app';

const ApiDocs = () => {
  const [rate, setRate] = useState(null);
  const [copiedKey, setCopiedKey] = useState('');

  useEffect(() => {
    let mounted = true;
    fetch('/api/public/rate-limit')
      .then((r) => r.json())
      .then((j) => {
        if (mounted && j?.data) setRate(j.data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleCopy = (text, key) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 2000);
    }
  };

  const sampleUrl = `${BASE_URL}/api/postal-code?address=台北市中正區忠孝西路一段1號`;
  const widgetCode = `<script src="${BASE_URL}/zip-widget.js" defer></script>`;
  const fetchCode = `// 查詢台灣 3+3 郵遞區號
async function getPostalCode(address) {
  const res = await fetch(\`${BASE_URL}/api/postal-code?address=\${encodeURIComponent(address)}\`);
  const data = await res.json();
  return data?.data?.postal_code; // 例如回傳 "100001"
}

// 使用範例：
getPostalCode("台北市中正區忠孝西路一段1號").then(zip => console.log("郵遞區號：", zip));`;

  return (
    <>
      <Head>
        <title>台灣 3+3 郵遞區號 API 快速使用指南</title>
        <meta
          name="description"
          content="超簡單的台灣 3+3 郵遞區號 API，支援網址列直接查詢、一行 HTML 小工具嵌入與現代 Fetch 呼叫。"
        />
        <AdSenseScript />
      </Head>

      <div className={styles.container}>
        <header className={styles.header}>
          <h1>📮 台灣 3+3 郵遞區號 API 使用指南</h1>
          <p>免金鑰、超簡單！支援瀏覽器直接查、一行嵌入小工具與 RESTful API。</p>
        </header>

        <nav className={styles.nav}>
          <Link href="/">🏠 回到首頁</Link>
          <Link href="/embed-demo">📱 小工具展示頁</Link>
          <a
            href="https://github.com/tdx999/postal-code-finder"
            target="_blank"
            rel="noopener noreferrer"
          >
            💻 GitHub 原始碼
          </a>
        </nav>

        <main className={styles.main}>
          {/* 小白 3 秒上手專區 */}
          <section className={styles.section}>
            <h2>⚡ 小白 3 招快速上手（選最適合您的方式）</h2>
            <p style={{ color: '#64748b', marginTop: '-8px', marginBottom: '18px' }}>
              完全免費、免申請 API Key，直接套用即可！
            </p>

            {/* 第 1 招 */}
            <div className={styles.levelCard}>
              <div className={styles.cardHeader}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  🟢 第 1 招：免寫程式！網址列直接查
                </h3>
                <span className={`${styles.badge} ${styles.badgeGreen}`}>最簡單 / 任何人都能用</span>
              </div>
              <p style={{ margin: '6px 0', fontSize: '0.95rem' }}>
                只要在瀏覽器網址列貼上以下網址，把最後面的地址換成您想查的地址，按下 Enter 就能看到結果：
              </p>
              <div className={styles.codeBox}>
                <code>{sampleUrl}</code>
              </div>
              <div className={styles.actionBtnGroup}>
                <button
                  className={styles.copyBtn}
                  onClick={() => handleCopy(sampleUrl, 'url')}
                >
                  {copiedKey === 'url' ? '✅ 已複製網址！' : '📋 複製測試網址'}
                </button>
                <a
                  href={sampleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.copyBtnSecondary}
                >
                  🔗 點我直接在瀏覽器開啟測試
                </a>
              </div>
            </div>

            {/* 第 2 招 */}
            <div className={styles.levelCard}>
              <div className={styles.cardHeader}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  🟡 第 2 招：一行代碼嵌入到您的網站 (Widget)
                </h3>
                <span className={`${styles.badge} ${styles.badgeBlue}`}>站長必備 / 免自己刻畫面</span>
              </div>
              <p style={{ margin: '6px 0', fontSize: '0.95rem' }}>
                把這行 HTML 貼到您的部落格、WordPress 或任何網頁中，就會自動生出一個漂亮的查詢框與按鈕：
              </p>
              <div className={styles.codeBox}>
                <code>{widgetCode}</code>
              </div>
              <div className={styles.actionBtnGroup}>
                <button
                  className={styles.copyBtn}
                  onClick={() => handleCopy(widgetCode, 'widget')}
                >
                  {copiedKey === 'widget' ? '✅ 已複製代碼！' : '📋 複製嵌入代碼'}
                </button>
                <Link href="/embed-demo" className={styles.copyBtnSecondary}>
                  👀 查看小工具實際長相
                </Link>
              </div>
            </div>

            {/* 第 3 招 */}
            <div className={styles.levelCard}>
              <div className={styles.cardHeader}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  🔵 第 3 招：工程師最愛！三行 JavaScript (Fetch)
                </h3>
                <span className={`${styles.badge} ${styles.badgePurple}`}>前端串接 / 開發者專用</span>
              </div>
              <p style={{ margin: '6px 0', fontSize: '0.95rem' }}>
                在您的前端或 Node.js 程式中直接呼叫，立即取得乾淨的 JSON 格式回傳：
              </p>
              <div className={styles.codeBox}>
                <code>{fetchCode}</code>
              </div>
              <div className={styles.actionBtnGroup}>
                <button
                  className={styles.copyBtn}
                  onClick={() => handleCopy(fetchCode, 'fetch')}
                >
                  {copiedKey === 'fetch' ? '✅ 已複製程式碼！' : '📋 複製 Fetch 程式碼'}
                </button>
              </div>
            </div>
          </section>

          {/* 回應格式說明 */}
          <section className={styles.section}>
            <h2>📦 API 回傳 JSON 格式說明</h2>
            <p>請求成功時回傳標準 JSON 物件，包含地址、3+3 碼郵遞區號以及官方標準英文翻譯地址：</p>
            <pre className={styles.jsonExample}>
              <code>{`{
  "success": true,
  "data": {
    "postal_code": "100001",                                                               // 3+3 碼郵遞區號
    "address": "臺北市中正區忠孝西路一段1號",                                                // 格式化標準中文地址
    "input_address": "台北市中正區忠孝西路一段1號",                                          // 原始輸入的地址
    "english_address": "No. 1, Sec. 1, Zhongxiao W. Rd., Zhongzheng Dist., Taipei City 100001, Taiwan (R.O.C.)" // 英文地址
  }
}`}</code>
            </pre>
          </section>

          {/* 完整端點清單 */}
          <section className={styles.section}>
            <h2>📋 完整 API 端點一覽 (EndPoints)</h2>
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <div className={styles.endpointInfo}>
                  <span className={styles.method}>GET</span>
                  <code className={styles.path}>/api/postal-code?address=完整地址</code>
                </div>
                <p><strong>說明：</strong>輸入任意台灣地址，系統自動智慧匹配並回傳精確 3+3 郵遞區號。</p>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.endpointInfo}>
                  <span className={styles.method}>GET</span>
                  <code className={styles.path}>/api/address/cities</code>
                </div>
                <p><strong>說明：</strong>取得全台灣所有縣市清單（例如：台北市、新北市、台中市...）。</p>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.endpointInfo}>
                  <span className={styles.method}>GET</span>
                  <code className={styles.path}>/api/address/areas?city=縣市名稱</code>
                </div>
                <p><strong>說明：</strong>取得指定縣市下的所有行政區/鄉鎮市區（例如：中正區、大安區...）。</p>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.endpointInfo}>
                  <span className={styles.method}>GET</span>
                  <code className={styles.path}>/api/address/roads?city=縣市&district=行政區</code>
                </div>
                <p><strong>說明：</strong>取得指定區域下的所有道路街名清單。</p>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.endpointInfo}>
                  <span className={styles.method}>GET</span>
                  <code className={styles.path}>/api/db-health</code>
                </div>
                <p><strong>說明：</strong>伺服器與資料庫健康檢查端點，回傳 <code>{`{ "ok": true }`}</code> 代表連線正常。</p>
              </div>
            </div>
          </section>

          {/* 使用限制 */}
          <section className={styles.section}>
            <h2>🛡️ 呼叫頻率限制 (Rate Limit)</h2>
            <div className={styles.limitations}>
              <p>為了維護伺服器穩定與防止惡意爬蟲，本系統設有基礎防刷限制：</p>
              <ul>
                <li>
                  <strong>每分鐘呼叫上限：</strong>每個 IP 每分鐘最多允許查詢{' '}
                  <strong>{rate?.defaultPerMinute ?? 20} 次</strong>。
                </li>
                <li>
                  <strong>暫停處分：</strong>若連續短時間大量違規超過{' '}
                  <strong>{rate?.violationThreshold ?? 3} 次</strong>，系統將自動暫停存取約{' '}
                  <strong>{rate?.banDurationSeconds ? Math.round(rate.banDurationSeconds / 60) : 30} 分鐘</strong>。
                </li>
                <li>
                  <strong>一般使用完全不影響：</strong>正常使用者瀏覽與查詢不會觸發限制。若有特殊大量整合需求，歡迎至 GitHub 提出 Issue！
                </li>
              </ul>
            </div>
          </section>

          {/* 常見問題 */}
          <section className={styles.section}>
            <h2>❓ 常見問題 Q&A</h2>
            <div className={styles.faq}>
              <div className={styles.faqItem}>
                <h4>Q1：使用這個 API 需要付費或註冊帳號嗎？</h4>
                <p>A：完全免費！免申請帳號、免 API Key，直接呼叫即可使用。</p>
              </div>
              <div className={styles.faqItem}>
                <h4>Q2：地址輸入不完整也可以查嗎？</h4>
                <p>A：可以！系統具備智慧模糊匹配能力，即使缺少「市」或「區」，系統也會盡力匹配最符合的道路與郵遞區號。</p>
              </div>
              <div className={styles.faqItem}>
                <h4>Q3：資料來源是哪裡？</h4>
                <p>A：本系統資料以中華郵政官方 3+3 郵遞區號資料庫為基礎進行整理與索引優化。</p>
              </div>
            </div>
          </section>
        </main>

        <footer className={styles.footer}>
          <p>© 2026 Taiwan Postal Code Finder (台灣 3+3 郵遞區號查詢系統)</p>
          <p>
            本服務資料僅供參考，實際郵遞投遞標準請以中華郵政官方為準。
          </p>
        </footer>
      </div>
    </>
  );
};

export default ApiDocs;