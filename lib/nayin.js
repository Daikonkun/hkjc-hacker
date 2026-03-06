/**
 * NaYinContext — 六十甲子納音全局能量因子
 *
 * 根據開獎日的日柱納音五行，對 1-49 號碼進行底層權重修正：
 *   同氣相求 +15%  |  相生有力 +10%  |  克制平衡 -5%（僅陽/奇數）
 */
const { Solar } = require('lunar-javascript');

// ─── 五行生克 ───
var SHENG = { 金: '水', 水: '木', 木: '火', 火: '土', 土: '金' };
var KE    = { 金: '木', 木: '土', 土: '水', 水: '火', 火: '金' };

// ─── 號碼尾數 → 五行 ───
// 天干序：1/2→木, 3/4→火, 5/6→土, 7/8→金, 9/0→水
function tailElement(num) {
  var d = num % 10;
  if (d === 1 || d === 2) return '木';
  if (d === 3 || d === 4) return '火';
  if (d === 5 || d === 6) return '土';
  if (d === 7 || d === 8) return '金';
  return '水';
}

// ─── 從納音名取五行（末字） ───
function extractElement(naYinName) {
  if (!naYinName) return null;
  var last = naYinName.charAt(naYinName.length - 1);
  if ('金木水火土'.indexOf(last) >= 0) return last;
  return null;
}

// ─── 解析日期時間 ───
function parseDT(s) {
  var m = String(s || '').trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{1,2})/);
  if (!m) return null;
  return { y: +m[1], mo: +m[2], d: +m[3], h: +m[4], mi: +m[5] };
}

// ─── 計算當日納音上下文 ───
function computeNaYinContext(drawDatetime) {
  var dt = parseDT(drawDatetime);
  if (!dt) return { error: '無效的日期時間格式' };

  var solar = Solar.fromYmdHms(dt.y, dt.mo, dt.d, dt.h, dt.mi, 0);
  var lunar = solar.getLunar();

  var dayGanZhi   = lunar.getDayInGanZhi();
  var dayNaYin    = lunar.getDayNaYin();
  var dayElement  = extractElement(dayNaYin);
  var yearNaYin   = lunar.getYearNaYin();
  var timeNaYin   = lunar.getTimeNaYin();

  if (!dayElement) return { error: '無法取得納音五行' };

  var desc = buildDescription(dayNaYin, dayElement);

  return {
    day_ganzhi:      dayGanZhi,
    day_nayin:       dayNaYin,
    day_nayin_element: dayElement,
    year_nayin:      yearNaYin,
    time_nayin:      timeNaYin,
    description:     desc,
  };
}

// ─── 單號修正因子 ───
function applyNaYinModifier(num, naYinElement) {
  var numElement = tailElement(num);
  var isYang = num % 2 === 1;
  var modifier = 1.0;

  if (numElement === naYinElement) {
    // 同氣相求 +15%
    modifier = 1.15;
  } else if (SHENG[naYinElement] === numElement) {
    // 納音生號碼 +10%
    modifier = 1.10;
  } else if (KE[naYinElement] === numElement) {
    // 納音克號碼：陽（奇數）受衝 -5%，陰（偶數）不額外扣
    if (isYang) modifier = 0.95;
  }

  return modifier;
}

// ─── 構建 1-49 權重圖 ───
function buildNaYinWeights(naYinElement) {
  var w = {};
  for (var i = 1; i <= 49; i++) {
    w[i] = applyNaYinModifier(i, naYinElement);
  }
  return w;
}

// ─── 對一組號碼計算聚合因子 ───
function getGroupNaYinFactor(numbers, naYinElement) {
  if (!numbers || !numbers.length || !naYinElement) return 1;
  var sum = 0;
  for (var i = 0; i < numbers.length; i++) {
    sum += applyNaYinModifier(numbers[i], naYinElement);
  }
  return sum / numbers.length;
}

// ─── 描述文本 ───
var ELEM_META = {
  金: { tails: '7、8', quality: '剛健' },
  木: { tails: '1、2', quality: '靈動' },
  水: { tails: '9、0', quality: '活躍' },
  火: { tails: '3、4', quality: '明亮' },
  土: { tails: '5、6', quality: '穩健' },
};

function buildDescription(naYin, element) {
  var child = SHENG[element];
  var selfMeta  = ELEM_META[element];
  var childMeta = ELEM_META[child];

  var text = '今日納音：' + naYin + '。';
  text += element + '能生' + child + '，';
  text += child + '屬性號碼（尾數 ' + childMeta.tails + '）';
  text += '今日獲得額外的' + element + '能滋養，表現將更' + childMeta.quality + '。';
  text += '同時' + element + '屬性號碼（尾數 ' + selfMeta.tails + '）同氣相求，能量亦有提升。';

  return text;
}

module.exports = {
  computeNaYinContext: computeNaYinContext,
  buildNaYinWeights:   buildNaYinWeights,
  getGroupNaYinFactor: getGroupNaYinFactor,
  applyNaYinModifier:  applyNaYinModifier,
};
