// Deterministic entertainment rankings, never win probabilities.
const { Solar } = require('lunar-javascript');
const { createHash } = require('node:crypto');
const { computeHexagram, getNumberWuxing } = require('./hexagram');
const VERSION = '2.0.0';
const ELEMENTS = ['木', '火', '土', '金', '水'];
const GAN = { 甲:'木', 乙:'木', 丙:'火', 丁:'火', 戊:'土', 己:'土', 庚:'金', 辛:'金', 壬:'水', 癸:'水' };
const SHENG = { 木:'火', 火:'土', 土:'金', 金:'水', 水:'木' };
const KE = { 木:'土', 土:'水', 水:'火', 火:'金', 金:'木' };
const CONVENTION = '出生時間按輸入的當地民用鐘點排盤；未校正夏令時或真太陽時，不按城市猜測經度。立春換年、節換月、午夜換日（lunar sect 2）。分析及開獎時間按香港民用時間。';

function parseTime(value, field = '日期時間') {
  const m = typeof value === 'string' && value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) throw new Error(field + '須為 YYYY-MM-DD HH:mm');
  const [y, mo, d, h, mi, s] = m.slice(1).map(x => Number(x || 0));
  const date = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
  if (y < 1900 || y > 2100 || date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d || h > 23 || mi > 59 || s > 59) throw new Error(field + '超出範圍或不是有效日期（1900–2100）');
  return { solar: Solar.fromYmdHms(y, mo, d, h, mi, s), text: `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${String(s).padStart(2,'0')}`, hour: h, minute: mi };
}

function chartAt(time) {
  const ec = time.solar.getLunar().getEightChar();
  ec.setSect(2);
  const pillars = ['Year','Month','Day','Time'].map(p => ec['get' + p]());
  const support = Object.fromEntries(ELEMENTS.map(e => [e, 0]));
  // Proxy: stems weight 1; hidden stems share branch weight 1 (month: 2).
  // This is not a full professional 用神 judgment.
  ['Year','Month','Day','Time'].forEach(p => {
    support[GAN[ec['get' + p + 'Gan']()]] += 1;
    const hidden = ec['get' + p + 'HideGan']();
    hidden.forEach(g => { support[GAN[g]] += (p === 'Month' ? 2 : 1) / hidden.length; });
  });
  const dayMaster = GAN[ec.getDayGan()];
  const resource = ELEMENTS.find(e => SHENG[e] === dayMaster);
  const ratio = (support[dayMaster] + support[resource]) / 9;
  const strength = ratio >= .55 ? '偏強' : ratio <= .4 ? '偏弱' : '中和';
  const preference = Object.fromEntries(ELEMENTS.map(e => [e,
    strength === '中和' ? 60 : ((e === dayMaster || e === resource) === (strength === '偏弱') ? 80 : 40)
  ]));
  return { pillars, day_master: dayMaster, strength_proxy: strength, support_ratio: Number(ratio.toFixed(4)), element_mass: support, element_scores: preference, provisional_favorable_elements: ELEMENTS.filter(e => preference[e] === 80), note: '月支加權、藏干均分的扶抑代理規則；未處理合化、從格或調候，不等同專業喜用神定論。' };
}

function relationScore(element, reference) {
  if (element === reference) return 75;
  if (SHENG[element] === reference) return 85;
  if (KE[reference] === element) return 65;
  if (SHENG[reference] === element) return 40;
  return 25;
}
function hash(text) { return createHash('sha256').update(text).digest('hex'); }

function buildPrediction(input, options = {}) {
  if (!input || typeof input.birth_location !== 'string' || !input.birth_location.trim() || input.birth_location.length > 120) throw new Error('請填寫出生城市（最多 120 字）');
  const birth = parseTime(input.birth_time, '出生時間');
  const context = parseTime(input.draw_datetime || input.current_time, '分析／開獎時間');
  const initial = input.initial_numbers == null ? [] : input.initial_numbers;
  if (!Array.isArray(initial) || initial.length > 6 || initial.some(n => !Number.isInteger(n) || n < 1 || n > 49) || new Set(initial).size !== initial.length) throw new Error('初選號碼須為最多六個不重複的 1–49 整數');
  const chart = chartAt(birth);
  const hexagram = computeHexagram(context.text);
  if (hexagram.error) throw new Error(hexagram.error);
  const contextEc = context.solar.getLunar().getEightChar();
  contextEc.setSect(2);
  const nayinName = contextEc.getDayNaYin();
  const nayinElement = nayinName.slice(-1);
  const variant = options.variant || 'full';
  const variants = { full: { bazi:.6, meihua:.3, nayin:.1 }, bazi:{ bazi:1, meihua:0, nayin:0 }, bazi_meihua:{ bazi:2/3, meihua:1/3, nayin:0 } };
  if (!variants[variant]) throw new Error('Unknown evaluation variant');
  const weights = variants[variant];
  const seed = hash(JSON.stringify([VERSION, birth.text, context.text, variant]));
  const ranked = Array.from({length:49}, (_, i) => {
    const num = i + 1, element = getNumberWuxing(num);
    const components = { bazi: chart.element_scores[element], meihua: relationScore(element, hexagram.ti_gua.wuxing), nayin: relationScore(element, nayinElement) };
    const score = Object.keys(weights).reduce((s,k) => s + weights[k]*components[k], 0);
    return { num, element, components, score:Number(score.toFixed(2)), tie:hash(seed + ':' + num) };
  }).sort((a,b) => b.score-a.score || a.tie.localeCompare(b.tie));
  const byNum = Object.fromEntries(ranked.map(n => [n.num,n]));
  const usage = {};
  const groups = [];
  // Greedy compatibility minus 12 points per prior use. Diversity never
  // changes the displayed compatibility and imposes no parity exclusions.
  for (let i=0; i<5; i++) {
    const nums = [];
    while (nums.length < 6) {
      const candidates = ranked.filter(n => !nums.includes(n.num)).sort((a,b) =>
        (b.score - 12*(usage[b.num]||0)) - (a.score - 12*(usage[a.num]||0)) || a.tie.localeCompare(b.tie));
      const candidate = candidates.find(n => nums.length < 5 || !groups.some(g => g.numbers.join(',') === [...nums,n.num].sort((a,b)=>a-b).join(',')));
      nums.push(candidate.num);
    }
    nums.sort((a,b)=>a-b);
    nums.forEach(n => { usage[n] = (usage[n]||0)+1; });
    const components = Object.fromEntries(Object.keys(weights).map(k => [k, Number((nums.reduce((s,n)=>s+byNum[n].components[k],0)/6).toFixed(2))]));
    const score = Number((nums.reduce((s,n)=>s+byNum[n].score,0)/6).toFixed(2));
    const odd = nums.filter(n=>n%2).length;
    groups.push({ numbers:nums, energy_score:score, components, number_meta:nums.map(n=>({ num:n, element:byNum[n].element, score:byNum[n].score })), yinyang_ratio:odd+':'+(6-odd), desc:`最終號碼 ${nums.join('、')}；八字 ${components.bazi}、梅花 ${components.meihua}、納音 ${components.nayin}。契合分按公開權重取平均；奇偶比只作描述，沒有事後換號。` });
  }
  const overlap = [];
  groups.forEach((g,i)=>groups.slice(i+1).forEach(h=>overlap.push(g.numbers.filter(n=>h.numbers.includes(n)).length)));
  const result = {
    methodology: { version:VERSION, variant, weights, number_mapping:'河圖：1/6 水、2/7 火、3/8 木、4/9 金、5/0 土', time_convention:CONVENTION, context_time:context.text, context_source:input.draw_datetime ? '開獎時刻' : '分析時刻（未指定開獎）', history_status:'disabled_no_verified_dataset', qimen_status:'excluded_unverified_heuristic', evaluation_status:'尚未完成真實歷史留出測試，未證明勝過隨機', score_label:'規則契合分，非中獎概率', seed, diversity_penalty:12 },
    bazi_chart:chart, hexagram,
    nayin:{day_ganzhi:contextEc.getDay(),day_nayin:nayinName,day_nayin_element:nayinElement,description:'納音只佔 10% 的規則契合分，不代表中獎機率。'},
    solar_time_note:CONVENTION,
    bazi_analysis:`四柱：${chart.pillars.join(' ')}。日主 ${chart.day_master}，扶抑代理 ${chart.strength_proxy}；支持比例 ${(chart.support_ratio*100).toFixed(1)}%。${chart.note}`,
    initial_review:initial.length ? initial.map(n=>`${n}（${byNum[n].element}）：${byNum[n].score} 分`).join('；')+'。初選僅供比較，不改動排名。' : '未提供初選號碼。',
    core_numbers:ranked.slice(0,3).map(n=>n.num), bet_groups:groups,
    number_ranking:ranked.map(({tie,...n})=>n),
    portfolio:{ unique_numbers:Object.keys(usage).length, max_pair_overlap:Math.max(...overlap), note:'分散重複並不提高單注中獎概率；核心號為前三名，不強制每組包含。' },
    yinyang_summary:'未接入經驗證的歷史資料，因此停用冷熱、走勢及物極必反修正；奇偶比例僅作描述。',
    strategy:{ fortune:'娛樂參考；未驗證預測優勢', period:'不推斷黃金下注時段', direction:'不推斷財神方位' },
    warnings:[chart.note, '權重為事先設定的娛樂性假設，並非歷史擬合或中獎概率。', '奇門暫不參與排名；沒有使用模擬開獎資料。'],
  };
  if ((birth.hour % 2 === 1 && birth.minute < 15) || (birth.hour % 2 === 0 && birth.minute >= 45)) result.warnings.push('出生時間接近時辰交界；若時間不確定，四柱及排名可能改變。');
  result.prediction_id = hash(JSON.stringify([VERSION, seed, groups.map(g=>g.numbers)])).slice(0,24);
  return result;
}
module.exports = { VERSION, buildPrediction, parseTime, chartAt, relationScore };
