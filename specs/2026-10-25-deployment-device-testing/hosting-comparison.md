# Hosting comparison — GitHub Pages vs Cloudflare (Workers static assets)

Measured on 2026-10-25 after the Phase 3 merge (commit `10686fc`). Both sites serve the same build. Numbers come from one machine (Windows 10, Europe, `curl`), so treat them as rough.

| Aspect                      | GitHub Pages                                                                                                | Cloudflare (Workers static assets)                                                                                                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| URL                         | https://sergshtelmakh.github.io/piano-tutor/                                                                | https://piano-tutor.sh-serg1993.workers.dev/                                                                                                                                                                        |
| Setup                       | One setting (Pages source = GitHub Actions) plus a CI job in the repo. No external account.                 | Cloudflare account, Git connection, build and deploy commands in the dashboard, plus `wrangler.jsonc` in the repo.                                                                                                  |
| Deploy trigger              | CI job after `verify` on pushes to `main` only                                                              | Cloudflare's own build on every push to any branch                                                                                                                                                                  |
| Time from push to live      | Whole CI run (`verify` + deploy) took **43 s** (10:42:51 → 10:43:34, run for `10686fc`)                     | Not measured: read the build duration in the Cloudflare dashboard and add it here                                                                                                                                   |
| Preview per branch / PR     | No (not on the free plan)                                                                                   | Yes. `feature-deployment-device-testing-piano-tutor.sh-serg1993.workers.dev` was used for all device checks in Phase 3                                                                                              |
| Response time (5 requests)  | 129–161 ms to first byte, 420 B page, served from a Fastly cache in Frankfurt, `Cache-Control: max-age=600` | 137–208 ms to first byte, 396 B page, `CF-Cache-Status: HIT`, `Cache-Control: max-age=0, must-revalidate`, HTTP/3 offered                                                                                           |
| Base path                   | Needs a sub-path (`/piano-tutor/`), so a separate build with `BASE_PATH`                                    | Root (`/`)                                                                                                                                                                                                          |
| Problems met during Phase 3 | None                                                                                                        | Dashboard created a Workers project (not Pages), so `CF_PAGES*` variables were missing; beta `wrangler preview` failed first with a missing `previews` block, then with API error 10013, fixed by `versions upload` |
| Analytics                   | None enabled                                                                                                | None enabled (Logpush / Tail Workers are unavailable for asset-only Workers)                                                                                                                                        |
| Free-tier limits            | Public repo required; 1 GB site size, 100 GB/month soft bandwidth limit                                     | Generous static-asset limits; build minutes are limited on the free plan                                                                                                                                            |

The free-tier limits above come from the providers' public documentation as I know it, and I did not re-check them for this table. Check them before relying on them.

## Observations

- Speed is a tie for this app: both answer in about 150 ms and the bundle is 76 KB gzipped.
- The decisive difference is **previews**. Phase 3 needed a working HTTPS URL for every branch to test MIDI on a phone before merge. GitHub Pages cannot do that.
- GitHub Pages is the simpler, more stable pipeline: everything lives in the repo and nothing broke. Cloudflare took four extra changes to get working.
- Cloudflare's build and deploy commands live in the dashboard, not the repo, so the setup can't be recreated from the repo alone. The README documents the settings.

## Decision

**Keep both (2026-10-25).** GitHub Pages is the stable production site: everything lives in the repo and nothing broke. Cloudflare stays for its per-branch previews, which Phase 3 needed to test MIDI on a phone before merge. If one has to go later, drop GitHub Pages only if previews matter more than a repo-only pipeline; drop Cloudflare if its dashboard setup becomes a maintenance burden.
