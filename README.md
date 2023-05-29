# be-intl

Format numbers, dates automatically and semantically.

```html
<data value=123456.789 lang="de-DE" be-intl='{ "style": "currency", "currency": "EUR" }'></data>
```

emits

```html
<data value=123456.789 lang="de-DE" be-intl='{ "style": "currency", "currency": "EUR" }'>123.456,79 €</data>
```