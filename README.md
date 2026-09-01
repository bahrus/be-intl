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

## Alternative names

The semantic example above involves a lot of keyboard tapping of the letters "be-intl".  To avoid blisters on your itty bitty fingers, we provide an alternative base attribute you can use:

```html
<time lang="ar-EG" datetime="2011-11-18T14:54:39.929Z"
🌐-weekday=long 🌐-year=numeric 🌐-month=long 🌐-day=numeric></time>
```

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


