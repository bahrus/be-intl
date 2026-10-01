# be-intl (🌐)

Format numbers, dates automatically and semantically.

[![Playwright Tests](https://github.com/bahrus/be-intl/actions/workflows/CI.yml/badge.svg?branch=baseline)](https://github.com/bahrus/be-intl/actions/workflows/CI.yml)
[![How big is this package in your project?](https://img.shields.io/bundlephobia/minzip/be-intl?style=for-the-badge)](https://bundlephobia.com/result?p=be-intl)
<img src="http://img.badgesize.io/https://cdn.jsdelivr.net/npm/be-intl?compression=gzip">
[![NPM version](https://badge.fury.io/js/be-intl.png)](http://badge.fury.io/js/be-intl)

```html
<data value=123456.789 lang="de-DE" be-intl='{ "style": "currency", "currency": "EUR" }'></data>
```

emits

```html
<data value=123456.789 lang="de-DE" be-intl='{ "style": "currency", "currency": "EUR" }'>123.456,79 €</data>
```

The output element provides identical support.

```html
<time lang="ar-EG" datetime=2011-11-18T14:54:39.929Z be-intl='{ "weekday": "long", "year": "numeric", "month": "long", "day": "numeric" }'></time>
```

emits

```html
<time lang="ar-EG" datetime="2011-11-18T14:54:39.929Z" be-intl="{ &quot;weekday&quot;: &quot;long&quot;, &quot;year&quot;: &quot;numeric&quot;, &quot;month&quot;: &quot;long&quot;, &quot;day&quot;: &quot;numeric&quot; }">الجمعة، ١٨ نوفمبر ٢٠١١</time>
```


We can also employ more semantic syntax:

```html
<data value=123456.789 lang="de-DE" be-intl-style=currency be-intl-currency=EUR></data>
```

## Locale resolution

The examples above put `lang` right on the formatted element, but that isn't required.
`be-intl` uses the element's **effective language**, resolved the same way the browser's
`:lang()` selector works:

1. the nearest ancestor with a `lang` (or `xml:lang`) attribute — crossing shadow-root
   boundaries via the host element;
2. otherwise `<html lang>`;
3. otherwise the browser's own `navigator.language`.

So in practice you set `lang` once, high up:

```html
<html lang="de-DE">
  ...
  <data value=123456.789 be-intl-style=currency be-intl-currency=EUR></data>
  <!-- emits 123.456,79 € -->
```

Changing the formatted element's **own** `lang` after it has been enhanced re-formats it only
if you opt in with `be-intl-observe-lang` (`🌐-observe-lang`); changes to an ancestor's `lang`
after enhancement are not tracked.

## Announcing updates to assistive technology

`be-intl` writes the formatted string into `textContent` on first render and again whenever the
bound value or the effective locale changes. By default it leaves ARIA untouched — most
formatted `<data>` / `<time>` elements are static readouts, and turning every one into a live
region (especially for a locale switch that only changes *presentation*, not the value) is
usually just screen-reader noise.

When a particular value *is* something the user is watching change, opt that element in with
`be-intl-announce` (`🌐-announce`):

```html
<output be-intl be-intl-announce></output>
<data be-intl be-intl-announce value="0" id="unread"></data>
```

With the attribute set, `be-intl` — **after** the element's first render, so the initial value
isn't spoken on load — marks it as a polite live region:

- `aria-live="polite"` (skipped for `<output>`, which is already an implicit polite live
  region), and
- `aria-atomic="true"`, so multi-token output such as a formatted date is announced as one
  phrase rather than word-by-word.

Later re-formats then mutate an already-registered region and are announced. `assertive` is
intentionally not offered — interrupting the user to read out a reformatted number is almost
never the right call.

## Alternative names

The semantic example above involves a lot of keyboard tapping of the letters "be-intl".  To avoid blisters on your itty bitty fingers, we provide an alternative base attribute you can use:

```html
<time lang="ar-EG" datetime="2011-11-18T14:54:39.929Z"
🌐-weekday=long 🌐-year=numeric 🌐-month=long 🌐-day=numeric></time>
```

## Programmatic attachment (no attribute)

The attribute syntax shown above shines for server-rendered HTML and progressive enhancement:  the markup alone says how each value should be formatted.  But most web development today renders on the client, with a framework (Lit, React, Vue, Svelte, etc.) that already has a JavaScript reference to each element it creates.  In that setting, attaching be-intl programmatically is the better fit:

1.  **A less clunky API.**  Frameworks tend to be awkward about setting arbitrary (let alone emoji) attributes, and quoting JSON inside an attribute, like `be-intl='{ "style": "currency", "currency": "EUR" }'`, is error prone.  Setting `format` to `{style: 'currency', currency: 'EUR'}` is ordinary JavaScript, which TypeScript can check against `Intl.NumberFormatOptions` / `Intl.DateTimeFormatOptions`.  You can also set `locale` directly, which has no attribute equivalent.
2.  **Less stringifying and parsing.**  With an attribute, the framework serializes the format options to JSON, and be-intl then parses that JSON back into an object.  Setting `format` directly skips both steps.
3.  **Less overhead monitoring attributes.**  The attribute approach relies on [be-hive](https://github.com/bahrus/be-hive) / [mount-observer](https://github.com/bahrus/mount-observer) watching the DOM for elements that carry (or gain) the attribute, and for changes to its value.  The programmatic approach needs none of that -- `def.js` just registers the enhancement's config, and the enhancement is attached exactly when, and to exactly the elements, your code says.

Both approaches produce the same enhancement, with the same locale resolution and formatting rules, so you can mix them in one app -- attributes for server-rendered islands, programmatic attachment inside client-rendered components.

First register the enhancement's config once:

```JS
import { defBeIntl } from 'be-intl/def.js';
const emc = await defBeIntl(document.body); // or a shadow root's host, for a scoped registry
```

Then set any of these properties:

| Attribute                                   | Property                          | Notes                                                                                  |
|---------------------------------------------|-----------------------------------|----------------------------------------------------------------------------------------|
| `be-intl` / `🌐`                            | `format`                          | An `Intl.NumberFormatOptions` / `Intl.DateTimeFormatOptions` object.  A bare attribute is `{}`.  |
| `be-intl-style`, `-currency`, `-weekday`, `-year`, `-month`, `-day` | `style`, `currency`, `weekday`, `year`, `month`, `day` | Folded into `format`; keys set explicitly in `format` win.  |
| `be-intl-observe-lang`                      | `observeLang`                     | `true` / `false`.                                                                      |
| `be-intl-announce`                          | `announce`                        | `true` / `false`.                                                                      |
| *(none -- `lang`)*                          | `locale`                          | A BCP-47 tag.  Overrides the locale resolved from `lang`.                              |

### Declarative -- via `enh.set`

```JS
// equivalent to <data value=123456.789 lang="de-DE" be-intl='{ "style": "currency", "currency": "EUR" }'>
data.enh.set.beIntl.format = {style: 'currency', currency: 'EUR'};
```

Only the first property needs `.set` -- it's what triggers the attachment.  This can be done before or after `defBeIntl` has been called.

### Imperative -- via `enh.get()`

```JS
Object.assign(data.enh.get(emc), {
    locale: 'de-DE',
    style: 'currency',
    currency: 'USD',
});
```

`data.enh.get(emc)` with no properties at all is equivalent to a bare `be-intl` attribute.

### Changing the formatting later

After the first render, setting `locale`, `format` or one of the semantic properties re-formats the element:

```JS
data.enh.beIntl.currency = 'EUR';
```

`format` is compared by reference, so assign a new object rather than mutating the existing one.

See [demo/Programmatic](demo/Programmatic/) for runnable examples.

## Viewing Demos Locally

1. Install git
2. Fork/clone this repo
3. Install node.js
4. Open command window to folder where you cloned this repo
5. > git submodule add https://github.com/bahrus/types.git types
6. > git submodule update --init --recursive
7. > npm install
8. > npm run build
9. > npm run serve
10. Open http://localhost:8000/demo/ in a modern browser

## Running Tests

```
> npm run test
```


