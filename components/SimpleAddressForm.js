import React, { useState, useEffect, useRef } from 'react';

/**
 * 簡易版地址表單 - 不依賴 antd 組件庫
 */
const SimpleAddressForm = ({ onChange }) => {
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [roads, setRoads] = useState([]);
  const [filteredRoads, setFilteredRoads] = useState([]);
  const [showRoadSuggestions, setShowRoadSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const roadSuggestionsRef = useRef(null);
  const roadInputRef = useRef(null);
  const roadsCache = useRef({});
  const [values, setValues] = useState({
    city: '',
    district: '',
    road: '',
    detail: ''
  });

  // 點擊外部時關閉建議列表
  useEffect(() => {
    function handleClickOutside(event) {
      if (roadSuggestionsRef.current && !roadSuggestionsRef.current.contains(event.target) &&
          roadInputRef.current && !roadInputRef.current.contains(event.target)) {
        setShowRoadSuggestions(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 載入城市資料
  useEffect(() => {
    fetchCities();
  }, []);

  // 當城市改變時載入區域
  useEffect(() => {
    if (values.city) {
      fetchDistricts(values.city);
    } else {
      setDistricts([]);
    }
  }, [values.city]);

  // 當區域改變時載入道路
  useEffect(() => {
    if (values.city && values.district) {
      fetchRoads(values.city, values.district);
    } else {
      setRoads([]);
      setFilteredRoads([]);
    }
  }, [values.district]);

  // 當道路輸入變化時篩選道路
  useEffect(() => {
    if (!values.road || values.road.trim() === "") {
      setFilteredRoads(roads); // 顯示所有道路，不再限制為前15個
      return;
    }

    const query = values.road.trim().toLowerCase();
    
    // 匹配開頭的項目優先顯示
    const startsWithMatches = roads.filter(road => 
      road.toLowerCase().startsWith(query)
    );
    
    // 然後是包含關鍵字的項目
    const containsMatches = roads.filter(road => 
      road.toLowerCase().includes(query) && !road.toLowerCase().startsWith(query)
    );
    
    // 不再限制數量，顯示所有匹配結果
    const filtered = [...startsWithMatches, ...containsMatches];
    
    setFilteredRoads(filtered);
    setShowRoadSuggestions(filtered.length > 0);
  }, [values.road, roads]);

  // 通知父組件數值變更
  useEffect(() => {
    // 不要在每次值變更時都通知父組件，這可能導致不必要的重新渲染
    // 我們已經有按鈕專門用於觸發搜索
  }, [values, onChange]);

  // 獲取城市列表 - 改進版本
  const fetchCities = async () => {
    setLoading(true);
    try {
      // 使用完整的城市列表作為備用方案，包含所有可能的縣市
      const defaultCities = [
        '臺北市', '新北市', '桃園市', '臺中市', '臺南市', '高雄市', 
        '基隆市', '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣', 
        '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣', 
        '臺東縣', '澎湖縣', '金門縣', '連江縣', '南海島'
      ];
      
      try {
        const response = await fetch('/api/address/cities');
        const data = await response.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setCities(data.data);
        } else {
          setCities(defaultCities);
        }
      } catch (error) {
        setCities(defaultCities);
      }
    } finally {
      setLoading(false);
    }
  };

  // 獲取區域列表 - 改進版本
  const fetchDistricts = async (city) => {
    setLoading(true);
    
    try {
      // 臺灣各縣市的區域對照表 (預設數據)
      const defaultDistricts = {
        '臺北市': ['中正區', '大同區', '中山區', '松山區', '大安區', '萬華區', '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區'],
        '新北市': ['板橋區', '新莊區', '中和區', '永和區', '土城區', '樹林區', '三峽區', '鶯歌區', '三重區', '蘆洲區', '五股區', '泰山區', '林口區', '八里區', '淡水區', '三芝區', '石門區', '金山區', '萬里區', '汐止區', '瑞芳區', '貢寮區', '平溪區', '雙溪區', '新店區', '深坑區', '石碇區', '坪林區', '烏來區'],
        '桃園市': ['桃園區', '中壢區', '平鎮區', '八德區', '楊梅區', '蘆竹區', '大溪區', '龜山區', '龍潭區', '大園區', '觀音區', '新屋區', '復興區'],
        '臺中市': ['西屯區', '北屯區', '南屯區', '太平區', '大里區', '豐原區', '清水區', '沙鹿區', '梧棲區', '霧峰區', '烏日區', '大甲區', '東區', '南區', '西區', '北區', '中區', '石岡區', '東勢區', '新社區', '和平區', '大肚區', '大安區', '外埔區', '后里區', '神岡區', '潭子區', '大雅區', '龍井區'],
        '臺南市': ['東區', '南區', '中西區', '北區', '安平區', '永康區', '善化區', '新市區', '安南區', '仁德區', '佳里區', '麻豆區', '新營區', '鹽水區', '下營區', '後壁區', '白河區', '東山區', '六甲區', '官田區', '大內區', '學甲區', '西港區', '七股區', '將軍區', '北門區', '安定區', '山上區', '玉井區', '楠西區', '南化區', '左鎮區', '龍崎區', '關廟區'],
        '高雄市': ['鳳山區', '三民區', '左營區', '楠梓區', '鼓山區', '苓雅區', '前鎮區', '新興區', '小港區', '前金區', '旗山區', '岡山區', '美濃區', '大寮區', '鳥松區', '林園區', '大樹區', '仁武區', '大社區', '茄萣區', '橋頭區', '燕巢區', '田寮區', '阿蓮區', '路竹區', '湖內區', '彌陀區', '永安區', '梓官區', '六龜區', '甲仙區', '杉林區', '內門區', '茂林區', '桃源區', '那瑪夏區'],
        '基隆市': ['中正區', '信義區', '仁愛區', '中山區', '安樂區', '暖暖區', '七堵區'],
        '新竹市': ['東區', '北區', '香山區'],
        '嘉義市': ['東區', '西區'],
        '新竹縣': ['竹北市', '竹東鎮', '新埔鎮', '湖口鄉', '芎林鄉', '橫山鄉', '尖石鄉', '北埔鄉', '寶山鄉', '峨眉鄉', '五峰鄉', '關西鎮', '新豐鄉'],
        '苗栗縣': ['苗栗市', '頭份市', '竹南鎮', '後龍鎮', '通霄鎮', '苑裡鎮', '卓蘭鎮', '造橋鄉', '三灣鄉', '南庄鄉', '大湖鄉', '獅潭鄉', '銅鑼鄉', '泰安鄉', '公館鄉', '頭屋鄉', '三義鄉', '西湖鄉'],
        '彰化縣': ['彰化市', '員林市', '鹿港鎮', '和美鎮', '北斗鎮', '溪湖鎮', '田中鎮', '二林鎮', '線西鄉', '伸港鄉', '福興鄉', '秀水鄉', '花壇鄉', '芬園鄉', '大村鄉', '埔鹽鄉', '埔心鄉', '永靖鄉', '社頭鄉', '二水鄉', '田尾鄉', '埤頭鄉', '芳苑鄉', '大城鄉', '竹塘鄉', '溪州鄉'],
        '南投縣': ['南投市', '埔里鎮', '草屯鎮', '竹山鎮', '集集鎮', '名間鄉', '鹿谷鄉', '中寮鄉', '魚池鄉', '國姓鄉', '水里鄉', '信義鄉', '仁愛鄉'],
        '雲林縣': ['斗六市', '斗南鎮', '虎尾鎮', '西螺鎮', '土庫鎮', '北港鎮', '古坑鄉', '大埤鄉', '莿桐鄉', '林內鄉', '二崙鄉', '崙背鄉', '麥寮鄉', '東勢鄉', '褒忠鄉', '臺西鄉', '元長鄉', '四湖鄉', '口湖鄉', '水林鄉'],
        '嘉義縣': ['太保市', '朴子市', '布袋鎮', '大林鎮', '民雄鄉', '溪口鄉', '新港鄉', '六腳鄉', '東石鄉', '義竹鄉', '鹿草鄉', '水上鄉', '中埔鄉', '竹崎鄉', '梅山鄉', '番路鄉', '大埔鄉', '阿里山鄉'],
        '屏東縣': ['屏東市', '潮州鎮', '東港鎮', '恆春鎮', '萬丹鄉', '長治鄉', '麟洛鄉', '九如鄉', '里港鄉', '鹽埔鄉', '高樹鄉', '萬巒鄉', '內埔鄉', '竹田鄉', '新埤鄉', '枋寮鄉', '新園鄉', '崁頂鄉', '林邊鄉', '南州鄉', '佳冬鄉', '琉球鄉', '車城鄉', '滿州鄉', '枋山鄉', '三地門鄉', '霧臺鄉', '瑪家鄉', '泰武鄉', '來義鄉', '春日鄉', '獅子鄉', '牡丹鄉'],
        '宜蘭縣': ['宜蘭市', '羅東鎮', '蘇澳鎮', '頭城鎮', '礁溪鄉', '壯圍鄉', '員山鄉', '冬山鄉', '五結鄉', '三星鄉', '大同鄉', '南澳鄉'],
        '花蓮縣': ['花蓮市', '鳳林鎮', '玉里鎮', '新城鄉', '吉安鄉', '壽豐鄉', '光復鄉', '豐濱鄉', '瑞穗鄉', '富里鄉', '秀林鄉', '萬榮鄉', '卓溪鄉'],
        '臺東縣': ['臺東市', '成功鎮', '關山鎮', '長濱鄉', '池上鄉', '東河鄉', '鹿野鄉', '卑南鄉', '大武鄉', '綠島鄉', '蘭嶼鄉', '延平鄉', '海端鄉', '達仁鄉', '金峰鄉', '太麻里鄉'],
        '澎湖縣': ['馬公市', '湖西鄉', '白沙鄉', '西嶼鄉', '望安鄉', '七美鄉'],
        '金門縣': ['金城鎮', '金湖鎮', '金沙鎮', '金寧鄉', '烈嶼鄉', '烏坵鄉'],
        '連江縣': ['南竿鄉', '北竿鄉', '莒光鄉', '東引鄉'],
        '南海島': ['東沙群島', '南沙群島']
      };
      
      // 先設置預設列表，確保至少有顯示
      const defaultList = defaultDistricts[city] || [];
      if (defaultList.length > 0) {
        setDistricts(defaultList);
      }
      
      try {
        const apiUrl = `/api/address/areas?city=${encodeURIComponent(city)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.success && Array.isArray(data.areas) && data.areas.length > 0) {
          const uniqueDistricts = data.areas.filter(Boolean);
          if (uniqueDistricts.length < 3 && defaultList.length > uniqueDistricts.length) {
            setDistricts(defaultList);
          } else if (uniqueDistricts.length > 0) {
            if (uniqueDistricts.length < defaultList.length) {
              const mergedDistricts = [...new Set([...uniqueDistricts, ...defaultList])].sort();
              setDistricts(mergedDistricts);
            } else {
              setDistricts(uniqueDistricts);
            }
          }
        }
      } catch (error) {
      }
    } finally {
      setLoading(false);
    }
  };

  // 獲取路名列表 - 增加快取機制
  const fetchRoads = async (city, district) => {
    setLoading(true);
    try {
      // 檢查快取中是否已有數據
      const cacheKey = `${city}-${district}`;
      if (roadsCache.current[cacheKey]) {
        setRoads(roadsCache.current[cacheKey]);
        setLoading(false);
        return;
      }

      const url = `/api/address/roads?city=${encodeURIComponent(city)}&district=${encodeURIComponent(district)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success) {
        let uniqueRoads = [...new Set((data.roads || []))].filter(Boolean);
        
        uniqueRoads = uniqueRoads.map(road => {
          if (!road) return '';
          const hasData = Array.isArray(data.data);
          const roadsWithSections = hasData
            ? data.data.filter(item => 
                item.road === road && 
                item.delivery_range && 
                /[一二三四五六七八九十]段/.test(item.delivery_range)
              )
            : [];
          if (roadsWithSections.length > 0) {
            const sectionMatch = roadsWithSections[0].delivery_range.match(/(.+?[路街道大道][一二三四五六七八九十]段)/);
            if (sectionMatch) {
              return sectionMatch[1];
            }
          }
          return road;
        });
        
        uniqueRoads = [...new Set(uniqueRoads)].filter(Boolean).sort();
        roadsCache.current[cacheKey] = uniqueRoads;
        setRoads(uniqueRoads);
        setFilteredRoads(uniqueRoads);
      } else {
        setRoads([]);
        setFilteredRoads([]);
      }
    } catch (error) {
      setRoads([]);
      setFilteredRoads([]);
    } finally {
      setLoading(false);
    }
  };

  // 處理城市變更
  const handleCityChange = (e) => {
    const city = e.target.value;
    setValues({
      ...values,
      city,
      district: '',
      road: '',
      detail: ''
    });
  };

  // 處理區域變更
  const handleDistrictChange = (e) => {
    const district = e.target.value;
    setValues({
      ...values,
      district,
      road: '',
      detail: ''
    });
  };

  // 處理道路輸入變更
  const handleRoadChange = (e) => {
    const road = e.target.value;
    setValues({
      ...values,
      road
    });
  };

  // 處理詳細地址變更
  const handleDetailChange = (e) => {
    const detail = e.target.value;
    setValues({
      ...values,
      detail
    });
  };

  // 選擇道路建議
  const handleRoadSelect = (road) => {
    setValues({
      ...values,
      road
    });
    setShowRoadSuggestions(false);
  };

  // 檢查表單是否有效
  const isFormValid = () => {
    return values.city && values.district && values.road && values.detail;
  };

  // 處理表單提交
  const handleSubmit = () => {
    if (isFormValid() && onChange) {
      onChange(values);
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
        {/* 城市選擇 */}
        <div style={{ minWidth: '150px', flex: '1' }}>
          <select
            value={values.city}
            onChange={handleCityChange}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
              fontSize: '18px'
            }}
            disabled={loading}
          >
            <option value="">選擇縣市</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        
        {/* 區域選擇 */}
        <div style={{ minWidth: '150px', flex: '1' }}>
          <select
            value={values.district}
            onChange={handleDistrictChange}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
              fontSize: '18px'
            }}
            disabled={!values.city || loading}
          >
            <option value="">選擇區域</option>
            {districts.map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* 道路輸入 */}
      <div style={{ position: 'relative', marginBottom: '15px' }}>
        <input
          ref={roadInputRef}
          type="text"
          value={values.road}
          onChange={handleRoadChange}
          onFocus={() => {
            if (filteredRoads.length > 0) {
              setShowRoadSuggestions(true);
            }
          }}
          placeholder="輸入道路名稱 (例如: 中山路)"
          style={{
            width: '100%',
            padding: '14px 16px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            fontSize: '18px'
          }}
          disabled={!values.district || loading}
        />
        
      {/* 道路建議列表 */}
      {showRoadSuggestions && (
        <div 
          ref={roadSuggestionsRef}
          style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '100%',
              maxHeight: '300px',
              overflowY: 'auto',
              backgroundColor: 'white',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              zIndex: 10
          }}
        >
          {filteredRoads.map((road, index) => (
            <div
              key={index}
              onClick={() => handleRoadSelect(road)}
              style={{
                padding: '14px 16px',
                cursor: 'pointer',
                borderBottom: index < filteredRoads.length - 1 ? '1px solid rgba(0, 0, 0, 0.05)' : 'none',
                fontSize: '18px',
                backgroundColor: 'white',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 113, 227, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              {road}
            </div>
          ))}
        </div>
      )}
      </div>
      
      {/* 詳細地址輸入 */}
      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          value={values.detail}
          onChange={handleDetailChange}
          placeholder="輸入詳細地址 (例如: 1號)"
          style={{
            width: '100%',
            padding: '14px 16px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            fontSize: '18px'
          }}
          disabled={!values.road || loading}
        />
      </div>
      
      {/* 提交按鈕 */}
      <div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid() || loading}
          style={{
            backgroundColor: isFormValid() ? '#0071e3' : 'rgba(0, 0, 0, 0.1)',
            color: isFormValid() ? 'white' : 'rgba(0, 0, 0, 0.4)',
            border: 'none',
            borderRadius: '980px',
            padding: '12px 24px',
            cursor: isFormValid() ? 'pointer' : 'not-allowed',
            fontSize: '18px',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            boxShadow: isFormValid() ? '0 2px 8px rgba(0, 113, 227, 0.2)' : 'none'
          }}
        >
          {loading ? '載入中...' : '查詢'}
        </button>
      </div>
    </div>
  );
};

export default SimpleAddressForm;