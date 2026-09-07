# Methodology v2.0.0

This is an entertainment ranking system, not a validated lottery predictor. No historical accuracy uplift has been established. Every valid six-number combination has the same jackpot probability under a fair draw.

## Runtime contract

`lib/methodology.js` computes all numbers, scores, metadata and explanations before optional AI interpretation. AI cannot replace these fields. Provider failures return the complete deterministic result with an explicit unavailable-reading warning. No fabricated draw history is imported. The legacy simplified Qimen calculator is excluded from scoring.

Birth: entered local civil clock, 1900–2100. No longitude, timezone, DST or apparent-solar-time correction is inferred from free text. Location is recorded by the UI but not used by the engine. Users requiring corrected solar time need a separately validated conversion; do not label current output true solar time. `lunar-javascript` EightChar sect 2: Li Chun year boundary, Jie month boundaries, midnight day change (late-Zi hour stem follows the library's convention). Context is the supplied draw time, otherwise the explicit/current Hong Kong analysis time. Calendar library behavior is regression-tested, not independently certified for every geographic/historical case.

## Fixed, untrained rules

- Single number mapping: tails 1/6 water, 2/7 fire, 3/8 wood, 4/9 metal, 5/0 earth (Hetu). Color and alternative tail mappings are not combined.
- Bazi **support proxy**, not a full 喜用神 determination: each visible stem has mass 1; each branch's hidden stems share mass 1, except month branch mass 2. Total mass 9. Day-master plus resource share >=55% is strong, <=40% weak, otherwise neutral. Weak favors resource/self (80 vs 40); strong favors other elements (80 vs 40); neutral scores every element 60. No 合化、從格、調候 claim.
- Meihua uses lunar year branch/month/day/hour arithmetic. Leap months use the unsigned ordinary month number. This lunar-year convention is distinct from Bazi's Li Chun boundary. Mutual and changed trigrams are displayed as context only, not extra scoring bonuses.
- Element relation scores: element generates reference 85; same 75; reference controls element 65; reference generates element 40; element controls reference 25. Meihua reference is 體卦; Nayin reference is the context day's Nayin element. These numeric values are design assumptions, not canonical textual quantities or fitted probabilities.
- Number score = 60% Bazi + 30% Meihua + 10% Nayin. No multiplication or clipping. Group score is the arithmetic mean of its final six number scores. Component means are independently rounded to 2 decimals, so weighted displayed means may differ by 0.01.
- Deterministic SHA-256 ties depend on normalized birth/context/version/variant, not input outcome data. Tied scores remain tied: hash order has no divinatory significance.
- Five distinct groups: greedy score minus 12 points per prior portfolio use. No parity exclusion or after-scoring substitutions. Core numbers are ranking leaders, not required in every group. Initial selections receive comparison scores but do not alter ranking.

## Reproducibility and privacy

The JSON download contains input birth data: keep it private. It includes full rules, all 49 ranked numbers, final groups and a reproducibility ID. IDs are not proof of publication before a draw. Exports are local; no server-side archive or trusted timestamp is claimed. Server logs contain only engine version, interpretation availability and group count.

## Offline historical evaluation

Run `npm run evaluate -- /absolute/path/verified-draws.json`. Supply a JSON object:

```json
{
  "source_url": "https://your-verified-source.example/draws",
  "holdout_start": "2026-01-01 00:00",
  "profiles": [{"birth_time":"1990-05-15 12:00","birth_location":"香港"}],
  "draws": [{"draw_datetime":"2026-01-01 21:30","numbers":[1,2,3,4,5,6]}]
}
```

The example is schema-only, not actual draw data. At least two holdout draws are required. Use verified HKJC main numbers and actual draw times; never include the special number among the six. Freeze profiles, rules and cutoff before examining results. The CLI validates shape/ranges/duplicates, sorts chronologically, excludes pre-cutoff draws and runs the same engine without LLM or future outcomes as inputs. It does not independently authenticate source URLs.

Compare Bazi-only, Bazi+Meihua, full model, and 100 seeded random five-ticket portfolios per draw. Report mean main-number matches (uniform expectation 36/49), ticket-level 3+ match rate, coverage and approximate draw-level mean intervals. Profiles are clustered within draw. These are retrospective fixed-rule ablations, not an adaptive trained walk-forward model. Small-sample intervals, exploratory multiple comparisons, rare prizes and lack of a trusted prospective prediction registry limit conclusions. No ROI or special-number result is inferred.

Tests use explicitly synthetic fixtures only. Real-history evaluation remains **not completed** until authenticated data is obtained and evaluated. Future statistical fitting must use a separate training period and untouched holdout, with adjustment for multiple comparisons. Do not tune these weights repeatedly against the reported holdout.

## References

- Calendar implementation: https://github.com/6tail/lunar-javascript
- Traditional Meihua text: https://zh.wikisource.org/wiki/梅花易數/卷一
- Civil vs apparent solar time: https://www.hko.gov.hk/en/gts/time/item_list.htm
