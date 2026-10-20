# University discovery and ethical promotion

## Delivered experience

- All three student-intent entries are visible without expanding a disclosure, including on mobile. They remain above university discovery.
- A distinct **Trường nổi bật** section follows the student entry/benefit area. Editorial profiles currently feature FPT, UIT and TDTU, with existing logos, campus/learning-space images, real program examples and profile/source links. Selection is not a ranking or claimed partnership.
- Existing eight-slide campus showcase, three admissions highlights, university logos and school lookup remain. No promotion section was removed to simplify the homepage.
- The discovery section also presents sourced scholarship/admissions references and an official consultation contact channel. Old admissions and scholarship material explicitly says it is reference material, not confirmed open enrollment.
- Major search has a separate contextual discovery area. Its explanation states that association is by program name in the 2026 catalog, not an objective personal matching score. Region selection is respected.
- School profiles gain a “Học bổng & kết nối” tab backed by the same opportunity components. Missing verified opportunities have an honest empty state and retain the official school link.
- Paid placements, when configured and verified, render in separate home/context/profile slots, carry an unavoidable **Được tài trợ** label and `rel="sponsored"` on external promotional links.

## Commercial data is intentionally empty

No verified commercial agreement was supplied. `universityPartners` and `universityCampaigns` are therefore empty. The shipped website does not pretend that any featured school is a paying partner. The paid paths are exercised using synthetic fixtures in automated tests only.

`assets/data/university-promotions.js` is a public content adapter, not a partner database or proof of a legal agreement. A future partner management system can replace its reviewed exports. Approval and authorization must occur in that system; a browser cannot establish whether an agreement is genuine.

### Partner record contract

| Field | Meaning |
| --- | --- |
| `id`, `schoolId` | Stable non-personal identifiers tied to a real canonical university |
| `status` | Must be `verified`; draft/pending records never render |
| `verifiedAt`, `expiresAt` | Human approval and expiration; missing, future verification or expired approval is rejected |

Do not ship contracts, agreement references that reveal private documents, credentials or student records in this module.

### Campaign/opportunity contract

| Field | Requirement |
| --- | --- |
| `id`, `schoolId`, `partnerId` | Stable identifiers; paid content must match a verified partner's school |
| `funding` | Explicitly `editorial` or `sponsored`; unknown values are not silently treated as editorial |
| `kind` | `scholarship`, `admissions`, `event` or `consultation` |
| `status`, `verifiedAt`, `sourceUrl` | Verified content, dated review, HTTPS source on the school's official domain/subdomain |
| `availability` | `reference`, `contact` or `active`; paid content must be `active` |
| `startsAt`, `endsAt` | Mandatory active display window; this is not automatically an application deadline |
| `placements` | Allowlist: `home_featured`, `major_context`, `school_profile` |
| `programCodes` | Optional narrower program eligibility; contextual placement must match real program names/codes, not audience profiling |
| `eventAt` | Actual sourced future event time, with time zone; past/undated events are rejected |
| `consultationUrl`, `reviewExpiresAt` | Official contact channel and review expiry; expiry is an internal review due date, not a university deadline |

Paid content is capped at one home campaign and two contextual/profile campaigns per render. No automatic popups, invented urgency, lead forms or paid search reordering are added. No active event was fabricated just to fill an empty slot.

## Component boundaries

| Module | Responsibility |
| --- | --- |
| `university-promotions.js` (data) | Curated editorial IDs/images, verified opportunity metadata, future partner/campaign records |
| `university-promotion-rules.js` | Pure provenance, official URL, time window and contextual eligibility checks |
| `university-card.js` | Shared university identity, safe local logo rendering and reusable promotional/profile cards |
| `university-promotions.js` (UI) | Home, context, school opportunities, failure/retry, consent and outbound consultation dialog |
| `university-promotion-metrics.js` | Opt-in aggregate counters and optional future reporter adapter |
| `page2.js` | Organic filtering and ordering, unchanged in how results are chosen; shared identity component and separate promotional host |

Promotion selection never sorts or mutates the organic school list. The UI/feed is dynamically loaded with an independent failure boundary: a failed promotional module does not stop organic lookup. Holland, raw admission rules and score rules do not import promotional data or depend on partner status. Existing calculated score logic is not changed.

## Privacy and future reporting

Counting is disabled by default. The optional checkbox enables only in-memory, non-identifying counters for the current page. Reloading clears consent; unchecking deletes counters and stops observation. Global Privacy Control / Do Not Track disables the checkbox and counting. No new cookies, storage keys, analytics requests or external tracking SDKs are installed.

An impression means at least 50% of a promotional card is in the visible viewport for one second while the document is visible. It is counted once per content/placement on the page after consent. Organic result cards are not measured by this module.

The current event contract contains only:

```json
{
  "schemaVersion": 1,
  "schoolId": "canonical-school-id",
  "contentId": "reviewed-content-id",
  "placement": "home_featured",
  "action": "impression",
  "day": "YYYY-MM-DD"
}
```

Allowed browser actions are `impression`, `click` and `consultation_interest`. No names, contact details, query text, page URLs, school-student matching scores, Holland codes, IP addresses or persistent identifiers are added to events. `snapshot()` adds aggregate `count`; there is no built-in transport. Invalid metadata fields are dropped rather than copied into events. Reporter failures cannot block navigation.

`createPromotionMetrics({ reporter })` is an adapter seam, not a live reporting service. Before connecting a remote reporter, update the notice and consent UX to identify actual recipients/purposes, implement withdrawal and retention, and assess the applicable privacy requirements. The shipped UI correctly says counters have not been transmitted to schools/partners; do not keep that wording after enabling transmission.

### Voluntary consultations and registrations

The current feature opens a verified official school channel only after an unchecked acknowledgment is actively selected. It does not collect contact fields, prefill forms or submit a registration. External links use `noopener noreferrer` and `no-referrer`. A user who independently provides information on a school website must review that website's policy.

An outbound click or `consultation_interest` is **not** a completed registration and must never be reported as one. Confirmed voluntary consultation registrations require a future server-side flow: specific consent for the named recipient/purpose, minimal contact handling, an auditable consent receipt, retention/withdrawal rules and a verified completion callback. Only that authorized service should produce a separate `consultation_registration_confirmed` report; the browser counter intentionally rejects arbitrary registration events. No registration totals are invented in this release.

## Sources and assets

- [FPT scholarship notice](https://daihoc.fpt.edu.vn/thong-bao-tuyen-sinh/huong-dan-nop-ho-so-dang-ky-chuong-trinh-tim-kiem-nhan-tai-ky-nguyen-so-viet-nam-2026/), [UEH 2026 notice](https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-khoa-52-nam-2026/), and [FPT contact channel](https://daihoc.fpt.edu.vn/lien-he/) were opened and checked on 20 October 2026. No still-open scholarship deadline or student outcome is inferred from them.
- UIT and TDTU campus photos reuse the already documented official assets in `assets/images/hero/SOURCES.md`. FPT reuses the existing learning-space photo without asserting a new campus location. Original carousel assets are preserved; this change does not certify every legacy image's provenance.
- Programs, identities and logos come from the existing reviewed catalog. Editorial examples do not certify complete program coverage or institutional endorsement.

## Verification

- `npm test`: 55 passing tests, including seven promotion/consent/source/isolation test groups.
- `npm run validate`: 20 HTML pages, 386 local references, 68 JavaScript/inline-script syntax checks.
- `npm run test:e2e`: 15 browser scenario groups, including 36 viewport checks across 320/360/390/768/1366/1920px.
- New browser coverage: always-visible student intents, preserved showcases/news, editorial labels, consent off/on/erase, viewable impressions, consultation acknowledgment/no contact fields, school-profile opportunities and keyboard tabs, simulated sponsored label/link attributes, unchanged organic IDs/order, irrelevant-major exclusion, 503 retry, organic search during promotional-feed failure and Global Privacy Control.
- Test campaigns/partners are synthetic fixtures only. No actual partner management, CRM, remote analytics or university registration is configured or tested as live functionality.
- Screenshots and browser report: `.cache/ux-e2e/`. The fixture screenshot is explicitly named `university-context-sponsored-fixture-1366.png`; it is not a production advertisement.
