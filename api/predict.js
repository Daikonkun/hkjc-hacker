const fs = require('fs');
const path = require('path');
const { computeHexagram, getDivinationScore } = require('../lib/hexagram.js');

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
        period: '黃金下注時段（如：酉時至亥時 17:00-23:00）',
        direction: '財神方位（如：正西、西北）',
      },
    },
    null,
    2
  );
  prompt += '\n每組 bet_groups 必須包含 energy_score（0-100 的整數），表示該組號碼與用戶命局及流時的能量契合度。';
  prompt += '\n若用戶提供了開獎時刻，可結合梅花易數體卦五行（乾兌金、離火、震巽木、坎水、艮坤土），對與體卦相同或被體卦所克（財）的號碼給予更高評價。';

  return prompt;
}

function buildUserPrompt(data) {
  const { birth_time, birth_location, current_time, initial_numbers } = data;

  let prompt = `請根據以下信息進行分析：\n\n`;
  prompt += `出生時間：${birth_time}\n`;
  prompt += `出生地點：${birth_location}\n`;
  prompt += `當前時間：${current_time}\n`;

  if (initial_numbers && initial_numbers.length > 0 && initial_numbers[0] > 0) {
    prompt += `初選號碼：${initial_numbers.join(', ')}\n`;
  } else {
    prompt += `初選號碼：未提供\n`;
  }

  if (data.draw_datetime) {
    prompt += `\n開獎時刻（梅花易數起卦用）：${data.draw_datetime}`;
  }
  prompt += `\n請按照系統提示的步驟進行完整分析，並返回符合格式要求的 JSON。`;

  return prompt;
}

async function callXAI(userPrompt) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey || apiKey === 'your_xai_api_key_here') {
    throw new Error('XAI_API_KEY 未配置，請在 Vercel 環境變量中設置');
  }

  const model = process.env.XAI_MODEL || 'grok-beta';
  const systemPrompt = buildSystemPrompt();

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
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
    let errorMsg = `xAI API 錯誤 (${response.status})`;
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
    throw new Error('xAI API 返回格式異常');
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
    if (draw_datetime) {
      hexagram = computeHexagram(draw_datetime);
      if (hexagram.error) hexagram = null;
    }

    const userPrompt = buildUserPrompt({
      birth_time,
      birth_location,
      current_time: current_time || new Date().toISOString().slice(0, 16).replace('T', ' '),
      initial_numbers: numbers,
      draw_datetime: draw_datetime || undefined,
    });

    const aiResponse = await callXAI(userPrompt);
    const result = parseAIResponse(aiResponse);

    if (hexagram) result.hexagram = hexagram;

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
    result.bet_groups = result.bet_groups.slice(0, 5).map((group) => {
      const nums = normalizeNumbers(group.numbers, result.core_numbers);
      let energyScore = typeof group.energy_score === 'number' && group.energy_score >= 0 && group.energy_score <= 100
        ? Math.round(group.energy_score)
        : null;
      if (energyScore === null) {
        const overlap = nums.filter((n) => coreSet.has(n)).length;
        energyScore = Math.min(100, 55 + overlap * 15);
      }
      if (tiWuxing && nums.length > 0) {
        const divScore = nums.reduce((s, n) => s * getDivinationScore(n, tiWuxing), 1);
        energyScore = Math.min(100, Math.round(energyScore * divScore));
      }
      return { numbers: nums, desc: group.desc || '', energy_score: energyScore };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Vercel predict error:', error);
    res.status(500).json({
      error: '服務器錯誤',
      message: error.message,
    });
  }
}
