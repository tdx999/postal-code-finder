// 縣市英文名稱對照表
const cityTranslations = {
  '臺北市': 'Taipei City',
  '新北市': 'New Taipei City',
  '桃園市': 'Taoyuan City',
  '臺中市': 'Taichung City',
  '臺南市': 'Tainan City',
  '高雄市': 'Kaohsiung City',
  '基隆市': 'Keelung City',
  '新竹市': 'Hsinchu City',
  '嘉義市': 'Chiayi City',
  '新竹縣': 'Hsinchu County',
  '苗栗縣': 'Miaoli County',
  '彰化縣': 'Changhua County',
  '南投縣': 'Nantou County',
  '雲林縣': 'Yunlin County',
  '嘉義縣': 'Chiayi County',
  '屏東縣': 'Pingtung County',
  '宜蘭縣': 'Yilan County',
  '花蓮縣': 'Hualien County',
  '臺東縣': 'Taitung County',
  '澎湖縣': 'Penghu County',
  '金門縣': 'Kinmen County',
  '連江縣': 'Lienchiang County'
};

// 區域類型英文對照
const districtTypeTranslations = {
  '區': 'District',
  '鄉': 'Township',
  '鎮': 'Town',
  '市': 'City'
};

// 道路類型英文對照
const roadTypeTranslations = {
  '路': 'Rd.',
  '街': 'St.',
  '大道': 'Blvd.',
  '巷': 'Ln.',
  '弄': 'Aly.',
  '段': 'Sec.'
};

// 數字轉英文對照
const numberTranslations = {
  '一': '1st',
  '二': '2nd',
  '三': '3rd',
  '四': '4th',
  '五': '5th',
  '六': '6th',
  '七': '7th',
  '八': '8th',
  '九': '9th',
  '十': '10th'
};

/**
 * 從資料庫獲取地址翻譯
 * @param {string} roadName - 道路名稱
 * @param {string} district - 區域名稱
 * @returns {Promise<Object|null>} 翻譯數據
 */
const getAddressTranslation = async (roadName, district) => {
  try {
    const response = await fetch(
      `/api/address/road-translation?roadName=${encodeURIComponent(roadName)}&district=${encodeURIComponent(district)}`
    );
    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('獲取地址翻譯錯誤:', error);
    return null;
  }
};

/**
 * 轉換中文數字為阿拉伯數字
 * @param {string} chineseNum - 中文數字
 * @returns {number|string} 阿拉伯數字
 */
const convertChineseNumToArabic = (chineseNum) => {
  const numMap = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
  };
  return numMap[chineseNum] || chineseNum;
};

/**
 * 處理地址段落
 * @param {string} road - 道路名稱
 * @returns {string} 英文段落描述
 */
const processSectionNumber = (road) => {
  const sectionMatch = road.match(/[一二三四五六七八九十](段)/);
  if (sectionMatch) {
    const sectionNum = convertChineseNumToArabic(sectionMatch[0].replace('段', ''));
    return `Section ${sectionNum}`;
  }
  return '';
};

/**
 * 處理巷弄
 * @param {string} alley - 巷弄資訊
 * @returns {string} 英文巷弄描述
 */
const processAlleyLane = (alley) => {
  if (!alley) return '';
  
  const parts = [];
  const alleyMatch = alley.match(/(\d+)巷/);
  const laneMatch = alley.match(/(\d+)弄/);
  
  if (alleyMatch) parts.push(`Lane ${alleyMatch[1]}`);
  if (laneMatch) parts.push(`Alley ${laneMatch[1]}`);
  
  return parts.join(' ');
};

/**
 * 構建英文地址
 * @param {Object} address - 地址物件
 * @param {Object} translation - 翻譯數據
 * @returns {Object} 英文地址資訊
 */
const constructEnglishAddress = (address, translation) => {
  const parts = [];
  
  // 添加門牌號
  if (address.number) {
    parts.push(address.number.replace('號', ''));
  }
  
  // 添加巷弄
  const alleyLanePart = processAlleyLane(address.alley);
  if (alleyLanePart) parts.push(alleyLanePart);
  
  // 添加路名和段數
  if (address.road) {
    const sectionPart = processSectionNumber(address.road);
    if (sectionPart) parts.push(sectionPart);
    
    // 優先使用資料庫中的英文路名
    if (translation?.english_name) {
      parts.push(translation.english_name);
    } else {
      // 如果資料庫中沒有翻譯，使用預設轉換
      let roadName = address.road;
      let roadType = '';
      
      // 移除段名以獲取純路名
      const pureName = address.road.replace(/[一二三四五六七八九十]段/, '');
      
      // 檢查並轉換道路類型
      for (const [type, translation] of Object.entries(roadTypeTranslations)) {
        if (pureName.includes(type)) {
          roadType = translation;
          roadName = pureName.split(type)[0];
          break;
        }
      }
      
      parts.push(`${roadName} ${roadType}`.trim());
    }
  }
  
  // 添加區域名稱
  if (address.district) {
    // 優先使用資料庫中的英文區域名稱
    if (translation?.district_english) {
      parts.push(translation.district_english);
    } else {
      // 如果資料庫中沒有翻譯，使用預設轉換
      const districtName = address.district.slice(0, -1);
      const districtType = address.district.slice(-1);
      const englishDistrictType = districtTypeTranslations[districtType] || districtType;
      parts.push(`${districtName} ${englishDistrictType}`);
    }
  }
  
  // 添加城市名稱
  if (address.city) {
    // 優先使用資料庫中的英文城市名稱
    if (translation?.city_english) {
      parts.push(translation.city_english);
    } else {
      // 如果資料庫中沒有翻譯，使用預設轉換
      parts.push(cityTranslations[address.city] || address.city);
    }
  }
  
  // 添加國家
  parts.push('Taiwan');
  
  return {
    fullAddress: parts.join(' '),
    englishRoad: translation?.english_name || '',
    districtName: translation?.district_english || ''
  };
};

/**
 * 主要的地址轉換函數
 * @param {Object} address - 地址物件
 * @returns {Promise<Object>} 轉換後的英文地址
 */
export const translateAddress = async (address) => {
  try {
    if (!address || !address.city || !address.district || !address.road) {
      throw new Error('地址資訊不完整');
    }

    // 保持完整的路名和區域名稱
    const roadName = address.road;  // 不再移除段名
    const district = address.district;  // 保持完整區域名稱
    
    // 先從資料庫獲取翻譯數據
    const translation = await getAddressTranslation(roadName, district);
    console.log('資料庫翻譯數據:', translation);
    
    // 構建英文地址
    const result = constructEnglishAddress(address, translation);
    console.log('最終翻譯結果:', result);
    
    return result;
  } catch (error) {
    console.error('地址轉換錯誤:', error);
    // 如果出錯，返回基本的英文地址格式
    return {
      fullAddress: `${address.city} ${address.district} ${address.road} ${address.detail || ''}, Taiwan`,
      englishRoad: '',
      districtName: ''
    };
  }
};

/**
 * 轉換完整地址字符串
 * @param {string} fullAddress - 完整的中文地址字符串
 * @returns {Promise<string>} - 轉換後的英文地址
 */
export const translateFullAddress = async (fullAddress) => {
  try {
    // 這裡可以添加完整地址字符串的解析邏輯
    // 目前返回一個簡單的轉換
    return `${fullAddress} (English translation pending)`;
  } catch (error) {
    console.error('完整地址轉換錯誤:', error);
    return null;
  }
};