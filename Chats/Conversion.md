# Conversion

## Bruce's Ask

Can you please follow [the instructions](../types/EnhancementConversionInstructions.md) to bring this package up the state of the art tech stack.

Note that I installed the old dependencies so you can piece together how some of the existing logic worked.

If there's anything you get stuck on, aren't sure how to port over, no worries, just flag it below, and don't start unit testing yet.

Please add your implementation notes below, including gaps.

---

## Claude's Implementation Notes

### What was done (steps from `EnhancementConversionInstructions.md`)

| Step | Status | Notes |
|------|--------|-------|
| 1. Migrate types `ts-refs` → `types/` | ✅ | `ts-refs/be-intl/types.d.ts` recreated as a standalone `types/be-intl/types.d.ts`; `ts-refs/` removed (it was still a stray gitlink in the index with no `.gitmodules` entry — `git rm -r --cached ts-refs` + delete). |
| 2. Archive legacy | ✅ | `legacy/` already held the original **xtal-element/XE** generation (`be-intl.ts/.js`, `behivior.ts/.js`). The newer **be-enhanced/`BeValueAdded`** generation that was sitting in the repo root was moved in alongside it as `legacy/be-intl.be-enhanced.js`, `legacy/emc.be-enhanced.js`, `legacy/🌐.be-enhanced.js` so both prior generations are preserved. |
| 3. `package.json` deps + scripts | ✅ | Runtime deps now `assign-gingerly`, `be-hive`, `inferencer`, `mount-observer`, `roundabout-lib`. `nested-regex-groups` / `id-generation` deliberately omitted (no custom string-DSL parser needed — see below). `build` script added. `serve` switched to `spa-ssi`. Ran `npm run update` (everything already latest). **Deviation:** the instructions say "do not modify `devDependencies`", but `serve` now needs `spa-ssi`, so `ssi-server` (python) was replaced by `spa-ssi` in `devDependencies`. |
| 4. `imports.html` | ✅ | New import map (`be-intl/` → `/`, deps → `/node_modules/...`). |
| 5. `.kiro/steering/coding-standards.md` | ✅ | Verbatim from the instructions. |
| 6. Standalone types | ✅ | No more `import ... from '../trans-render/...'` / `../be-enhanced/...` / `../be-value-added/...`; no `IEnhancement` extends; no `BAP`. `enhancedElement` added to `AllProps`. `init` signature updated to the 4-param `(self, enhancedElement, ctx, initVals)` form. |
| 7. `emc.mjs` | ✅ | `withAttrs` replaces `base`/`branches`/`map`; static config → `customData`; `render()` + `console.log`. See "format assembly" below for the one real design departure from the legacy `map`. |
| 7a. Custom parser | ⏭️ N/A | `be-intl` takes a JSON object attribute (`be-intl='{...}'`) plus flat semantic sub-attributes. No DSL, so no `nested-regex-groups` parser. |
| 8. VS Code file nesting | ✅ | `.vscode/settings.json` (merged with the existing `extensions.json` sibling; that file untouched). |
| 8a. Auto-build hook | ✅ | `.kiro/hooks/auto-build-config.kiro.hook`, watching `emc.mjs` and `🌐.mjs`. |
| 9. Modern class | ✅ | Plain class, no base, constructor → `init` → `roundabout(...)`. Actions: `hydrate`, `onFormattingChange`, `formatNumber`, `formatDate`. `positractions`/`resolved`/`de` dispatch dropped (see gaps). |
| 10. Emoji shorthand `🌐.mjs` | ✅ | `...myJSON` spread at top level so `customData` carries over. Generates `🌐.json`. |
| 11. Tests / demo / playwright | ✅ | `tests/test1.html` + `demo/dev.html` now use `<be-hive><script type=emc src="be-intl/{emc,🌐}.json">`. `playwright.config.ts` → chromium only. `CI.yml` also updated: `actions/checkout@v4` **with `submodules: recursive`** (previously `@v2`, no submodules — would have failed to find `types/`), added a `npm run build` step, bumped Node to 22.x, dropped the now-unused Python setup, `playwright install ... chromium`. |

`npm run build` produces `emc.json` and `🌐.json` cleanly; both contain the full `customData` block. These two generated files are committed (they're in the `files` allowlist and CI/serve rely on them).

### Design departure worth reviewing: how `format` is assembled

Legacy `emc.js` mapped every semantic sub-attribute straight into a nested path, e.g. `be-intl-style` → `?.format?.style`, alongside `be-intl` → `format` (`instanceOf: Object`).

In the modern pipeline `parseWithAttrs` just does `result['?.format?.style'] = 'currency'` (it does **not** interpret the path), and `roundabout` then applies the whole `initVals` object through a **single** `assignGingerly(vm, initVals)` call. `assignGingerly` *does* interpret `?.`-prefixed keys — but key order matters, and `parseWithAttrs` emits the base (`format`) key **last**. So for the semantic / mixed form (`be-intl-style=currency` with or without a `be-intl='{...}'`) the plain `format` assignment would land *after* the nested ones and wipe them.

To avoid depending on assignment order, the semantic sub-attributes (`style`, `currency`, `weekday`, `year`, `month`, `day`) now map to **flat top-level props**, and `onFormattingChange` folds them into a *copy* of `self.format` (explicit JSON keys win, semantic keys fill gaps) before constructing the `Intl.*Format`. Net end-user behavior is intended to match the README examples. If you'd rather keep the nested-path mapping, that's the spot to revisit.

### Value reading: `be-value-added` → `inferencer`

Legacy `be-intl` `extends BeValueAdded`, which is itself a full enhancement (reads a `value` off `<data>/<time>/<output>/<meta>/<link>`, coerces it — `JSON.parse` for data, `new Date()` for time — mirrors it back to the DOM on change, sets `aria-live`, and optionally watches attribute/`textContent` mutations via `beVigilant`). The modern architecture has no enhancement inheritance, and no reference conversion pulls another `be-*` in as a library, so this was **not** reproduced by composition.

Instead the class:
- reads the value itself in a small `readValue()` helper — `new Date(el.dateTime)` for `<time>`, `Number(el.value)` (falling back to the raw string) otherwise;
- sets `enhancedElement.ariaLive = 'polite'` directly (the one `BeValueAdded.hydrate` side-effect that matters here);
- gets an `inferencer` `Infer` instance and uses `getPropagator()` to re-run formatting when the element's value/`dateTime` property changes (this is the modern replacement for the `beVigilant` MutationObserver).

### Reactive wiring (`emc.mjs` `customData.actions`)

- `initialized` flag pattern (from three-peat) is used: `init` sets `self.initialized = true` right after `await roundabout(...)`, and `hydrate` gates on `ifAllOf: ['enhancedElement','initialized'] / ifKeyIn: ['initialized']` so it runs exactly once, after every attribute has been read.
- `hydrate` resolves the locale (explicit `locale` → element `lang` → runtime default) and returns `{locale}`.
- `{locale}` triggers `onFormattingChange` → builds `intlNumberFormat` **or** `intlDateFormat` (branch on `localName === 'time'`, same as legacy) and seeds `value`.
- `value` changes drive `formatNumber` / `formatDate`, which write `textContent`.

### Gaps / things I did NOT port (flagging per your ask)

1. **`positractions` + `resolved` event + `de` (dispatchEvent)** — legacy inherited `[resolved, rejected]` positractions and a `de = dispatchEvent` from `BeValueAdded`, so a `be-value-added`-style `resolved`/value-change **event** was dispatched from the element. The new class sets a `resolved: true` prop but does **not** dispatch any DOM event. If downstream code (e.g. `be-propagating` consumers) listens for that event, this is a behavior change. `be-propagating` was a legacy dependency and is dropped entirely.
2. **Writing the value back to the DOM** — `BeValueAdded.onValChange` reflected the parsed value back to `data.textContent` / `time.textContent` / `meta.content` / `link.href`. `be-intl` only ever *writes* the formatted string into `textContent`, so I didn't reproduce the general write-back. Should be fine for the documented use (`<data>`, `<time>`, `<output>` display formatting) but it's a reduction in surface area.
3. **`<meta>` / `<link>` support** — `BeValueAdded` handled `content` / `href` (incl. `https://schema.org/True|False`). Legacy `behivior.js` only registered `data,time,output`, so this was already effectively dead for `be-intl`; not ported. `inferencer.inferValueProperty` does cover `a`/`area` → `href` if that's ever wanted.
4. **`beVigilant` / attribute-mutation observation of the *source* value** — replaced by `inferencer`'s `getPropagator()`. For `<data>` that wires a `MutationObserver` on the `value` attribute (good). For `<time>` `InferencedPropagator` falls back to **setter interception** on `dateTime` — a change to the `datetime` *attribute* from outside won't be picked up (legacy `BeValueAdded` would have, with `beVigilant`). Low risk for typical usage; noted.
5. **`observeAttr` → `observeLang`** — legacy `be-intl.ts` had an `observeAttr` prop gating a `lang` `MutationObserver`; the be-enhanced-era root version dropped it. I re-added the capability as an opt-in boolean attribute `be-intl-observe-lang` (`observeLang` prop). Default off, matching the shipped behavior.
6. **Default locale baked at build vs. runtime** — legacy `emc.js` computed `new Intl.NumberFormat().resolvedOptions().locale` in the browser. Keeping that: it's computed in `be-intl.js` at module load (browser), NOT in `emc.mjs` (which would freeze the build machine's locale into the JSON). So `emc.mjs` has no locale default and the class owns the fallback.
7. **`_lang` / `osotas`** — legacy used an `osota` to map the global `lang` attribute → `locale`. I did **not** map `lang` through `withAttrs`, because a non-underscore `lang` entry would also add `[lang]` to the generated `matching` selector (every element with a `lang` attribute would match `be-intl`). The class reads `enhancedElement.lang` directly in `hydrate` instead — same effect, matches `legacy/be-intl.ts`.
8. **Live re-format on `format` / semantic-attr mutation** — `onFormattingChange` effectively runs once (post-`initialized`, via the `locale` hand-off). Runtime mutation of `be-intl='{...}'` or a `be-intl-*` attribute after mount will not currently rebuild the formatter. Legacy's `ifKeyIn: ['format','currency']` implied it could. Add `format` (and the semantic keys) to a compact / widen `onFormattingChange`'s `ifKeyIn` if this matters.

### Known type-check noise

- `be-intl.js` reports **`TS2681: A constructor cannot have a 'this' parameter`** on the `@this {AllProps & Actions}` JSDoc tag. This tag is copied verbatim from the Step 9 template / be-clonable reference; TypeScript 5.x (VS Code) accepts it, the `tsc` 7.0.x preview on this machine does not. Left as-is to match the documented pattern — say the word if you'd rather drop the tag.
- `types/inferencer/types.d.ts` in the `types` submodule lags the published `inferencer@0.0.13` (no `getPropagator` / `valueProperty` on `Infer`). The `infer()` helper is therefore typed `Promise<any>`. Worth refreshing the `types` submodule.

### Not done (as requested)

- No unit / Playwright tests were run or written. `tests/test1.html` + `tests/test1.spec.mjs` were updated to the new loading pattern but not executed. Suggested first check once you're ready: `npm run build && npm run serve`, open `/demo/dev.html`, confirm the four samples render, then `npm test`.