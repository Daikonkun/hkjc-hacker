const test = require('node:test');
const assert = require('node:assert/strict');
const {buildPrediction,parseTime,chartAt} = require('../lib/methodology');
const {computeHexagram,getNumberWuxing} = require('../lib/hexagram');
const input = {birth_time:'1990-05-15 12:00',birth_location:'香港',draw_datetime:'2026-09-08 21:30',initial_numbers:[]};

test('fixed input is fully reproducible and contains no simulated history or Qimen weights',()=>{
  const a=buildPrediction(input),b=buildPrediction(input);
  assert.deepEqual(a,b);
  assert.equal(a.methodology.version,'2.0.0');
  assert.equal(a.methodology.history_status,'disabled_no_verified_dataset');
  assert.equal(a.qimen,undefined);
  assert.deepEqual(a.bazi_chart.pillars,['庚午','辛巳','庚辰','壬午']);
  assert.equal(a.number_ranking.length,49);
});
test('final groups, metadata, scores and explanations agree over multiple dates',()=>{
  for(let day=1;day<=28;day++) {
    const r=buildPrediction({...input,draw_datetime:`2026-09-${String(day).padStart(2,'0')} 21:30`});
    assert.equal(new Set(r.bet_groups.map(g=>g.numbers.join(','))).size,5);
    for(const g of r.bet_groups) {
      assert.equal(new Set(g.numbers).size,6);
      assert.deepEqual(g.number_meta.map(n=>n.num),g.numbers);
      assert.ok(g.desc.includes(g.numbers.join('、')));
      assert.equal(g.energy_score,Number((g.number_meta.reduce((s,n)=>s+n.score,0)/6).toFixed(2)));
      assert.ok(g.energy_score>=0 && g.energy_score<=100);
      for(const n of g.number_meta) assert.equal(n.element,getNumberWuxing(n.num));
    }
  }
});
test('invalid dates, duplicate and fractional numbers fail instead of being padded',()=>{
  for(const value of ['2026-02-30 12:00','2026-13-01 12:00','2026-01-01 24:00','2026-01-01 12:61','2026-01-01 12:00junk']) assert.throws(()=>parseTime(value));
  for(const nums of [[1,1],[1.5],['1'],[50],[0]]) assert.throws(()=>buildPrediction({...input,initial_numbers:nums}));
  assert.throws(()=>buildPrediction({...input,birth_location:''}));
});
test('initial numbers are comparisons only; no influence on ranking',()=>{
  assert.deepEqual(buildPrediction(input).bet_groups,buildPrediction({...input,initial_numbers:[1,2,3,4,5,6]}).bet_groups);
});
test('sect 2 retains the day at 23:00 and changes at midnight',()=>{
  const at=t=>chartAt(parseTime(t)).pillars;
  assert.equal(at('2026-09-08 22:59')[2],at('2026-09-08 23:01')[2]);
  assert.notEqual(at('2026-09-08 23:59')[2],at('2026-09-09 00:00')[2]);
});
test('solar year and month change at the library Li Chun boundary',()=>{
  const {Solar}=require('lunar-javascript');
  const boundary=Solar.fromYmd(2026,2,4).getLunar().getJieQiTable()['立春'];
  const timestamp=Date.parse(boundary.toYmdHms().replace(' ','T')+'Z');
  const at=delta=>chartAt(parseTime(new Date(timestamp+delta).toISOString().slice(0,19))).pillars;
  assert.notEqual(at(-1000)[0],at(1000)[0]);
  assert.notEqual(at(-1000)[1],at(1000)[1]);
});
test('leap month uses a positive month and mutual/changed trigrams are valid',()=>{
  const h=computeHexagram('2025-08-01 21:30');
  assert.equal(h.lunar.month,6);
  for(const pair of [h.mutual_hexagram,h.changed_hexagram]) for(const g of [pair.upper,pair.lower]) assert.ok(g.num>=1 && g.num<=8);
});
test('analysis time explicitly replaces missing draw time',()=>{
  const r=buildPrediction({...input,draw_datetime:undefined,current_time:'2026-09-07 12:00'});
  assert.match(r.methodology.context_source,/分析/);
});
test('API returns deterministic results despite missing or malicious AI output',async()=>{
  const handler=require('../api/predict');
  const oldKey=process.env.OPENROUTER_API_KEY,oldFetch=global.fetch;
  const invoke=async body=>{let status,payload;const res={setHeader(){},status(s){status=s;return this;},json(p){payload=p;return p;}};await handler({method:'POST',body},res);return {status,payload};};
  try {
    delete process.env.OPENROUTER_API_KEY;
    const unavailable=await invoke(input);
    assert.equal(unavailable.status,200);
    assert.equal(unavailable.payload.interpretation_status,'unavailable');
    process.env.OPENROUTER_API_KEY='test-not-a-real-key';
    global.fetch=async()=>({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({reading:'僅供娛樂的代理規則，未經歷史驗證。',core_numbers:[99],bet_groups:[]})}}]})});
    const available=await invoke(input);
    assert.equal(available.payload.interpretation_status,'available');
    assert.deepEqual(available.payload.bet_groups,unavailable.payload.bet_groups);
    assert.deepEqual(available.payload.core_numbers,unavailable.payload.core_numbers);
    global.fetch=async()=>{throw new Error('private-provider-detail');};
    assert.equal((await invoke(input)).payload.interpretation_status,'unavailable');
    assert.equal((await invoke({...input,birth_time:'invalid'})).status,400);
  } finally {global.fetch=oldFetch;if(oldKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=oldKey;}
});
