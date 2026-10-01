# Add Support For Programmatic Attachment

## Bruce's Ask

Can you please follow the example of [be-persistent](https://github.com/bahrus/be-persistent) and [the addendum](../types/ImportantEnhancementAddendum.md) to add demos and adjust be-intl.js as needed and add def.js to support programmatic attachment of this enhancement?

Please add your implementation notes below.

## Implementation Notes (Claude)

All 4 Playwright tests pass: the existing `test1` plus 3 new ones under `tests/Programmatic/`.

be-intl already did most of what the addendum asks. `init` already awaited `roundabout` and set `initialized`, and the actions are gated on `initialized`. That is why values assigned straight after `enh.get()` work without the compact-to-action conversion be-decked-with needed.

### New files

- `def.js`: `defBeIntl(ref)`. It's the same formulaic shape as be-persistent's.
- `demo/Programmatic/`:
  - `DeclarativeInSequence.html` and `DeclarativeOutOfSequence.html` reproduce the `test1` examples through `enh.set.beIntl.format`.
  - `Imperative.html` uses `Object.assign(el.enh.get(emc), {locale, style, currency})`, attaches a second element with no properties, and has a button that switches the currency to EUR after the first render.
- `tests/Programmatic/`: one fixture and spec per demo. They assert the same formatted output as `test1`. The imperative spec also checks that the output re-formats after a later `currency` change, a new `format` object, and a change to the element's `value`, and that no page errors occur.

### Changes

- `be-intl.js`: `init` reads `ctx.emc || ctx.config` (addendum item 2). Without this, `customData` is undefined when the enhancement is attached through `enh.get()` / `enh.set`.
- `emc.mjs` (JSON rebuilt):
  - **`enhKey` renamed** from `BeIntl` to `beIntl`, to match be-persistent. That gives `el.enh.set.beIntl`. Note: on the attribute path, the instance also moves from `el.enh.BeIntl` to `el.enh.beIntl`. The emoji variant's key (`🌐`) is unchanged.
  - **`onFormattingChange`'s `ifKeyIn` now lists `style`, `currency`, `weekday`, `year`, `month` and `day`.** Before, changing one of those props after the first render did nothing, because only `locale` and `format` re-ran the action. Attributes rarely change after mount, so nobody noticed, but programmatic callers expect `el.enh.beIntl.currency = 'EUR'` to take effect. I checked that the imperative spec fails without this change.
- `package.json`: added `"./def.js"` to `exports`. `files` already includes `*.js`, so `def.js` gets published.
- `README.md`: added a "Programmatic attachment (no attribute)" section after "Alternative names", following addendum item 6.

### Not applicable / open points

- **Addendum item 4 (reserved names):** no collisions.
- **Addendum item 7 (accept elements where ids are accepted):** be-intl has no property that refers to another element, so nothing to do.
- **Broken export:** `package.json` exports `"./🌐.js"`, but there's no such file (there's `🌐.mjs`). I left it alone. You may want `"./🌐.json"` only, which is already listed.
- **No `value` override:** there's no programmatic way to supply the value itself. The enhancement always reads it from the element (`value` / `dateTime`). That seems right for `<data>`/`<time>`, so I didn't add one.

