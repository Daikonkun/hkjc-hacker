# 八字六合彩 · 時空合盤

Production: https://mark-six-hacker.com · GitHub: https://github.com/Daikonkun/hkjc-hacker

## Methodology v2

Deterministic 八字扶抑代理 + 梅花 + 納音 scoring (60/30/10), one Hetu number mapping, five distinct portfolios, and optional OpenRouter interpretation. AI does not choose numbers, calculate charts or assign scores. Simulated history and the legacy simplified Qimen tool do not participate in prediction.

Read [METHODOLOGY.md](METHODOLOGY.md) for exact assumptions, calendar conventions and limitations. Birth times are used as entered local civil time, without inferred solar-time or daylight-saving correction. There is no demonstrated prediction advantage or historical accuracy claim.

## Development

```sh
npm ci
npm test
npm run lint
npm run dev
```

The static HTML/CSS/JS frontend calls Vercel Node functions under `api/`. `lib/methodology.js` owns predictions; `api/predict.js` optionally asks OpenRouter for a separate reading. If AI is unavailable, the full computed result remains available with a warning.

Keep `OPENROUTER_API_KEY` in the untracked local `.env`; optionally set `OPENROUTER_MODEL`. Never commit credentials or use public/frontend-prefixed key variables. Vercel runtime secrets must be configured separately; `.env` is excluded from uploads. Do not paste keys into logs, screenshots or issue reports.

## Evaluation

```sh
npm run evaluate -- /absolute/path/verified-draws.json
```

The offline evaluator compares fixed-rule ablations with equal-budget random portfolios. It needs verified main draw numbers and dates; no real dataset is bundled. Synthetic test fixtures verify software only, not predictive accuracy. See the methodology document for the input schema and interpretation limits.

The UI can export a reproducible JSON record. It contains birth information and should be kept private. A local export is not independent proof that a prediction preceded a draw.

## Release

Run tests and browser checks, then narrowly commit and push the release to GitHub. The linked Vercel Git integration deploys `main` to production. Confirm the deployment's commit and Ready status, `/api/health` methodology version, and a live form submission. Keep every production code deployment traceable to a GitHub commit.

ISC license. Entertainment only; compatibility scores are not winning probabilities.
