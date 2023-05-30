# be-intl

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

```html
<time lang="ar-EG" datetime=2011-11-18T14:54:39.929Z be-intl='{ "weekday": "long", "year": "numeric", "month": "long", "day": "numeric" }'></time>
```

emits

```html
<time lang="ar-EG" datetime="2011-11-18T14:54:39.929Z" be-intl="{ &quot;weekday&quot;: &quot;long&quot;, &quot;year&quot;: &quot;numeric&quot;, &quot;month&quot;: &quot;long&quot;, &quot;day&quot;: &quot;numeric&quot; }">الجمعة، ١٨ نوفمبر ٢٠١١</time>
```

## Viewing Locally

1.  Install git.
2.  Fork/clone this repo.
3.  Install node.
4.  Open command window to folder where you cloned this repo.
5.  > npm install
6.  > npm run serve
7.  Open http://localhost:3030/demo in a modern browser.

## Importing in ES Modules:

```JavaScript
import 'be-intl/be-intl.js';

```

## Using from CDN:

```html
<script type=module crossorigin=anonymous>
    import 'https://esm.run/be-intl';
</script>
```
