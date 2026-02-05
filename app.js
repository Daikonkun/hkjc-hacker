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
  const initialNumbersContainer = document.getElementById('initial-numbers');

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
  [birthHourInput, currentHourInput].forEach(function (el) {
    if (el) clampNumberInput(el, 0, 23);
  });
  [birthMinuteInput, currentMinuteInput].forEach(function (el) {
    if (el) clampNumberInput(el, 0, 59);
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

    return {
      birth_time: birthDateTime,
      birth_location: birthLocation,
      current_time: currentDateTime || 'Now',
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

  function renderResults(data, result) {
    const s = result;
    let html = '';

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
      html += '<div class="bet-group-title">第 ' + (i + 1) + ' 組</div>';
      html += '<div class="bet-numbers">';
      (g.numbers || []).forEach(function (num) {
        html += '<span class="bet-num">' + num + '</span>';
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
