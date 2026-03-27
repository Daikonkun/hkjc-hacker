const fs = require('fs');
const path = require('path');
const {
  computeHexagram,
  getDivinationScore,
  calculateElementalResonance,
  getNumberMeta,
} = require('../lib/hexagram.js');
const { computeQiMen, getSpatialWeight } = require('../lib/qimen.js');
const { applyYinYangBalance } = require('../lib/yinyang.js');
const { computeNaYinContext, getGroupNaYinFactor } = require('../lib/nayin.js');

let promptConfigCache = null;

function getPromptConfig() {
  if (promptConfigCache) return promptConfigCache;
  const promptPath = path.join(__dirname, '..', 'hkjc-hacking-prompt.txt');
  const raw = fs.readFileSync(promptPath, 'utf-8');
  promptConfigCache = JSON.parse(raw);
  return promptConfigCache;
}

function buildSystemPrompt() {
  const promptConfig = getPromptConfig();
  const sys = promptConfig.system_instructions;
  let prompt = `${sys.role}\n\n${sys.task_goal}\n\n`;

  prompt += '請按照以下步驟進行分析：\n';
  sys.logic_steps.forEach((step, idx) => {
    prompt += `${idx + 1}. ${step.name}: ${step.description}\n`;
  });

  prompt += '\n輸出格式要求（必須返回有效的 JSON）：\n';
  prompt += JSON.stringify(
    {
      solar_time_note: '真太陽時修正說明（文字）',
      bazi_analysis: '八字喜用神深度分析（文字）',
      initial_review: '初選號能量點評（文字，包含評分 0-100）',
      core_numbers: [1, 2, 3],
      bet_groups: [
        {
          numbers: [1, 2, 3, 4, 5, 6],
          desc: '五行解析說明',
          energy_score: 85,
        },
      ],
      strategy: {
        fortune: '大吉/小吉/平穩/宜守',
        period: '黃金下注時段：須寫明「開獎日日期 + 時辰與鐘點」，且時段必須在開獎時刻之前（例：2026-02-05 酉時至戌時 17:00–21:00，早於開獎 21:30）',
        direction: '財神方位（如：正西、西北）',
      },
    },
    null,
    2
  );
  prompt += '\nbet_groups 必須恰好包含 5 組（五組推薦注號），每組 6 個號碼，每組必須包含 energy_score（0-100 的整數），表示該組號碼與用戶命局及流時的能量契合度。';
  prompt += '\n若用戶提供了開獎時刻，可結合梅花易數體卦五行（乾兌金、離火、震巽木、坎水、艮坤土），對與體卦相同或被體卦所克（財）的號碼給予更高評價。';
  prompt += '\n同時結合奇門遁甲時家排盤的「生門」落宮位置，對該宮位對應尾數的號碼進行空間能量加權。';
  prompt += '\n重要：當開獎時刻存在時，推薦組合必須明顯反映該日的時空能量（納音、體卦、生門、開獎日干支），不同開獎日應產出明顯不同的 core_numbers 與 bet_groups，避免僅以八字主導而忽略日期變化。';
  prompt += '\nstrategy.period（黃金下注時段）：必須寫明「哪一天」與「具體時辰/鐘點」。若用戶提供了開獎時刻，該時段必須是開獎日當天、且結束時間早於開獎時刻（不可推薦開獎後的時間）。若未提供開獎時刻，則以「當天」或「今日」加時辰表述。';

  return prompt;
}

function buildUserPrompt(data) {
  const { birth_time, birth_location, current_time, initial_numbers, draw_datetime, draw_summary } = data;

  let prompt = `請根據以下信息進行分析：\n\n`;
  prompt += `出生時間：${birth_time}\n`;
  prompt += `出生地點：${birth_location}\n`;
  prompt += `當前時間：${current_time}\n`;

  if (initial_numbers && initial_numbers.length > 0 && initial_numbers[0] > 0) {
    prompt += `初選號碼：${initial_numbers.join(', ')}\n`;
  } else {
    prompt += `初選號碼：未提供\n`;
  }

  if (draw_datetime) {
    prompt += `\n開獎時刻：${draw_datetime}`;
    if (draw_summary) {
      prompt += `\n開獎日情境（請據此讓推薦明顯反映當日時空，與八字並重）：${draw_summary}`;
    }
    prompt += `\n請讓 core_numbers 與五組 bet_groups 明顯隨此開獎日變化，勿僅依八字產出雷同組合。`;
    prompt += `\n黃金下注時段（strategy.period）須寫明開獎日日期與具體時刻（例如「${String(draw_datetime).slice(0, 10)} 酉時至戌時 17:00–21:00」），且必須早於開獎時刻 ${draw_datetime}，不得推薦開獎之後的時段。`;
  }
  prompt += `\n請按照系統提示的步驟進行完整分析，並返回符合格式要求的 JSON。`;

  return prompt;
}

async function callOpenRouter(userPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    throw new Error('OPENROUTER_API_KEY 未配置，請在 Vercel 環境變量中設置');
  }

  const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v3.2';
  const systemPrompt = buildSystemPrompt();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://hkjc-hacker.vercel.app',
      'X-Title': 'HKJC Bazi Predictor',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMsg = `OpenRouter API 錯誤 (${response.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.error && errorJson.error.message) {
        errorMsg += ': ' + errorJson.error.message;
      } else {
        errorMsg += ': ' + errorText.substring(0, 200);
      }
    } catch {
      errorMsg += ': ' + errorText.substring(0, 200);
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('OpenRouter API 返回格式異常');
  }
  return data.choices[0].message.content;
}

function parseAIResponse(content) {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }
  try {
    return JSON.parse(content);
  } catch {
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(content.substring(start, end + 1));
    }
    throw new Error('無法解析 AI 返回的 JSON');
  }
}

function normalizeNumbers(arr = [], fallbackCore = []) {
  const nums = Array.isArray(arr)
    ? arr
        .map((n) => parseInt(n, 10))
        .filter((n) => n >= 1 && n <= 49)
        .slice(0, 6)
    : [];
  while (nums.length < 6 && fallbackCore.length > 0) {
    const core = fallbackCore[nums.length % fallbackCore.length];
    if (!nums.includes(core)) {
      nums.push(core);
    } else {
      nums.push(((core + 1) % 49) || 1);
    }
  }
  return nums.sort((a, b) => a - b);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { birth_time, birth_location, current_time, initial_numbers, draw_datetime } = req.body || {};

    if (!birth_time || !birth_location) {
      return res
        .status(400)
        .json({ error: '缺少必要參數：birth_time 和 birth_location 為必填' });
    }

    const numbers = Array.isArray(initial_numbers)
      ? initial_numbers.filter((n) => n > 0 && n <= 49).slice(0, 6)
      : [];

    let hexagram = null;
    let qimen = null;
    let nayin = null;
    if (draw_datetime) {
      hexagram = computeHexagram(draw_datetime);
      if (hexagram.error) hexagram = null;
      qimen = computeQiMen(draw_datetime);
      if (qimen.error) qimen = null;
      nayin = computeNaYinContext(draw_datetime);
      if (nayin.error) nayin = null;
    }

    const drawSummary =
      draw_datetime && [nayin, hexagram, qimen].some(Boolean)
        ? [
            nayin && nayin.day_nayin_element ? '納音' + nayin.day_nayin_element : null,
            hexagram && hexagram.ti_gua ? '體卦' + hexagram.ti_gua.name + hexagram.ti_gua.wuxing : null,
            qimen && qimen.sheng_men ? '生門落' + qimen.sheng_men.palace_name : null,
          ]
            .filter(Boolean)
            .join('、')
        : undefined;

    const userPrompt = buildUserPrompt({
      birth_time,
      birth_location,
      current_time: current_time || new Date().toISOString().slice(0, 16).replace('T', ' '),
      initial_numbers: numbers,
      draw_datetime: draw_datetime || undefined,
      draw_summary: drawSummary,
    });

    const aiResponse = await callOpenRouter(userPrompt);
    const result = parseAIResponse(aiResponse);

    if (nayin) result.nayin = nayin;
    if (hexagram) result.hexagram = hexagram;
    if (qimen) {
      var qmDisplay = Object.assign({}, qimen);
      delete qmDisplay.spatial_energy_map;
      result.qimen = qmDisplay;
    }

    if (!result.core_numbers || !Array.isArray(result.core_numbers)) {
      result.core_numbers = result.core_numbers || [13, 18, 24];
    }
    result.core_numbers = result.core_numbers.slice(0, 3).map((n) => {
      const num = parseInt(n, 10);
      return num >= 1 && num <= 49 ? num : ((num % 49) + 49) % 49 || 49;
    });

    if (!result.bet_groups || !Array.isArray(result.bet_groups)) {
      result.bet_groups = [];
    }
    const coreSet = new Set(result.core_numbers);
    const tiWuxing = hexagram && hexagram.ti_gua ? hexagram.ti_gua.wuxing : null;
    const dayElement = hexagram && hexagram.day_element ? hexagram.day_element : null;
    const userElement = result.user_element || null;

    while (result.bet_groups.length < 5) {
      var padNums = result.core_numbers.slice();
      var used = new Set(padNums);
      while (padNums.length < 6) {
        var candidate = Math.floor(Math.random() * 49) + 1;
        if (!used.has(candidate)) { padNums.push(candidate); used.add(candidate); }
      }
      result.bet_groups.push({ numbers: padNums.sort((a, b) => a - b), desc: '系統自動補足組合。', energy_score: 60 });
    }

    const hasDrawContext = !!(nayin?.day_nayin_element || tiWuxing || dayElement || (qimen?.spatial_energy_map?.length > 0));

    result.bet_groups = result.bet_groups.slice(0, 5).map((group) => {
      const nums = normalizeNumbers(group.numbers, result.core_numbers);
      let baseScore = typeof group.energy_score === 'number' && group.energy_score >= 0 && group.energy_score <= 100
        ? Math.round(group.energy_score)
        : null;
      if (baseScore === null) {
        const overlap = nums.filter((n) => coreSet.has(n)).length;
        baseScore = Math.min(100, 55 + overlap * 15);
      }

      let drawFactor = 1;
      if (nayin && nayin.day_nayin_element && nums.length > 0) {
        drawFactor *= getGroupNaYinFactor(nums, nayin.day_nayin_element);
      }
      if (tiWuxing && nums.length > 0) {
        drawFactor *= nums.reduce((s, n) => s * getDivinationScore(n, tiWuxing), 1);
      }
      if (dayElement && nums.length > 0) {
        drawFactor *= nums.reduce(
          (s, n) => s * calculateElementalResonance(userElement, dayElement, n),
          1
        );
      }
      if (qimen && qimen.spatial_energy_map && nums.length > 0) {
        drawFactor *= nums.reduce(
          (s, n) => s * getSpatialWeight(qimen.spatial_energy_map, n),
          1
        );
      }

      const drawAdjustedScore = Math.min(100, Math.round(baseScore * drawFactor));
      const energyScore = hasDrawContext
        ? Math.min(100, Math.round(0.45 * baseScore + 0.55 * drawAdjustedScore))
        : drawAdjustedScore;

      const numberMeta = nums.map((n) => getNumberMeta(n, dayElement, userElement));

      return {
        numbers: nums,
        desc: group.desc || '',
        energy_score: energyScore,
        number_meta: numberMeta,
      };
    });

    const drawDate = draw_datetime ? String(draw_datetime).trim().slice(0, 10) : undefined;
    var yyResult = applyYinYangBalance(result.bet_groups, { drawDate });
    result.bet_groups = yyResult.groups;
    result.yinyang_summary = yyResult.summary;
    result.yinyang_analysis = yyResult.analysis;

    res.status(200).json(result);
  } catch (error) {
    console.error('Vercel predict error:', error);
    res.status(500).json({
      error: '服務器錯誤',
      message: error.message,
    });
  }
}
