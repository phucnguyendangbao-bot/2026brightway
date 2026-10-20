# BrightWay admissions regression audit — 20/10/2026

## Verified fixes

| Priority | Reproduced issue | Change |
| --- | --- | --- |
| P1 | Reset followed by reload restored the school/program from the URL | Reset clears those URL parameters; target changes synchronize the URL |
| P1 | A delayed school request overrode a newer reset/selection | A request may restore its original target only while the selection revision is unchanged |
| P1 | Edit focused a hidden Math/V-ACT input for another combination/exam | Focus the first visible input of the active method |
| P2 | Private-exam results displayed three score scales | Display only the selected exam summary |
| P1 | Catalog failure left the school counter showing loading | Settle the counter and busy state; retry the real catalog in place; keep filters disabled until data is ready |
| P2 | Calendar dynamically replaced the preparation label with a generic 2027 admissions label | Label 2026 as reference data and 2027 as preparation; preserve source-dependent status text |
| P2 | Mobile saved-school CTA wrapped vertically | Keep the CTA on one line, wrap header actions below the title and use two columns for coverage |

The first new regression run passed 4/10 groups and failed 6/10. After the fixes the final run passed 10/10. All four complete 42-question journeys passed both before and after the fixes.

## Results for this checkpoint

| Command | Result |
| --- | --- |
| `npm test` | PASS, 60/60 |
| `npm run validate` | PASS, 20 pages, 386 local links/assets, 68 syntax checks |
| `npm run test:e2e` | PASS, 16 groups; 36 responsive page checks |
| `npm run test:e2e:admissions` | PASS, 10 groups; 34 THPT/transcript combination cases; 3 private exams; 5 invalid input cases |
| `npm run build` | NOT CONFIGURED: exits 1, Missing script: build |
| `npm run lint` | NOT CONFIGURED: exits 1, Missing script: lint |

The new suite uses the actual repository catalogs. Failure tests return HTTP 503, remove the failure route, and retry the original file. They do not replace a successful response with invented admissions data. Existing legacy suites also contain isolated security/promotion fixtures, separate from production data.

Complete Holland → career → school → calculator → reload journeys ran at 360, 390, 768 and 1366 px, including real 42-question answers, saving a career/school, selecting a program, calculating 24.00, restoring values, and checking horizontal overflow. The region and major filters, empty search, school retry and career retry were tested. No page exceptions occurred in the passing new suite.

## Files

- `assets/js/score-calculator.js`: active-field focus, selected exam results, reset, URL synchronization and asynchronous restoration.
- `assets/js/page2.js`: catalog loading/error/retry lifecycle and filter availability.
- `assets/js/admissions-calendar.js`: year-specific label.
- `assets/css/page2.css`: mobile dialog CTA/header.
- `index.html`, `page2.html`, `score-calculator.html`, `calendar.html`: year context and asset versions.
- `scripts/qa-admissions-regression.cjs`, `scripts/qa-audit-production.cjs`, `package.json`: reproducible checks and production smoke assertions.

At this checkpoint no files under `assets/data/`, no formula modules, APIs, secrets or production configuration were changed. The later integrated-admissions request is a separate change.

## Screenshots and raw reports

Generated in `.cache/admissions-regression/`, outside tracked source; regenerate using `npm run test:e2e:admissions`.

| Width | Home | Holland | Career | School dialog | Calculator |
| --- | --- | --- | --- | --- | --- |
| 360 | [image](../.cache/admissions-regression/home-360.png) | [image](../.cache/admissions-regression/holland-360.png) | [image](../.cache/admissions-regression/career-360.png) | [image](../.cache/admissions-regression/school-360.png) | [image](../.cache/admissions-regression/score-360.png) |
| 390 | [image](../.cache/admissions-regression/home-390.png) | [image](../.cache/admissions-regression/holland-390.png) | [image](../.cache/admissions-regression/career-390.png) | [image](../.cache/admissions-regression/school-390.png) | [image](../.cache/admissions-regression/score-390.png) |
| 768 | [image](../.cache/admissions-regression/home-768.png) | [image](../.cache/admissions-regression/holland-768.png) | [image](../.cache/admissions-regression/career-768.png) | [image](../.cache/admissions-regression/school-768.png) | [image](../.cache/admissions-regression/score-768.png) |
| 1366 | [image](../.cache/admissions-regression/home-1366.png) | [image](../.cache/admissions-regression/holland-1366.png) | [image](../.cache/admissions-regression/career-1366.png) | [image](../.cache/admissions-regression/school-1366.png) | [image](../.cache/admissions-regression/score-1366.png) |

[Before](../.cache/admissions-regression/before-report.json) · [After](../.cache/admissions-regression/report.json) · [Legacy suite](../.cache/ux-e2e/report.json)

## Limits

The checks validate UI behavior and arithmetic against the retained formulas, not completeness of every university admission policy. Live successful Waybi responses and real account synchronization were not certified; legacy tests verify error fallback and isolated account behavior. Build/lint remain unconfigured. No numeric 8.5/10 rating is asserted.
