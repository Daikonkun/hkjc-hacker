/**
 * 梅花易數時空起卦邏輯（供 api/hexagram 與 api/predict 共用）
 */
const { Solar } = require('lunar-javascript');

const BAGUA = {
  1: { name: '乾', wuxing: '金' },
  2: { name: '兌', wuxing: '金' },
  3: { name: '離', wuxing: '火' },
  4: { name: '震', wuxing: '木' },
  5: { name: '巽', wuxing: '木' },
  6: { name: '坎', wuxing: '水' },
  7: { name: '艮', wuxing: '土' },
  8: { name: '坤', wuxing: '土' },
};

const WUXING_SHENG = { 金: '水', 水: '木', 木: '火', 火: '土', 土: '金' };
const WUXING_KE = { 金: '木', 木: '土', 土: '水', 水: '火', 火: '金' };

function parseDrawDatetime(drawDatetime) {
  const s = String(drawDatetime || '').trim();
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  if (!m) return null;
  return {
    year: parseInt(m[1], 10),
    month: parseInt(m[2], 10),
    day: parseInt(m[3], 10),
    hour: parseInt(m[4], 10),
    minute: parseInt(m[5], 10),
    second: m[6] ? parseInt(m[6], 10) : 0,
  };
}

function computeHexagram(drawDatetime) {
  const dt = parseDrawDatetime(drawDatetime);
  if (!dt) {
    return { error: '無效的開獎時刻格式，請使用 YYYY-MM-DD HH:mm 或 YYYY-MM-DD HH:mm:ss' };
  }

  const solar = Solar.fromYmdHms(dt.year, dt.month, dt.day, dt.hour, dt.minute, dt.second);
  const lunar = solar.getLunar();

  const yearZhiNum = lunar.getYearZhiIndex() + 1;
  const timeZhiNum = lunar.getTimeZhiIndex() + 1;
  const lunarMonth = lunar.getMonth();
  const lunarDay = lunar.getDay();

  let upper = (yearZhiNum + lunarMonth + lunarDay) % 8;
  if (upper === 0) upper = 8;

  let lower = (yearZhiNum + lunarMonth + lunarDay + timeZhiNum) % 8;
  if (lower === 0) lower = 8;

  let changeLine = (yearZhiNum + lunarMonth + lunarDay + timeZhiNum) % 6;
  if (changeLine === 0) changeLine = 6;

  const upperGua = BAGUA[upper];
  const lowerGua = BAGUA[lower];

  let tiGua, yongGua;
  if (changeLine >= 1 && changeLine <= 3) {
    tiGua = upperGua;
    yongGua = lowerGua;
  } else {
    tiGua = lowerGua;
    yongGua = upperGua;
  }

  const tiWuxing = tiGua.wuxing;
  const yongWuxing = yongGua.wuxing;

  let relation, relationLabel, relationFortune;
  if (WUXING_SHENG[yongWuxing] === tiWuxing) {
    relation = 'yong_sheng_ti';
    relationLabel = '用生體';
    relationFortune = '大吉';
  } else if (tiWuxing === yongWuxing) {
    relation = 'bihe';
    relationLabel = '體用比和';
    relationFortune = '次吉';
  } else if (WUXING_SHENG[tiWuxing] === yongWuxing) {
    relation = 'ti_sheng_yong';
    relationLabel = '體生用';
    relationFortune = '泄氣';
  } else if (WUXING_KE[yongWuxing] === tiWuxing) {
    relation = 'yong_ke_ti';
    relationLabel = '用克體';
    relationFortune = '不佳';
  } else {
    relation = 'ti_ke_yong';
    relationLabel = '體克用';
    relationFortune = '小吉';
  }

  return {
    draw_datetime: drawDatetime,
    lunar: {
      year_zhi_num: yearZhiNum,
      year_zhi: lunar.getYearZhi(),
      month: lunarMonth,
      day: lunarDay,
      time_zhi_num: timeZhiNum,
      time_zhi: lunar.getTimeZhi(),
    },
    upper_gua: { num: upper, name: upperGua.name, wuxing: upperGua.wuxing },
    lower_gua: { num: lower, name: lowerGua.name, wuxing: lowerGua.wuxing },
    change_line: changeLine,
    ti_gua: { name: tiGua.name, wuxing: tiWuxing },
    yong_gua: { name: yongGua.name, wuxing: yongWuxing },
    relation,
    relation_label: relationLabel,
    relation_fortune: relationFortune,
  };
}

function getNumberWuxing(n) {
  const r = ((n - 1) % 10) + 1;
  if (r === 1 || r === 6) return '水';
  if (r === 2 || r === 7) return '火';
  if (r === 3 || r === 8) return '木';
  if (r === 4 || r === 9) return '金';
  return '土';
}

function getDivinationScore(num, tiWuxing) {
  const w = getNumberWuxing(num);
  if (w === tiWuxing) return 1.2;
  if (WUXING_KE[tiWuxing] === w) return 1.1;
  if (WUXING_SHENG[w] === tiWuxing) return 1.05;
  return 1;
}

module.exports = { computeHexagram, getNumberWuxing, getDivinationScore };
