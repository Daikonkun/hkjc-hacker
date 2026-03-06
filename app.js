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
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    if (currentDateInput) currentDateInput.value = `${year}-${month}-${day}`;
    if (currentHourInput) currentHourInput.value = hours;
    if (currentMinuteInput) currentMinuteInput.value = mins;
  });

  const useDrawNowBtn = document.getElementById('use-draw-now');
  if (useDrawNowBtn) {
    useDrawNowBtn.addEventListener('click', function () {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      if (drawDateInput) drawDateInput.value = `${year}-${month}-${day}`;
      if (drawHourInput) drawHourInput.value = hours;
      if (drawMinuteInput) drawMinuteInput.value = mins;
    });
  }

  if (hexUseNowBtn) {
    hexUseNowBtn.addEventListener('click', function () {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
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
      initial_numbers: initialNumbers.length >= 6 ? initialNumbers.slice(0, 6) : [0, 0, 0, 0, 0, 0]
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
      var now = new Date();
      var year = now.getFullYear();
      var month = String(now.getMonth() + 1).padStart(2, '0');
      var day = String(now.getDate()).padStart(2, '0');
      var hours = String(now.getHours()).padStart(2, '0');
      var mins = String(now.getMinutes()).padStart(2, '0');
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
    const s = result;
    let html = '';

    if (s.hexagram) {
      const h = s.hexagram;
      html += '<div class="result-section hexagram-section"><h3>梅花易數 · 時空起卦</h3>';
      html += '<div class="hex-result-inner">';
      html += '<p><strong>開獎時刻：</strong>' + (h.draw_datetime || '') + '</p>';
      html += '<p><strong>體卦：</strong>' + h.ti_gua.name + '（' + h.ti_gua.wuxing + '） · <strong>用卦：</strong>' + h.yong_gua.name + '（' + h.yong_gua.wuxing + '）</p>';
      html += '<p><strong>體用生克：</strong>' + h.relation_label + ' — ' + h.relation_fortune + '</p>';
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
      html += '<div class="result-section yy-section"><h3>AI 能量綜述 · 陰陽消長</h3>';
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

    html += '<div class="result-section"><h3>真太陽時修正說明</h3><p>' + (s.solar_time_note || '') + '</p></div>';
    html += '<div class="result-section"><h3>八字喜用神深度分析</h3><p>' + (s.bazi_analysis || '') + '</p></div>';
    html += '<div class="result-section"><h3>初選號能量點評</h3><p>' + (s.initial_review || '') + '</p></div>';

    html += '<div class="result-section"><h3>三枚核心幸運號</h3><div class="core-numbers">';
    (s.core_numbers || []).forEach(function (n) {
      html += '<span class="core-num">' + n + '</span>';
    });
    html += '</div></div>';

    html += '<div class="result-section"><h3>五組推薦注號矩陣（含五行解析）</h3>';
    (s.bet_groups || []).forEach(function (g, i) {
      html += '<div class="bet-group">';
      html += '<div class="bet-group-header">';
      html += '<span class="bet-group-title">第 ' + (i + 1) + ' 組</span>';
      if (typeof g.energy_score === 'number') {
        html += '<span class="bet-group-energy" title="能量契合度 0–100">能量 ' + g.energy_score + '</span>';
      }
      if (g.yinyang_ratio) {
        html += '<span class="bet-group-yy" title="奇偶比（陽:陰）">' + g.yinyang_ratio + '</span>';
      }
      html += '</div>';
      html += '<div class="bet-numbers">';
      (g.numbers || []).forEach(function (num, idx) {
        const meta = g.number_meta && g.number_meta[idx] ? g.number_meta[idx] : null;
        const tag = meta && meta.label ? meta.label : '';
        html += '<span class="bet-num">' + num;
        if (tag) {
          html += '<span class="bet-num-tag">' + tag + '</span>';
        }
        html += '</span>';
      });
      html += '</div>';
      if (g.desc) html += '<div class="bet-group-desc">' + g.desc + '</div>';
      html += '</div>';
    });
    html += '</div>';

    html += '<div class="result-section"><h3>今日博弈決策方案</h3>';
    html += '<div class="strategy-box">';
    html += '<p><strong>運勢定性：</strong>' + (s.strategy && s.strategy.fortune ? s.strategy.fortune : '—') + '</p>';
    html += '<p><strong>黃金下注時段：</strong>' + (s.strategy && s.strategy.period ? s.strategy.period : '—') + '</p>';
    html += '<p><strong>財神方位：</strong>' + (s.strategy && s.strategy.direction ? s.strategy.direction : '—') + '</p>';
    html += '</div></div>';

    resultsContent.innerHTML = html;
    resultsPanel.classList.remove('hidden');

    if (s.qimen) {
      var qmInline = document.getElementById('qm-result-inline');
      if (qmInline) {
        qmInline.classList.remove('hidden');
        renderQiMenResult(s.qimen, qmInline);
      }
    }

    resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const data = getFormData();

    form.classList.add('loading');
    resultsContent.innerHTML = '<p style="color: var(--ink-muted);">正在推算…</p>';
    resultsPanel.classList.remove('hidden');

    try {
      // 調用真實 API
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '請求失敗' }));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      renderResults(data, result);
    } catch (error) {
      console.error('預測錯誤:', error);
      let errorMsg = error.message || '未知錯誤';
      let helpMsg = '';
      
      // 根據錯誤類型提供更詳細的提示
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMsg = '無法連接到服務器';
        helpMsg = '請確保後端服務器正在運行（運行 npm start）';
      } else if (error.message.includes('XAI_API_KEY')) {
        errorMsg = error.message;
        helpMsg = '請檢查 .env 文件中的 XAI_API_KEY 配置';
      } else if (error.message.includes('xAI API')) {
        errorMsg = error.message;
        helpMsg = '請檢查 API Key 是否正確，或查看服務器日誌獲取詳細信息';
      } else {
        helpMsg = '請查看瀏覽器控制台和服務器日誌獲取詳細信息';
      }
      
      resultsContent.innerHTML = 
        '<div class="result-section">' +
        '<h3 style="color: var(--red-light);">錯誤</h3>' +
        '<p style="color: var(--ink-muted);">' + errorMsg + '</p>' +
        (helpMsg ? '<p style="color: var(--ink-muted); font-size: 0.85rem; margin-top: 0.5rem;">' + helpMsg + '</p>' : '') +
        '</div>';
    } finally {
      form.classList.remove('loading');
    }
  });

  form.addEventListener('reset', function () {
    resultsPanel.classList.add('hidden');
    resultsContent.innerHTML = '';
  });
})();
