# Visual-regression harness

Catches any pixel change across every page × breakpoint. Used to safely refactor
`global.css` (flattening the version-layer redeclarations) without introducing
visual regressions that a build/grep check can't see.

## Coverage
- 12 routes (every page; `/team` redirects to `/leadership`)
- 3 viewports: mobile 390×844, tablet 820×1180, desktop 1440×900
- full-page screenshots → 36 snapshots

## Workflow
```bash
npm run build        # build the CURRENT known-good site
npm run vr:approve   # capture/refresh reference baselines
# ...make a CSS change...
npm run build        # rebuild
npm run vr           # diff against baselines (fails on any visual change)
npm run vr:report    # open side-by-side + diff overlay for failures
```

If a diff is **intended**, re-run `npm run vr:approve` to bless the new look.

## Notes
- `reducedMotion: reduce` + a hard freeze make marquees/counters/canvas
  deterministic (the site already gates motion on this).
- Baselines live in `__screenshots__/` (the reference — keep them).
- `.report/` and `.results/` are transient output.
- Server is started automatically via `npm run preview` on :4321.
