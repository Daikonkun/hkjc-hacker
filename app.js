(function () {
  'use strict';

  const form = document.getElementById('predict-form');
  const resultsPanel = document.getElementById('results-panel');
  const resultsContent = document.getElementById('results-content');
  const useNowBtn = document.getElementById('use-now');
  const birthDateInput = document.getElementById('birth-date');
  const birthHourInput = document.getElementById('birth-hour');
  const birthMinuteInput = document.getElementById('birth-minute');
  const currentDateInput = document.getElementById('current-date');
  const currentHourInput = document.getElementById('current-hour');
  const currentMinuteInput = document.getElementById('current-minute');
  const drawDateInput = document.getElementById('draw-date');
  const drawHourInput = document.getElementById('draw-hour');
  const drawMinuteInput = document.getElementById('draw-minute');
  const initialNumbersContainer = document.getElementById('initial-numbers');
  const hexDrawDateInput = document.getElementById('hex-draw-date');
  const hexDrawHourInput = document.getElementById('hex-draw-hour');
  const hexDrawMinuteInput = document.getElementById('hex-draw-minute');
  const hexSubmitBtn = document.getElementById('hex-submit');
  const hexUseNowBtn = document.getElementById('hex-use-now');
  const hexResultEl = document.getElementById('hex-result');
  const qmDrawDateInput = document.getElementById('qm-draw-date');
  const qmDrawHourInput = document.getElementById('qm-draw-hour');
  const qmDrawMinuteInput = document.getElementById('qm-draw-minute');
  const qmSubmitBtn = document.getElementById('qm-submit');
  const qmUseNowBtn = document.getElementById('qm-use-now');
  const qmResultEl = document.getElementById('qm-result');

  function clampNumberInput(input, min, max) {
    input.addEventListener('change', function () {
      let v = parseInt(this.value, 10);
      if (isNaN(v)) {
        this.value = '';
        return;
      }
      if (v < min) v = min;
      if (v > max) v = max;
      this.value = String(v).padStart(2, '0');
    });
  }

  // 限制小時/分鐘輸入
  [birthHourInput, currentHourInput, drawHourInput, hexDrawHourInput, qmDrawHourInput].forEach(function (el) {
    if (el) clampNumberInput(el, 0, 23);
  });
  [birthMinuteInput, currentMinuteInput, drawMinuteInput, hexDrawMinuteInput, qmDrawMinuteInput].forEach(function (el) {
    if (el) clampNumberInput(el, 0, 59);
  });

  // 開獎時間預設為 21:30（東八區 9:30pm）
  [drawHourInput, hexDrawHourInput, qmDrawHourInput].forEach(function (el) {
    if (el && !el.value) el.value = '21';
  });
  [drawMinuteInput, hexDrawMinuteInput, qmDrawMinuteInput].forEach(function (el) {
    if (el && !el.value) el.value = '30';
  });

  function normalizeTimeParts(hourStr, minuteStr) {
    if (!hourStr || !minuteStr) return '';
    const h = parseInt(hourStr, 10);
    const m = parseInt(minuteStr, 10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return '';
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // 使用現在時間
  useNowBtn.addEventListener('click', function () {
    const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const mins = String(now.getUTCMinutes()).padStart(2, '0');
    if (currentDateInput) currentDateInput.value = `${year}-${month}-${day}`;
    if (currentHourInput) currentHourInput.value = hours;
    if (currentMinuteInput) currentMinuteInput.value = mins;
  });

  const useDrawNowBtn = document.getElementById('use-draw-now');
  if (useDrawNowBtn) {
    useDrawNowBtn.addEventListener('click', function () {
      const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, '0');
      const day = String(now.getUTCDate()).padStart(2, '0');
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      if (drawDateInput) drawDateInput.value = `${year}-${month}-${day}`;
      if (drawHourInput) drawHourInput.value = hours;
      if (drawMinuteInput) drawMinuteInput.value = mins;
    });
  }

  if (hexUseNowBtn) {
    hexUseNowBtn.addEventListener('click', function () {
      const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, '0');
      const day = String(now.getUTCDate()).padStart(2, '0');
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      if (hexDrawDateInput) hexDrawDateInput.value = `${year}-${month}-${day}`;
      if (hexDrawHourInput) hexDrawHourInput.value = hours;
      if (hexDrawMinuteInput) hexDrawMinuteInput.value = mins;
    });
  }

  // 號碼輸入限制 1–49
  initialNumbersContainer.querySelectorAll('input[type="number"]').forEach(function (input) {
    input.addEventListener('change', function () {
      let v = parseInt(this.value, 10);
      if (isNaN(v) || v < 1) this.value = '';
      else if (v > 49) this.value = 49;
    });
  });

  function getFormData() {
    const birthDate = birthDateInput.value;
    const birthTime = normalizeTimeParts(
      birthHourInput.value,
      birthMinuteInput.value
    );
    const birthLocation = document.getElementById('birth-location').value.trim();
    const currentDate = currentDateInput.value;
    const currentTime = normalizeTimeParts(
      currentHourInput.value,
      currentMinuteInput.value
    );
    const numberInputs = initialNumbersContainer.querySelectorAll('input[type="number"]');
    const initialNumbers = Array.from(numberInputs)
      .map(function (el) { return parseInt(el.value, 10); })
      .filter(function (n) { return !isNaN(n) && n >= 1 && n <= 49; });

    // 組合 24h 格式的日期時間
    const combineDateTime = function (dateStr, timeStr) {
      if (!dateStr || !timeStr) return '';
      return `${dateStr} ${timeStr}`;
    };

    const birthDateTime = combineDateTime(birthDate, birthTime);
    const currentDateTime = combineDateTime(currentDate, currentTime);
    const drawDateTime = combineDateTime(
      drawDateInput ? drawDateInput.value : '',
      normalizeTimeParts(drawHourInput ? drawHourInput.value : '', drawMinuteInput ? drawMinuteInput.value : '')
    );

    return {
      birth_time: birthDateTime,
      birth_location: birthLocation,
      current_time: currentDateTime || 'Now',
      draw_datetime: drawDateTime || undefined,
      initial_numbers: initialNumbers
    };
  }

  // 模擬後端回應（可替換為真實 API）
  function simulateResult(data) {
    const nums = data.initial_numbers && data.initial_numbers.length ? data.initial_numbers : [7, 14, 21, 28, 35, 42];
    const core = [nums[0] % 49 || 13, (nums[1] + 5) % 49 || 18, (nums[2] + 11) % 49 || 24];

    function to49(n) {
      const v = ((n % 49) + 49) % 49;
      return v === 0 ? 49 : v;
    }
    function group(a, b, c, d, e, f) {
      return [a, b, c, d, e, f].map(to49).sort(function (x, y) { return x - y; });
    }
    core[0] = to49(core[0]);
    core[1] = to49(core[1]);
    core[2] = to49(core[2]);

    return {
      solar_time_note: '根據出生地經度，已將您提供的時間換算為真太陽時，用以排盤。若出生地為東經約 114°（如香港），與北京時相差約 -24 分鐘，排出的四柱更貼合當地天時。',
      bazi_analysis: '日主得令得地，身旺喜克泄。喜用神取金、水，忌神為木、火。流時與命局金水相生，利於偏財時段。',
      initial_review: '初選號碼中水數（1、6）與金數（4、9）較多，與今日喜用神契合度較高，整體能量評分約 72/100。',
      core_numbers: core,
      bet_groups: [
        { numbers: group(core[0], core[1], core[2], (core[0] + 7) % 49 || 7, (core[1] + 8) % 49 || 8, (core[2] + 9) % 49 || 9), desc: '以三枚核心幸運號為軸，補金水相生之數。' },
        { numbers: group(core[0], core[2], (core[0] + 10) % 49 || 10, (core[1] + 12) % 49 || 12, (core[2] + 6) % 49 || 6, (core[0] + core[1]) % 49 || 19), desc: '金水流通，兼顧尾數分佈。' },
        { numbers: group(core[1], core[2], (core[0] + 5) % 49 || 5, (core[1] + 15) % 49 || 15, (core[2] + 3) % 49 || 3, 49), desc: '納一碼 49 收尾，取「久久」之象。' },
        { numbers: group(core[0], core[1], core[2], 6, 16, 26), desc: '水數 6 系加強，助旺喜神。' },
        { numbers: group(core[0], core[1], core[2], 4, 14, 24), desc: '金數 4 系加強，利偏財。' }
      ],
      strategy: {
        fortune: '小吉',
        period: '酉時至亥時（17:00–23:00）',
        direction: '正西、西北'
      }
    };
  }

  function renderHexResult(h) {
    if (!h || h.error) {
      hexResultEl.innerHTML = '<p class="hex-error">' + (h ? h.error : '請輸入開獎時刻') + '</p>';
      hexResultEl.classList.remove('hidden');
      return;
    }
    let html = '<div class="hex-result-inner">';
    html += '<p><strong>開獎時刻：</strong>' + (h.draw_datetime || '') + '</p>';
    html += '<p><strong>農曆：</strong>' + h.lunar.year_zhi + '年 ' + h.lunar.month + '月' + h.lunar.day + '日 ' + h.lunar.time_zhi + '時</p>';
    html += '<p><strong>上卦：</strong>' + h.upper_gua.name + '（' + h.upper_gua.wuxing + '）</p>';
    html += '<p><strong>下卦：</strong>' + h.lower_gua.name + '（' + h.lower_gua.wuxing + '）</p>';
    html += '<p><strong>動爻：</strong>第 ' + h.change_line + ' 爻</p>';
    if (h.mutual_hexagram) html += '<p>互卦：' + h.mutual_hexagram.upper.name + '上' + h.mutual_hexagram.lower.name + '下；變卦：' + h.changed_hexagram.upper.name + '上' + h.changed_hexagram.lower.name + '下（僅供解讀，不另加分）。</p>';
    html += '<p><strong>體卦：</strong>' + h.ti_gua.name + '（' + h.ti_gua.wuxing + '）</p>';
    html += '<p><strong>用卦：</strong>' + h.yong_gua.name + '（' + h.yong_gua.wuxing + '）</p>';
    html += '<p><strong>體用生克：</strong>' + h.relation_label + ' — ' + h.relation_fortune + '</p>';
    html += '</div>';
    hexResultEl.innerHTML = html;
    hexResultEl.classList.remove('hidden');
  }

  if (hexSubmitBtn) {
    hexSubmitBtn.addEventListener('click', async function () {
      const drawDate = hexDrawDateInput ? hexDrawDateInput.value : '';
      const drawTime = normalizeTimeParts(
        hexDrawHourInput ? hexDrawHourInput.value : '',
        hexDrawMinuteInput ? hexDrawMinuteInput.value : ''
      );
      const drawDatetime = drawDate && drawTime ? drawDate + ' ' + drawTime : '';
      if (!drawDatetime) {
        renderHexResult({ error: '請輸入開獎日期與時間' });
        return;
      }
      try {
        const res = await fetch('/api/hexagram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draw_datetime: drawDatetime })
        });
        const data = await res.json();
        if (!res.ok) renderHexResult({ error: data.error || data.message || '請求失敗' });
        else renderHexResult(data);
      } catch (e) {
        renderHexResult({ error: e.message || '無法連接到服務器' });
      }
    });
  }

  // 奇門遁甲面板
  if (qmUseNowBtn) {
    qmUseNowBtn.addEventListener('click', function () {
      var now = new Date(Date.now() + 8 * 60 * 60 * 1000);
      var year = now.getUTCFullYear();
      var month = String(now.getUTCMonth() + 1).padStart(2, '0');
      var day = String(now.getUTCDate()).padStart(2, '0');
      var hours = String(now.getUTCHours()).padStart(2, '0');
      var mins = String(now.getUTCMinutes()).padStart(2, '0');
      if (qmDrawDateInput) qmDrawDateInput.value = year + '-' + month + '-' + day;
      if (qmDrawHourInput) qmDrawHourInput.value = hours;
      if (qmDrawMinuteInput) qmDrawMinuteInput.value = mins;
    });
  }

  function renderQiMenResult(qm, targetEl) {
    if (!qm || qm.error) {
      targetEl.innerHTML = '<p class="hex-error">' + (qm ? qm.error : '請輸入開獎時刻') + '</p>';
      targetEl.classList.remove('hidden');
      return;
    }

    var gridOrder = [
      { palace: 4, name: '巽宮', dir: '東南', element: '木' },
      { palace: 9, name: '離宮', dir: '正南', element: '火' },
      { palace: 2, name: '坤宮', dir: '西南', element: '土' },
      { palace: 3, name: '震宮', dir: '正東', element: '木' },
      { palace: 5, name: '中宮', dir: '中央', element: '土' },
      { palace: 7, name: '兌宮', dir: '正西', element: '金' },
      { palace: 8, name: '艮宮', dir: '東北', element: '土' },
      { palace: 1, name: '坎宮', dir: '正北', element: '水' },
      { palace: 6, name: '乾宮', dir: '西北', element: '金' },
    ];

    var shengPalace = qm.sheng_men.palace;
    var kaiPalace = qm.kai_men.palace;
    var jingPalace = qm.jing_men.palace;

    var html = '<div class="qm-result-inner">';

    html += '<div class="qm-summary">';
    html += '<p><strong>節氣：</strong>' + qm.jie_qi + ' · ' + qm.yuan + '</p>';
    html += '<p><strong>遁局：</strong>' + qm.dun_type + ' ' + qm.ju_num + '局</p>';
    html += '<p><strong>生門落宮：</strong>' + qm.sheng_men.palace_name + '（' + qm.sheng_men.position + '· ' + qm.sheng_men.element + '）</p>';
    html += '<p><strong>開門落宮：</strong>' + qm.kai_men.palace_name + '</p>';
    html += '<p><strong>景門落宮：</strong>' + qm.jing_men.palace_name + '</p>';
    html += '</div>';

    // 九宮格
    html += '<div class="qm-grid-wrap"><div class="qm-grid">';
    gridOrder.forEach(function (cell) {
      var isSheng = cell.palace === shengPalace;
      var isKai = cell.palace === kaiPalace;
      var isJing = cell.palace === jingPalace;
      var cls = 'qm-cell' + (isSheng ? ' active' : '');
      html += '<div class="' + cls + '">';
      html += '<span class="qm-cell-name">' + cell.name + '</span>';
      html += '<span class="qm-cell-dir">' + cell.dir + ' · ' + cell.element + '</span>';
      var doors = [];
      if (isSheng) doors.push('★生門');
      if (isKai) doors.push('開門');
      if (isJing) doors.push('景門');
      if (doors.length) {
        html += '<span class="qm-cell-door">' + doors.join(' ') + '</span>';
      }
      html += '</div>';
    });
    html += '</div></div>';

    // 格局標籤
    if (qm.patterns && qm.patterns.length > 0) {
      html += '<div class="qm-patterns">';
      qm.patterns.forEach(function (p) {
        var cls = 'qm-pattern-tag';
        if (p.fortune === '大吉') cls += ' fortune-daji';
        else if (p.fortune === '吉') cls += ' fortune-ji';
        else cls += ' fortune-buli';
        html += '<span class="' + cls + '" title="' + p.desc + '">' + p.name + ' · ' + p.fortune + '</span>';
      });
      html += '</div>';
    }

    // 能量提示
    var tailNums = [];
    var p = shengPalace;
    for (var n = p; n <= 49; n += 10) { if (n >= 1) tailNums.push(n); }
    if (p >= 1 && p <= 4) {
      for (var n2 = p + 40; n2 <= 49; n2 += 10) { if (n2 >= 1 && tailNums.indexOf(n2) < 0) tailNums.push(n2); }
    }
    tailNums.sort(function (a, b) { return a - b; });

    html += '<div class="qm-energy-hint">';
    html += '當期生門落在<strong>' + qm.sheng_men.palace_name + '</strong>（' + qm.sheng_men.position + '），';
    html += qm.sheng_men.position + '之' + qm.sheng_men.element + '氣正旺，';
    html += '尾數 ' + shengPalace + ' 的號碼（' + tailNums.join('、') + '）出現概率大增。';
    if (qm.sheng_men.is_ke) {
      html += '<br>⚠ 生門落宮受克，能量有所削弱。';
    }
    html += '</div>';

    html += '</div>';
    targetEl.innerHTML = html;
    targetEl.classList.remove('hidden');
  }

  if (qmSubmitBtn) {
    qmSubmitBtn.addEventListener('click', async function () {
      var drawDate = qmDrawDateInput ? qmDrawDateInput.value : '';
      var drawTime = normalizeTimeParts(
        qmDrawHourInput ? qmDrawHourInput.value : '',
        qmDrawMinuteInput ? qmDrawMinuteInput.value : ''
      );
      var drawDatetime = drawDate && drawTime ? drawDate + ' ' + drawTime : '';
      if (!drawDatetime) {
        renderQiMenResult({ error: '請輸入開獎日期與時間' }, qmResultEl);
        return;
      }
      try {
        var res = await fetch('/api/qimen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draw_datetime: drawDatetime })
        });
        var data = await res.json();
        if (!res.ok) renderQiMenResult({ error: data.error || data.message || '請求失敗' }, qmResultEl);
        else renderQiMenResult(data, qmResultEl);
      } catch (e) {
        renderQiMenResult({ error: e.message || '無法連接到服務器' }, qmResultEl);
      }
    });
  }

  function renderResults(data, result) {
    // Model text is untrusted: escape it before inserting any HTML.
    function escapeValues(value) {
      if (typeof value === 'string') return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      if (Array.isArray(value)) return value.map(escapeValues);
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, escapeValues(v)]));
      return value;
    }
    const s = escapeValues(result);
    let html = '';

    if (s.methodology) {
      html += '<div class="result-section methodology-summary"><h3>方法框架 v' + s.methodology.version + '</h3>';
      html += '<p>八字 60% · 梅花 30% · 納音 10%。固定規則計算，AI 不選號、不評分。</p>';
      html += '<p>' + s.methodology.number_mapping + '</p><p>' + s.methodology.context_source + '：' + s.methodology.context_time + '</p>';
      html += '<p>' + s.methodology.evaluation_status + '。奇門與模擬歷史已退出計分。</p>';
      html += '<details><summary>查看方法、覆蓋率與限制</summary>';
      html += '<p>組合覆蓋 ' + s.portfolio.unique_numbers + ' 個不同號碼；兩組最多重複 ' + s.portfolio.max_pair_overlap + ' 個。核心號不強制加入每一組。</p>';
      html += '<p>重現編號：' + s.prediction_id + '</p>';
      (s.warnings || []).forEach(w => { html += '<p class="form-hint">' + w + '</p>'; });
      html += '</details></div>';
    }

    if (s.nayin) {
      html += '<div class="result-section nayin-section">';
      html += '<h3>納音能量基調</h3>';
      html += '<div class="nayin-banner">';
      html += '<span class="nayin-badge">' + s.nayin.day_ganzhi + ' · ' + s.nayin.day_nayin + '</span>';
      html += '<p class="nayin-desc">' + s.nayin.description + '</p>';
      if (s.nayin.year_nayin || s.nayin.time_nayin) {
        html += '<p class="nayin-sub">';
        if (s.nayin.year_nayin) html += '年柱納音：' + s.nayin.year_nayin + '　';
        if (s.nayin.time_nayin) html += '時柱納音：' + s.nayin.time_nayin;
        html += '</p>';
      }
      html += '</div></div>';
    }

    if (s.hexagram) {
      const h = s.hexagram;
      html += '<div class="result-section hexagram-section"><h3>梅花易數 · 時空起卦</h3>';
      html += '<div class="hex-result-inner">';
      html += '<p><strong>開獎時刻：</strong>' + (h.draw_datetime || '') + '</p>';
      html += '<p><strong>體卦：</strong>' + h.ti_gua.name + '（' + h.ti_gua.wuxing + '） · <strong>用卦：</strong>' + h.yong_gua.name + '（' + h.yong_gua.wuxing + '）</p>';
      html += '<p><strong>體用生克：</strong>' + h.relation_label + ' — ' + h.relation_fortune + '</p>';
      if (h.mutual_hexagram) html += '<p>互卦：' + h.mutual_hexagram.upper.name + '上' + h.mutual_hexagram.lower.name + '下；變卦：' + h.changed_hexagram.upper.name + '上' + h.changed_hexagram.lower.name + '下（不另加分）。</p><p>' + h.leap_month_convention + '</p>';
      html += '</div></div>';
    }

    if (s.qimen) {
      html += '<div class="result-section qm-section"><h3>奇門遁甲 · 時空排盤</h3>';
      var qmContainer = document.createElement('div');
      qmContainer.id = 'qm-result-inline';
      html += '<div id="qm-result-inline"></div>';
      html += '</div>';
    }

    if (s.yinyang_summary) {
      html += '<div class="result-section yy-section"><h3>陰陽比例 · 描述而非預測</h3>';
      html += '<div class="yy-summary-box">';
      html += '<p class="yy-summary-text">' + s.yinyang_summary + '</p>';
      if (s.yinyang_analysis) {
        html += '<div class="yy-meta">';
        html += '<span class="yy-target-tag">目標比例 ' + s.yinyang_analysis.target + '</span>';
        if (s.yinyang_analysis.recent_ratios && s.yinyang_analysis.recent_ratios.length > 0) {
          html += '<span class="yy-trend">走勢 ' + s.yinyang_analysis.recent_ratios.join(' → ') + '</span>';
        }
        html += '</div>';
      }
      html += '</div></div>';
    }

    html += '<div class="result-section"><h3>時間基準與限制</h3><p>' + (s.solar_time_note || '') + '</p></div>';
    html += '<div class="result-section"><h3>八字排盤 · 扶抑代理分析</h3><p>' + (s.bazi_analysis || '') + '</p></div>';
    if (s.ai_reading) html += '<div class="result-section"><h3>AI 補充解讀（不參與計分）</h3><p>' + s.ai_reading + '</p></div>';
    if (data.initial_numbers.some(n => n > 0)) html += '<div class="result-section"><h3>初選號能量點評</h3><p>' + (s.initial_review || '') + '</p></div>';

    html += '<div class="result-section number-summary"><h3>三枚核心幸運號</h3><div class="core-numbers">';
    (s.core_numbers || []).forEach(function (n) {
      html += '<span class="core-num">' + n + '</span>';
    });
    html += '</div></div>';

    html += '<div class="result-section number-groups"><h3>五組參考號碼</h3><p class="form-hint">契合分是系統的娛樂性評分，不代表中獎概率；相同分數不表示同等勝算。</p>';
    (s.bet_groups || []).forEach(function (g, i) {
      html += '<div class="bet-group">';
      html += '<div class="bet-group-header">';
      html += '<span class="bet-group-title">第 ' + (i + 1) + ' 組</span>';
      if (typeof g.energy_score === 'number') {
        html += '<span class="bet-group-energy">契合分 ' + g.energy_score + '/100</span>';
      }
      if (g.yinyang_ratio) {
        html += '<span class="bet-group-yy" title="奇偶比（陽:陰）">' + g.yinyang_ratio + '</span>';
      }
      html += '</div>';
      html += '<div class="bet-numbers">';
      (g.numbers || []).forEach(function (num) {
        html += '<span class="bet-num">' + num;
        html += '</span>';
      });
      html += '</div>';
      if (g.desc) html += '<details class="group-explanation"><summary>查看規則計分明細</summary><div class="bet-group-desc">' + g.desc + '</div></details>';
      html += '<button type="button" class="btn btn-ghost copy-group" data-group="' + i + '">複製第 ' + (i + 1) + ' 組</button>';
      html += '</div>';
    });
    html += '</div>';

    html += '<div class="result-section"><h3>使用限制</h3>';
    html += '<div class="strategy-box">';
    html += '<p><strong>運勢定性：</strong>' + (s.strategy && s.strategy.fortune ? s.strategy.fortune : '—') + '</p>';
    html += '<p><strong>黃金下注時段：</strong>' + (s.strategy && s.strategy.period ? s.strategy.period : '—') + '</p>';
    html += '<p><strong>財神方位：</strong>' + (s.strategy && s.strategy.direction ? s.strategy.direction : '—') + '</p>';
    html += '</div></div>';

    resultsContent.innerHTML = html;
    const summary = resultsContent.querySelector('.number-summary');
    const groups = resultsContent.querySelector('.number-groups');
    const methodology = resultsContent.querySelector('.methodology-summary');
    const explanations = document.createElement('details');
    explanations.className = 'result-explanations';
    const toggle = document.createElement('summary');
    toggle.textContent = '查看完整命理解讀';
    explanations.append(toggle);
    Array.from(resultsContent.children).filter(el => el !== summary && el !== groups && el !== methodology).forEach(el => explanations.append(el));
    resultsContent.append(summary, groups, explanations);
    if (methodology) resultsContent.prepend(methodology);
    const actions = document.createElement('div');
    actions.className = 'result-actions';
    actions.innerHTML = '<button type="button" class="btn btn-primary" id="copy-all">複製全部號碼</button><button type="button" class="btn btn-ghost" id="save-result">儲存號碼文字檔</button><button type="button" class="btn btn-ghost" id="save-evidence">匯出驗證紀錄 JSON</button><p class="form-hint">JSON 包含出生資料，請私下保存；下載紀錄不代表開獎前已獲第三方存證。</p><p id="copy-feedback" role="status"></p>';
    summary.append(actions);
    const numberText = result.bet_groups.map((g,i) => '第 ' + (i+1) + ' 組：' + g.numbers.join(', ')).join('\n');
    async function copy(text) {
      const feedback = document.getElementById('copy-feedback');
      try { await navigator.clipboard.writeText(text); feedback.textContent = '已複製'; }
      catch { feedback.textContent = '無法存取剪貼簿，請使用「儲存號碼文字檔」。'; }
    }
    document.getElementById('copy-all').onclick = () => copy(numberText);
    document.getElementById('save-evidence').onclick = () => {
      const record = {exported_at:new Date().toISOString(), input:data, result};
      const url = URL.createObjectURL(new Blob([JSON.stringify(record,null,2)], {type:'application/json'}));
      const link = document.createElement('a'); link.href = url; link.download = 'methodology-' + (result.prediction_id || 'demo') + '.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
    };
    resultsContent.querySelectorAll('.copy-group').forEach(button => { button.onclick = () => copy(result.bet_groups[Number(button.dataset.group)].numbers.join(', ')); });
    document.getElementById('save-result').onclick = () => {
      const url = URL.createObjectURL(new Blob(['八字六合彩 · 時空合盤\n' + numberText + '\n僅供娛樂參考'], {type:'text/plain;charset=utf-8'}));
      const link = document.createElement('a'); link.href = url; link.download = '合盤號碼.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    resultsPanel.classList.remove('hidden');
    document.getElementById('results-heading').textContent = '合盤結果';
    resultsPanel.focus({preventScroll:true});

    if (s.qimen) {
      var qmInline = document.getElementById('qm-result-inline');
      if (qmInline) {
        qmInline.classList.remove('hidden');
        renderQiMenResult(s.qimen, qmInline);
      }
    }

    resultsPanel.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }

  const overlayEl = document.getElementById('ritual-overlay');
  const cancelButton = document.getElementById('cancel-prediction');
  const pageWrap = document.querySelector('.page-wrap');
  const feedback = document.getElementById('form-feedback');
  const submitButton = form.querySelector('[type="submit"]');
  document.querySelector('.standalone-tools').before(resultsPanel);
  form.addEventListener('invalid', event => {
    const settings = document.getElementById('optional-settings');
    if (settings.contains(event.target)) settings.open = true;
  }, true);
  let activeController = null;
  let manualCurrentTime = false;

  function hongKongNow() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Hong_Kong', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date()).map(p => [p.type, p.value]));
    currentDateInput.value = parts.year + '-' + parts.month + '-' + parts.day;
    currentHourInput.value = parts.hour; currentMinuteInput.value = parts.minute;
  }
  hongKongNow();
  [currentDateInput,currentHourInput,currentMinuteInput].forEach(el => el.addEventListener('input', () => { manualCurrentTime = true; }));
  useNowBtn.addEventListener('click', () => { manualCurrentTime = false; hongKongNow(); });

  // Give every split date/time and number input an explicit accessible name.
  [['draw','合盤開獎'],['hex-draw','梅花易數開獎'],['qm-draw','奇門遁甲開獎']].forEach(([prefix,label]) => {
    ['date','hour','minute'].forEach((part,i) => document.getElementById(prefix+'-'+part).setAttribute('aria-label', label+['日期','小時（香港時間）','分鐘'][i]));
  });
  initialNumbersContainer.querySelectorAll('input').forEach((el,i) => {
    el.setAttribute('aria-label', '第 '+(i+1)+' 個初選號碼（1 至 49）');
    el.setAttribute('inputmode','numeric');
  });
  cancelButton.addEventListener('click', () => activeController?.abort());
  overlayEl.addEventListener('keydown', e => {
    if (e.key === 'Escape') activeController?.abort();
    if (e.key === 'Tab') { e.preventDefault(); cancelButton.focus(); }
  });
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (activeController) return;
    const entered = Array.from(initialNumbersContainer.querySelectorAll('input')).filter(el => el.value !== '');
    if (entered.length && (entered.length !== 6 || new Set(entered.map(el => Number(el.value))).size !== 6)) {
      document.getElementById('optional-settings').open = true;
      feedback.textContent = '請填寫 6 個不重複的號碼，或全部留空。';
      initialNumbersContainer.querySelector('input').focus(); return;
    }
    if (!manualCurrentTime) hongKongNow();
    const data = getFormData();
    if (!data.birth_time || !data.birth_location) { feedback.textContent = '請完整填寫出生日期、時間和城市。'; return; }
    if (manualCurrentTime && (!currentDateInput.value || !normalizeTimeParts(currentHourInput.value,currentMinuteInput.value))) {
      document.getElementById('optional-settings').open = true;
      feedback.textContent = '請完整填寫分析時間，或按「使用現在」。'; currentDateInput.focus(); return;
    }
    feedback.textContent = '';
    if (!resultsPanel.classList.contains('hidden')) document.getElementById('results-heading').textContent = '上次合盤結果';
    const controller = new AbortController(); activeController = controller;
    let timedOut = false;
    const started = Date.now();
    const timer = setInterval(() => {
      document.getElementById('ritual-step-label').textContent = '已等待 ' + Math.floor((Date.now()-started)/1000) + ' 秒';
    },1000);
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); },120000);
    document.getElementById('ritual-text').textContent = '正在生成分析，請稍候…';
    document.getElementById('ritual-text').classList.add('visible');
    document.getElementById('ritual-step-label').textContent = '已等待 0 秒';
    pageWrap.inert = true; submitButton.disabled = true; form.setAttribute('aria-busy','true');
    overlayEl.classList.remove('hidden'); document.body.style.overflow = 'hidden'; cancelButton.focus();
    let result;
    try {
      const response = await fetch('/api/predict', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data), signal:controller.signal});
      if (!response.ok) throw new Error('request_failed');
      result = await response.json();
      if (!Array.isArray(result.core_numbers) || !Array.isArray(result.bet_groups) || result.bet_groups.length !== 5 || result.bet_groups.some(g => !Array.isArray(g.numbers) || g.numbers.length !== 6)) throw new Error('invalid_result');
    } catch (error) {
      result = null;
      feedback.textContent = controller.signal.aborted
        ? (timedOut ? '分析等候逾時，資料已保留，請稍後重試。' : '已停止等待，資料已保留。')
        : '暫時無法完成分析，資料已保留，請再次按「起盤推算」重試。';
    } finally {
      clearInterval(timer); clearTimeout(timeout); activeController = null;
      overlayEl.classList.add('hidden'); document.body.style.overflow = '';
      pageWrap.inert = false; submitButton.disabled = false; form.removeAttribute('aria-busy');
      submitButton.focus();
    }
    if (result) renderResults(data,result);
  });
  form.addEventListener('reset', () => {
    feedback.textContent = ''; resultsPanel.classList.add('hidden'); resultsContent.replaceChildren();
    manualCurrentTime = false; setTimeout(hongKongNow,0);
  });
})();
