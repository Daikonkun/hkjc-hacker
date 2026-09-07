const test=require('node:test');
const assert=require('node:assert/strict');
const {evaluate,measure,randomGroups}=require('../scripts/evaluate');
test('evaluation metric controls and distinct random portfolios',()=>{
  assert.equal(measure([{numbers:[1,2,3,4,5,6]}],[1,2,3,4,5,6]).matches,6);
  const groups=randomGroups('test');
  assert.equal(new Set(groups.map(g=>g.numbers.join(','))).size,5);
  assert.ok(groups.every(g=>new Set(g.numbers).size===6));
});
test('synthetic fixtures exercise holdout evaluator, never evidence of accuracy',()=>{
  const data={source_url:'https://example.com/test-fixture-only',holdout_start:'2026-09-01 00:00',profiles:[{birth_time:'1990-05-15 12:00',birth_location:'香港'}],draws:[{draw_datetime:'2026-08-01 21:30',numbers:[1,2,3,4,5,6]},{draw_datetime:'2026-09-01 21:30',numbers:[1,2,3,4,5,6]},{draw_datetime:'2026-09-03 21:30',numbers:[7,8,9,10,11,12]}]};
  const result=evaluate(data);
  assert.equal(result.draw_count,2);
  assert.deepEqual(Object.keys(result.summary),['bazi','bazi_meihua','full','random']);
  assert.throws(()=>evaluate({...data,draws:[...data.draws,data.draws[0]]}),/Duplicate/);
});
