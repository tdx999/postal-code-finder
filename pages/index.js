import React, { useState, useEffect } from 'react';
import SimpleAddressForm from '../components/SimpleAddressForm';
import styles from '../styles/AddressDemo.module.css';
import { translateAddress } from '../services/addressTranslation';

const AddressDemo = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [sameRoadResults, setSameRoadResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [englishAddress, setEnglishAddress] = useState(null);
  const [matchType, setMatchType] = useState(null);
  const [matchDistance, setMatchDistance] = useState(null);

  // 添加事件監聽器，監聽自定義的表單提交事件
  useEffect(() => {
    const handleCustomFormSubmit = async (event) => {
      const { fullAddress, postalCode } = event.detail;
      await processSearch(fullAddress, postalCode);
    };
    
    window.addEventListener('search-submit', handleCustomFormSubmit);
    
    return () => {
      window.removeEventListener('search-submit', handleCustomFormSubmit);
    };
  }, []);
  
  // 表單處理邏輯
  const processSearch = async (fullAddress, postalCode) => {
    setLoading(true);
    setSameRoadResults([]);
    
    try {
      const params = new URLSearchParams();
      
      if (postalCode) {
        // 清理郵遞區號，移除空格
        const cleanedPostalCode = postalCode.trim().replace(/\s+/g, '');
        params.append('postalCode', cleanedPostalCode);
        console.log('【調試】使用郵遞區號查詢:', cleanedPostalCode);
      } else if (fullAddress) {
        // 解析完整地址
        const parsed = parseAddress(fullAddress);
        if (parsed.error) {
          alert(parsed.error);
          setLoading(false);
          return;
        }
        
        // 設置查詢參數
        if (parsed.city) params.append('city', parsed.city);
        if (parsed.district) params.append('district', parsed.district);
        if (parsed.road) params.append('road', parsed.road);
        
        // 暫時保存解析結果以便顯示
        setSelectedAddress({
          city: parsed.city,
          district: parsed.district,
          road: parsed.road,
          detail: parsed.fullDetail,
          originalAddress: fullAddress
        });
      } else if (selectedAddress) {
        if (selectedAddress.city) params.append('city', selectedAddress.city);
        if (selectedAddress.district) params.append('district', selectedAddress.district);
        if (selectedAddress.road) params.append('road', selectedAddress.road);
      } else {
        alert('請輸入搜索條件');
        setLoading(false);
        return;
      }
      
      // 發送請求
      console.log('【調試】API請求參數:', params.toString());
      const response = await fetch(`/api/postal-code?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        // 如果是完整地址搜索，進行更精確的比對
        if (fullAddress && data.data.length > 0 && !postalCode) {
          const parsed = parseAddress(fullAddress);
          console.log('【調試】開始進行地址比對:', parsed);
          
          // 按照道路、巷、號順序進行篩選
          let filteredResults = data.data;
          
          // 如果有道路，先按道路篩選
          if (parsed.road) {
            console.log('【調試】正在比對道路:', parsed.road);
            const backupResults = [...filteredResults];
            
            // 先找出所有相同路名的記錄
            const sameRoadResults = filteredResults.filter(item => {
              if (!item.road) return false;
              return parsed.road === item.road;
            });
            
            console.log(`【調試】找到 ${sameRoadResults.length} 筆相同路名的記錄`);
            setSameRoadResults(sameRoadResults);
            
            // 如果有相同路名的記錄，使用這些記錄進行後續比對
            if (sameRoadResults.length > 0) {
              filteredResults = sameRoadResults;
            } else {
              // 如果沒有完全相同的路名，使用備份結果
              console.log('【調試】沒有找到完全相同的路名，使用備份結果');
              filteredResults = backupResults;
            }
          }
          
          // 如果有巷，再按巷篩選
          if (parsed.alley && filteredResults.length > 0) {
            console.log('【調試】正在比對巷名:', parsed.alley);
            const backupResults = [...filteredResults];
            
            filteredResults = filteredResults.filter(item => {
              if (!item.delivery_range) return false;
              
              // 解析投遞範圍中的數字
              const numbers = item.delivery_range.match(/\d+/g);
              if (!numbers) return false;
              
              const parsedNumbers = numbers.map(n => parseInt(n));
              const min = Math.min(...parsedNumbers);
              const max = Math.max(...parsedNumbers);
              const alleyNumber = parseInt(parsed.alley);
              
              console.log('【調試】巷號比對:', {
                '投遞範圍': item.delivery_range,
                '提取的數字': parsedNumbers,
                '最小範圍': min,
                '最大範圍': max,
                '要比對的巷號': alleyNumber
              });
              
              // 檢查單雙號
              if (item.delivery_range.includes('單') || item.delivery_range.includes('雙')) {
                const isOdd = alleyNumber % 2 === 1;
                const isSingle = item.delivery_range.includes('單');
                console.log('【調試】單雙號檢查:', {
                  '巷號': alleyNumber,
                  '是否為單號': isOdd,
                  '要求類型': isSingle ? '單號' : '雙號'
                });
                
                if (isSingle && !isOdd) {
                  console.log('【調試】不符合單號要求');
                  return false;
                }
                if (!isSingle && isOdd) {
                  console.log('【調試】不符合雙號要求');
                  return false;
                }
              }
              
              // 檢查是否在範圍內
              if (alleyNumber < min || alleyNumber > max) {
                console.log('【調試】巷號不在範圍內');
                return false;
              }
              
              console.log('【調試】巷號符合要求');
              return true;
            });
            
            // 如果過濾後沒有結果，使用備份結果
            if (filteredResults.length === 0) {
              console.log('【調試】巷名過濾後無結果，使用備份結果');
              filteredResults = backupResults;
            }
          }
          
          // 如果有弄，再按弄篩選
          if (parsed.lane && filteredResults.length > 0) {
            console.log('【調試】正在比對弄名:', parsed.lane);
            const backupResults = [...filteredResults];
            
            filteredResults = filteredResults.filter(item => {
              if (!item.delivery_range) return false;
              
              // 解析投遞範圍中的數字
              const numbers = item.delivery_range.match(/\d+/g);
              if (!numbers) return false;
              
              const parsedNumbers = numbers.map(n => parseInt(n));
              const min = Math.min(...parsedNumbers);
              const max = Math.max(...parsedNumbers);
              const laneNumber = parseInt(parsed.lane);
              
              console.log('【調試】弄號比對:', {
                '投遞範圍': item.delivery_range,
                '提取的數字': parsedNumbers,
                '最小範圍': min,
                '最大範圍': max,
                '要比對的弄號': laneNumber
              });
              
              // 檢查單雙號
              if (item.delivery_range.includes('單') || item.delivery_range.includes('雙')) {
                const isOdd = laneNumber % 2 === 1;
                const isSingle = item.delivery_range.includes('單');
                console.log('【調試】弄號單雙檢查:', {
                  '弄號': laneNumber,
                  '是否為單號': isOdd,
                  '要求類型': isSingle ? '單號' : '雙號'
                });
                
                if (isSingle && !isOdd) {
                  console.log('【調試】不符合單號要求');
                  return false;
                }
                if (!isSingle && isOdd) {
                  console.log('【調試】不符合雙號要求');
                  return false;
                }
              }
              
              // 檢查是否在範圍內
              if (laneNumber < min || laneNumber > max) {
                console.log('【調試】弄號不在範圍內');
                return false;
              }
              
              console.log('【調試】弄號符合要求');
              return true;
            });
            
            // 如果過濾後沒有結果，使用備份結果
            if (filteredResults.length === 0) {
              console.log('【調試】弄名過濾後無結果，使用備份結果');
              filteredResults = backupResults;
            }
          }
          
          // 如果有號，最後按號篩選
          if (parsed.number && filteredResults.length > 0) {
            console.log('【調試】正在比對門牌號:', parsed.number);
            const backupResults = [...filteredResults];
            let exactMatches = [];
            let nearestMatches = [];
            
            // 先找出所有可能的匹配
            filteredResults.forEach(item => {
              if (!item.delivery_range) return;
              
              // 提取門牌號中的數字
              const houseNumberMatch = parsed.number.match(/\d+/);
              if (!houseNumberMatch) return;
              const houseNumber = parseInt(houseNumberMatch[0]);
              
              // 提取巷弄號碼（如果有的話）
              const alleyNumber = parsed.alley ? parseInt(parsed.alley.match(/\d+/)[0]) : null;
              const laneNumber = parsed.lane ? parseInt(parsed.lane.match(/\d+/)[0]) : null;
              
              console.log('【調試】門牌比對:', {
                '投遞範圍': item.delivery_range,
                '要比對的門牌號': houseNumber,
                '巷號': alleyNumber,
                '弄號': laneNumber
              });

              // 清理投遞範圍文字，移除空格和全形空格
              const cleanRange = item.delivery_range.replace(/[\s　]/g, '');
              let isExactMatch = false;
              
              // 優先處理巷弄範圍
              if (alleyNumber !== null) {
                console.log('【調試】開始處理巷號:', alleyNumber);
                
                // 檢查範圍中的巷號
                if (cleanRange.includes('巷')) {
                  // 檢查單雙號要求
                  const isOdd = alleyNumber % 2 === 1;
                  const isSingleRange = cleanRange.includes('單');
                  const isDoubleRange = cleanRange.includes('雙');
                  
                  // 如果範圍指定了單雙號，但不符合，則跳過
                  if ((isSingleRange && !isOdd) || (isDoubleRange && isOdd)) {
                    console.log(`【調試】不符合${isSingleRange ? '單' : '雙'}號要求`);
                    return;
                  }

                  // 提取範圍中的數字
                  const numbers = cleanRange.match(/\d+/g);
                  if (!numbers) return;
                  
                  const parsedNumbers = numbers.map(n => parseInt(n));
                  const min = Math.min(...parsedNumbers);
                  const max = Math.max(...parsedNumbers);
                  
                  console.log('【調試】巷號比對:', {
                    '投遞範圍': cleanRange,
                    '提取的數字': parsedNumbers,
                    '最小範圍': min,
                    '最大範圍': max,
                    '要比對的巷號': alleyNumber
                  });

                  // 檢查巷號是否在範圍內
                  if (alleyNumber >= min && alleyNumber <= max) {
                    console.log(`【調試】巷號在範圍內，完全匹配: ${min} <= ${alleyNumber} <= ${max}`);
                    exactMatches.push(item);
                    return;  // 巷號匹配成功後立即返回
                  } else {
                    nearestMatches.push({
                      item,
                      distance: Math.min(Math.abs(alleyNumber - min), Math.abs(alleyNumber - max))
                    });
                    console.log(`【調試】巷號不在範圍內，最小距離: ${Math.min(Math.abs(alleyNumber - min), Math.abs(alleyNumber - max))}`);
                    return;  // 找到最接近匹配後立即返回
                  }
                }
              }

              // 只有在沒有巷號的情況下，才處理門牌號
              if (alleyNumber === null) {
                // 處理一般門牌範圍
                if (cleanRange.includes('以下')) {
                  const match = cleanRange.match(/\d+/);
                  if (match) {
                    const maxNum = parseInt(match[0]);
                    if (houseNumber <= maxNum) {
                      isExactMatch = true;
                      console.log(`【調試】找到範圍內匹配: ${houseNumber} <= ${maxNum}`);
                    } else {
                      nearestMatches.push({ item, distance: houseNumber - maxNum });
                    }
                  }
                }
                else if (cleanRange.includes('以上')) {
                  const match = cleanRange.match(/\d+/);
                  if (match) {
                    const minNum = parseInt(match[0]);
                    if (houseNumber >= minNum) {
                      isExactMatch = true;
                      console.log(`【調試】找到範圍內匹配: ${houseNumber} >= ${minNum}`);
                    } else {
                      nearestMatches.push({ item, distance: minNum - houseNumber });
                    }
                  }
                }
                else if (cleanRange.includes('至')) {
                  const rangeMatch = cleanRange.match(/(\d+)號?至(\d+)(號|巷)/);
                  if (rangeMatch) {
                    const start = parseInt(rangeMatch[1]);
                    const end = parseInt(rangeMatch[2]);
                    
                    // 如果有巷號，檢查巷號是否在範圍內
                    if (alleyNumber !== null) {
                      if (alleyNumber >= start && alleyNumber <= end) {
                        isExactMatch = true;
                        console.log(`【調試】巷號在範圍內，完全匹配: ${start} <= ${alleyNumber} <= ${end}`);
                      } else {
                        const distanceToStart = Math.abs(alleyNumber - start);
                        const distanceToEnd = Math.abs(alleyNumber - end);
                        nearestMatches.push({ 
                          item, 
                          distance: Math.min(distanceToStart, distanceToEnd)
                        });
                      }
                    }
                    // 如果沒有巷號，檢查門牌號
                    else if (houseNumber >= start && houseNumber <= end) {
                      isExactMatch = true;
                      console.log(`【調試】找到範圍內匹配: ${start} <= ${houseNumber} <= ${end}`);
                    } else {
                      const distanceToStart = Math.abs(houseNumber - start);
                      const distanceToEnd = Math.abs(houseNumber - end);
                      nearestMatches.push({ 
                        item, 
                        distance: Math.min(distanceToStart, distanceToEnd)
                      });
                    }
                  }
                }
                else {
                  // 處理特定號碼
                  const exactMatch = cleanRange.match(/(\d+)號$/);
                  if (exactMatch) {
                    const exactNumber = parseInt(exactMatch[1]);
                    if (houseNumber === exactNumber) {
                      isExactMatch = true;
                      console.log(`【調試】找到完全匹配: ${houseNumber} = ${exactNumber}`);
                    } else {
                      nearestMatches.push({ 
                        item, 
                        distance: Math.abs(houseNumber - exactNumber)
                      });
                    }
                  }
                }
              }
              
              if (isExactMatch) {
                exactMatches.push(item);
              }
            });
            
            // 如果有完全匹配的結果，使用完全匹配
            if (exactMatches.length > 0) {
              console.log('【調試】使用完全匹配的結果:', exactMatches.length, '筆');
              filteredResults = exactMatches;
              setMatchType('exact');
              setMatchDistance(0);
            }
            // 如果沒有完全匹配，但有最接近的結果，使用最接近的結果
            else if (nearestMatches.length > 0) {
              // 按距離排序
              nearestMatches.sort((a, b) => a.distance - b.distance);
              const minDistance = nearestMatches[0].distance;
              // 選擇所有具有最小距離的結果
              const closestMatches = nearestMatches
                .filter(match => match.distance === minDistance)
                .map(match => match.item);
              
              console.log('【調試】使用最接近的結果:', closestMatches.length, '筆，距離:', minDistance);
              filteredResults = closestMatches;
              setMatchType('nearest');
              setMatchDistance(minDistance);
            }
            // 如果都沒有匹配，使用原始結果
            else {
              console.log('【調試】沒有找到任何匹配的結果，使用原始結果');
              filteredResults = backupResults;
              setMatchType('original');
              setMatchDistance(null);
            }
          } else {
            // 如果沒有門牌號碼，清除匹配類型
            setMatchType(null);
            setMatchDistance(null);
          }
          
          console.log('【調試】最終過濾結果數量:', filteredResults.length);
          setSearchResults(filteredResults);
          const addressForTranslation = selectedAddress || {
            city: parsed.city,
            district: parsed.district,
            road: parsed.road,
            detail: parsed.fullDetail
          };
          if (filteredResults.length > 0 && addressForTranslation) {
            try {
              const translatedAddress = await translateAddress(addressForTranslation);
              setEnglishAddress(translatedAddress);
            } catch (e) {
              setEnglishAddress(null);
            }
          }
        } else {
          // 直接使用API返回的結果
          setSearchResults(data.data);
          
          // 如果是郵遞區號查詢，設置一個虛擬的選擇地址以便顯示
          if (postalCode && data.data.length > 0) {
            const firstResult = data.data[0];
            setSelectedAddress({
              city: firstResult.city,
              district: firstResult.district,
              road: firstResult.road,
              detail: '',
              originalAddress: `${firstResult.city}${firstResult.district}${firstResult.road}`
            });
            try {
              const translatedAddress = await translateAddress({
                city: firstResult.city,
                district: firstResult.district,
                road: firstResult.road,
                detail: ''
              });
              setEnglishAddress(translatedAddress);
            } catch (e) {
              setEnglishAddress(null);
            }
          }
        }
        
        // 沒有結果時顯示提示
        if (data.data.length === 0) {
          alert('沒有符合條件的地址');
        }
      } else {
        alert('查詢失敗: ' + (data.message || '發生錯誤，請稍後再試'));
      }
    } catch (error) {
      console.error('查詢錯誤:', error);
      alert('查詢錯誤: 發生未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 解析完整地址
  const parseAddress = (addressText) => {
    if (!addressText || typeof addressText !== 'string' || addressText.trim() === '') {
      return { error: '地址不能為空' };
    }

    // 清理地址文本
    const cleanedAddress = addressText.trim().replace(/\s+/g, '');
    
    // 台灣縣市清單
    const cities = [
      '臺北市', '新北市', '桃園市', '臺中市', '臺南市', '高雄市',
      '基隆市', '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣',
      '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
      '臺東縣', '澎湖縣', '金門縣', '連江縣', '台北市', '台中市', '台南市', '台東縣'
    ];

    // 搜尋縣市
    let foundCity = null;
    let districtStart = -1;
    
    for (const city of cities) {
      const index = cleanedAddress.indexOf(city);
      if (index !== -1) {
        foundCity = city.replace('台', '臺'); // 標準化台灣/臺灣的寫法
        districtStart = index + city.length;
        break;
      }
    }

    if (!foundCity) {
      return { error: '無法識別地址中的縣市' };
    }

    // 尋找區域
    const restOfAddress = cleanedAddress.substring(districtStart);
    const districtRegex = /(.+?[區鄉鎮市])/;
    const districtMatch = restOfAddress.match(districtRegex);
    
    if (!districtMatch) {
      return { error: '無法識別地址中的區域' };
    }

    const district = districtMatch[1];
    const roadStart = districtStart + district.length;
    
    // 修改道路名稱正則表達式，使其能夠匹配更複雜的道路名稱模式，包括命名巷
    const roadWithSectionAndAlleyRegex = /(.+?[路街道大道](?:[一二三四五六七八九十]段)?(?:[\u4e00-\u9fa5]+巷)?(?:[０-９0-9]+巷)?(?:[０-９0-9]+弄)?)/;
    const roadMatch = cleanedAddress.substring(roadStart).match(roadWithSectionAndAlleyRegex);
    
    let road = '';
    let alley = '';
    if (roadMatch) {
      road = roadMatch[1];
      
      // 檢查是否包含段名
      const sectionMatch = road.match(/([一二三四五六七八九十]段)/);
      let section = '';
      if (sectionMatch) {
        section = sectionMatch[1];
      }
      
      // 檢查是否包含命名巷（例如：富順巷）
      const namedAlleyMatch = road.match(/([\u4e00-\u9fa5]+巷)/);
      if (namedAlleyMatch) {
        alley = namedAlleyMatch[1];
        // 保留命名巷在道路名中，因為它是道路名的一部分
        // 不需要從road中移除
      }
      
      // 檢查是否包含數字巷
      const numberAlleyMatch = road.match(/([０-９0-9]+巷)/);
      if (numberAlleyMatch && !namedAlleyMatch) {  // 如果沒有命名巷才處理數字巷
        alley = numberAlleyMatch[1];
        // 如果有段名，保留段名在道路名中
        if (section) {
          road = road.substring(0, road.indexOf(section) + section.length);
        } else {
          // 如果沒有段名，從道路名中移除巷名
          road = road.replace(numberAlleyMatch[1], '');
        }
      }
      
      // 檢查是否包含弄
      const laneMatch = road.match(/([０-９0-9]+弄)/);
      if (laneMatch) {
        // 如果已經有巷，則將弄加入到巷後面
        if (alley) {
          alley = alley + laneMatch[1];
        } else {
          alley = laneMatch[1];
        }
        // 從道路名中移除弄
        road = road.replace(laneMatch[1], '');
      }
    }

    // 提取剩餘的地址細節
    const detailAddress = cleanedAddress.substring(roadStart + (roadMatch ? roadMatch[1].length : 0));
    
    // 在剩餘的地址中尋找巷（如果還沒找到的話）
    if (!alley) {
      // 先檢查命名巷
      const namedAlleyRegex = /([\u4e00-\u9fa5]+巷)/;
      const namedAlleyMatch = detailAddress.match(namedAlleyRegex);
      if (namedAlleyMatch) {
        alley = namedAlleyMatch[1];
        // 將命名巷加入到道路名中
        road = road + alley;
      } else {
        // 如果沒有命名巷，再檢查數字巷
        const numberAlleyRegex = /([０-９0-9]+巷)(?:[０-９0-9]+弄)?/;
        const numberAlleyMatch = detailAddress.match(numberAlleyRegex);
        if (numberAlleyMatch) {
          alley = numberAlleyMatch[1];
        }
      }
      
      // 檢查是否有弄
      const laneRegex = /([０-９0-9]+弄)/;
      const laneMatch = detailAddress.match(laneRegex);
      if (laneMatch) {
        alley = (alley || '') + laneMatch[1];
      }
    }
    
    // 尋找號碼
    const numberRegex = /([０-９0-9]+號)(?:之[０-９0-9]+)?/;
    const numberMatch = detailAddress.match(numberRegex);
    let number = '';
    if (numberMatch) {
      number = numberMatch[1];
    }

    console.log('【調試】地址解析結果:', {
      city: foundCity,
      district,
      road,
      alley,
      number,
      fullDetail: detailAddress
    });

    return {
      city: foundCity,
      district,
      road,
      alley,
      number,
      fullDetail: detailAddress
    };
  };

  const handleAddressChange = async (address) => {
    // 清空輸入框
    const addressInput = document.getElementById('fullAddress');
    const postalCodeInput = document.getElementById('postalCode');
    
    if (addressInput) addressInput.value = '';
    if (postalCodeInput) postalCodeInput.value = '';
    
    // 設置選擇的地址
    setSelectedAddress(address);

    // 轉換為英文地址 - 當有基本地址資料時就進行翻譯
    if (address && address.city && address.district && address.road) {
      try {
        const translatedAddress = await translateAddress(address);
        setEnglishAddress(translatedAddress);
      } catch (error) {
        console.error('地址轉換錯誤:', error);
        setEnglishAddress(null);
      }
    } else {
      // 如果地址不完整，清空英文地址
      setEnglishAddress(null);
    }

    // 如果包含完整信息，則執行搜索
    if (address && address.city && address.district && address.road && address.detail) {
      let fullAddressStr = `${address.city}${address.district}${address.road}${address.detail}`;
      processSearch(fullAddressStr, null);
    }
  };

  // 清空其他輸入欄位
  const clearOtherInputs = (keepInput) => {
    if (keepInput !== 'address') {
      const addressInput = document.getElementById('fullAddress');
      if (addressInput) addressInput.value = '';
    }
    
    if (keepInput !== 'postalCode') {
      const postalCodeInput = document.getElementById('postalCode');
      if (postalCodeInput) postalCodeInput.value = '';
    }
    
    if (keepInput !== 'selectedAddress' && selectedAddress !== null) {
      setSelectedAddress(null);
    }
  };

  // 處理表單提交
  const handleSearch = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const fullAddress = formData.get('fullAddress');
    const postalCode = formData.get('postalCode');
    
    await processSearch(fullAddress, postalCode);
  };

  // 獲取查詢結果的唯一郵遞區號列表
  const getUniquePostalCodes = () => {
    if (!searchResults.length) return [];
    const uniqueCodes = [];
    const seen = new Set();
    
    searchResults.forEach(item => {
      if (item.postal_code && !seen.has(item.postal_code)) {
        seen.add(item.postal_code);
        uniqueCodes.push(item.postal_code);
      }
    });
    
    return uniqueCodes;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          AutoAsst AI - 郵遞區號小助手
        </div>
        <div className={styles.buttonGroup}>
          <a 
            href="/"
            className={styles.primaryButton}
          >
            返回首頁
          </a>
          <button 
            onClick={() => window.location.reload()}
            className={styles.secondaryButton}
          >
            重新載入頁面
          </button>
        </div>
      </div>
      
      <div className={styles.card}>
        <h2>快速查詢</h2>
        <p style={{ marginTop: '-15px', marginBottom: '25px', color: '#86868b', fontSize: '17px' }}>
          輸入地址或郵遞區號，快速查詢相關資訊
        </p>
        
        <form id="searchForm" onSubmit={handleSearch}>
          {/* 地址查詢 */}
          <div className={styles.formGroup}>
            <label className={styles.label}>地址查詢</label>
            <SimpleAddressForm onChange={handleAddressChange} />
          </div>
          
          {/* 完整地址查詢 */}
          <div className={styles.formGroup}>
            <label htmlFor="fullAddress" className={styles.label}>完整地址查詢</label>
            <input
              id="fullAddress"
              name="fullAddress"
              type="text"
              placeholder="請輸入完整地址，例如：臺北市信義區市府路1號"
              className={styles.input}
            />
            <div style={{ marginTop: '15px' }}>
              <button 
                type="button"
                onClick={() => {
                  const fullAddress = document.getElementById('fullAddress').value;
                  if (fullAddress) {
                    processSearch(fullAddress, null);
                  } else {
                    alert('請輸入完整地址');
                  }
                }}
                className={styles.primaryButton}
              >
                查詢
              </button>
            </div>
            <p className={styles.helperText}>輸入完整地址，系統會自動解析並查詢對應的郵遞區號</p>
          </div>
          
          {/* 郵遞區號查詢 */}
          <div className={styles.formGroup}>
            <label htmlFor="postalCode" className={styles.label}>郵遞區號查詢</label>
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              placeholder="請輸入郵遞區號，例如: 100"
              className={styles.inputSmall}
            />
            <p className={styles.helperText}>輸入郵遞區號(3+2或3+3格式)進行查詢</p>
          </div>
          
          <div>
            <button 
              type="submit"
              className={styles.primaryButton}
            >
              查詢
            </button>
          </div>
        </form>
      </div>
      
      <div className={styles.card}>
        <h2>查詢結果 <span style={{ color: '#86868b', fontWeight: 'normal', fontSize: '20px' }}>({searchResults.length})</span></h2>
        
        {/* 添加用戶輸入的原始地址和英文地址顯示區域 */}
        {searchResults.length > 0 && (
          <div className={styles.resultCard}>
            <div className={styles.flexColumn}>
              <div className={styles.postalCodeBadge}>
                {searchResults[0].postal_code}
              </div>
              {matchType && (
                <div className={`${styles.matchTypeBadge} ${styles[matchType]}`}>
                  {matchType === 'exact' && '完全匹配'}
                  {matchType === 'nearest' && `最接近匹配 (差距: ${matchDistance} 號)`}
                  {matchType === 'original' && '無法精確匹配'}
                </div>
              )}
              <div className={styles.flexColumn}>
                <div className={styles.flexRow}>
                  <span className={styles.bold + ' ' + styles.textGray} style={{ fontSize: '18px' }}>中文地址：</span>
                  <span style={{ fontSize: '18px' }}>{selectedAddress?.originalAddress || ''}</span>
                </div>
                {englishAddress && (
                  <div className={styles.flexRow} style={{ marginTop: '10px' }}>
                    <span className={styles.bold + ' ' + styles.textGray} style={{ fontSize: '18px' }}>English Address：</span>
                    <span style={{ fontSize: '18px' }}>{englishAddress.fullAddress}</span>
                  </div>
                )}
                {matchType === 'nearest' && (
                  <div className={styles.matchInfo}>
                    <p className={styles.textGray}>
                      未找到完全符合的門牌號碼，顯示最接近的範圍。
                      {matchDistance && `與您搜尋的門牌號碼相差 ${matchDistance} 號。`}
                    </p>
                  </div>
                )}
                {matchType === 'original' && (
                  <div className={styles.matchInfo}>
                    <p className={styles.textGray}>
                      無法找到相近的門牌號碼範圍，顯示所有可能的結果。
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* 顯示所有相同路名的記錄 */}
        {sameRoadResults.length > 0 && (
          <div className={styles.sameRoadCard}>
            <h3 className={styles.sameRoadTitle}>相同路名的所有記錄 <span style={{ color: '#86868b', fontWeight: 'normal', fontSize: '18px' }}>({sameRoadResults.length})</span></h3>
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.sameRoadTable}>
                <thead>
                  <tr className={styles.sameRoadTableHeader}>
                    <th className={styles.sameRoadTableCell}>縣市</th>
                    <th className={styles.sameRoadTableCell}>區域</th>
                    <th className={styles.sameRoadTableCell}>郵遞區號</th>
                    <th className={styles.sameRoadTableCell}>道路</th>
                    <th className={styles.sameRoadTableCell}>投遞範圍</th>
                  </tr>
                </thead>
                <tbody>
                  {sameRoadResults.map((item, index) => (
                    <tr key={index}>
                      <td className={styles.sameRoadTableCell}>{item.city}</td>
                      <td className={styles.sameRoadTableCell}>{item.district}</td>
                      <td className={styles.sameRoadPostalCodeCell}>{item.postal_code}</td>
                      <td className={styles.sameRoadTableCell}>{item.road}</td>
                      <td className={styles.sameRoadTableCell}>{item.delivery_range}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* 顯示最終比對結果 */}
        {searchResults.length > 0 && (
          <div className={styles.resultSummaryCard}>
            <h3>最終比對結果</h3>
            <div className={styles.flexWrap}>
              {getUniquePostalCodes().map((code, index) => (
                <div key={index} className={styles.postalCodeTag}>
                  {code}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {loading ? (
          <div className={styles.loadingIndicator}>
            <div style={{ display: 'inline-block', width: '24px', height: '24px', borderRadius: '50%', border: '3px solid rgba(0, 113, 227, 0.2)', borderTopColor: '#0071e3', animation: 'spin 1s linear infinite', marginRight: '12px' }}></div>
            載入中...
            <style jsx>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {searchResults.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHeader}>
                    <th className={styles.tableCell}>縣市</th>
                    <th className={styles.tableCell}>區域</th>
                    <th className={styles.tableCell}>郵遞區號</th>
                    <th className={styles.tableCell}>道路</th>
                    <th className={styles.tableCell}>投遞範圍</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((item, index) => (
                    <tr key={index}>
                      <td className={styles.tableCell}>{item.city}</td>
                      <td className={styles.tableCell}>{item.district}</td>
                      <td className={styles.postalCodeCell}>{item.postal_code}</td>
                      <td className={styles.tableCell}>{item.road}</td>
                      <td className={styles.tableCell}>{item.delivery_range}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#86868b' }}>
                <div style={{ fontSize: '50px', marginBottom: '20px' }}>📮</div>
                <p className={styles.textGray} style={{ fontSize: '18px' }}>請使用上方查詢表單進行查詢</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 添加注意事項和相關信息卡片 */}
      <div className={styles.card}>
        <h2>注意事項與說明</h2>
        
        <div className={styles.infoSection}>
          <h3>注意事項</h3>
          <ul className={styles.infoList}>
            <li>郵遞區號資料來源為中華郵政，資料更新至最新版本</li>
            <li>匯入大量資料可能需要較長時間，請耐心等待</li>
            <li>實際使用時，建議根據業務需求調整資料庫索引以提高查詢效率</li>
          </ul>
        </div>
        
        <div className={styles.infoSection}>
          <h3>相關連結</h3>
          <ul className={styles.infoList}>
            <li><a href="https://www.post.gov.tw/" target="_blank" rel="noopener noreferrer">中華郵政全球資訊網</a></li>
            <li><a href="https://www.post.gov.tw/post/internet/Postal/index.jsp?ID=208" target="_blank" rel="noopener noreferrer">3+3郵遞區號查詢</a></li>
          </ul>
        </div>
        
        <div className={styles.infoSection}>
          <h3>授權說明</h3>
          <p>本專案使用的郵遞區號數據來源於中華郵政，具體授權和使用範圍請參考中華郵政的相關規定。</p>
        </div>
      </div>
    </div>
  );
};

export default AddressDemo;

<style jsx>{`
  .matchTypeBadge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 14px;
    margin: 8px 0;
    font-weight: 500;
  }
  
  .exact {
    background-color: #34c759;
    color: white;
  }
  
  .nearest {
    background-color: #ff9500;
    color: white;
  }
  
  .original {
    background-color: #ff3b30;
    color: white;
  }
  
  .matchInfo {
    margin-top: 12px;
    padding: 8px 12px;
    background-color: #f5f5f7;
    border-radius: 8px;
    font-size: 14px;
  }
`}</style>