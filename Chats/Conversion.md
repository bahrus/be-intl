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
- reads the value through `(await infer(el)).value` — a live, type-coerced read living in `inferencer` (`Date` for `<time>`, `number` for `<data>`/`<output>`). *(Originally a local `readValue()` helper; removed in Response V once `inferencer.value` was fixed — see below.)*
- sets `enhancedElement.ariaLive = 'polite'` directly (the one `BeValueAdded.hydrate` side-effect that matters here);
- gets an `inferencer` `Infer` instance and uses `getPropagator()` to re-run formatting when the element's value/`dateTime` property changes (this is the modern replacement for the `beVigilant` MutationObserver).

### Reactive wiring (`emc.mjs` `customData.actions`)

- `initialized` flag pattern (from three-peat) is used: `init` sets `self.initialized = true` right after `await roundabout(...)`, and `hydrate` gates on `ifAllOf: ['enhancedElement','initialized'] / ifKeyIn: ['initialized']` so it runs exactly once, after every attribute has been read.
- `hydrate` resolves the locale (explicit `locale` → `inference.lang` (effective language: nearest `lang`/`xml:lang` ancestor across shadow hosts → `<html lang>` → `navigator.language`) → runtime default) and returns `{locale, value}`.
- `{locale}` triggers `onFormattingChange` → builds `intlNumberFormat` **or** `intlDateFormat` (branch on `localName === 'time'`, same as legacy) and seeds `value`.
- `value` changes drive `formatNumber` / `formatDate`, which write `textContent`.

### Gaps / things I did NOT port (flagging per your ask)

1. **`positractions` + `resolved` event + `de` (dispatchEvent)** — legacy inherited `[resolved, rejected]` positractions and a `de = dispatchEvent` from `BeValueAdded`, so a `be-value-added`-style `resolved`/value-change **event** was dispatched from the element. The new class sets a `resolved: true` prop but does **not** dispatch any DOM event. If downstream code (e.g. `be-propagating` consumers) listens for that event, this is a behavior change. `be-propagating` was a legacy dependency and is dropped entirely.
2. **Writing the value back to the DOM** — `BeValueAdded.onValChange` reflected the parsed value back to `data.textContent` / `time.textContent` / `meta.content` / `link.href`. `be-intl` only ever *writes* the formatted string into `textContent`, so I didn't reproduce the general write-back. Should be fine for the documented use (`<data>`, `<time>`, `<output>` display formatting) but it's a reduction in surface area.
3. **`<meta>` / `<link>` support** — `BeValueAdded` handled `content` / `href` (incl. `https://schema.org/True|False`). Legacy `behivior.js` only registered `data,time,output`, so this was already effectively dead for `be-intl`; not ported. `inferencer.inferValueProperty` does cover `a`/`area` → `href` if that's ever wanted.
4. **`beVigilant` / attribute-mutation observation of the *source* value** — replaced by `inferencer`'s `getPropagator()`. For `<data>` that wires a `MutationObserver` on the `value` attribute (good). For `<time>` `InferencedPropagator` falls back to **setter interception** on `dateTime` — a change to the `datetime` *attribute* from outside won't be picked up (legacy `BeValueAdded` would have, with `beVigilant`). Low risk for typical usage; noted.
5. **`observeAttr` → `observeLang`** — legacy `be-intl.ts` had an `observeAttr` prop gating a `lang` `MutationObserver`; the be-enhanced-era root version dropped it. I re-added the capability as an opt-in boolean attribute `be-intl-observe-lang` (`observeLang` prop). Default off, matching the shipped behavior.
6. **Default locale baked at build vs. runtime** — legacy `emc.js` computed `new Intl.NumberFormat().resolvedOptions().locale` in the browser. Keeping that: it's computed in `be-intl.js` at module load (browser), NOT in `emc.mjs` (which would freeze the build machine's locale into the JSON). So `emc.mjs` has no locale default and the class owns the fallback.
7. **`_lang` / `osotas`** — legacy used an `osota` to map the global `lang` attribute → `locale`. I did **not** map `lang` through `withAttrs`, because a non-underscore `lang` entry would also add `[lang]` to the generated `matching` selector (every element with a `lang` attribute would match `be-intl`). `hydrate` reads the *effective* language via `inference.lang` instead (see Response VIII) — an improvement over legacy, which only read `enhancedElement.lang`.
8. **Live re-format on `format` / semantic-attr mutation** — `onFormattingChange` effectively runs once (post-`initialized`, via the `locale` hand-off). Runtime mutation of `be-intl='{...}'` or a `be-intl-*` attribute after mount will not currently rebuild the formatter. Legacy's `ifKeyIn: ['format','currency']` implied it could. Add `format` (and the semantic keys) to a compact / widen `onFormattingChange`'s `ifKeyIn` if this matters.

### Known type-check noise

- `be-intl.js` reports **`TS2681: A constructor cannot have a 'this' parameter`** on the `@this {AllProps & Actions}` JSDoc tag. This tag is copied verbatim from the Step 9 template / be-clonable reference; TypeScript 5.x (VS Code) accepts it, the `tsc` 7.0.x preview on this machine does not. Left as-is to match the documented pattern — say the word if you'd rather drop the tag.
- `types/inferencer/types.d.ts` in the `types` submodule lags the published `inferencer@0.0.13` (no `getPropagator` / `valueProperty` on `Infer`). The `infer()` helper is therefore typed `Promise<any>`. Worth refreshing the `types` submodule.

### Not done (as requested)

- No unit / Playwright tests were run or written. `tests/test1.html` + `tests/test1.spec.mjs` were updated to the new loading pattern but not executed. Suggested first check once you're ready: `npm run build && npm run serve`, open `/demo/dev.html`, confirm the four samples render, then `npm test`.

## Bruce's Response I

The Unit test passes!

You raised an interesting point about replacing be-value-added with inferencer.  I believe that was one of my goals of introducing inferencer at such a core level.  But in testing the inferencer enhancement which is getting attached, I don't think it is fully mature, and I would like to take this opportunity to make it match what I recall be-value-added feature wise.  I'm thinking it's possible that if we fix the inferencer library the way I think it should be fixed, we might be able to reduce some redundant code in this package (be-intl) but that is a secondary goal.

I've temporarily brought in the assign-gingerly package / source code, so that I can ask you to fix issues I'm seeing directly.  

I've temporarily pointed import.html to the local package.

So the first issue I see:

When I open http://localhost:8000/demo/dev.html and inspect each of the elements adorned by be-intl, when I evaluate:

```JS
$0.enh.inferencer.value
```

I'm getting undefined.  I expect it to be typed based on the element type:

If the element is data and the value isn't true or false, it should return the numeric value. 

I do find that:

```JS
$0.enh.inferencer.value = 17
```

does behave more like I remember be-value-added acting.  But that may still need some fine tuning, which we will get to later.

Can you please fix the issue of $0.enh.inferencer.value being undefined?

## Claude's Response II

### Root cause

`Infer` had a write-only `value`: the getter just returned a private `#value` field that
was only ever populated by the setter. It never read anything off the element, so
`$0.enh.inferencer.value` is `undefined` until you assign to it. `be-value-added`, by
contrast, always *derived* `value` from the DOM (`parseAttr`).

### Fix (in `node_modules/inferencer/`, `.js` + `.ts` + `types/inferencer/types.d.ts`)

1. New exported helper **`coerceElementValue(element, propName?)`** that reads the inferred
   value property and coerces it, mirroring `be-value-added`'s `parseVal` rules:
   - `<time>` (`dateTime`) → `Date` (or `undefined` when empty)
   - `<input type=number|range>` (`valueAsNumber`) → `number` (`undefined` when `NaN`)
   - `<input type=checkbox|radio>` (`checked`) → `boolean`
   - schema.org `itemtype` hints honored: `Number` / `Integer` / `Float` / `Boolean` / `Date` / `DateTime`
   - `textContent` returned verbatim
   - otherwise `JSON.parse` when possible, else the raw string — so
     `<data value="12345">` → `12345`, `<data value="true">` → `true`,
     `<data value="EUR">` → `"EUR"`
2. `get value()` now: `deref` the element → pick prop name (`#propName` if a real string,
   else `inferValueProperty(el)`) → `return coerceElementValue(el, propName)`. Falls back to
   the cached `#value` only when the element has been GC'd.
3. Setter unchanged (you said fine-tuning comes later). `.d.ts` also gained the
   already-shipped-but-undeclared `valueProperty` / `getPropagator` / `defaultRemoteBindingPropName`.

Verified the coercion table with a quick Node trace (data/output/time/itemtype/input-number all pass).

### Caveats / follow-ups

- **This edit lives in `node_modules/inferencer/` and will be lost on reinstall** — it needs to be
  upstreamed to the `inferencer` repo (and the `types` submodule) to stick.
- `<link href="https://schema.org/True|False">` handling from `be-value-added` is *not* reproduced —
  `inferValueProperty` doesn't even map `<link>`/`<meta>` yet (returns `textContent`). Separate task
  if you want full parity.
- Secondary goal you mentioned: `be-intl.js`'s local `readValue()` now duplicates
  `coerceElementValue`. Once the inferencer change is upstreamed, `be-intl` can drop `readValue()` and
  use `(await infer(el)).value` directly. Left as-is for now.

  ## Bruce's Response II

  It's better.  But in Chrome, at least JSON.parse('12345') = 12345.  The number, not the string.  

  But now when I do 

```JS
$0.enh.inferencer.value
```

I get the string `12345` on the first data element.

## Claude's Response III

My edited getter does return the **number** `12345` for `<data value="12345">` — verified two ways:

```
$ node -e "import('./node_modules/inferencer/inferencer.js').then(async m=>{
    const el={localName:'data',value:'12345',getAttribute:()=>null};
    console.log(typeof new m.Infer(el,{config:{}}).value)  // -> number
  })"
```

`coerceElementValue(dataEl,'value')` → no switch case → not null → string → no `itemtype` →
not `textContent` → not `''` → `JSON.parse('12345')` → `12345`. There is no path that returns
the raw string here.

So if the browser hands you `"12345"`, it isn't running this file. **There are 5 copies of
`inferencer.js` on disk right now** (your local `assign-gingerly` vendors its own as a submodule):

| path | who imports it (in the browser) | edited? |
|---|---|---|
| `node_modules/inferencer/inferencer.js` | bare `inferencer/...` → **`be-intl.js`'s `infer()`** (import map) | ✅ yes |
| `assign-gingerly/inferencer/inferencer.js` | `./inferencer/...` from your local `assign-gingerly` (`beVigilant.js`, `inferredAssignments.js`) | ❌ no — and it's a *different, newer* version (`#queryScoped`, changed `['|']` sig) whose `get value()` is still `return this.#value` |
| `node_modules/assign-gingerly/inferencer/…` | — (import map shadows it) | ❌ |
| `node_modules/mount-observer/node_modules/assign-gingerly/inferencer/…` | — | ❌ |
| `node_modules/roundabout-lib/node_modules/assign-gingerly/inferencer/…` | — | ❌ |

`enh.inferencer` is stored per-`enhKey` with last-writer-wins, and both the standalone package
and the vendored copy register an item with `enhKey: 'inferencer'`. Whichever `Infer` spawned
last for that element is what `$0.enh.inferencer` points at.

**To get a deterministic result while debugging, collapse them to one copy** — point the import
map's `inferencer/` at whichever tree you're actually editing, e.g.

```json
"inferencer/": "/assign-gingerly/inferencer/",
```

and apply the same `coerceElementValue` change there (that copy is newer, so it's probably the
one you want to be working in anyway). Then hard-reload (DevTools → Network → "Disable cache").

Quick confirmation of which copy is live:

```JS
$0.enh.inferencer.constructor.toString().includes('coerceElementValue')  // true = edited copy
```

If you'd rather I just port the fix into `assign-gingerly/inferencer/inferencer.js` (the vendored
submodule) as well, say the word and I'll mirror it there.

### Update

Per your instruction, the same change is now in **`assign-gingerly/inferencer/inferencer.ts`
only** (`get value()` + new `coerceElementValue`); the generated `inferencer.js` there was
reverted for you to rebuild. `tsc --noEmit` passes clean for that submodule. Added `CLAUDE.md`
at the repo root recording the "edit `.ts` only under `assign-gingerly/`" rule.

`node_modules/inferencer/` (`.js` + `.ts`) keeps its edit — it has no build step and is what
`be-intl.js` loads today; the passing unit test depends on it.

## Bruce's Response III

I meant to add the instructions to Claude.md of the assign-gingerly folder, not be-intl.

I might have been mistaken.  Maybe I just did $0.value by mistake.  Anyway, they are all working now, thanks.

The only other gap that I see compared to the old be-value-added is this:

When I inspect the time element and set:

```JavaScript
$0.enh.inferencer.value = new Date()
```

It sets $0.value to Tue Sep 01 2026 23:08:06 GMT-0400 (Eastern Daylight Time)

rather than than to the toISO string:

2011-11-18T14:54:39.929Z

## Claude's Response IV

Fixed. The `value` **setter** now runs the assigned value through a new
`serializeForProperty(propName, nv)` before writing it to the DOM property:

- `Date` → `nv.toISOString()` — so `$0.enh.inferencer.value = new Date()` writes
  `"2026-09-01T…Z"` to `<time>.dateTime` (and it round-trips: the getter reads it back as a `Date`)
- plain objects / arrays → `JSON.stringify(nv)`
- `checked` / `valueAsNumber` / `valueAsDate` → passed through untouched (the DOM types those)
- the setter also now honors an explicit `#propName` (same guard the getter uses)

Applied to:
- **`assign-gingerly/inferencer/inferencer.ts`** — `.ts` only, per the rule. Your build watcher
  regenerated `inferencer.js` + `types/` from it (verified in sync + working). `tsc --noEmit` clean.
- **`node_modules/inferencer/`** (`.js` + `.ts`) — no build step there; edited both.

`CLAUDE.md` moved: removed from the `be-intl` root, added **`assign-gingerly/CLAUDE.md`**
("edit `.ts` only; `.js`/`.d.ts` are build output").

## Bruce's Response IV

It's working great.

One possible improvement:

Instead of:

```TS
    #value: TValue | undefined;
    
    get value(): TValue | undefined {
        const element = this.#weakRef.deref();
        if (element === undefined) return this.#value;
        const propName = typeof this.#propName === 'string'
            ? this.#propName
            : inferValueProperty(element);
        return coerceElementValue(element, propName) as TValue | undefined;
    }

    set value(nv: TValue){
        this.#value = nv;
        const {enhancedElement} = this;
        const propName = typeof this.#propName === 'string'
            ? this.#propName
            : inferValueProperty(enhancedElement);
        (enhancedElement as any)[propName] = serializeForProperty(propName, nv);
    }
```

we did:

```TS
    #value: TValue | undefined;
    
    get value(): TValue | undefined {
        if(this.#value !== undefined) return this.#value;
        const element = this.#weakRef.deref();
        if (element === undefined) return this.#value;
        const propName = typeof this.#propName === 'string'
            ? this.#propName
            : inferValueProperty(element);
        this.#value =  coerceElementValue(element, propName) as TValue | undefined;
        return this.#value;
    }

    set value(nv: TValue){
        this.#value = nv;
        const {enhancedElement} = this;
        const propName = typeof this.#propName === 'string'
            ? this.#propName
            : inferValueProperty(enhancedElement);
        (enhancedElement as any)[propName] = serializeForProperty(propName, nv);
    }
```

???

Wouldn't that a little faster?  

Also, with this logic in place, is there any redundant logic in be-intl.js that can be removed, in favor of using inferencer?

## Claude's Response V

### On memoizing the getter — I'd recommend against it

The speedup is real but negligible: the hot path of `coerceElementValue` is one property read
(`element.value`), two `typeof` checks, and `JSON.parse` on a short string — nanoseconds, and
the getter isn't called in a loop.

The cost is a **correctness regression**. The reason the getter was changed to read the DOM was
to make `value` *live*. With `if (this.#value !== undefined) return this.#value;`:

- Once anything reads `value`, the result is frozen. A later change to `<data value>` /
  `<time datetime>` (via `InferencedPropagator`, user input on an `<input>`, or other script)
  is invisible to `inference.value` forever. `be-value-added` re-derived on every read precisely
  to avoid this.
- After the **setter** runs, `#value` holds the caller's pre-`serializeForProperty` JS value, so
  the getter starts returning that instead of what's actually in the DOM — a divergence source if
  the DOM property normalizes the value (it does for `<input type=date>`, `<a href>`, …).
- The one case where repeated reads could actually benefit — an empty element where
  `coerceElementValue` returns `undefined` — is never cached (`undefined` fails the guard), so it
  re-derives every time anyway.

If a specific call site is hot, cache **there** with explicit invalidation (e.g. clear on the
propagator event), rather than making the shared getter lossy. Happy to add an opt-in
`{ cache: true }` if you have a read-heavy scenario in mind.

### Redundant logic in `be-intl.js` that can now go

Yes — `readValue()` is a near-duplicate of `coerceElementValue`. Proposed cleanup:

| now | after |
|---|---|
| `readValue(el)` helper (13 lines) | **deleted** |
| `hydrate`: wires propagator, `return {locale}` | also seed value: `return { locale, value: inference.value }` |
| propagator cb: `self.value = readValue(enhancedElement)` | `self.value = inference.value` |
| `onFormattingChange`: `const value = readValue(enhancedElement); return { intl*Format, value, resolved }` | drop the read: `return { intl*Format, resolved: true }` — `value` is already seeded by `hydrate` and kept fresh by the propagator |

`inference.value` returns a `Date` for `<time>` and a `number` for `<data>`/`<output>`, which is
exactly what `formatDate` / `formatNumber` expect, so the behavior is unchanged. Net: `be-intl.js`
loses ~15 lines and the element-type branching lives only in `inferencer`.

Caveat: this assumes the `types` submodule's `Infer` gains `value` as a live getter (it's already
declared) — fine for runtime today, and `@ts-check` is already satisfied via the `infer()` helper
returning `any`.

Want me to apply that cleanup? It touches the unit-tested `be-intl.js`, so I left it staged as a
proposal.

## Bruce's Response V

Good point about live changes getting lost and correctness regression.  Bad idea on my part.

Yes, please apply the cleanup.

## Claude's Response VI

Applied. `be-intl.js`: 168 → 148 lines.

- `readValue()` helper **deleted**.
- `hydrate` now `return {locale, value: inference.value}` and the propagator callback does
  `self.value = inference.value`.
- `onFormattingChange` no longer reads the value — just builds `intl*Format` and returns
  `{intl*Format, resolved: true}`; `value` is seeded by `hydrate` and kept current by the
  propagator.
- `infer()` JSDoc updated (the "types lag" note was stale — the submodule `Infer` decl now has
  `value` / `getPropagator` / `valueProperty`).

`@ts-check` clean apart from the known pre-existing `TS2681` on the `@this` constructor tag.
Reactive cascade is unchanged: `initialized` → `hydrate` → `{locale, value}` → `onFormattingChange`
→ `{intl*Format}` → `formatNumber` / `formatDate`. Not re-run through Playwright yet (per your
"no unit testing" note still standing — say when).

## Bruce's Response VI

Everything is looking great.  One important point I forgot to ask about.  Are we doing the lang attribute wrong?  We apply the formatting based on the lang attribute if the attribute is present on the element itself, but what ever the attribute is applied at a higher, containing element, even outside the shadow DOM.  How is that suppose to apply?  Is there a universal way of reading what the language default should be on an element, including inheritance rules?

## Claude's Response VII

You're right — reading only `enhancedElement.lang` is incomplete. `lang` is an **inherited**
attribute: the effective language of an element is the value of the *nearest ancestor* that
carries `lang` (or `xml:lang`), and in practice that's usually `<html lang>` or a section
wrapper, not the formatted element itself. Legacy `be-intl` had the same limitation (it also
only read `enhancedElement.lang`), so this is an improvement opportunity, not a regression from
the conversion.

### Is there a universal accessor? No.

There is **no DOM property** that gives you "the computed language of this element". The options:

| approach | covers | misses |
|---|---|---|
| `el.lang` | attribute on `el` itself | all inheritance |
| `el.closest('[lang]')?.getAttribute('lang')` | ancestors in the **same** tree | shadow-root boundaries |
| walk `parentNode`, hop `getRootNode().host` at each shadow boundary | ancestors **and** shadow hosts | slot reprojection edge cases |
| `getComputedStyle(el)` | — | lang isn't a CSS property, not exposed |
| `el.matches(':lang(xx)')` | tests one known tag; `:lang()` *does* pierce shadow DOM in modern browsers | you have to already know `xx`, so it's a check not a read |

The `:lang()` pseudo-class is the spec's "source of truth" for matching, and recent HTML/CSS
makes it cross shadow boundaries and consider the host — but it only answers yes/no for a given
tag, so you can't use it to *read* the value.

So the practical universal read is the **walk**, with a sensible fallback chain:

```js
function resolveLang(el) {
    let node = el;
    while (node) {
        if (node instanceof Element) {
            const lang = node.lang || node.getAttribute('xml:lang');
            if (lang) return lang;
        }
        const root = node.getRootNode?.();
        node = node.parentNode ?? (root && root !== node && 'host' in root ? root.host : null);
    }
    return document.documentElement.lang
        || navigator.language          // browser UI preference
        || undefined;                  // -> caller falls back to Intl default
}
```

`navigator.language` (last resort) is essentially what our current `defaultLocale`
(`new Intl.NumberFormat().resolvedOptions().locale`) already resolves to, so the fallback stays
consistent.

### Where it belongs

This is element-convention logic, same category as `.value` / `.eventType` / `.propName` — it
should live in **`inferencer`**, not be reimplemented per enhancement. Proposed:

- add `resolveLang(element)` (above) as an export in `inferencer`, and a `get lang()` on `Infer`;
- `be-intl.js` `hydrate` becomes:
  ```js
  const locale = self.locale || inference.lang || defaultLocale;
  ```
  (drops the `enhancedElement instanceof HTMLElement ? enhancedElement.lang : ''` line);
- `observeLang` then needs to watch `lang` on the resolved ancestor, not just `enhancedElement`
  — or, simpler, a `MutationObserver` on `document` subtree filtered to `lang` is overkill;
  keep `observeLang` watching `enhancedElement` only and document that container-`lang` changes
  after mount aren't tracked (rare).

Per the `assign-gingerly`/`CLAUDE.md` rule I'd put the real change in
`assign-gingerly/inferencer/inferencer.ts` (+ mirror to `node_modules/inferencer/` for runtime).

Want me to implement `resolveLang` + `Infer.lang` and wire `be-intl` to it?

## Bruce's Response VII

I brought back the assign-gingerly package / source into this project temporarily, and ts compiling is to js.

Please make the change.
## Claude's Response VIII

Implemented `resolveLang` + `Infer.lang` and wired `be-intl` to it.

**`inferencer`** (`assign-gingerly/inferencer/inferencer.ts` — `.ts` only, watcher built `.js`; mirrored to `node_modules/inferencer/` `.js`+`.ts` for runtime; both `types.d.ts` updated):
- `export function resolveLang(element)` — walks `parentNode`, hops `ShadowRoot` -> `.host`, returns the first `lang`/`xml:lang` it finds; then `<html lang>`, then `navigator.language`, else `undefined`. Slot reprojection deliberately not followed (HTML lang inheritance is over the real node tree).
- `get lang()` on `Infer` — `resolveLang(enhancedElement)`.
- Also declared the previously-undeclared `serializeForProperty` in the `.d.ts` files.

**`be-intl.js`**:
- `hydrate`: `const locale = self.locale || inference.lang || defaultLocale;` (dropped the `enhancedElement.lang` line).
- `observeLang` callback now recomputes via `inference.lang` (so setting `lang` on the element re-walks). Container-`lang` mutations after mount still arent observed — documented in the type + a code comment; rare enough to leave.

Verified with a Node trace: inherits from a container `<div lang>`, falls through to `<html lang>`, crosses a shadow host, orphan -> `navigator.language`. `tsc` clean (vendored submodule exit 0; `be-intl.js` only the known `TS2681`).


## Bruce's Response VIII

Can you check if anything in README.md needs to be updated to accurately reflect how we are handling the lang attribute now?

## Claude's Response IX

Nothing in the README was *inaccurate* — every example sets `lang` directly on the element, and
that still works (it's the first thing `resolveLang` finds). But it was *incomplete*: the
inheritance behavior wasn't documented anywhere.

Added a **"## Locale resolution"** section (after the semantic-syntax example) covering:
- effective-language resolution order: nearest `lang`/`xml:lang` ancestor (across shadow hosts)
  -> `<html lang>` -> `navigator.language`;
- the common pattern of setting `lang` once on `<html>`;
- the `be-intl-observe-lang` / `🌐-observe-lang` opt-in for re-formatting on the element's own
  `lang` change, and the note that ancestor-`lang` changes after enhancement are not tracked.

Existing examples left as-is.
