/**
 * 奇門遁甲時家排盤引擎（簡版）
 * 根據開獎時刻計算生門落宮及空間能量權重
 */
const { Solar } = require('lunar-javascript');

// ─── 24 節氣 → 局數映射 ───
// 陽遁（冬至→芒種）: [上元, 中元, 下元]
const YANG_DUN_JU = {
  冬至: [1, 7, 4], 小寒: [2, 8, 5], 大寒: [3, 9, 6],
  立春: [8, 5, 2], 雨水: [9, 6, 3], 惊蛰: [1, 7, 4],
  春分: [3, 9, 6], 清明: [4, 1, 7], 谷雨: [5, 2, 8],
  立夏: [4, 1, 7], 小满: [5, 2, 8], 芒种: [6, 3, 9],
};

// 陰遁（夏至→大雪）: [上元, 中元, 下元]
const YIN_DUN_JU = {
  夏至: [9, 3, 6], 小暑: [8, 2, 5], 大暑: [7, 1, 4],
  立秋: [2, 5, 8], 处暑: [1, 4, 7], 白露: [9, 3, 6],
  秋分: [7, 1, 4], 寒露: [6, 9, 3], 霜降: [5, 8, 2],
  立冬: [6, 9, 3], 小雪: [5, 8, 2], 大雪: [4, 7, 1],
};

// ─── 九宮信息 ───
const PALACE_INFO = {
  1: { name: '坎宮', position: '正北', element: '水', direction: '北' },
  2: { name: '坤宮', position: '西南', element: '土', direction: '西南' },
  3: { name: '震宮', position: '正東', element: '木', direction: '東' },
  4: { name: '巽宮', position: '東南', element: '木', direction: '東南' },
  5: { name: '中宮', position: '中央', element: '土', direction: '中' },
  6: { name: '乾宮', position: '西北', element: '金', direction: '西北' },
  7: { name: '兌宮', position: '正西', element: '金', direction: '西' },
  8: { name: '艮宮', position: '東北', element: '土', direction: '東北' },
  9: { name: '離宮', position: '正南', element: '火', direction: '南' },
};

// 八門原始宮位（後天八卦）
const DOOR_NAMES = ['休門', '死門', '傷門', '杜門', '開門', '驚門', '生門', '景門'];
const DOOR_BASE_PALACE = [1, 2, 3, 4, 6, 7, 8, 9];

// 生門原始索引 = 6（在 DOOR_BASE_PALACE 中 palace 8 的位置）
const SHENGMEN_IDX = 6;
const KAIMEN_IDX = 4;
const JINGMEN_IDX = 7;

// 八宮順序（排除中宮5）
const PALACE_ORDER = [1, 8, 3, 4, 9, 2, 7, 6];

const WUXING_SHENG = { 金: '水', 水: '木', 木: '火', 火: '土', 土: '金' };
const WUXING_KE = { 金: '木', 木: '土', 土: '水', 水: '火', 火: '金' };

// ─── 工具函數 ───

function parseDrawDatetime(s) {
  const m = String(s || '').trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  if (!m) return null;
  return {
    year: +m[1], month: +m[2], day: +m[3],
    hour: +m[4], minute: +m[5], second: m[6] ? +m[6] : 0,
  };
}

function getDoorPalace(doorBaseIdx, juNum, isYangDun, hourOffset) {
  const basePos = PALACE_ORDER.indexOf(DOOR_BASE_PALACE[doorBaseIdx]);
  const shift = (juNum - 1) + hourOffset;
  if (isYangDun) {
    return PALACE_ORDER[(basePos + shift) % 8];
  }
  return PALACE_ORDER[((basePos - shift) % 8 + 80) % 8];
}

// ─── 核心排盤 ───

function computeQiMen(drawDatetime) {
  const dt = parseDrawDatetime(drawDatetime);
  if (!dt) return { error: '無效的開獎時刻格式' };

  const solar = Solar.fromYmdHms(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second);
  const lunar = solar.getLunar();

  // 上一個節氣
  const prevJieQi = lunar.getPrevJieQi();
  const jqName = prevJieQi.getName();
  const jqSolar = prevJieQi.getSolar();

  // 判斷陽遁/陰遁 及 局數
  let isYangDun = jqName in YANG_DUN_JU;
  const juTable = isYangDun ? YANG_DUN_JU[jqName] : YIN_DUN_JU[jqName];

  if (!juTable) {
    return { error: '無法確定節氣局數：' + jqName };
  }

  // 三元判定（距前一節氣天數）
  const daysSinceJQ = Solar.fromYmd(solar.getYear(), solar.getMonth(), solar.getDay())
    .subtract(Solar.fromYmd(jqSolar.getYear(), jqSolar.getMonth(), jqSolar.getDay()));
  let yuanIndex;
  if (daysSinceJQ < 5) yuanIndex = 0;
  else if (daysSinceJQ < 10) yuanIndex = 1;
  else yuanIndex = 2;
  const yuanNames = ['上元', '中元', '下元'];

  const juNum = juTable[yuanIndex];
  const hourOffset = lunar.getTimeZhiIndex() % 8;

  // 三吉門落宮
  const shengMenPalace = getDoorPalace(SHENGMEN_IDX, juNum, isYangDun, hourOffset);
  const kaiMenPalace = getDoorPalace(KAIMEN_IDX, juNum, isYangDun, hourOffset);
  const jingMenPalace = getDoorPalace(JINGMEN_IDX, juNum, isYangDun, hourOffset);

  const shengPalaceInfo = PALACE_INFO[shengMenPalace];

  // 生門落宮是否受克
  const palaceElement = shengPalaceInfo.element;
  const shengMenNativeElement = '土'; // 生門原宮 艮=土
  const isKe = WUXING_KE[palaceElement] === shengMenNativeElement;

  // ─── 特殊格局 ───
  const patterns = [];

  // 青龍返首：陽遁一局 + 值符回本宮
  if (isYangDun && juNum === 1 && shengMenPalace === 8) {
    patterns.push({ name: '青龍返首', fortune: '大吉', desc: '值符歸位，萬事亨通' });
  }
  // 飛鳥跌穴：陰遁九局 + 吉門歸正位
  if (!isYangDun && juNum === 9 && shengMenPalace === 8) {
    patterns.push({ name: '飛鳥跌穴', fortune: '大吉', desc: '天時地利，吉星高照' });
  }
  // 門迫：生門落宮受克
  if (isKe) {
    patterns.push({ name: '門迫', fortune: '不利', desc: '生門受宮位五行所克，能量削弱' });
  }
  // 三吉門同宮
  if (shengMenPalace === kaiMenPalace || shengMenPalace === jingMenPalace) {
    patterns.push({ name: '吉門會合', fortune: '吉', desc: '多門聚於同宮，能量集中' });
  }

  // ─── 空間能量圖 ───
  const spatialMap = buildSpatialEnergyMap(shengMenPalace, kaiMenPalace, jingMenPalace, isKe, patterns.length > 0 && patterns.some(p => p.fortune === '大吉'));

  return {
    draw_datetime: drawDatetime,
    jie_qi: jqName,
    yuan: yuanNames[yuanIndex],
    dun_type: isYangDun ? '陽遁' : '陰遁',
    ju_num: juNum,
    sheng_men: {
      palace: shengMenPalace,
      palace_name: shengPalaceInfo.name,
      position: shengPalaceInfo.position,
      element: shengPalaceInfo.element,
      is_ke: isKe,
    },
    kai_men: {
      palace: kaiMenPalace,
      palace_name: PALACE_INFO[kaiMenPalace].name,
    },
    jing_men: {
      palace: jingMenPalace,
      palace_name: PALACE_INFO[jingMenPalace].name,
    },
    patterns,
    spatial_energy_map: spatialMap,
  };
}

// ─── 空間能量映射 ───

function numToPalace(n) {
  const last = n % 10;
  if (last === 0) {
    const tens = Math.floor(n / 10);
    return tens >= 1 && tens <= 9 ? tens : 5;
  }
  return last <= 9 ? last : 5;
}

function buildSpatialEnergyMap(shengPalace, kaiPalace, jingPalace, isKe, hasDaJi) {
  const map = [];
  const globalBoost = hasDaJi ? 1.1 : 1;
  const keDebuff = isKe ? 0.85 : 1;

  for (let i = 1; i <= 49; i++) {
    const palace = numToPalace(i);
    let weight = 1 * globalBoost;

    if (palace === shengPalace) {
      weight *= 1.4 * keDebuff;
    } else if (palace === kaiPalace) {
      weight *= 1.2;
    } else if (palace === jingPalace) {
      weight *= 1.1;
    }

    // 生門所落宮位的五行與號碼所在宮位五行相生→加分
    const numPalaceElement = PALACE_INFO[palace] ? PALACE_INFO[palace].element : null;
    const shengElement = PALACE_INFO[shengPalace] ? PALACE_INFO[shengPalace].element : null;
    if (numPalaceElement && shengElement && WUXING_SHENG[shengElement] === numPalaceElement) {
      weight *= 1.1;
    }

    map.push({ num: i, palace, weight: Math.round(weight * 100) / 100 });
  }
  return map;
}

function getSpatialWeight(spatialMap, num) {
  if (!spatialMap || !Array.isArray(spatialMap)) return 1;
  const entry = spatialMap.find((e) => e.num === num);
  return entry ? entry.weight : 1;
}

module.exports = { computeQiMen, getSpatialWeight };
