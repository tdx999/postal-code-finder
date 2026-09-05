// 測試模式的 Google AdSense 元件
// 在開發環境中顯示佔位符，不實際載入廣告

import { useEffect, useState } from 'react';
import Head from 'next/head';

// 從環境變數讀取 AdSense 客戶端 ID
const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-test';

// 檢查是否為測試模式
const isTestMode = ADSENSE_CLIENT_ID === 'ca-pub-test' || ADSENSE_CLIENT_ID.includes('test');

const GoogleAd = ({ 
  adSlot, 
  adFormat = 'auto', 
  adLayout = '', 
  adLayoutKey = '',
  fullWidthResponsive = true,
  style = {}
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    if (!isTestMode && typeof window !== 'undefined' && window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.error('AdSense 載入錯誤:', error);
      }
    }
  }, []);

  // 測試模式：顯示佔位符
  if (isTestMode || !isClient) {
    return (
      <div 
        className="test-ad-container" 
        style={{
          ...style,
          border: '2px dashed #ccc',
          backgroundColor: '#f0f0f0',
          padding: '20px',
          textAlign: 'center',
          color: '#666',
          fontSize: '14px',
          margin: '10px 0',
          borderRadius: '8px'
        }}
      >
        <div>🎯 廣告版位 ({adFormat})</div>
        <div style={{ fontSize: '12px', marginTop: '5px' }}>
          ID: {adSlot} | Client: {ADSENSE_CLIENT_ID}
        </div>
        <div style={{ fontSize: '11px', marginTop: '5px', color: '#999' }}>
          測試模式 - 實際上線時會顯示真實廣告
        </div>
      </div>
    );
  }

  // 正式模式：載入真實廣告
  return (
    <div className="google-ad-container" style={style}>
      <ins className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-ad-layout={adLayout}
        data-ad-layout-key={adLayoutKey}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
    </div>
  );
};

// AdSense 腳本載入元件
export const AdSenseScript = () => {
  // 測試模式不需要載入腳本
  if (isTestMode) {
    return (
      <Head>
        <meta name="adsense-test-mode" content="enabled" />
      </Head>
    );
  }

  return (
    <Head>
      <script 
        async 
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
    </Head>
  );
};

// 常用廣告版位元件
export const SidebarAd = () => (
  <GoogleAd 
    adSlot="1234567890"
    adFormat="rectangle"
    style={{ marginBottom: '20px' }}
  />
);

export const BannerAd = () => (
  <GoogleAd 
    adSlot="1234567891"
    adFormat="horizontal"
    style={{ margin: '20px 0' }}
  />
);

export const InContentAd = () => (
  <GoogleAd 
    adSlot="1234567892"
    adFormat="fluid"
    style={{ margin: '20px 0' }}
  />
);

export default GoogleAd;