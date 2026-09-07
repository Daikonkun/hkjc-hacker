const { buildPrediction } = require('../lib/methodology');

// AI is an optional interpreter. It cannot choose numbers, scores or charts.
async function interpret(result) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('unavailable');
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method:'POST', signal:AbortSignal.timeout(20000),
    headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${process.env.OPENROUTER_API_KEY}`, 'HTTP-Referer':'https://mark-six-hacker.com', 'X-Title':'HKJC Methodology v2' },
    body:JSON.stringify({ model:process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v3.2', temperature:0, max_tokens:600, response_format:{type:'json_object'}, messages:[
      {role:'system',content:'以繁體中文解釋提供的娛樂性規則。只返回 JSON {"reading":"不超過200字"}。不得另排八字、提供新號碼、聲稱提高勝率、預言中獎或編造喜用神與真太陽時校正。必須說明扶抑僅是簡化代理且沒有歷史驗證。'},
      {role:'user',content:JSON.stringify({chart:result.bazi_chart,methodology:result.methodology,groups:result.bet_groups.map(g=>({numbers:g.numbers,components:g.components}))})}
    ] })
  });
  if (!response.ok) throw new Error('provider_unavailable');
  const data = await response.json();
  const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
  if (typeof parsed.reading !== 'string' || !parsed.reading.trim() || parsed.reading.length > 2000) throw new Error('invalid_reading');
  return parsed.reading;
}

module.exports = async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({error:'Method Not Allowed'}); }
  let result;
  try {
    const body = req.body || {};
    const nowHK = new Date(Date.now()+8*60*60*1000).toISOString().slice(0,19).replace('T',' ');
    result = buildPrediction({...body,current_time:body.current_time || nowHK});
  } catch (error) { return res.status(400).json({error:error.message}); }
  try {
    result.ai_reading = await interpret(result);
    result.interpretation_status = 'available';
  } catch {
    result.interpretation_status = 'unavailable';
    result.warnings.push('AI 解讀暫不可用；以下號碼與計分已由規則引擎完整計算，不受影響。');
  }
  console.info(JSON.stringify({event:'prediction_completed',methodology:result.methodology.version,interpretation:result.interpretation_status,groups:result.bet_groups.length}));
  return res.status(200).json(result);
};
