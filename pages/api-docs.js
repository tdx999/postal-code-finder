import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { AdSenseScript } from '../components/GoogleAd';
import styles from '../styles/ApiDocs.module.css';

const ApiDocs = () => {
  return (
    <>
      <Head>
        <title>API 使用文件 - 台灣郵遞區號查詢系統</title>
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
            <h2>概述</h2>
            <p>
              我們的 API 提供簡單且強大的方式來查詢台灣郵遞區號資訊。
              支援多種查詢方式，包括地址搜尋、郵遞區號反向查詢，以及地址翻譯功能。
            </p>
          </section>

          <section className={styles.section}>
            <h2>基礎資訊</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <h3>Base URL</h3>
                <code>https://your-domain.com/api</code>
              </div>
              <div className={styles.infoItem}>
                <h3>認證方式</h3>
                <p>目前為開放使用，無需 API Key</p>
              </div>
              <div className={styles.infoItem}>
                <h3>回應格式</h3>
                <p>JSON</p>
              </div>
              <div className={styles.infoItem}>
                <h3>HTTP 方法</h3>
                <p>GET</p>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>主要端點</h2>
            
            <div className={styles.endpoint}>
              <h3>郵遞區號查詢</h3>
              <div className={styles.endpointInfo}>
                <span className={styles.method}>GET</span>
                <code className={styles.path}>/postal-code</code>
              </div>
              
              <h4>查詢參數</h4>
              <table className={styles.paramsTable}>
                <thead>
                  <tr>
                    <th>參數名稱</th>
                    <th>類型</th>
                    <th>必填</th>
                    <th>描述</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>city</code></td>
                    <td>string</td>
                    <td>否</td>
                    <td>縣市名稱 (例: 臺北市)</td>
                  </tr>
                  <tr>
                    <td><code>district</code></td>
                    <td>string</td>
                    <td>否</td>
                    <td>區域名稱 (例: 大安區)</td>
                  </tr>
                  <tr>
                    <td><code>road</code></td>
                    <td>string</td>
                    <td>否</td>
                    <td>道路名稱 (例: 忠孝東路)</td>
                  </tr>
                  <tr>
                    <td><code>postalCode</code></td>
                    <td>string</td>
                    <td>否</td>
                    <td>郵遞區號 (例: 106)</td>
                  </tr>
                </tbody>
              </table>

              <h4>使用範例</h4>
              <div className={styles.codeExample}>
                <h5>根據地址查詢郵遞區號</h5>
                <pre><code>GET /api/postal-code?city=臺北市&district=大安區&road=忠孝東路</code></pre>
              </div>
              
              <div className={styles.codeExample}>
                <h5>根據郵遞區號查詢地址範圍</h5>
                <pre><code>GET /api/postal-code?postalCode=106</code></pre>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>程式碼範例</h2>
            
            <div className={styles.codeExamples}>
              <div className={styles.codeTab}>
                <h3>JavaScript (Fetch)</h3>
                <pre><code>{`async function searchPostalCode(city, district, road) {
  const params = new URLSearchParams({ city, district, road });
  const response = await fetch(\`/api/postal-code?\${params}\`);
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  } else {
    throw new Error(data.message);
  }
}

// 使用範例
searchPostalCode('臺北市', '大安區', '忠孝東路')
  .then(results => console.log(results))
  .catch(error => console.error(error));`}</code></pre>
              </div>
              
              <div className={styles.codeTab}>
                <h3>Python (Requests)</h3>
                <pre><code>{`import requests

def search_postal_code(city, district, road):
    params = {
        'city': city,
        'district': district,
        'road': road
    }
    response = requests.get('https://your-domain.com/api/postal-code', params=params)
    data = response.json()
    
    if data['success']:
        return data['data']
    else:
        raise Exception(data['message'])

# 使用範例
try:
    results = search_postal_code('臺北市', '大安區', '忠孝東路')
    print(results)
except Exception as e:
    print(f'錯誤: {e}')`}</code></pre>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>回應格式</h2>
            <div className={styles.responseExample}>
              <pre><code>{`{
  "success": true,
  "data": [
    {
      "postal_code": "106",
      "city": "臺北市",
      "district": "大安區",
      "road": "忠孝東路",
      "delivery_range": "單 1 號至 101 號",
      "scoop": "大安"
    }
  ],
  "count": 1
}`}</code></pre>
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
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "請提供有效的地址參數"
  }
}`}</code></pre>
            </div>
          </section>

          <section className={styles.section}>
            <h2>使用限制</h2>
            <div className={styles.limitations}>
              <ul>
                <li><strong>請求頻率</strong>: 每分鐘最多 100 次請求</li>
                <li><strong>資料庫更新</strong>: 資料每月更新一次</li>
                <li><strong>服務可用性</strong>: 99.9% 正常運行時間</li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2>常見問題</h2>
            <div className={styles.faq}>
              <div className={styles.faqItem}>
                <h4>Q: API 是否有使用限制？</h4>
                <p>A: 目前每分鐘最多 100 次請求，如需更高額度請聯絡我們。</p>
              </div>
              
              <div className={styles.faqItem}>
                <h4>Q: 資料多久更新一次？</h4>
                <p>A: 郵遞區號資料每月與中華郵政同步更新。</p>
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
          <p>&copy; 2024 台灣郵遞區號查詢系統. All rights reserved.</p>
          <p>如需技術支援，請聯絡 api-support@your-domain.com</p>
        </footer>
      </div>
    </>
  );
};

export default ApiDocs;