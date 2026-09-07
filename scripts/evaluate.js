// Offline, fixed-rule chronological holdout evaluator. No network or AI calls.
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const { buildPrediction, parseTime, VERSION } = require('../lib/methodology');
const mean = xs => xs.reduce((s,x)=>s+x,0)/xs.length;
function randomGroups(seed) {
  const groups = [], seen = new Set();
  for (let i=0; groups.length<5; i++) {
    const numbers = Array.from({length:49},(_,j)=>j+1).sort((a,b)=>{
      const key = n => createHash('sha256').update(seed+':'+i+':'+n).digest('hex');
      return key(a).localeCompare(key(b));
    }).slice(0,6).sort((a,b)=>a-b);
    if (!seen.has(numbers.join(','))) { groups.push({numbers}); seen.add(numbers.join(',')); }
  }
  return groups;
}
function measure(groups, actual) {
  const hits = groups.map(g=>g.numbers.filter(n=>actual.includes(n)).length);
  return {matches:mean(hits),three_plus:mean(hits.map(n=>Number(n>=3))),coverage:new Set(groups.flatMap(g=>g.numbers)).size};
}
function evaluate(data) {
  if (!data || typeof data.source_url !== 'string' || !/^https:\/\//.test(data.source_url)) throw new Error('A verifiable HTTPS source_url is required; its accuracy must be checked separately.');
  if (!Array.isArray(data.profiles) || !data.profiles.length || data.profiles.length>20) throw new Error('Supply 1–20 predeclared profiles');
  const cutoff = parseTime(data.holdout_start).text;
  if (!Array.isArray(data.draws)) throw new Error('draws array required');
  const seen = new Set();
  const draws = data.draws.map(d=>{
    const time = parseTime(d.draw_datetime).text;
    if (seen.has(time)) throw new Error('Duplicate draw time');
    seen.add(time);
    if (!Array.isArray(d.numbers) || d.numbers.length!==6 || new Set(d.numbers).size!==6 || d.numbers.some(n=>!Number.isInteger(n)||n<1||n>49)) throw new Error('Invalid six main draw numbers');
    return {...d,draw_datetime:time};
  }).filter(d=>d.draw_datetime>=cutoff).sort((a,b)=>a.draw_datetime.localeCompare(b.draw_datetime));
  if (draws.length<2) throw new Error('At least two holdout draws required');
  const perDraw = {bazi:[],bazi_meihua:[],full:[],random:[]};
  for (const draw of draws) {
    for (const variant of ['bazi','bazi_meihua','full']) {
      const measurements = data.profiles.map(p=>measure(buildPrediction({...p,draw_datetime:draw.draw_datetime,initial_numbers:[]},{variant}).bet_groups,draw.numbers));
      perDraw[variant].push(Object.fromEntries(['matches','three_plus','coverage'].map(k=>[k,mean(measurements.map(m=>m[k]))])));
    }
    // 100 repeatable equal-budget portfolios; never seed with outcomes.
    const control = Array.from({length:100},(_,i)=>measure(randomGroups('control:'+draw.draw_datetime+':'+i),draw.numbers));
    perDraw.random.push(Object.fromEntries(['matches','three_plus','coverage'].map(k=>[k,mean(control.map(m=>m[k]))])));
  }
  const summary = Object.fromEntries(Object.entries(perDraw).map(([variant,rows])=>{
    const matches=mean(rows.map(r=>r.matches));
    const sd=Math.sqrt(rows.reduce((s,r)=>s+(r.matches-matches)**2,0)/(rows.length-1));
    return [variant,{average_main_matches:matches,ticket_three_plus_rate:mean(rows.map(r=>r.three_plus)),average_coverage:mean(rows.map(r=>r.coverage)),approximate_95pct_mean_interval:[Math.max(0,matches-1.96*sd/Math.sqrt(rows.length)),Math.min(6,matches+1.96*sd/Math.sqrt(rows.length))]}];
  }));
  return {version:VERSION,source_url:data.source_url,dataset_sha256:createHash('sha256').update(JSON.stringify(data)).digest('hex'),holdout_start:cutoff,draw_count:draws.length,profiles:data.profiles.length,tickets_per_profile:5,uniform_expected_matches:36/49,summary,limitations:['Retrospective fixed-rule evaluation, not proof of a prospective advantage.','Source authenticity is not automatically verified. Freeze profiles, rules and cutoff before examining outcomes.','Intervals use draw-level averages and a normal approximation; unreliable for small samples.','No weight fitting, multiple-testing adjustment, special-number or return-on-stake analysis. Do not claim an edge from exploratory results.']};
}
if (require.main===module) {
  if (!process.argv[2]) { console.error('Usage: npm run evaluate -- /absolute/path/verified-draws.json'); process.exitCode=1; }
  else { try { console.log(JSON.stringify(evaluate(JSON.parse(fs.readFileSync(process.argv[2],'utf8'))),null,2)); } catch(e) { console.error(e.message); process.exitCode=1; } }
}
module.exports = {evaluate,measure,randomGroups};
